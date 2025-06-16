import {
  ReactFlow,
  type NodeOrigin,
  Panel,
  type NodeMouseHandler,
  useReactFlow,
  MiniMap,
} from "@xyflow/react";
import DevTools from "./devtools/devtools.tsx";

import "@xyflow/react/dist/style.css";
import useGraphStore, { type RFState } from "./store.ts";
import { shallow } from "zustand/vanilla/shallow";

import SequenceNode from "../components/sequence-node/sequence-node.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import GraphControls from "./controls.tsx";
import { useFocusHandlers } from "../controls/focus-node/focus-utils.ts";
import { layoutModes, nodeTypes, nodeWidthModes } from "../theme/types.tsx";
import { applyLayout } from "./layout";
import { theme } from "../theme";
import RowNode from "../components/row-node.tsx";
import store from "./store.ts";
import { toggleNodeWidthMode } from "./layout/helper.tsx";
import DirectionMiniMapNode from "../components/minimap/direction-minimap-node.tsx";
import ArrowEdge from "../components/arrow-edge/arrow-edge.tsx";
import { callApi, callApiWithParameters } from "../helper/api-call.ts";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  nodeWidthMode: state.nodeWidthMode,
  setNodeWidthMode: state.setGlobalNodeWidthMode,
  layoutMode: state.layoutMode,
  setLayoutMode: state.setLayoutMode,
  isoformColorMapping: state.isoformColorMapping,
});

// this places the node origin in the center of a node
const nodeOrigin: NodeOrigin = [0.5, 0.5];
const myNodeTypes = {
  [nodeTypes.SequenceNode]: SequenceNode,
  [nodeTypes.RowNode]: RowNode,
};
const edgeTypes = {
  arrow: ArrowEdge,
};

const Flow = () => {
  const { getInternalNode } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    nodeWidthMode,
    setNodeWidthMode,
    layoutMode,
    setLayoutMode,
    isoformColorMapping,
  } = useGraphStore(selector, shallow); // using shallow to make sure the component only re-renders when one of the values changes
  const [focusedNode, setFocusedNode] = useState<SequenceNodeProps>();
  const { focusNode, onFocusNextNode, onFocusPreviousNode } = useFocusHandlers(
    nodes,
    setFocusedNode,
  );

  const focusWithDelay = (nodeToBeFocused: SequenceNodeProps) => {
    const timer = setTimeout(() => {
      focusNode(nodeToBeFocused);
    }, 500); // 500ms delay to allow React Flow to render the nodes and edges properly

    return () => clearTimeout(timer);
  };

  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");

  // get file names from the ./data directory
  useEffect(() => {
    // get file names from ./../data directory
    const getFileNames = async () => {
      const response = await callApi("api/get_available_files/");
      if (!response.success) {
        console.error("Failed to fetch file names");
        return;
      } else {
        const names = response.data || [];

        setFileNames(names);
        if (names.length > 0) {
          setSelectedFile(names[0]); // Set the first file as selected by default
        }
      }
    };

    void getFileNames();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      const response = await callApiWithParameters("api/convert_file/", {
        file_name: selectedFile,
      });
      console.log("Response from convert_file:", response);
      if (!response.success) {
        console.error("Failed to convert file:", response.error);
        return;
      }
    } catch (error) {
      console.error("Error executing script:", error);
    }
  };

  // --- Initial render ---
  useEffect(() => {
    let mounted = true;

    const applyInitialLayout = async () => {
      try {
        const [layoutedNodes, layoutedEdges] = await applyLayout(
          nodes,
          edges,
          layoutMode,
          getInternalNode,
        );

        // Only update state if component is still mounted
        if (mounted) {
          useGraphStore.setState({
            nodes: layoutedNodes,
            edges: layoutedEdges,
          });

          if (layoutedNodes.length > 0) {
            const firstSequenceNode = layoutedNodes.find(
              (node) => node.type === nodeTypes.SequenceNode,
            ) as SequenceNodeProps | undefined;
            focusWithDelay(firstSequenceNode as SequenceNodeProps);
          }
        }
      } catch (error) {
        console.error("Error applying layout:", error);
      }
    };

    void applyInitialLayout();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    useGraphStore.getState().setInternalNodeGetter(getInternalNode);
  }, [getInternalNode]);

  const toggleGlobalNodeWidthMode = () => {
    setNodeWidthMode(toggleNodeWidthMode(nodeWidthMode));
  };

  const toggleSnakeLayout = () => {
    setLayoutMode(
      layoutMode === layoutModes.Basic ? layoutModes.Snake : layoutModes.Basic,
    );
    focusWithDelay(focusedNode as SequenceNodeProps);
  };

  const lastClickTimeRef = useRef<number>(0);
  const clickTimerRef = useRef<number | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const currentTime = new Date().getTime();
      const timeSinceLastClick = currentTime - lastClickTimeRef.current;

      if (timeSinceLastClick < 300 && lastClickTimeRef.current > 0) {
        if (node.type === nodeTypes.SequenceNode) {
          focusNode(node as SequenceNodeProps);
        }
        lastClickTimeRef.current = 0;
      } else {
        lastClickTimeRef.current = currentTime;

        if (clickTimerRef.current !== null) {
          clearTimeout(clickTimerRef.current);
        }

        clickTimerRef.current = window.setTimeout(() => {
          if (lastClickTimeRef.current > 0) {
            store
              .getState()
              .setNodeWidthMode(
                node.id,
                toggleNodeWidthMode(node.data.nodeWidthMode as nodeWidthModes),
              );
          }
          clickTimerRef.current = null;
        }, 300);
      }
    },
    [focusNode],
  );

  const fitViewOptions = {
    minZoom: 0.4,
    maxZoom: 1,
    nodes: nodes.slice(0, 3),
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={myNodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeOrigin={nodeOrigin}
      minZoom={0.05}
      maxZoom={5}
      zoomOnDoubleClick={false}
      width={100}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={fitViewOptions}
      nodesDraggable={false}
      nodesConnectable={false}
    >
      {theme.debugMode && <DevTools />}
      <GraphControls
        onFocusNextNode={() => onFocusNextNode(focusedNode)}
        onFocusPreviousNode={() => onFocusPreviousNode(focusedNode)}
        onFocusCurrentNode={() => {
          if (focusedNode) {
            focusNode(focusedNode);
          }
        }}
        toggleNodeWidthMode={() => {
          void toggleGlobalNodeWidthMode();
        }}
        toggleSnakeLayout={() => {
          void toggleSnakeLayout();
        }}
      />
      <Panel position="top-left">
        Proteoform graph visualization with React Flow library
      </Panel>
      <Panel position="top-right">
        <div style={{ padding: "10px" }}>
          <strong>Select file to process:</strong>
          <br />
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
          >
            <option value="" disabled>
              -- Select a file --
            </option>
            {fileNames.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
          <br />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </Panel>
      <MiniMap
        style={{
          width: 350,
          height: 200,
          borderRadius: 10,
          border: "1px solid #ccc",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          transform: "translate(10%, 0%)",
        }}
        nodeComponent={DirectionMiniMapNode}
        maskColor={"rgba(240, 240, 240, 0.6)"}
        nodeStrokeWidth={8}
        zoomable
        pannable
        inversePan={false}
        position={"bottom-left"}
      />
      <Panel position="bottom-center">
        <div style={{ padding: "10px" }}>
          <strong>Layout Mode:</strong> {layoutMode}
          <br />
          <strong>Node Width Mode:</strong> {nodeWidthMode}
          <br />
          <button onClick={toggleGlobalNodeWidthMode}>
            Toggle Node Width Mode
          </button>
          <button onClick={toggleSnakeLayout}>Toggle Layout Mode</button>
        </div>
      </Panel>
      <Panel position="bottom-right">
        <div style={{ padding: "10px" }}>
          <strong>Isoforms mapped to color:</strong>
          <br />
          {Object.entries(isoformColorMapping).map(([isoform, color]) => (
            <span key={isoform} style={{ color }}>
              {isoform}
              <br />
            </span>
          ))}
        </div>
      </Panel>
    </ReactFlow>
  );
};

export default Flow;
