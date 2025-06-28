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
import { theme } from "../theme";
import {
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
  isoformColorMapping: Record<string, string>;
  selectedIsoforms: string[];
  toggleIsoformSelection: (isoform: string) => void;
  deselectAllIsoforms: () => void;
  updateIsoformColor: (isoform: string, color: string) => void;
  isAnimated: boolean;
  setIsAnimated: (isAnimated: boolean) => void;
  allowInteraction: boolean;
  setAllowInteraction: (allowInteraction: boolean) => void;
};

// ----- create nodes and edges -----
const customNodes: SequenceNodeProps[] = createNodes(
  nodes as SequenceNodeProps[],
);
const customEdges: ArrowEdgeProps[] = createEdges(edges as ArrowEdgeProps[]);

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
  layoutMode: theme.layout.mode,
  setLayoutMode: async (layoutMode: layoutModes) => {
    set({ layoutMode });

    const { nodes, edges, getInternalNodeFn } = get();

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      nodes,
      edges,
      layoutMode,
      getInternalNodeFn,
    );

    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },
  nodeWidthMode: theme.layout.defaultNodeWidthMode,
  setGlobalNodeWidthMode: async (nodeWidthMode: nodeWidthModes) => {
    set({ nodeWidthMode });

    const { nodes, edges, getInternalNodeFn, layoutMode } = get();

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
    applyLayout(
      updatedNodes,
      state.edges,
      state.layoutMode,
      state.getInternalNodeFn,
    ).then(([layoutedNodes, layoutedEdges]) => {
      set({
        nodes: layoutedNodes,
        edges: layoutedEdges,
      });
    });
  },
  isoformColorMapping: initialIsoformColorMapping,
  selectedIsoforms: loadSelectedIsoforms(),
  toggleIsoformSelection: (isoform: string) => {
    const { selectedIsoforms } = get();
    const newSelection = selectedIsoforms.includes(isoform)
      ? selectedIsoforms.filter((iso) => iso !== isoform)
      : selectedIsoforms.length >= theme.numberOfAllowedIsoforms
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
  isAnimated: theme.isAnimated,
  setIsAnimated: (isAnimated: boolean) => {
    set({ isAnimated });
    set({
      edges: get().edges.map((edge) => ({ ...edge, animated: isAnimated })),
    });
  },
  allowInteraction: theme.allowInteraction,
  setAllowInteraction: (allowInteraction: boolean) => {
    set({ allowInteraction });
  },
}));

export default useGraphStore;
