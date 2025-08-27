import {
  ReactFlow,
  type NodeOrigin,
  Panel,
  type NodeMouseHandler,
  MiniMap,
  type Edge,
} from "@xyflow/react";
import DevTools from "./devtools/devtools.tsx";

import "@xyflow/react/dist/style.css";
import useGraphStore, { type RFState } from "./store.ts";
import { shallow } from "zustand/vanilla/shallow";

import SequenceNode from "../components/sequence-node/sequence-node.tsx";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
  type JSX,
} from "react";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import GraphControls from "../controls/graph-controls.tsx";
import { useFocusHandlers } from "../controls/focus-node/focus-utils.ts";
import {
  glowMethods,
  type NodeTypes,
  nodeTypes,
  nodeWidthModes,
} from "../theme/types.tsx";
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
import { applyLocalStorageValues } from "./generation-utils/apply-local-storage.tsx";
import { ToggleMenuButton } from "../components/on-screen-menu/toggle-button.tsx";
import { IntensitySourceProvider } from "../controls/intensity-source-context.tsx";
import {
  GraphContainer,
  GraphLabel,
  GraphSection,
  MenuStackContainer,
  OverlayContainer,
} from "../components/base-components/graph-wrapper.tsx";
import DownloadButton from "../components/download-button/download-button.tsx";

// Split the selectors to minimize re-renders
const graphDataSelector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
});

const graphConfigSelector = (state: RFState) => ({
  allowInteraction: state.allowInteraction,
  shouldRerender: state.shouldRerender,
});

const graphIntensitySelector = (state: RFState) => ({
  intensitySourceTop: state.intensitySourceTop,
  intensitySourceBottom: state.intensitySourceBottom,
  isDualGraphMode: state.showDualScreen,
  glowMethod: state.glowMethod,
});

const graphMenuSelector = (state: RFState) => ({
  isPeptideMenuFullSize: state.isPeptideMenuFullSize,
  isIsoformMenuFullSize: state.isIsoformMenuFullSize,
});

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const myNodeTypes = {
  [nodeTypes.SequenceNode]: SequenceNode,
  [nodeTypes.RowNode]: RowNode,
};
const edgeTypes = {
  arrow: ArrowEdge,
};

function renderGraph(
  intensitySource: string,
  isTop: boolean,
  label: string,
  isDualGraphMode: boolean,
  nodes: NodeTypes[],
  edges: Edge[],
  onNodesChange: (changes: any) => void,
  onEdgesChange: (changes: any) => void,
  allowInteraction: boolean,
  handleNodeClick: NodeMouseHandler,
  fitViewOptions: { minZoom: number; maxZoom: number; nodes: NodeTypes[] },
): JSX.Element {
  return (
    <GraphSection isTop={isTop} isDualMode={isDualGraphMode}>
      <GraphLabel isDualMode={true}>{label}</GraphLabel>
      <IntensitySourceProvider
        intensitySource={intensitySource}
        isSecondaryGraph={!isTop}
      >
        <ReactFlow
          debug={theme.debugMode}
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
          onNodeClick={handleNodeClick}
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
}

const Flow = memo(() => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);
  const initializationTriggeredRef = useRef(false);
  const initializationCompletedRef = useRef(false);
  const { nodes, edges, onNodesChange, onEdgesChange } = useGraphStore(
    graphDataSelector,
    shallow,
  );

  const { allowInteraction, shouldRerender } = useGraphStore(
    graphConfigSelector,
    shallow,
  );

  const {
    intensitySourceTop,
    intensitySourceBottom,
    isDualGraphMode,
    glowMethod,
  } = useGraphStore(graphIntensitySelector, shallow);

  const { isPeptideMenuFullSize, isIsoformMenuFullSize } = useGraphStore(
    graphMenuSelector,
    shallow,
  );

  // Memoize these stable functions from store to avoid recreating them
  const setNodeWidthMode = useMemo(
    () => useGraphStore.getState().setGlobalNodeWidthMode,
    [],
  );
  const setLayoutMode = useMemo(
    () => useGraphStore.getState().setLayoutMode,
    [],
  );
  const setPeptideMonitorForNode = useMemo(
    () => useGraphStore.getState().setClickedNode,
    [],
  );

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

  // graph component
  const [topGraphComponent, setTopGraphComponent] =
    useState<JSX.Element | null>(null);
  const [bottomGraphComponent, setBottomGraphComponent] =
    useState<JSX.Element | null>(null);

  const topGraphLabel = useMemo(() => {
    return glowMethod === glowMethods.intensity
      ? `Intensity source: ${intensitySourceTop}`
      : `Intensity highlighted by count of peptides`;
  }, [glowMethod, intensitySourceTop]);

  const bottomGraphLabel = useMemo(() => {
    return `Intensity source: ${intensitySourceBottom}`;
  }, [intensitySourceBottom]);

  const focusNodeWithDelay = useCallback(
    (nodeToBeFocused: SequenceNodeProps) => {
      const timer = setTimeout(() => {
        focusNode(nodeToBeFocused);
      }, theme.delay.graphRerendering);

      return () => clearTimeout(timer);
    },
    [focusNode],
  );

  // --- Initialization trigger effect ---
  useEffect(() => {
    if (shouldRerender && !initializationTriggeredRef.current) {
      setIsInitializing(true);
      initializationTriggeredRef.current = true;
    } else if (!shouldRerender) {
      initializationTriggeredRef.current = false;
    }
  }, [shouldRerender]);

  // --- Initialization logic ---
  useEffect(() => {
    if (!isInitializing) return;
    // Skip if not initializing or already completed
    if (!isInitializing || initializationCompletedRef.current) return;

    applyLocalStorageValues(setSelectedFile);

    let nodes = useGraphStore.getState().nodes;
    const layoutMode = useGraphStore.getState().layoutMode;
    const nodeWidthMode = useGraphStore.getState().nodeWidthMode;

    if (nodes.length === 0) {
      console.warn(
        "No nodes available in the graph. Please check the data source.",
      );
      setIsInitializing(false);
      initializationTriggeredRef.current = false;
      setIsSideMenuOpen(true);
      setHasNoData(true);
      return;
    }

    // Use a single timeout for the entire initialization process
    const initTimeout = setTimeout(() => {
      setNodeWidthMode(nodeWidthMode);
      setLayoutMode(layoutMode);

      nodes = useGraphStore.getState().nodes; // Refresh nodes after layout application

      setTopGraphComponent(
        renderGraph(
          intensitySourceTop,
          true,
          glowMethod === glowMethods.intensity
            ? `Intensity source: ${intensitySourceTop}`
            : "Intensity highlighted by count of peptides",
          isDualGraphMode,
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          allowInteraction,
          handleNodeClick,
          fitViewOptions,
        ),
      );
      setBottomGraphComponent(
        isDualGraphMode
          ? null
          : renderGraph(
              intensitySourceBottom,
              false,
              `Intensity source: ${intensitySourceBottom}`,
              isDualGraphMode,
              nodes,
              edges,
              onNodesChange,
              onEdgesChange,
              allowInteraction,
              handleNodeClick,
              fitViewOptions,
            ),
      );

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
      setIsInitializing(false);
      initializationTriggeredRef.current = false;
      initializationCompletedRef.current = true;
      store.setState({ shouldRerender: false });
    }, 500);

    return () => clearTimeout(initTimeout);
  }, [
    isInitializing,
    focusNodeWithDelay,
    setNodeWidthMode,
    setLayoutMode,
    intensitySourceTop,
    intensitySourceBottom,
    glowMethod,
  ]);

  // Reset initialization completed flag when shouldRerender becomes true again
  useEffect(() => {
    if (shouldRerender) {
      initializationCompletedRef.current = false;
    }
  }, [shouldRerender]);

  const lastClickTimeRef = useRef<number>(0);
  const clickTimerRef = useRef<number | null>(null);

  const handleNodeClick: NodeMouseHandler = useCallback(
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

  // Memoize fitViewOptions with stable dependencies
  const fitViewOptions = useMemo(
    () => {
      return {
        minZoom: 0.4,
        maxZoom: 1,
        nodes: nodes.slice(0, 3),
      };
    },
    [nodes.length], // Only depend on length, not the entire array
  );

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    setTopGraphComponent(
      renderGraph(
        intensitySourceTop,
        true,
        topGraphLabel,
        isDualGraphMode,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        allowInteraction,
        handleNodeClick,
        fitViewOptions,
      ),
    );
  }, [
    intensitySourceTop,
    topGraphLabel,
    isDualGraphMode,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    allowInteraction,
    handleNodeClick,
    fitViewOptions,
    isInitializing,
  ]);

  useEffect(() => {
    if (!isDualGraphMode || isInitializing) {
      setBottomGraphComponent(null);
      return;
    }
    setBottomGraphComponent(
      renderGraph(
        intensitySourceBottom,
        false,
        bottomGraphLabel,
        isDualGraphMode,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        allowInteraction,
        handleNodeClick,
        fitViewOptions,
      ),
    );
  }, [
    intensitySourceBottom,
    bottomGraphLabel,
    isDualGraphMode,
    nodes,
    allowInteraction,
    intensitySourceTop,
    edges,
    onNodesChange,
    onEdgesChange,
    handleNodeClick,
    fitViewOptions,
  ]);

  // Memoize UI components that don't need to re-render with graph data
  const overlayControls = useMemo(
    () => (
      <OverlayContainer>
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
          <DownloadButton />
          <SettingsButton
            setIsSettingsOpen={setIsSideMenuOpen}
            isShifted={shouldShiftButtons}
          />
        </Panel>
        <MiniMapContainer isOpen={isMapOpen} style={{ pointerEvents: "auto" }}>
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
    ),
    [
      allowInteraction,
      onFocusNextNode,
      onFocusPreviousNode,
      focusNode,
      focusedNode,
      isPeptideMonitorOpen,
      setIsPeptideMonitorOpen,
      isOnScreenMenuOpen,
      isMapOpen,
      shouldShiftButtons,
      glowMethod,
      focusNodeWithDelay,
    ],
  );

  return (
    <>
      <GraphContainer>
        {isDualGraphMode ? (
          <>
            {topGraphComponent}
            {bottomGraphComponent}
          </>
        ) : (
          topGraphComponent
        )}

        {/* Overlay controls that apply to both graphs */}
        {overlayControls}
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
});

export default Flow;
