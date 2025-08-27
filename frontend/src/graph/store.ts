import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";

import { default as nodesData } from "../../../generated/nodes.json" assert { type: "json" };
import { default as edgesData } from "../../../generated/edges.json" assert { type: "json" };
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../theme";
import {
  type colorScaleOptions,
  type ExtremesBySource,
  type glowMethods,
  type intensityMethods,
  labelVisibilities,
  type layoutModes,
  localStorageKeys,
  nodeWidthModes,
  type NodeTypes,
  type PeptideLog,
} from "../theme/types.tsx";
import {
  addSymmetricalOffsetForVariations,
  applyLayout,
  assignPositionIndices,
  filterAndResetNodes,
} from "./layout";
import type { ArrowEdgeProps } from "../components/arrow-edge/arrow-edge.props.tsx";
import {
  createEdges,
  createNodes,
  generateIsoformColorMatching,
} from "./generation-utils/nodes-edges.tsx";
import { performanceTracker } from "../evaluation/trackers/performance-tracker.ts";
import {
  measuringTracker,
  recordEdgeMeasurements,
} from "../evaluation/trackers/edge-measuring-tracker.ts";

export type SourceToTargets = Record<
  string,
  {
    positionIndex: number;
    all_targets: string[];
  }
>;

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  shouldRerender: boolean;
  nodeWidthMode: nodeWidthModes;
  setGlobalNodeWidthModeAndApplyLayout: (nodeWidthMode: nodeWidthModes) => void;
  setGlobalNodeWidthMode: (nodeWidthMode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (layoutMode: layoutModes) => void;
  setNodeWidthMode: (nodeId: string, mode: nodeWidthModes) => void;
  hoveredNode: string | null;
  setHoveredNode: (nodeId: string | null) => void;
  clickedNode: string | null;
  setClickedNode: (nodeId: string | null) => void;
  isIsoformMenuFullSize: boolean;
  isPeptideMenuFullSize: boolean;

  preparedNodes: SequenceNodeProps[];
  sourceToTargets: SourceToTargets;
  calculatePositionData: () => void;

  isoformColorMapping: Record<string, string>;
  selectedIsoforms: string[];
  toggleIsoformSelection: (isoform: string) => void;
  deselectAllIsoforms: () => void;
  updateIsoformColor: (isoform: string, color: string) => void;
  nodeExtremes: ExtremesBySource;
  edgeExtremes: ExtremesBySource;
  maxPeptidesNodes: number;
  maxPeptidesEdges: number;
  peptidesByNode: Record<string, PeptideLog>;
  peptidesByEdge: Record<string, PeptideLog>;
  getPeptidesForNode: (nodeId: string) => PeptideLog;
  getPeptidesForEdge: (edgeId: string) => PeptideLog;
  allIntensitySources: string[];
  colorScale: colorScaleOptions;
  setColorScale: (colorScale: colorScaleOptions) => void;
  glowMethod: glowMethods;
  setGlowMethod: (glowMethod: glowMethods) => void;
  intensityMethod: intensityMethods;
  setIntensityMethod: (intensityMethod: string) => void;
  intensitySource: string;
  setIntensitySource: (intensitySource: string) => void;
  showDualScreen: boolean;
  setShowDualScreen: (showDualScreen: boolean) => void;
  intensitySourceTop: string;
  setIntensitySourceTop: (intensitySource: string) => void;
  intensitySourceBottom: string;
  setIntensitySourceBottom: (intensitySource: string) => void;

  isAnimated: boolean;
  setIsAnimated: (isAnimated: boolean) => void;
  allowInteraction: boolean;
  reverseNodes: boolean;
  numberOfAllowedIsoforms: number;
  rowWidth: number;
  labelVisibility: labelVisibilities;
  zeroValuesPeptides: boolean;
};

// ----- create nodes and edges -----
const nodes =
  Array.isArray(nodesData) && Object.keys(nodesData).length > 0
    ? nodesData
    : [];
const edges =
  Array.isArray(edgesData) && Object.keys(edgesData).length > 0
    ? edgesData
    : [];

const isDataMissing = nodes.length === 0 || edges.length === 0;

// Create empty defaults if data is missing
const [
  customNodes,
  nodesMaxPeptides,
  nodeExtremes,
  intensitySources,
  peptidesDictNodes,
] = isDataMissing
  ? [[], 0, {}, [], {}]
  : createNodes(nodes as SequenceNodeProps[]);

const [customEdges, edgesMaxPeptides, edgeExtremes, peptidesDictEdges] =
  isDataMissing
    ? [[], 0, {}, {}]
    : createEdges(edges as ArrowEdgeProps[], intensitySources);

// Generate color mapping for isoforms
const initialIsoformColorMapping = generateIsoformColorMatching(
  customEdges as ArrowEdgeProps[],
);

const useGraphStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: customNodes,
  edges: customEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  shouldRerender: true,

  preparedNodes: [],
  sourceToTargets: {},

  calculatePositionData: () => {
    const { nodes, edges } = get();
    const trackedFilterAndResetNodes = performanceTracker.time(
      "filterAndResetNodes",
      filterAndResetNodes,
    );
    const filteredNodes = trackedFilterAndResetNodes(nodes as NodeTypes[]);

    const trackedAssignPositionIndices = performanceTracker.time(
      "assignPositionIndices",
      assignPositionIndices,
    );
    const [assignedNodes, sourceToTargets] = trackedAssignPositionIndices(
      filteredNodes,
      edges,
    );

    const trackedAddSymmetricalOffsetForVariations = performanceTracker.time(
      "addSymmetricalOffsetForVariations",
      addSymmetricalOffsetForVariations,
    );
    const yOffsetNodes =
      trackedAddSymmetricalOffsetForVariations(assignedNodes);

    set({ preparedNodes: yOffsetNodes, sourceToTargets });
  },

  // --- layouting ---
  layoutMode: defaultValues.layoutMode,
  setLayoutMode: async (layoutMode: layoutModes) => {
    let { nodes, edges, rowWidth, preparedNodes, sourceToTargets } = get();

    // Calculate position data if not already done
    if (preparedNodes.length === 0) {
      get().calculatePositionData();
      preparedNodes = get().preparedNodes;
      sourceToTargets = get().sourceToTargets;
    }

    const layoutedNodes = await applyLayout(
      nodes,
      edges,
      layoutMode,
      rowWidth,
      preparedNodes,
      sourceToTargets,
    );

    // Record edge measurements after layout is applied
    if (measuringTracker.isCurrentlyTracking()) {
      const edgeMeasurements = edges.map((edge) => {
        const sourceNode = layoutedNodes.find((n) => n.id === edge.source);
        const targetNode = layoutedNodes.find((n) => n.id === edge.target);

        console.log(
          "positions: ",
          sourceNode?.position.x,
          sourceNode?.position.y,
          targetNode?.position.x,
          targetNode?.position.y,
        );
        const length =
          sourceNode && targetNode
            ? Math.sqrt(
                Math.pow(targetNode.position.x - sourceNode.position.x, 2) +
                  Math.pow(targetNode.position.y - sourceNode.position.y, 2),
              )
            : 0; // No length
        console.log(`Edge ${edge.id} length: ${length}`);

        return {
          edgeId: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
          length,
          peptideCount: edge.data?.peptideCount,
          isoforms: edge.data?.isoforms,
        };
      });

      recordEdgeMeasurements(edgeMeasurements);
    }

    set({
      nodes: layoutedNodes,
      layoutMode,
    });
  },

  // --- width of nodes ---
  nodeWidthMode: defaultValues.nodeWidthMode,
  setGlobalNodeWidthModeAndApplyLayout: async (
    nodeWidthMode: nodeWidthModes,
  ) => {
    const {
      nodes,
      edges,
      layoutMode,
      rowWidth,
      sourceToTargets,
      preparedNodes,
    } = get();

    const alteredNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeWidthMode: nodeWidthMode,
      },
    }));

    // Calculate position data if not already done
    if (preparedNodes.length === 0) {
      get().calculatePositionData();
    }

    const layoutedNodes = await applyLayout(
      alteredNodes,
      edges,
      layoutMode,
      rowWidth,
      preparedNodes,
      sourceToTargets,
    );

    set({
      nodes: layoutedNodes,
      nodeWidthMode,
    });
  },
  setGlobalNodeWidthMode: (nodeWidthMode: nodeWidthModes) => {
    const alteredNodes = get().nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeWidthMode: nodeWidthMode,
      },
    }));
    set({ nodes: alteredNodes, nodeWidthMode });
  },
  setNodeWidthMode: (nodeId: string, mode: nodeWidthModes) => {
    const state = get();
    const updatedNodes = state.nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            nodeWidthMode: mode,
          },
        };
      }
      return node;
    });

    // Calculate position data if not already done
    if (state.preparedNodes.length === 0) {
      get().calculatePositionData();
    }

    // Reapply layout after changing the individual node width mode
    if (theme.node.delayedRerendering) {
      applyLayout(
        updatedNodes,
        state.edges,
        state.layoutMode,
        state.rowWidth,
        state.preparedNodes,
        state.sourceToTargets,
      ).then((layoutedNodes) => {
        set({
          nodes: layoutedNodes,
        });
      });
    } else {
      setTimeout(() => {
        applyLayout(
          updatedNodes,
          state.edges,
          state.layoutMode,
          state.rowWidth,
          state.preparedNodes,
          state.sourceToTargets,
        ).then((layoutedNodes) => {
          set({
            nodes: layoutedNodes,
          });
        });
      }, 100);
    }
  },
  hoveredNode: null,
  setHoveredNode: (nodeId: string | null) => {
    set({ hoveredNode: nodeId });
  },
  clickedNode: null,
  setClickedNode: (nodeId: string | null) => {
    set({ clickedNode: nodeId });
  },
  isIsoformMenuFullSize: Object.values(initialIsoformColorMapping).length > 3,
  isPeptideMenuFullSize: false,
  // --- isoform colored edges ---
  isoformColorMapping: initialIsoformColorMapping,
  selectedIsoforms: [],
  toggleIsoformSelection: (isoform: string) => {
    const { selectedIsoforms } = get();
    const newSelection = selectedIsoforms.includes(isoform)
      ? selectedIsoforms.filter((iso) => iso !== isoform)
      : selectedIsoforms.length >= get().numberOfAllowedIsoforms
        ? selectedIsoforms
        : [...selectedIsoforms, isoform];

    set({ selectedIsoforms: newSelection });

    localStorage.setItem("selectedIsoforms", JSON.stringify(newSelection));
  },
  deselectAllIsoforms: () => {
    set({ selectedIsoforms: [] });
  },
  // comment out when shortcut needed
  // deselectAllIsoforms: () => {
  //   const allIsoforms = Object.keys(get().isoformColorMapping).filter(
  //     (isoform) => isoform !== "Default",
  //   );
  //   set({ selectedIsoforms: allIsoforms });
  //
  //   localStorage.setItem("selectedIsoforms", JSON.stringify(allIsoforms));
  // },
  updateIsoformColor: (isoform: string, color: string) => {
    const { isoformColorMapping } = get();
    const updatedMapping = {
      ...isoformColorMapping,
      [isoform]: color,
    };

    set({ isoformColorMapping: updatedMapping });

    localStorage.setItem("isoformColorMapping", JSON.stringify(updatedMapping));
  },

  // --- peptide features ---
  nodeExtremes: nodeExtremes,
  edgeExtremes: edgeExtremes,
  maxPeptidesNodes: nodesMaxPeptides,
  maxPeptidesEdges: edgesMaxPeptides,
  allIntensitySources: intensitySources,
  peptidesByNode: peptidesDictNodes,
  peptidesByEdge: peptidesDictEdges,
  getPeptidesForNode: (nodeId: string) => {
    return get().peptidesByNode[nodeId] || [];
  },
  getPeptidesForEdge: (edgeId: string) => {
    return get().peptidesByEdge[edgeId] || [];
  },
  colorScale: theme.edgeGlow.defaultColorScale,
  setColorScale: (colorScale: colorScaleOptions) => {
    set({ colorScale });
    localStorage.setItem(localStorageKeys.colorScale, colorScale);
  },
  glowMethod: theme.edgeGlow.defaultMethod,
  setGlowMethod: (glowMethod: glowMethods) => {
    set({ glowMethod });
    localStorage.setItem(localStorageKeys.glowMethod, glowMethod);
  },
  intensityMethod: theme.edgeGlow.defaultMultiplePeptidesMethod,
  setIntensityMethod: (intensityMethod: string) => {
    set({ intensityMethod });
    localStorage.setItem(localStorageKeys.intensityMethod, intensityMethod);
  },
  intensitySource: intensitySources[0],
  setIntensitySource: (intensitySource: string) => {
    set({ intensitySource });
    localStorage.setItem(localStorageKeys.intensitySource, intensitySource);
  },
  showDualScreen: false,
  setShowDualScreen: (showDualScreen: boolean) => {
    set({ showDualScreen });
  },
  intensitySourceTop: intensitySources[0] || "",
  setIntensitySourceTop: (intensitySource: string) => {
    set({ intensitySourceTop: intensitySource });
  },
  intensitySourceBottom: intensitySources[1] || intensitySources[0] || "",
  setIntensitySourceBottom: (intensitySource: string) => {
    set({ intensitySourceBottom: intensitySource });
  },
  // --- settings variables ---
  isAnimated: defaultValues.isAnimated,
  setIsAnimated: (isAnimated: boolean) => {
    set({ isAnimated });
    set({
      edges: get().edges.map((edge) => ({ ...edge, animated: isAnimated })),
    });
  },
  allowInteraction: defaultValues.allowInteraction,
  reverseNodes: defaultValues.reverseNodes,
  numberOfAllowedIsoforms: defaultValues.numberOfAllowedIsoforms,
  rowWidth: defaultValues.rowWidth,
  labelVisibility: defaultValues.labelVisibility,
  zeroValuesPeptides: defaultValues.zeroValuesPeptides,
}));

export default useGraphStore;
