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
import Dagre from "@dagrejs/dagre";

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../theme";
import { nodeWidthModes } from "../theme/types.tsx";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeWidthMode: nodeWidthModes;
  toggleNodeWidthMode: () => void;
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

// ----- functions for layouting nodes and edges -----
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
  options: { direction: string },
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    ranksep: 60,
    nodesep: 50,
    align: "UL",
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => {
    const sequence: string = node.data.sequence as string;
    const sequenceLength = sequence.length * 12 + 100; // 10 is the approximated width of each character, plus 25px on each side
    g.setNode(node.id, {
      ...node,
      width:
        nodeWidthMode === nodeWidthModes.Collapsed
          ? theme.offsets.defaultLength
          : sequenceLength,
      height: theme.offsets.defaultLength,
    });
  });

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // take the x coordinate from dagre layout but adjust y coordinate to useful post-position
      return { ...node, position: { x: position.x, y: 0 } };
    }),
    edges,
  };
};

function symmetricallyOffsetVariations(
  nodes: SequenceNodeProps[],
  edges: Edge[],
): SequenceNodeProps[] {
  const spacing = 100; // vertical distance between variations
  const sourceToTargets: Record<string, string[]> = {};

  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = [];
    }
    sourceToTargets[source].push(target);
  });

  return nodes.map((node) => {
    const parent = Object.entries(sourceToTargets).find(([, targets]) =>
      targets.includes(node.id),
    );
    if (!parent) return node;

    const [, siblings] = parent;
    // sort siblings by node.data.intensity
    siblings.sort(
      (a, b) =>
        (nodes.find((n) => n.id === b)?.data.intensity ?? 0) -
        (nodes.find((n) => n.id === a)?.data.intensity ?? 0),
    );
    const index = siblings.indexOf(node.id);
    const yOffset = (index - (siblings.length - 1) / 2) * spacing;
    const xOffset = theme.offsets.useXOffset ? index * 50 : 0;

    return {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset,
      },
    };
  });
}

// ---- apply layout to nodes and edges ----
const customNodes: SequenceNodeProps[] = createNodes(
  nodes as SequenceNodeProps[],
);
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  customNodes,
  edges,
  theme.offsets.defaultWidthCollapsed
    ? nodeWidthModes.Collapsed
    : nodeWidthModes.Expanded,
  { direction: "LR" },
);

// apply the offset to the variations
const offsetNodes = symmetricallyOffsetVariations(
  layoutedNodes as SequenceNodeProps[],
  layoutedEdges,
);

const useGraphStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: offsetNodes,
  edges: layoutedEdges,
  nodeWidthMode: theme.offsets.defaultWidthCollapsed
    ? nodeWidthModes.Collapsed
    : nodeWidthModes.Expanded,
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
  toggleNodeWidthMode: () => {
    set((state) => ({
      nodeWidthMode:
        state.nodeWidthMode === nodeWidthModes.Collapsed
          ? nodeWidthModes.Expanded
          : nodeWidthModes.Collapsed,
    }));
    // reapply layout to nodes and edges
    const { nodes, edges } = get();
    const state = get();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      state.nodeWidthMode === nodeWidthModes.Collapsed
        ? nodeWidthModes.Collapsed
        : nodeWidthModes.Expanded,
      { direction: "LR" },
    );
    const offsetNodes = symmetricallyOffsetVariations(
      layoutedNodes as SequenceNodeProps[],
      layoutedEdges,
    );
    set({
      nodes: offsetNodes,
      edges: layoutedEdges,
    });
  },
}));

export default useGraphStore;
