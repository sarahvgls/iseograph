import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
  getMaxWidthPerPositionIndex,
  sortNodesByPositionIndex,
} from "./helper.tsx";
import { theme } from "../../theme";
import { recordRowMeasurement } from "../../evaluation/trackers/row-tracker.ts";

// Function that aligns nodes in a linear layout, left to right, on the screen with as little overlapping edges as possible
export const applyLinearLayout = (
  nodes: SequenceNodeProps[],
  sourceToTargets: Record<
    string,
    { positionIndex: number; all_targets: string[] }
  > = {},
): SequenceNodeProps[] => {
  let previousPositionIndex = -1;
  let graphWidth = 0;
  let xPosition = 0;

  const sortedNodes = sortNodesByPositionIndex(nodes);

  const linearNodes = sortedNodes.map((node) => {
    if (node.data.positionIndex === previousPositionIndex) {
      return {
        ...node,
        parentId: undefined, // reset parentId for linear layout
        data: {
          ...node.data,
          isReversed: false, // reset isReversed for linear layout
        },
        position: {
          x: xPosition,
          y: node.position.y, // already assigned y-offset
        },
      };
    }

    const nodeWidth = getMaxWidthPerPositionIndex(
      node.data.positionIndex,
      nodes,
    );

    // reset position count if position index changed
    previousPositionIndex = node.data.positionIndex;
    graphWidth += nodeWidth + theme.layout.linear.xOffsetBetweenNodes;
    xPosition = graphWidth - nodeWidth / 2;

    return {
      ...node,
      parentId: undefined, // reset parentId for linear layout
      data: {
        ...node.data,
        isReversed: false, // reset isReversed for linear layout
      },
      position: {
        x: xPosition,
        y: node.position.y,
      },
    };
  });

  const yOffset = shiftNodesOfOverlappingEdges(linearNodes, sourceToTargets);

  // calculations for measuring the height
  let maxNumberOfNeighbors = 0;
  const nodesGroupedByPositionIndex: Record<number, SequenceNodeProps[]> = {};
  linearNodes.forEach((node) => {
    const positionIndex = node.data.positionIndex as number;
    if (!nodesGroupedByPositionIndex[positionIndex]) {
      nodesGroupedByPositionIndex[positionIndex] = [];
    }
    nodesGroupedByPositionIndex[positionIndex].push(node);
  });
  // get max number of neighbors
  Object.values(nodesGroupedByPositionIndex).forEach((nodesAtPosition) => {
    if (nodesAtPosition.length > maxNumberOfNeighbors) {
      maxNumberOfNeighbors = nodesAtPosition.length;
    }
  });

  const height =
    maxNumberOfNeighbors * theme.rowNode.heightPerVariation + yOffset;

  recordRowMeasurement(0, height, linearNodes.length);

  return linearNodes;
};

// This function shifts nodes in a linear layout (also a single snake row) to avoid overlaps caused by edges
// between nodes that are directly connected and on their edge path lies another node.
export const shiftNodesOfOverlappingEdges = (
  nodes: SequenceNodeProps[],
  sourceToTargets: Record<
    string,
    { positionIndex: number; all_targets: string[] }
  >,
): number => {
  // find all source nodes who have a target with offset to positionIndex > 1
  const nodeIdPairsWithOffset: [string, string][] = [];
  const sortedNodes = sortNodesByPositionIndex(nodes);
  sortedNodes.forEach((node) => {
    const positionIndex = node.data.positionIndex as number;
    const targets = sourceToTargets[node.id]?.all_targets || [];
    targets.forEach((targetId) => {
      const targetPositionIndex =
        sourceToTargets[targetId]?.positionIndex || -1;
      if (targetPositionIndex - positionIndex > 1) {
        nodeIdPairsWithOffset.push([node.id, targetId]);
      }
    });
  });

  let totalYOffset = 0;
  // check if intensityRank of node pairs is the same
  // check if there are any node pairs with nodes on the same y value in between, only keep those pairs for that this constraint is true
  nodeIdPairsWithOffset.forEach(([sourceId, targetId]) => {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);
    if (
      sourceNode &&
      targetNode &&
      sourceNode.position.y === targetNode.position.y
    ) {
      const inBetweenNodes = sortedNodes.filter(
        (node) =>
          node.data.positionIndex > sourceNode.data.positionIndex &&
          node.data.positionIndex < targetNode.data.positionIndex,
      );
      while (
        inBetweenNodes.some((node) => node.position.y === sourceNode.position.y)
      ) {
        // shift all nodes in between in y direction to avoid overlap
        const yOffset = theme.offsets.defaultYSpacingBetweenNodes;
        totalYOffset += yOffset;
        inBetweenNodes.forEach((node) => {
          node.position.y += yOffset;
        });
      }
    }
  });

  // return the total y-offset applied to the given nodes for snake rows
  return totalYOffset;
};
