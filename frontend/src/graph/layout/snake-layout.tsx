import { type Node } from "@xyflow/react";
import { defaultValues, theme } from "../../theme";
import { type NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { RowNode } from "./row-node.tsx";
import {
  getMaxWidthPerPositionIndex,
  sortNodesByPositionIndex,
} from "./helper.tsx";
import { shiftNodesOfOverlappingEdges } from "./linear-layout.tsx";

// Function that aligns nodes in a snake-like layout on the screen
// - expects nodes to have correct node.data.positionIndex attributes
// - row width is determined values set in settings or defaultValues.rowWidth
export const applySnakeLayout = (
  nodes: SequenceNodeProps[],
  maxWidthPerRow: number = defaultValues.rowWidth,
  sourceToTargets: Record<
    string,
    { positionIndex: number; all_targets: string[] }
  > = {},
): NodeTypes[] => {
  // --- helper functions ---
  const createRowNode = (
    nodeWidth: number = 0,
    positionIndex: number = Infinity,
  ) => {
    // adjust offets of last row
    const nodesInLastRow = nodes.filter(
      (node) =>
        node.data.positionIndex >= firstPositionIndexInRow &&
        node.data.positionIndex < positionIndex,
    );

    const yOffsetByShifting = shiftNodesOfOverlappingEdges(
      nodesInLastRow,
      sourceToTargets,
    );
    // apply y values of nodesInLastRow to layoutedNodes
    nodesInLastRow.forEach((node) => {
      const layoutedNode = nodes.find((n) => n.id === node.id);
      if (layoutedNode) {
        layoutedNode.position.y = node.position.y;
      }
    });

    // create grouping node for a finished row
    const heigthOfCurrentRow =
      maxNumberOfNeighbors * theme.rowNode.heightPerVariation +
      yOffsetByShifting;
    groupNodes.push(
      GroupNode.create(
    rowNodes.push(
      RowNode.create(
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
    rowId = `row-${rowCount}`;
    heightOfAllRows += heigthOfCurrentRow;
    maxNumberOfNeighbors = 1;
    firstPositionIndexInRow = positionIndex;
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
  let rowId = "row-1"; // id of the current row, used for parentId of nodes
  let firstPositionIndexInRow = 0;

  // Rows are represented by rowNodes
  const rowNodes: Node[] = [];

  // --- main layouting logic ---
  nodes = sortNodesByPositionIndex(nodes);

  nodes.forEach((node) => {
    // No new calculation if node is a neighbor to previous
    if (node.data.positionIndex === previousPositionIndex) {
      countNeighbors++;
      maxNumberOfNeighbors = Math.max(maxNumberOfNeighbors, countNeighbors);
      node.position = {
        x: xPosition,
        y: node.position.y,
      };
      node.data = {
        ...node.data,
        isReversed: isCurrentRowReversed,
      };
      node.parentId = rowId;
      node.extent = "parent";
      return;
    }

    previousPositionIndex = node.data.positionIndex as number;
    countNeighbors = 1; // reset neighbor count for new positionIndex

    // width in row is used as metric to determine if a new row is needed
    const nodeWidth = getMaxWidthPerPositionIndex(
      node.data.positionIndex,
      nodes,
    );
    widthInCurrentRow += nodeWidth + theme.layout.snake.xOffsetBetweenNodes;

    // --- new row ---
    if (widthInCurrentRow > maxWidthPerRow) {
      createRowNode(nodeWidth, node.data.positionIndex as number);
    }

    // calculate x position
    xPosition = isCurrentRowReversed
      ? maxWidthPerRow - widthInCurrentRow + nodeWidth / 2
      : widthInCurrentRow - nodeWidth / 2;

    node.position = {
      x: xPosition,
      y: node.position.y,
    };
    node.parentId = rowId;
    node.extent = "parent";
    node.data = {
      ...node.data,
      isReversed: isCurrentRowReversed,
    };
  });

  createRowNode(); // finalize last row

  // iterate over all nodes and adjust y position by the height of their respective row
  nodes.forEach((node) => {
    const row = rowNodes.find((g) => g.id === node.parentId);
    if (row) {
      node.position.y += (row.style!.height as number) / 2;
    }
  });

  // return both node types in a node collection
  return [...rowNodes, ...nodes];
};
