// ----- functions for layouting nodes and edges -----
import type { Edge } from "@xyflow/react";
import { layoutModes, nodeWidthModes } from "../../theme/types.tsx";
import Dagre from "@dagrejs/dagre";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";

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
    const sequenceLength = sequence.length * 12 + 100; // 12 is the approximated width of each character, plus 50px on each side
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
  const sourceToTargets: Record<
    string,
    { positionId: number; targets: string[] }
  > = {};

  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = { positionId: -1, targets: [] };
    }
    if (!sourceToTargets[target]) {
      sourceToTargets[target] = { positionId: -1, targets: [] };
    }
    sourceToTargets[source].targets.push(target);
  });

  let parentIdStack = [nodes[0].id];
  // initialize first node
  sourceToTargets[nodes[0].id].positionId = 0;

  // loop through all nodes and assign positionId
  while (parentIdStack.length > 0) {
    for (const parent of parentIdStack) {
      //remove parent from stack
      parentIdStack = parentIdStack.filter((id) => id !== parent);

      const children = sourceToTargets[parent].targets;
      if (children.length === 0) break;
      for (const child of children) {
        sourceToTargets[child].positionId =
          sourceToTargets[parent].positionId + 1;
        if (!parentIdStack.includes(child)) {
          parentIdStack.push(child);
        }
      }
    }
  }

  const alteredNodes = nodes.map((node) => {
    const parent = Object.entries(sourceToTargets).find(([, targets]) =>
      targets.targets.includes(node.id),
    );
    if (!parent) return node;

    const siblings = parent[1].targets;
    // sort siblings by node.data.intensity
    siblings.sort(
      (a, b) =>
        (nodes.find((n) => n.id === b)?.data.intensity ?? 0) -
        (nodes.find((n) => n.id === a)?.data.intensity ?? 0),
    );
    const intensityIndex = siblings.indexOf(node.id);
    const positionIndex = parent[1].positionId + 1;

    const yOffset = (intensityIndex - (siblings.length - 1) / 2) * spacing;
    const xOffset = theme.offsets.useXOffset ? intensityIndex * 50 : 0;

    return {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset,
      },
      data: {
        ...node.data,
        positionIndex: positionIndex,
        intensityRank: intensityIndex,
      },
    };
  });
  return [alteredNodes, edges];
}

export const applyLayout = (
  nodes: SequenceNodeProps[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
): [SequenceNodeProps[], Edge[]] => {
  let layoutedNodes: SequenceNodeProps[];
  let layoutedEdges: Edge[];
  [layoutedNodes, layoutedEdges] = applyBasicLayoutDagre(
    nodes,
    edges,
    nodeWidthMode,
    {
      direction: theme.layout.basic.direction,
    },
  );
  // add symmetrical offset for variations
  [layoutedNodes, layoutedEdges] = addSymmetricalOffsetForVariations(
    layoutedNodes,
    layoutedEdges,
  );
  if (theme.layout.mode == layoutModes.Snake) {
    [layoutedNodes, layoutedEdges] = applySnakeLayout(
      layoutedNodes,
      layoutedEdges,
    );
  }

  return [layoutedNodes, layoutedEdges];
};
