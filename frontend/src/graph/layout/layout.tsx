// ----- functions for layouting nodes and edges -----
import { type Edge } from "@xyflow/react";
import {
  layoutModes,
  nodeTypes,
  type NodeTypes,
  nodeWidthModes,
} from "../../theme/types.tsx";
import Dagre from "@dagrejs/dagre";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";
import { getNodeWidth } from "./helper.tsx";

const applyBasicLayoutDagre = (
  nodes: NodeTypes[],
  edges: Edge[],
): [NodeTypes[], Edge[]] => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 50,
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => {
    if (node.type !== nodeTypes.SequenceNode) {
      return;
    }
    g.setNode(node.id, {
      ...node,
      width:
        getNodeWidth(
          node.data.nodeWidthMode as nodeWidthModes,
          node.data.sequence as string,
        ) + theme.layout.linear.xOffsetBetweenNodes,
      height: theme.node.defaultHeight,
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

function assignPositionIndices(
  nodes: NodeTypes[],
  edges: Edge[],
): Record<
  string,
  {
    positionIndex: number;
    nodes_at_next_position: string[]; // targets that have the following position index of the parent
  }
> {
  // Create a map to track the parent nodes and their children with correct index
  const sourceToTargets: Record<
    string,
    {
      positionIndex: number;
      all_targets: string[];
      nodes_at_next_position: string[];
    }
  > = {};

  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = {
        positionIndex: -1,
        all_targets: [],
        nodes_at_next_position: [],
      };
    }
    if (!sourceToTargets[target]) {
      sourceToTargets[target] = {
        positionIndex: -1,
        all_targets: [],
        nodes_at_next_position: [],
      };
    }
    sourceToTargets[source].all_targets.push(target);
  });

  const firstSequenceNode = nodes.find(
    (node) => node.type === nodeTypes.SequenceNode,
  );
  if (!firstSequenceNode) {
    throw new Error("No sequence node found, layout not possible.");
  }
  let parentIdStack = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionIndex = 0;

  // loop through all nodes and assign positionId
  // all_targets is used as correct iterator
  while (parentIdStack.length > 0) {
    for (const parent of parentIdStack) {
      //remove parent from stack
      parentIdStack = parentIdStack.filter((id) => id !== parent);

      const children = sourceToTargets[parent].all_targets;
      if (children.length === 0) break;
      for (const childId of children) {
        sourceToTargets[childId].positionIndex =
          sourceToTargets[parent].positionIndex + 1;
        if (!parentIdStack.includes(childId)) {
          parentIdStack.push(childId);
        }
      }
    }
  }

  // assign directly following targets
  Object.entries(sourceToTargets).forEach(([source, targets]) => {
    targets.nodes_at_next_position = Object.keys(sourceToTargets).filter(
      (target) =>
        sourceToTargets[target].positionIndex ===
        sourceToTargets[source].positionIndex + 1,
    );
  });


  return sourceToTargets;
}

function addSymmetricalOffsetForVariations(
  nodes: NodeTypes[],
  edges: Edge[],
): [NodeTypes[], Edge[]] {
  const sourceToTargets = assignPositionIndices(nodes, edges);

  const alteredNodes = nodes.map((node) => {
    const previous = Object.entries(sourceToTargets).find(([, targets]) =>
      targets.nodes_at_next_position.includes(node.id),
    );
    if (!previous) return node;

    const neighbors = previous[1].nodes_at_next_position;
    // sort neighbors by peptide count
    neighbors.sort((a, b) => {
      const aNode = nodes.find((n) => n.id === a);
      const bNode = nodes.find((n) => n.id === b);
      if (!aNode || !bNode) return 0;
      return (
        (Number(bNode.data.peptideCount) || 0) -
        (Number(aNode.data.peptideCount) || 0)
      );
    });
    const intensityIndex = neighbors.indexOf(node.id);
    const positionIndex = sourceToTargets[node.id].positionIndex;
    const spacing = theme.debugMode
      ? theme.offsets.debugYSpacingBetweenNodes
      : theme.offsets.defaultYSpacingBetweenNodes; // vertical distance between variations

    const yOffset = (intensityIndex - (neighbors.length - 1) / 2) * spacing;

    const neighborXs = neighbors.map((nodeId) => {
      const neighbor = nodes.find((n) => n.id === nodeId);
      return neighbor ? neighbor.position.x : Infinity;
    });
    const smallestXofNeighbors = Math.min(...neighborXs);

    return {
      ...node,
      position: {
        x: smallestXofNeighbors,
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
  maxWidthPerRow: number,
): Promise<[NodeTypes[], Edge[]]> => {
  // remove groups and reset layouting properties
  const filteredNodes = nodes
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
        nodeWidthMode: node.data.nodeWidthMode || defaultValues.nodeWidthMode,
      },
    }));

  return new Promise((resolve) => {
    let [layoutedNodes, layoutedEdges] = applyBasicLayoutDagre(
      filteredNodes,
      edges,
    );

    [layoutedNodes, layoutedEdges] = addSymmetricalOffsetForVariations(
      layoutedNodes,
      layoutedEdges,
    );

    correctNodePositions(layoutedNodes);

    if (layoutMode !== layoutModes.Snake) {
      resolve([layoutedNodes, layoutedEdges]);
      return;
    }

    // Wait for two animation frames
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const [snakeNodes, snakeEdges] = applySnakeLayout(
          layoutedNodes,
          layoutedEdges,
          maxWidthPerRow,
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
