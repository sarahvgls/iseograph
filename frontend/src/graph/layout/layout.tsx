// ----- functions for layouting nodes and edges -----
import { type Edge, type InternalNode } from "@xyflow/react";
import {
  layoutModes,
  nodeTypes,
  type NodeTypes,
  nodeWidthModes,
} from "../../theme/types.tsx";
import Dagre from "@dagrejs/dagre";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";

const applyBasicLayoutDagre = (
  nodes: NodeTypes[],
  edges: Edge[],
  options: { direction: string },
): [NodeTypes[], Edge[]] => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    ranksep: 60,
    nodesep: 50,
    align: "UL",
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => {
    if (node.type !== nodeTypes.SequenceNode) {
      return;
    }
    const sequence: string = node.data.sequence as string;
    const sequenceLength = sequence.length * 12 + 100; // 12 is the approximated width of each character, plus 50px on each side

    g.setNode(node.id, {
      ...node,
      width:
        node.data.nodeWidthMode === nodeWidthModes.Expanded
          ? sequenceLength
          : theme.offsets.largeWidth,
      height: theme.offsets.defaultLength,
    });
  });

  Dagre.layout(g);

  return [
    nodes.map((node) => {
      if (node.type !== nodeTypes.SequenceNode) {
        return node;
      }
      const position = g.node(node.id);

      return {
        ...node,
        position: { x: position.x, y: 0 },
      } as SequenceNodeProps;
    }),
    edges,
  ];
};

function addSymmetricalOffsetForVariations(
  nodes: NodeTypes[],
  edges: Edge[],
): [NodeTypes[], Edge[]] {
  const spacing = theme.debugMode
    ? theme.offsets.debugYSpacingBetweenNodes
    : theme.offsets.defaultYSpacingBetweenNodes; // vertical distance between variations
  // Create a map to track the parent nodes and their children with correct index
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

  const firstSequenceNode = nodes.find(
    (node) => node.type === nodeTypes.SequenceNode,
  );
  if (!firstSequenceNode) {
    console.warn("No sequence node found, skipping layout adjustment.");
    return [nodes, edges];
  }
  let parentIdStack = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionId = 0;

  // loop through all nodes and assign positionId
  while (parentIdStack.length > 0) {
    for (const parent of parentIdStack) {
      //remove parent from stack
      parentIdStack = parentIdStack.filter((id) => id !== parent);

      const children = sourceToTargets[parent].targets;
      if (children.length === 0) break;
      for (const childId of children) {
        sourceToTargets[childId].positionId =
          sourceToTargets[parent].positionId + 1;
        if (!parentIdStack.includes(childId)) {
          parentIdStack.push(childId);
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
        ((nodes.find((n) => n.id === b)?.data.intensity as number) ?? 0) -
        ((nodes.find((n) => n.id === a)?.data.intensity as number) ?? 0),
    );
    const intensityIndex = siblings.indexOf(node.id);
    const positionIndex = sourceToTargets[node.id].positionId;

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
  nodes: NodeTypes[],
  edges: Edge[],
  layoutMode: layoutModes,
  getInternalNode: ((id: string) => InternalNode | undefined) | null,
): Promise<[NodeTypes[], Edge[]]> => {
  // remove groups and reset layouting properties
  let filteredNodes = nodes
    .filter((node) => node.type === nodeTypes.SequenceNode)
    .map((node) => ({
      ...node,
      parentId: undefined,
      extent: undefined,
      data: {
        ...node.data,
        positionIndex: 0,
        intensityRank: 0,
        isReversed: false, // Reset isReversed
        nodeWidthMode: node.data.nodeWidthMode || nodeWidthModes.Collapsed, // Use provided mode or default to Collapsed
      },
    }));

  return new Promise((resolve) => {
    let [layoutedNodes, layoutedEdges] = applyBasicLayoutDagre(
      filteredNodes,
      edges,
      {
        direction: theme.layout.basic.direction,
      },
    );

    [layoutedNodes, layoutedEdges] = addSymmetricalOffsetForVariations(
      layoutedNodes,
      layoutedEdges,
    );

    if (layoutMode !== layoutModes.Snake) {
      const finalNodes = layoutedNodes.map((node) => {
        if (node.type === nodeTypes.SequenceNode) {
          return {
            ...node,
            data: {
              ...node.data,
              isReversed: false,
            },
          };
        }
        return node;
      });
      resolve([finalNodes, layoutedEdges]);
      return;
    }

    // Wait for two animation frames to ensure DOM is updated with new node widths
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const [snakeNodes, snakeEdges] = applySnakeLayout(
          layoutedNodes,
          layoutedEdges,
          getInternalNode,
        );

        const finalNodes = snakeNodes.map((node) => {
          if (node.type === nodeTypes.SequenceNode) {
            return {
              ...node,
              data: {
                ...node.data,
                isReversed: node.data.isReversed ?? false, // Ensure isReversed is set
              },
            };
          }
          return node;
        });

        resolve([finalNodes, snakeEdges]);
      });
    });
  });
};
