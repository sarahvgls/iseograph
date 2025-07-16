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
import { nodeTypes, nodeWidthModes } from "../theme/types.tsx";
import { theme } from "../theme";
import RowNode from "../components/row-node/row-node.tsx";
import store from "./store.ts";
import { toggleNodeWidthMode } from "./layout/helper.tsx";
import DirectionMiniMapNode from "../components/minimap/direction-minimap-node.tsx";
import ArrowEdge from "../components/arrow-edge/arrow-edge.tsx";
import { SideMenu } from "../components/side-menu/side-menu.tsx";
import { OnScreenMenu } from "../components/on-screen-menu/on-screen-menu.tsx";
import { StyledPanel } from "../components/base-components";
import {
  LoadingBackdrop,
  SettingsBackdrop,
} from "../components/backdrop/backdrop.tsx";
import { SettingsButton } from "../components/side-menu/settings-button.tsx";
import { applyLocalStorageValues } from "./helper/generate-utils.tsx";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  nodeWidthMode: state.nodeWidthMode,
  setNodeWidthMode: state.setGlobalNodeWidthMode,
  layoutMode: state.layoutMode,
  setLayoutMode: state.setLayoutMode,
  isAnimated: state.isAnimated,
  setIsAnimated: state.setIsAnimated,
  allowInteraction: state.allowInteraction,
  setAllowInteraction: state.setAllowInteraction,
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
  const [isInitializing, setIsInitializing] = useState(true);
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
    isAnimated,
    setIsAnimated,
    allowInteraction,
    setAllowInteraction,
  } = useGraphStore(selector, shallow); // using shallow to make sure the component only re-renders when one of the values changes
  const [focusedNode, setFocusedNode] = useState<SequenceNodeProps>();
  const { focusNode, onFocusNextNode, onFocusPreviousNode } = useFocusHandlers(
    nodes,
    setFocusedNode,
  );
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const focusNodeWithDelay = useCallback(
    (nodeToBeFocused: SequenceNodeProps) => {
      const timer = setTimeout(() => {
        focusNode(nodeToBeFocused);
      }, 500);

      return () => clearTimeout(timer);
    },
    [focusNode],
  );

  // Initialize graph
  useEffect(() => {
    if (!isInitializing) return;
    useGraphStore.getState().setInternalNodeGetter(getInternalNode);

    // Apply any localStorage values immediately
    applyLocalStorageValues(setSelectedFile);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getInternalNode]);

  useEffect(() => {
    if (!isInitializing) return;

    const nodes = useGraphStore.getState().nodes;
    const layoutMode = useGraphStore.getState().layoutMode;
    const nodeWidthMode = useGraphStore.getState().nodeWidthMode;

    setTimeout(() => {
      setLayoutMode(layoutMode);
      setNodeWidthMode(nodeWidthMode);

      // Focus first node
      if (nodes.length > 0) {
        const firstSequenceNode = nodes.find(
          (node) => node.type === nodeTypes.SequenceNode,
        ) as SequenceNodeProps | undefined;

        if (firstSequenceNode) {
          focusNodeWithDelay(firstSequenceNode);
        }
      }
    }, 500);

    setTimeout(() => {
      setIsInitializing(false);
    }, 1500);
  }, [isInitializing, focusNodeWithDelay, setLayoutMode, setNodeWidthMode]);

  const lastClickTimeRef = useRef<number>(0);
  const clickTimerRef = useRef<number | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const currentTime = new Date().getTime();
      const timeSinceLastClick = currentTime - lastClickTimeRef.current;

      if (timeSinceLastClick < 300 && lastClickTimeRef.current > 0) {
        // double click
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
            // single click
            store
              .getState()
              .setNodeWidthMode(
                node.id,
                toggleNodeWidthMode(node.data.nodeWidthMode as nodeWidthModes),
              );
            focusNodeWithDelay(node as SequenceNodeProps);
          }
          clickTimerRef.current = null;
        }, 300);
      }
    },
    [focusNode, focusNodeWithDelay],
  );

  const fitViewOptions = {
    minZoom: 0.4,
    maxZoom: 1,
    nodes: nodes.slice(0, 3),
  };

  return (
    <>
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
        nodesDraggable={allowInteraction}
        nodesConnectable={false}
      >
        {theme.debugMode && <DevTools />}
        <GraphControls
          allowInteraction={allowInteraction}
          onFocusNextNode={() => onFocusNextNode(focusedNode)}
          onFocusPreviousNode={() => onFocusPreviousNode(focusedNode)}
          onFocusCurrentNode={() => {
            if (focusedNode) {
              focusNode(focusedNode);
            }
          }}
        />
        <Panel position="top-left">
          Proteoform graph visualization with React Flow library
        </Panel>
        <Panel position="top-right">
          <SettingsButton setIsSettingsOpen={setIsSettingsOpen} />
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
        <StyledPanel position={"bottom-right"}>
          <OnScreenMenu />
        </StyledPanel>
      </ReactFlow>

      {isSettingsOpen && (
        <SideMenu
          isOpen={isSettingsOpen}
          previousSelectedFile={selectedFile}
          onClose={() => setIsSettingsOpen(false)}
          nodeWidthMode={nodeWidthMode}
          setNodeWidthMode={setNodeWidthMode}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          setStoreIsAnimated={setIsAnimated}
          storeIsAnimated={isAnimated}
          setStoreAllowInteraction={setAllowInteraction}
          storeAllowInteraction={allowInteraction}
        />
      )}

      <SettingsBackdrop
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />
      <LoadingBackdrop isLoading={isInitializing} />
    </>
  );
};

export default Flow;
