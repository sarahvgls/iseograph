import { type Edge, type InternalNode, type Node } from "@xyflow/react";
import { theme } from "../../theme";
import type { NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { GroupNode } from "./group-node.tsx";
//import useGraphStore from "../store.ts";

// Function that aligns nodes in a snake-like layout on the screen
// - expects nodes to have correct node.data.positionIndex attributes
// - row length is determined by theme.layout.snake.maxWidthPerRow
export const applySnakeLayout = (
  nodes: NodeTypes[],
  edges: Edge[],
  getInternalNode: ((id: string) => InternalNode | undefined) | null,
): [NodeTypes[], Edge[]] => {
  // --- helper functions ---
  // Function to get the visual width of a node via the internal node
  const getMeasuredWidth = (node: Node) => {
    let internalNode: InternalNode | undefined;
    if (getInternalNode) {
      internalNode = getInternalNode(node.id);
    }
    if (!internalNode) {
      console.warn(`Internal node not found for ${node.id}`);
      return 0;
    }
    return internalNode?.measured.width ?? 0;
  };

  // Function that sorts nodes by their positionIndex
  const sortNodesByPositionIndex = () => {
    return nodes.sort((a, b) => {
      const positionA = a.data.positionIndex as number;
      const positionB = b.data.positionIndex as number;
      return positionA - positionB;
    });
  };

  // --- constants and initializations ---
  let nodesInCurrentRow = 0; // var to count the number of nodes in the current row for calculation of x position
  let widthInCurrentRow = 0; // var to keep track of the width of the current row to limit it
  let previousPositionIndex = -1; // var to track the positionIndex of the previous node to handle siblings correctly
  let xPosition = 0; // var to calculate the x position of the current node and make it available to siblings as well
  let isCurrentRowReversed = false; // var to reverse nodes in every second row
  let rowCount = 1;
  let rowId = "group-1"; // id of the current row, used for parentId of nodes

  // Rows are represented by group nodes
  const groupNodes: Node[] = [];
  groupNodes.push(GroupNode.create(rowId, rowCount, isCurrentRowReversed));

  // --- main layouting logic ---
  nodes = sortNodesByPositionIndex();

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    // No new calculation if node is a sibling to previous
    // TODO maybe calculate x position from width of widest sibling
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

    // handle nodes with same positionIndex with the same offsets
    previousPositionIndex = node.data.positionIndex as number;

    // width in row as metric to determine if a new row is needed
    const measuredWidth = getMeasuredWidth(node);
    widthInCurrentRow += measuredWidth;

    // --- new row ---
    if (widthInCurrentRow > theme.layout.snake.maxWidthPerRow) {
      isCurrentRowReversed = !isCurrentRowReversed;
      nodesInCurrentRow = 0;
      widthInCurrentRow = measuredWidth; // reset to current node width
      rowCount++;

      rowId = `group-${rowCount}`;
      groupNodes.push(GroupNode.create(rowId, rowCount, isCurrentRowReversed));
    }

    // --- calculate x position ---
    xPosition = isCurrentRowReversed
      ? theme.layout.snake.maxWidthPerRow * 2 -
        widthInCurrentRow -
        theme.layout.snake.xOffsetBetweenNodes * nodesInCurrentRow +
        measuredWidth / 2 +
        theme.layout.snake.maxWidthPerRow / 3
      : widthInCurrentRow + 100 * nodesInCurrentRow - measuredWidth / 2;

    nodesInCurrentRow++;

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
