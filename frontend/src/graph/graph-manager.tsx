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
import { theme } from "../theme";
import RowNode from "../components/row-node.tsx";
import store from "./store.ts";
import { toggleNodeWidthMode } from "./layout/helper.tsx";
import DirectionMiniMapNode from "../components/minimap/direction-minimap-node.tsx";
import ArrowEdge from "../components/arrow-edge/arrow-edge.tsx";
import { SettingsMenu } from "../components/settings-menu/settings-menu.tsx";
import { Icon } from "../components/icon";
import { OnScreenMenu } from "../components/on-screen-menu/on-screen-menu.tsx";
import { StyledPanel } from "../components/base-components";

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
  const [isInitializing, setIsInitializing] = useState(false);
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const focusNodeWithDelay = (nodeToBeFocused: SequenceNodeProps) => {
    const timer = setTimeout(() => {
      focusNode(nodeToBeFocused);
    }, 500);

    return () => clearTimeout(timer);
  };

  // Initialize graph
  useEffect(() => {
    if (isInitializing) return;
    setIsInitializing(true);
    useGraphStore.getState().setInternalNodeGetter(getInternalNode);

    const savedNodeWidthMode = localStorage.getItem(
      "defaultNodeWidthMode",
    ) as nodeWidthModes;
    const savedLayoutMode = localStorage.getItem(
      "defaultLayoutMode",
    ) as layoutModes;
    const savedIsAnimated = localStorage.getItem("isAnimated");
    const savedAllowInteraction = localStorage.getItem("allowInteraction");
    const selectedIsoforms = localStorage.getItem("selectedIsoforms");
    const isoformColorMapping = localStorage.getItem("isoformColorMapping");

    if (
      savedLayoutMode &&
      Object.values(layoutModes).includes(savedLayoutMode)
    ) {
      useGraphStore.setState({ layoutMode: savedLayoutMode });
    }

    if (
      savedNodeWidthMode &&
      Object.values(nodeWidthModes).includes(savedNodeWidthMode)
    ) {
      useGraphStore.setState({ nodeWidthMode: savedNodeWidthMode });
    }

    if (savedIsAnimated) {
      useGraphStore.getState().setIsAnimated(savedIsAnimated === "true");
    }

    if (savedAllowInteraction) {
      useGraphStore
        .getState()
        .setAllowInteraction(savedAllowInteraction === "true");
    }

    if (selectedIsoforms) {
      try {
        const parsedSelection = JSON.parse(selectedIsoforms);
        useGraphStore.setState({ selectedIsoforms: parsedSelection });
      } catch (error) {
        console.error("Error parsing selected isoforms", error);
      }
    }

    if (isoformColorMapping) {
      try {
        const parsedColorMapping = JSON.parse(isoformColorMapping);
        useGraphStore.setState({ isoformColorMapping: parsedColorMapping });
      } catch (error) {
        console.error("Error parsing isoform color mapping", error);
      }
    }
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
  }, [isInitializing]);

  const toggleGlobalNodeWidthMode = () => {
    setNodeWidthMode(toggleNodeWidthMode(nodeWidthMode));
  };

  const toggleSnakeLayout = () => {
    setLayoutMode(
      layoutMode === layoutModes.Basic ? layoutModes.Snake : layoutModes.Basic,
    );
    focusNodeWithDelay(focusedNode as SequenceNodeProps);
  };

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
    [focusNode],
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
          <div
            style={{
              padding: "10px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{
                padding: "8px 12px",
                color: "gray",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              <Icon icon={"settings"} />
            </button>
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
        <StyledPanel position={"bottom-right"}>
          <OnScreenMenu />
        </StyledPanel>
      </ReactFlow>

      {isSettingsOpen && (
        <SettingsMenu
          isOpen={isSettingsOpen}
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

      {/* Backdrop for settings menu */}
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 999,
          }}
          onClick={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Backdrop when initializing */}
      {isInitializing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1>Initializing...</h1>
        </div>
      )}
    </>
  );
};

export default Flow;
