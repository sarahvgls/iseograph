import {
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";
import Dagre from "@dagrejs/dagre";

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
};

// create nodes of type sequence node for each node in the nodes.json file
const createNodes = (nodes: Node[]) => {
  return nodes.map((node) => ({
    ...node,
    type: "custom",
    data: {
      sequence: node.data.sequence,
      intensity: node.data.intensity,
    },
  }));
};

// layout nodes and edges
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
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
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: 100,
      height: 100,
    }),
  );

  Dagre.layout(g);
  console.log(nodes);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      //const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = node.height ?? 0 / 2;

      return { ...node, position: { x: position.x, y: y } };
    }),
    edges,
  };
};

function symmetricallyOffsetVariations(nodes: Node[], edges: Edge[]): Node[] {
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
    const index = siblings.indexOf(node.id);
    const offset = (index - (siblings.length - 1) / 2) * spacing;

    return {
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y + offset,
      },
    };
  });
}

// apply layout to nodes and edges
const customNodes: Node[] = createNodes(nodes);
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  customNodes,
  edges,
  { direction: "LR" },
);

// apply the offset to the variations
const offsetNodes = symmetricallyOffsetVariations(layoutedNodes, layoutedEdges);

const useStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: offsetNodes,
  edges: layoutedEdges,
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
}));

export default useStore;
