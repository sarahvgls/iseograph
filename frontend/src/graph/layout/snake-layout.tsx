import { type Edge, type Node } from "@xyflow/react";
import { defaultValues, theme } from "../../theme";
import { type NodeTypes, nodeWidthModes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { GroupNode } from "./group-node.tsx";
import { getNodeWidth } from "./helper.tsx";

// Function that aligns nodes in a snake-like layout on the screen
// - expects nodes to have correct node.data.positionIndex attributes
// - row width is determined values set in settings or defaultValues.rowWidth
export const applySnakeLayout = (
  nodes: NodeTypes[],
  edges: Edge[],
  maxWidthPerRow: number = defaultValues.rowWidth,
): [NodeTypes[], Edge[]] => {
  // --- helper functions ---
  const sortNodesByPositionIndex = () => {
    return nodes.sort((a, b) => {
      const positionA = a.data.positionIndex as number;
      const positionB = b.data.positionIndex as number;
      return positionA - positionB;
    });
  };

  const createRowNode = (nodeWidth: number) => {
    // create group node of finished row
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

  const getMaxWidthPerDirectSiblings = (positionIndex: number): number => {
    return nodes
      .filter((node) => node.data.positionIndex === positionIndex)
      .reduce((maxWidth, node) => {
        const nodeWidth = getNodeWidth(
          node.data.nodeWidthMode as nodeWidthModes,
          node.data.sequence as string,
        );
        return Math.max(maxWidth, nodeWidth);
      }, 0);
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
  nodes = sortNodesByPositionIndex();

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    // No new calculation if node is a sibling to previous
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
      node.data.positionIndex as number,
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

  createRowNode(0); // finalize last row

  // iterate over all nodes and adjust y position by the height of their respective row
  layoutedNodes.forEach((node) => {
    const groupNode = groupNodes.find((g) => g.id === node.parentId);
    if (groupNode) {
      node.position.y += (groupNode.style!.height as number) / 2;
    }
  });

  // add group nodes to node collection
  const allNodes: NodeTypes[] = [...groupNodes, ...layoutedNodes];

  return [allNodes, edges];
};
