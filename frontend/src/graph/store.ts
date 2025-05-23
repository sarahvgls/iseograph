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

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../theme";
import { type layoutModes, nodeWidthModes } from "../theme/types.tsx";
import { applyLayout } from "./layout.tsx";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeWidthMode: nodeWidthModes;
  setNodeWidthMode: (nodeWidthMode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (layoutMode: layoutModes) => void;
};

// create nodes of type sequence node for each node in the nodes.json file
const createNodes = (nodes: SequenceNodeProps[]): SequenceNodeProps[] => {
  return nodes.map((node) => ({
    ...node,
    type: "custom",
    data: {
      sequence: node.data.sequence,
      intensity: node.data.intensity,
      feature: node.data.feature,
    },
  }));
};

// ----- create nodes -----
const customNodes: SequenceNodeProps[] = createNodes(
  nodes as SequenceNodeProps[],
);
const customEdges: Edge[] = edges;

const [layoutedNodes, layoutedEdges] = applyLayout(
  customNodes,
  customEdges,
  theme.layout.nodeWidthMode,
);

const useGraphStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: layoutedNodes,
  edges: layoutedEdges,
  nodeWidthMode: theme.layout.nodeWidthMode,
  layoutMode: theme.layout.mode,
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
  setNodeWidthMode: (nodeWidthMode: nodeWidthModes) => {
    set({
      nodeWidthMode: nodeWidthMode,
    });
    const { nodes, edges } = get();
    const customNodes: SequenceNodeProps[] = createNodes(
      nodes as SequenceNodeProps[],
    );
    const state = get();
    const [offsetNodes, offsetEdges] = applyLayout(
      customNodes,
      edges,
      state.nodeWidthMode,
    );
    set({
      nodes: offsetNodes,
      edges: offsetEdges,
    });
  },
  setLayoutMode: (layoutMode: layoutModes) => {
    set({
      layoutMode,
    });
  },
}));

export default useGraphStore;
