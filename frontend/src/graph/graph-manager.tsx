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
import { glowMethods, nodeTypes, nodeWidthModes } from "../theme/types.tsx";
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
import { MiniMapContainer } from "../components/minimap/minimap-container.tsx";
import { PeptideMonitor } from "../components/peptide-monitor/peptide-monitor.tsx";
import { OnScreenPeptidesMenu } from "../components/on-screen-peptides-menu/on-screen-peptides-menu.tsx";
import styled from "styled-components";
import { applyLocalStorageValues } from "./generation-utils/apply-local-storage.tsx";
import { ToggleMenuButton } from "../components/on-screen-menu/toggle-button.tsx";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  setNodeWidthMode: state.setGlobalNodeWidthMode,
  setLayoutMode: state.setLayoutMode,
  allowInteraction: state.allowInteraction,
  setPeptideMonitorForNode: state.setClickedNode,
  isPeptideMenuFullSize: state.isPeptideMenuFullSize,
  isIsoformMenuFullSize: state.isIsoformMenuFullSize,
  glowMethod: state.glowMethod,
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

const MenuStackContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  pointer-events: none;
  gap: 15px;
`;

const Flow = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { getInternalNode } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodeWidthMode,
    setLayoutMode,
    allowInteraction,
    setPeptideMonitorForNode,
    isPeptideMenuFullSize,
    isIsoformMenuFullSize,
    glowMethod,
  } = useGraphStore(selector, shallow); // using shallow to make sure the component only re-renders when one of the values changes
  const [focusedNode, setFocusedNode] = useState<SequenceNodeProps>();
  const { focusNode, onFocusNextNode, onFocusPreviousNode } = useFocusHandlers(
    nodes,
    setFocusedNode,
  );
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isOnScreenMenuOpen, setIsOnScreenMenuOpen] = useState(true);
  const [isPeptideMonitorOpen, setIsPeptideMonitorOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(true);
  const shouldShiftButtons = isPeptideMenuFullSize && isIsoformMenuFullSize;

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
          store
            .getState()
            .setNodeWidthMode(
              node.id,
              toggleNodeWidthMode(node.data.nodeWidthMode as nodeWidthModes),
            );
          focusNodeWithDelay(node as SequenceNodeProps);
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
            focusNode(node as SequenceNodeProps);
            setIsPeptideMonitorOpen(true);
            setPeptideMonitorForNode(node.id);
          }
          clickTimerRef.current = null;
        }, 300);
      }
    },
    [focusNode, focusNodeWithDelay, setPeptideMonitorForNode],
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
        edgesReconnectable={false}
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
        <StyledPanel position="top-left">
          Proteoform graph visualization with React Flow library
          <PeptideMonitor
            isOpen={isPeptideMonitorOpen}
            setIsOpen={setIsPeptideMonitorOpen}
          />
        </StyledPanel>
        <Panel position="top-right">
          <ToggleMenuButton
            onToggle={() => {
              if (glowMethod === glowMethods.intensity) {
                useGraphStore.setState({
                  isPeptideMenuFullSize: !isOnScreenMenuOpen,
                });
              }
            }}
            setIsOpen={setIsOnScreenMenuOpen}
            isOpen={isOnScreenMenuOpen}
            icon={"pencil_brush"}
            positionIndex={0}
            isShifted={shouldShiftButtons}
          />
          <ToggleMenuButton
            setIsOpen={setIsMapOpen}
            isOpen={isMapOpen}
            icon={"map"}
            positionIndex={1}
            isShifted={shouldShiftButtons}
          />
          <SettingsButton
            setIsSettingsOpen={setIsSideMenuOpen}
            isShifted={shouldShiftButtons}
          />
        </Panel>
        <MiniMapContainer isOpen={isMapOpen}>
          <button
            style={{
              border: "none",
              position: "relative",
              height: "30px",
              left: 60,
              bottom: 180,
              zIndex: 110,
            }}
            onClick={() => {
              setIsMapOpen(false);
            }}
          >{`<<`}</button>
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
        </MiniMapContainer>
        <StyledPanel position={"bottom-right"}>
          <MenuStackContainer>
            <OnScreenPeptidesMenu
              isOpen={isOnScreenMenuOpen}
              setIsOpen={setIsOnScreenMenuOpen}
            />
            <OnScreenMenu
              isOpen={isOnScreenMenuOpen}
              setIsOpen={setIsOnScreenMenuOpen}
              focusNodeWithDelay={focusNodeWithDelay}
            />
          </MenuStackContainer>
        </StyledPanel>
      </ReactFlow>

      {isSideMenuOpen && (
        <SideMenu
          isOpen={isSideMenuOpen}
          previousSelectedFile={selectedFile}
          onClose={() => setIsSideMenuOpen(false)}
        />
      )}

      <SettingsBackdrop
        isSettingsOpen={isSideMenuOpen}
        setIsSettingsOpen={setIsSideMenuOpen}
      />
      <LoadingBackdrop isLoading={isInitializing} />
    </>
  );
};

export default Flow;
