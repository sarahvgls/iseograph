import { type Node } from "@xyflow/react";
import { defaultValues, theme } from "../../theme";
import { type NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { GroupNode } from "./group-node.tsx";
import {
  getMaxWidthPerDirectSiblings,
  sortNodesByPositionIndex,
} from "./helper.tsx";

// Function that aligns nodes in a snake-like layout on the screen
// - expects nodes to have correct node.data.positionIndex attributes
// - row width is determined values set in settings or defaultValues.rowWidth
export const applySnakeLayout = (
  nodes: SequenceNodeProps[],
  maxWidthPerRow: number = defaultValues.rowWidth,
): NodeTypes[] => {
  // --- helper functions ---
  const createRowNode = (nodeWidth: number) => {
    // create grouping node for a finished row
    const heigthOfCurrentRow =
      maxNumberOfNeighbors * theme.rowNode.heightPerVariation;
    groupNodes.push(
      GroupNode.create(
        rowId,
        rowCount,
        isCurrentRowReversed,
        maxWidthPerRow,
        heigthOfCurrentRow,
        heightOfAllRows,
      ),
    );

    // update values for next row
    isCurrentRowReversed = !isCurrentRowReversed;
    widthInCurrentRow = nodeWidth + theme.layout.snake.xOffsetBetweenNodes; // reset to current node width
    rowCount++;
    rowId = `group-${rowCount}`;
    heightOfAllRows += heigthOfCurrentRow;
    maxNumberOfNeighbors = 1;
  };

  // --- constants and initializations ---
  let widthInCurrentRow = 0; // var to keep track of the width of the current row to limit it
  let countNeighbors = 1; // var to count the number of siblings of the current node
  let maxNumberOfNeighbors = 1; // var to count the max number of siblings in the current row
  let heightOfAllRows = 0; // var to keep track of the height of all rows
  let previousPositionIndex = -1; // var to track the positionIndex of the previous node to handle siblings correctly
  let xPosition = 0; // var to calculate the x position of the current node and make it available to siblings as well
  let isCurrentRowReversed = false; // var to reverse nodes in every second row
  let rowCount = 1;
  let rowId = "group-1"; // id of the current row, used for parentId of nodes

  // Rows are represented by group nodes
  const groupNodes: Node[] = [];

  // --- main layouting logic ---
  nodes = sortNodesByPositionIndex(nodes);

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    // No new calculation if node is a neighbor to previous
    if (node.data.positionIndex === previousPositionIndex) {
      countNeighbors++;
      maxNumberOfNeighbors = Math.max(maxNumberOfNeighbors, countNeighbors);
      return {
        ...node,
        position: {
          x: xPosition,
          y: node.position.y,
        },
        data: {
          ...node.data,
          isReversed: isCurrentRowReversed,
        },
        parentId: rowId,
        extent: "parent",
      } as SequenceNodeProps;
    }

    previousPositionIndex = node.data.positionIndex as number;
    countNeighbors = 1; // reset neighbor count for new positionIndex

    // width in row is used as metric to determine if a new row is needed
    const nodeWidth = getMaxWidthPerDirectSiblings(
      node.data.positionIndex,
      nodes,
    );
    widthInCurrentRow += nodeWidth + theme.layout.snake.xOffsetBetweenNodes;

    // --- new row ---
    if (widthInCurrentRow > maxWidthPerRow) {
      createRowNode(nodeWidth);
    }

    // calculate x position
    xPosition = isCurrentRowReversed
      ? maxWidthPerRow - widthInCurrentRow + nodeWidth / 2
      : widthInCurrentRow - nodeWidth / 2;

    return {
      ...node,
      position: {
        x: xPosition,
        y: node.position.y,
      },
      parentId: rowId,
      extent: "parent",
      data: {
        ...node.data,
        isReversed: isCurrentRowReversed,
      },
    } as SequenceNodeProps;
  });

  createRowNode(0); // finalize last row, a mock-node of width 0 is used

  // iterate over all nodes and adjust y position by the height of their respective row
  layoutedNodes.forEach((node) => {
    const groupNode = groupNodes.find((g) => g.id === node.parentId);
    if (groupNode) {
      node.position.y += (groupNode.style!.height as number) / 2;
    }
  });

  // return both node types in a node collection
  return [...groupNodes, ...layoutedNodes];
};
