import {
  ReactFlow,
  type NodeOrigin,
  Panel,
  type NodeMouseHandler,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
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
import { IntensitySourceProvider } from "./IntensitySourceContext.tsx";

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
  shouldRerender: state.shouldRerender,
  allIntensitySources: state.allIntensitySources,
  intensitySourceTop: state.intensitySourceTop,
  intensitySourceBottom: state.intensitySourceBottom,
  isDualGraphMode: state.showDualScreen,
});

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

const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
`;

const GraphSection = styled.div<{ isTop?: boolean; isDualMode?: boolean }>`
  flex: 1;
  position: relative;
  border-bottom: ${(props) =>
    props.isDualMode && props.isTop ? "2px solid #ccc" : "none"};
  display: ${(props) => (!props.isDualMode && !props.isTop ? "none" : "block")};
`;

const GraphLabel = styled.div<{ isDualMode?: boolean }>`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  z-index: 50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  display: ${(props) => (props.isDualMode ? "block" : "none")};
`;

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
`;

const Flow = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
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
    shouldRerender,
    intensitySourceTop,
    intensitySourceBottom,
    isDualGraphMode,
  } = useGraphStore(selector, shallow);

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
      }, theme.delay.graphRerendering);

      return () => clearTimeout(timer);
    },
    [focusNode],
  );

  useEffect(() => {
    setIsInitializing(shouldRerender);
  }, [shouldRerender]);

  // --- Initialization logic ---
  useEffect(() => {
    if (!isInitializing) return;
    console.log("Initializing graph...");
    applyLocalStorageValues(setSelectedFile);

    const nodes = useGraphStore.getState().nodes;
    const layoutMode = useGraphStore.getState().layoutMode;
    const nodeWidthMode = useGraphStore.getState().nodeWidthMode;

    if (nodes.length === 0) {
      console.warn(
        "No nodes available in the graph. Please check the data source.",
      );
      setIsInitializing(false);
      setIsSideMenuOpen(true);
      setHasNoData(true);
      return;
    }

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

      setTimeout(() => {
        setIsInitializing(false);
        store.setState({ shouldRerender: false });
      }, 1000);
    }, 500);
  }, [
    isInitializing,
    focusNodeWithDelay,
    setLayoutMode,
    setNodeWidthMode,
    intensitySourceTop,
    intensitySourceBottom,
  ]);

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
            if (node.type === nodeTypes.SequenceNode) {
              setIsPeptideMonitorOpen(true);
            }
          }
          clickTimerRef.current = null;
        }, 300);
      }
    },
    [focusNode, focusNodeWithDelay, setPeptideMonitorForNode],
  );

  // if loaded without data, information marker shall disappear after a few seconds
  useEffect(() => {
    if (!hasNoData) {
      return;
    }
    setTimeout(() => {
      setHasNoData(false);
    }, 5000);
  }, [hasNoData]);

  const fitViewOptions = {
    minZoom: 0.4,
    maxZoom: 1,
    nodes: nodes.slice(0, 3),
  };

  const renderGraph = (
    intensitySource: string,
    isTop: boolean,
    label: string,
  ) => (
    <GraphSection isTop={isTop} isDualMode={isDualGraphMode}>
      <GraphLabel isDualMode={isDualGraphMode}>{label}</GraphLabel>
      <IntensitySourceProvider
        intensitySource={intensitySource}
        isSecondaryGraph={!isTop}
      >
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
        </ReactFlow>
      </IntensitySourceProvider>
    </GraphSection>
  );

  return (
    <>
      <GraphContainer>
        {isDualGraphMode ? (
          <>
            {renderGraph(
              intensitySourceTop,
              true,
              `Top Graph: ${intensitySourceTop}`,
            )}
            {renderGraph(
              intensitySourceBottom,
              false,
              `Bottom Graph: ${intensitySourceBottom}`,
            )}
          </>
        ) : (
          renderGraph(intensitySourceTop, true, "")
        )}

        {/* Overlay controls that apply to both graphs */}
        <OverlayContainer>
          <GraphControls
            allowInteraction={allowInteraction}
            onFocusNextNode={() => onFocusNextNode(focusedNode)}
            onFococusPreviousNode={() => onFocusPreviousNode(focusedNode)}
            onFocusCurrentNode={() => {
              if (focusedNode) {
                focusNode(focusedNode);
              }
            }}
          />
          <StyledPanel position="top-left" style={{ pointerEvents: "auto" }}>
            Proteoform graph visualization with React Flow library
            <PeptideMonitor
              isOpen={isPeptideMonitorOpen}
              setIsOpen={setIsPeptideMonitorOpen}
            />
          </StyledPanel>
          <Panel position="top-right" style={{ pointerEvents: "auto" }}>
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
          <MiniMapContainer
            isOpen={isMapOpen}
            style={{ pointerEvents: "auto" }}
          >
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
          <StyledPanel
            position={"bottom-right"}
            style={{ pointerEvents: "auto" }}
          >
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
        </OverlayContainer>
      </GraphContainer>

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
        startUpInfo={hasNoData}
      />
      <LoadingBackdrop isLoading={isInitializing} />
    </>
  );
};

export default Flow;
