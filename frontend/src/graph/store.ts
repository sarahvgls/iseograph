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
  type PeptideLog,
} from "../theme/types.tsx";
import { applyLayout } from "./layout";
import type { ArrowEdgeProps } from "../components/arrow-edge/arrow-edge.props.tsx";
import {
  createEdges,
  createNodes,
  generateIsoformColorMatching,
} from "./generation-utils/nodes-edges.tsx";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeWidthMode: nodeWidthModes;
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
  : createNodes(nodes as unknown as SequenceNodeProps[]);

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

  // --- layouting ---
  layoutMode: defaultValues.layoutMode,
  setLayoutMode: async (layoutMode: layoutModes) => {
    set({ layoutMode });

    const { nodes, edges, rowWidth } = get();

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      nodes,
      edges,
      layoutMode,
      rowWidth,
    );

    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },

  // --- width of nodes ---
  nodeWidthMode: defaultValues.nodeWidthMode,
  setGlobalNodeWidthMode: async (nodeWidthMode: nodeWidthModes) => {
    set({ nodeWidthMode });

    const { nodes, edges, layoutMode, rowWidth } = get();

    // create altered nodes to be available for the internal nodes
    const alteredNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeWidthMode: nodeWidthMode,
      },
    }));
    set({ nodes: alteredNodes });

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      alteredNodes,
      edges,
      layoutMode,
      rowWidth,
    );

    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
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
    set({ nodes: updatedNodes });

    // Reapply layout after changing the individual node width mode
    if (theme.node.delayedRerendering) {
      applyLayout(
        updatedNodes,
        state.edges,
        state.layoutMode,
        state.rowWidth,
      ).then(([layoutedNodes, layoutedEdges]) => {
        set({
          nodes: layoutedNodes,
          edges: layoutedEdges,
        });
      });
    } else {
      setTimeout(() => {
        applyLayout(
          updatedNodes,
          state.edges,
          state.layoutMode,
          state.rowWidth,
        ).then(([layoutedNodes, layoutedEdges]) => {
          set({
            nodes: layoutedNodes,
            edges: layoutedEdges,
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
