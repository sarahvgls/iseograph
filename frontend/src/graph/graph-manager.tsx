import {
  ReactFlow,
  type NodeOrigin,
  Panel,
  type NodeMouseHandler,
  useReactFlow,
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

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  nodeWidthMode: state.nodeWidthMode,
  setNodeWidthMode: state.setGlobalNodeWidthMode,
  layoutMode: state.layoutMode,
  setLayoutMode: state.setLayoutMode,
});

// this places the node origin in the center of a node
const nodeOrigin: NodeOrigin = [0.5, 0.5];
const myNodeTypes = {
  [nodeTypes.SequenceNode]: SequenceNode,
  [nodeTypes.RowNode]: RowNode,
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
    [focusNode, toggleGlobalNodeWidthMode],
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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeOrigin={nodeOrigin}
      minZoom={0.05}
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
      <Panel position="top-right">
        Proteoform graph visualization with React Flow library
      </Panel>
    </ReactFlow>
  );
};

export default Flow;
