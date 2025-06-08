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

  const getMeasuredWidthPerIndex = (node: Node): number => {
    if (getInternalNode) {
      const siblings = nodes.filter(
        (n) => n.data.positionIndex === node.data.positionIndex,
      );
      return Math.max(...siblings.map((sibling) => getMeasuredWidth(sibling)));
    } else {
      console.warn("getInternalNode is not defined, cannot measure width.");
      return 0;
    }
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

    previousPositionIndex = node.data.positionIndex as number;

    // width in row as metric to determine if a new row is needed
    const measuredWidth = getMeasuredWidthPerIndex(node);
    widthInCurrentRow += measuredWidth + theme.layout.snake.xOffsetBetweenNodes; // 100px offset between nodes

    // --- new row ---
    if (widthInCurrentRow > 0.95 * theme.layout.snake.maxWidthPerRow) {
      // 95% to not overflow the row
      isCurrentRowReversed = !isCurrentRowReversed;
      widthInCurrentRow =
        measuredWidth + theme.layout.snake.xOffsetBetweenNodes; // reset to current node width
      rowCount++;

      rowId = `group-${rowCount}`;
      groupNodes.push(GroupNode.create(rowId, rowCount, isCurrentRowReversed));
    }

    // calculate x position
    xPosition = isCurrentRowReversed
      ? theme.layout.snake.maxWidthPerRow -
        widthInCurrentRow +
        measuredWidth / 2 -
        theme.layout.snake.xOffsetBetweenNodes
      : widthInCurrentRow - measuredWidth / 2;

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
