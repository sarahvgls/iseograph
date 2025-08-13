// ----- functions for layouting nodes and edges -----
import { type Edge } from "@xyflow/react";
import { layoutModes, nodeTypes, type NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";
import {
  getMaxWidthPerDirectSiblings,
  sortNodesByPositionIndex,
} from "./helper.tsx";

function assignPositionIndices(
  nodes: NodeTypes[],
  edges: Edge[],
): [
  Record<
    string,
    {
      positionIndex: number;
      nodes_at_next_position: string[]; // targets that have the following position index of the parent
    }
  >,
  SequenceNodeProps[],
] {
  // Create a map to track the parent nodes and their children with correct index
  const sourceToTargets: Record<
    string,
    {
      positionIndex: number;
      all_targets: string[];
      nodes_at_next_position: string[];
    }
  > = {};

  // Initialization
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
    (node) => node.type === nodeTypes.SequenceNode && node.id === "n0",
  );
  if (!firstSequenceNode) {
    throw new Error("No sequence node found, layout not possible.");
  }
  let parentIdStack = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionIndex = 0;

  // loop through all nodes and build correct positionIds
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

  // assign positionIndices to nodes
  nodes.forEach((node) => {
    if (node.type === nodeTypes.SequenceNode) {
      node.data.positionIndex = sourceToTargets[node.id]?.positionIndex ?? 0;
    }
  });

  return [sourceToTargets, nodes as SequenceNodeProps[]];
}

const applyLinearLayout = (nodes: SequenceNodeProps[]): SequenceNodeProps[] => {
  let previousPositionIndex = -1;
  let graphWidth = 0;
  let xPosition = 0;

  const sortedNodes = sortNodesByPositionIndex(nodes);

  return sortedNodes.map((node) => {
    const width = getMaxWidthPerDirectSiblings(node.data.positionIndex, nodes);

    if (node.data.positionIndex === previousPositionIndex) {
      return {
        ...node,
        position: {
          x: xPosition,
          y: node.position.y,
        },
      };
    }
    // reset position count if position index changed
    previousPositionIndex = node.data.positionIndex;
    graphWidth += width + theme.layout.linear.xOffsetBetweenNodes;
    xPosition = graphWidth - width / 2;

    return {
      ...node,
      position: {
        x: xPosition,
        y: node.position.y,
      },
    };
  });
};

function addSymmetricalOffsetForVariations(
  nodes: SequenceNodeProps[],
  edges: Edge[],
  sourceToTargets: Record<
    string,
    {
      positionIndex: number;
      nodes_at_next_position: string[]; // targets that have the following position index of the parent
    }
  >,
): [SequenceNodeProps[], Edge[]] {
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

    return {
      ...node,
      position: {
        x: 0,
        y: yOffset,
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
  const filteredNodes: SequenceNodeProps[] = nodes
    .filter((node) => node.type === nodeTypes.SequenceNode)
    .map((node) => ({
      ...node,
      parentId: undefined,
      extent: undefined,
      position: {
        x: 0,
        y: 0,
      },
      data: {
        ...node.data,
        positionIndex: 0,
        intensityRank: 0,
        isReversed: false, // Reset isReversed
        nodeWidthMode: node.data.nodeWidthMode || defaultValues.nodeWidthMode,
      },
    })) as SequenceNodeProps[];

  return new Promise((resolve) => {
    // --- main layouting algorithm ---
    const [sourceToTargets, positionedNodes] = assignPositionIndices(
      filteredNodes,
      edges,
    );

    const [layoutedNodes, layoutedEdges] = addSymmetricalOffsetForVariations(
      positionedNodes,
      edges,
      sourceToTargets,
    );

    if (layoutMode === layoutModes.Basic) {
      let linearNodes = applyLinearLayout(layoutedNodes as SequenceNodeProps[]);

      resolve([linearNodes, layoutedEdges]);
      return;
    } else if (layoutMode === layoutModes.Snake) {
      const [snakeNodes, snakeEdges] = applySnakeLayout(
        layoutedNodes,
        layoutedEdges,
        maxWidthPerRow,
      );

      resolve([snakeNodes, snakeEdges]);
    }
  });
};
