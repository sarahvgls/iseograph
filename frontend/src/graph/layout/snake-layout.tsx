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

  // --- constants and initializations ---
  let widthInCurrentRow = 0; // var to keep track of the width of the current row to limit it
  let previousPositionIndex = -1; // var to track the positionIndex of the previous node to handle siblings correctly
  let xPosition = 0; // var to calculate the x position of the current node and make it available to siblings as well
  let isCurrentRowReversed = false; // var to reverse nodes in every second row
  let rowCount = 1;
  let rowId = "group-1"; // id of the current row, used for parentId of nodes

  // Rows are represented by group nodes
  const groupNodes: Node[] = [];
  groupNodes.push(
    GroupNode.create(rowId, rowCount, isCurrentRowReversed, maxWidthPerRow),
  );

  // --- main layouting logic ---
  nodes = sortNodesByPositionIndex();

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    // No new calculation if node is a sibling to previous
    if (node.data.positionIndex === previousPositionIndex) {
      return {
        ...node,
        position: {
          x: xPosition,
          y: node.position.y + GroupNode.style.height / 2,
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

    // width in row is used as metric to determine if a new row is needed
    const nodeWidth = getNodeWidth(
      node.data.nodeWidthMode as nodeWidthModes,
      node.data.sequence as string,
    );
    widthInCurrentRow += nodeWidth + theme.layout.snake.xOffsetBetweenNodes; // 100px offset between nodes

    // --- new row ---
    if (widthInCurrentRow > 0.95 * maxWidthPerRow) {
      // 95% to not overflow the row
      isCurrentRowReversed = !isCurrentRowReversed;
      widthInCurrentRow = nodeWidth + theme.layout.snake.xOffsetBetweenNodes; // reset to current node width
      rowCount++;

      rowId = `group-${rowCount}`;
      groupNodes.push(
        GroupNode.create(rowId, rowCount, isCurrentRowReversed, maxWidthPerRow),
      );
    }

    // calculate x position
    xPosition = isCurrentRowReversed
      ? maxWidthPerRow -
        widthInCurrentRow +
        nodeWidth / 2 -
        theme.layout.snake.xOffsetBetweenNodes
      : widthInCurrentRow - nodeWidth / 2;

    return {
      ...node,
      position: {
        x: xPosition,
        y: node.position.y + GroupNode.style.height / 2,
      },
      parentId: rowId,
      extent: "parent",
      data: {
        ...node.data,
        isReversed: isCurrentRowReversed,
      },
    } as SequenceNodeProps;
  });

  // add group nodes to node collection
  const allNodes: NodeTypes[] = [...groupNodes, ...layoutedNodes];

  return [allNodes, edges];
};
