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
  nodeTypes,
  nodeWidthModes,
} from "../theme/types.tsx";
import { applyLayout } from "./layout/layout.tsx";

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
  setNodeWidthMode: (nodeWidthMode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (layoutMode: layoutModes) => void;
  isReversedStore: Record<string, boolean>;
  setIsReversedStore: (nodeId: string, isReversed: boolean) => void;
  getIsReversedStore: (nodeId: string) => boolean;
  resetIsReversedStore: () => void;
};

// create nodes of type sequence node for each node in the nodes.json file
const createNodes = (nodes: SequenceNodeProps[]): SequenceNodeProps[] => {
  return nodes.map((node) => ({
    ...node,
    type: nodeTypes.SequenceNode,
    data: {
      sequence: node.data.sequence,
      intensity: node.data.intensity,
      feature: node.data.feature,
      visualWidth: node.data.visualWidth || 0, // default to 0 if not provided
      positionIndex: 0,
      intensityRank: 0,
    },
  }));
};

// ----- create nodes -----
const customNodes: SequenceNodeProps[] = createNodes(
  nodes as SequenceNodeProps[],
);
const customEdges: Edge[] = edges;

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

    const { nodes, edges, getInternalNodeFn, nodeWidthMode } = get();

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      nodes,
      edges,
      nodeWidthMode,
      layoutMode,
      getInternalNodeFn,
    );

    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },
  nodeWidthMode: theme.layout.nodeWidthMode,
  setNodeWidthMode: async (nodeWidthMode: nodeWidthModes) => {
    set({ nodeWidthMode });

    const { nodes, edges, getInternalNodeFn, layoutMode } = get();

    const [layoutedNodes, layoutedEdges] = await applyLayout(
      nodes,
      edges,
      nodeWidthMode,
      layoutMode,
      getInternalNodeFn,
    );

    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },
  isReversedStore: Object.fromEntries(
    customNodes.map((node) => [node.id, false]),
  ),
  setIsReversedStore: (nodeId: string, isReversed: boolean) =>
    set((state) => ({
      isReversedStore: {
        ...state.isReversedStore,
        [nodeId]: isReversed,
      },
    })),
  getIsReversedStore: (nodeId: string) =>
    get().isReversedStore[nodeId] || false,
  resetIsReversedStore: () =>
    set({
      isReversedStore: Object.fromEntries(
        customNodes.map((node) => [node.id, false]),
      ),
    }),
}));

export default useGraphStore;
