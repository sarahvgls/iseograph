import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type InternalNode,
  type Node,
  type NodeChange,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../theme";
import {
  labelVisibilities,
  type layoutModes,
  localStorageKeys,
  nodeWidthModes,
} from "../theme/types.tsx";
import { applyLayout } from "./layout";
import type { ArrowEdgeProps } from "../components/arrow-edge/arrow-edge.props.tsx";
import {
  createEdges,
  createNodes,
  generateIsoformColorMatching,
} from "./helper/generate-utils.tsx";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  getInternalNodeFn: ((id: string) => InternalNode | undefined) | null;
  setInternalNodeGetter: (
    getter: (id: string) => InternalNode | undefined,
  ) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeWidthMode: nodeWidthModes;
  setGlobalNodeWidthMode: (nodeWidthMode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (layoutMode: layoutModes) => void;
  setNodeWidthMode: (nodeId: string, mode: nodeWidthModes) => void;
  hoveredNode: string | null;
  setHoveredNode: (nodeId: string | null) => void;
  isoformColorMapping: Record<string, string>;
  selectedIsoforms: string[];
  toggleIsoformSelection: (isoform: string) => void;
  deselectAllIsoforms: () => void;
  updateIsoformColor: (isoform: string, color: string) => void;
  maxPeptidesNodes: number;
  maxPeptidesEdges: number;
  isAnimated: boolean;
  setIsAnimated: (isAnimated: boolean) => void;
  allowInteraction: boolean;
  reverseNodes: boolean;
  numberOfAllowedIsoforms: number;
  rowWidth: number;
  labelVisibility: labelVisibilities;
};

// ----- create nodes and edges -----
const [customNodes, nodesMaxPeptides] = createNodes(
  nodes as SequenceNodeProps[],
);
const [customEdges, edgesMaxPeptides] = createEdges(edges as ArrowEdgeProps[]);

// Generate color mapping for isoforms
const initialIsoformColorMapping = generateIsoformColorMatching(
  customEdges as ArrowEdgeProps[],
);

// Load selected isoforms from localStorage if available
const loadSelectedIsoforms = (): string[] => {
  try {
    const savedSelection = localStorage.getItem(
      localStorageKeys.selectedIsoforms,
    );
    return savedSelection
      ? JSON.parse(savedSelection)
      : Object.keys(initialIsoformColorMapping);
  } catch (error) {
    console.error("Error loading selected isoforms", error);
    return Object.keys(initialIsoformColorMapping);
  }
};

const useGraphStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: customNodes,
  edges: customEdges,
  getInternalNodeFn: null,
  setInternalNodeGetter: (getter) => {
    set({ getInternalNodeFn: getter });
  },
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

    const { nodes, edges, rowWidth, getInternalNodeFn } = get();

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      nodes,
      edges,
      layoutMode,
      rowWidth,
      getInternalNodeFn,
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

    const { nodes, edges, getInternalNodeFn, layoutMode, rowWidth } = get();

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
      getInternalNodeFn,
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
        state.getInternalNodeFn,
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
          state.getInternalNodeFn,
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
  // --- isoform colored edges ---
  isoformColorMapping: initialIsoformColorMapping,
  selectedIsoforms: loadSelectedIsoforms(),
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
  maxPeptidesNodes: nodesMaxPeptides,
  maxPeptidesEdges: edgesMaxPeptides,

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
}));

export default useGraphStore;
