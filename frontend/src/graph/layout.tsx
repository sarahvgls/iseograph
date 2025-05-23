// ----- functions for layouting nodes and edges -----
import type { Edge } from "@xyflow/react";
import { layoutModes, nodeWidthModes } from "../theme/types.tsx";
import Dagre from "@dagrejs/dagre";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../theme";

const applyBasicLayoutDagre = (
  nodes: SequenceNodeProps[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
  options: { direction: string },
): [SequenceNodeProps[], Edge[]] => {
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

  return [
    nodes.map((node: SequenceNodeProps) => {
      const position = g.node(node.id);
      // take the x coordinate from dagre layout but adjust y coordinate later
      return {
        ...node,
        position: { x: position.x, y: 0 },
      } as SequenceNodeProps;
    }),
    edges,
  ];
};

function addSymmetricalOffsetForVariations(
  nodes: SequenceNodeProps[],
  edges: Edge[],
): [SequenceNodeProps[], Edge[]] {
  const spacing = theme.offsets.defaultSpacingBetweenNodes; // vertical distance between variations
  const sourceToTargets: Record<string, string[]> = {};

  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = [];
    }
    sourceToTargets[source].push(target);
  });

  return [
    nodes.map((node) => {
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
    }),
    edges,
  ];
}

export const applyLayout = (
  nodes: SequenceNodeProps[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
): [SequenceNodeProps[], Edge[]] => {
  let layoutedNodes: SequenceNodeProps[];
  let layoutedEdges: Edge[];
  if (theme.layout.mode == layoutModes.Basic) {
    [layoutedNodes, layoutedEdges] = applyBasicLayoutDagre(
      nodes,
      edges,
      nodeWidthMode,
      {
        direction: theme.layout.direction,
      },
    );
  } else {
    layoutedNodes = nodes;
    layoutedEdges = edges;
  }

  return addSymmetricalOffsetForVariations(layoutedNodes, layoutedEdges);
};
