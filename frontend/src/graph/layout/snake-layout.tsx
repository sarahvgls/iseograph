import { type Edge, type InternalNode, type Node } from "@xyflow/react";
import { theme } from "../../theme";
import type { NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import useGraphStore from "../store.ts";

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
  //consts to refactor later
  const groupHeight = 300;
  const style = {
    border: `none`,
    backgroundColor: "transparent",
    height: groupHeight,
    width: 10000,
  };

  let nodesInCurrentRow = 0; // var to count the number of nodes in the current row for calculation of x position
  let widthInCurrentRow = 0; // var to keep track of the width of the current row to limit it
  let previousPositionIndex = -1; // var to track the positionIndex of the previous node to handle siblings correctly
  let xPosition = 0; // var to calculate the x position of the current node and make it available to siblings as well
  let isCurrentRowReversed = false; // var to reverse nodes in every second row
  let rowCount = 1;
  let rowId = "group-1"; // id of the current row, used for parentId of nodes

  // Rows are represented by group nodes
  const groupNodes: Node[] = [];
  const initialGroupNode: Node = {
    id: "group-1",
    type: "group",
    position: { x: 0, y: 0 },
    data: {
      label: `Row ${rowCount}`,
      isReversed: isCurrentRowReversed,
    },
    style: style,
  };
  groupNodes.push(initialGroupNode);

  // TODO continue here
  // isReversedStore to keep track of reversed nodes
  const setIsReversedStore = useGraphStore.getState().setIsReversedStore;

  // --- main layouting logic ---
  // delay 500 ms to ensure that all nodes are loaded before layouting
  nodes = sortNodesByPositionIndex();

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    if (node.data.positionIndex === previousPositionIndex) {
      // No new calculation if node is a sibling to previous
      if (node.id) {
        setIsReversedStore(node.id, isCurrentRowReversed);
      }

      return {
        ...node,
        position: {
          x: xPosition,
          y: node.position.y + groupHeight / 2,
        },
        data: {
          ...node.data,
          isReversed: isCurrentRowReversed,
        },
        parentId: rowId,
        extent: "parent",
      } as SequenceNodeProps;
    }

    // width in row as metric to determine if a new row is needed
    const measuredWidth = getMeasuredWidth(node);
    widthInCurrentRow += measuredWidth;

    // --- new row ---
    if (widthInCurrentRow > theme.layout.snake.maxWidthPerRow) {
      if (theme.layout.snake.splitLargeNodes) {
        // TODO split if not collapsed
      }
      // Start a new row with current node
      isCurrentRowReversed = !isCurrentRowReversed;
      nodesInCurrentRow = 0;
      widthInCurrentRow = measuredWidth; // reset to current node width
      rowCount++;

      rowId = `group-${rowCount}`;
      const newGroupNode: Node = {
        id: rowId,
        type: "group",
        position: {
          x: 0,
          y: theme.layout.snake.yOffsetBetweenRows * (rowCount - 1),
        },
        data: {
          label: `Row ${rowCount}`,
        },
        style: style,
      };
      groupNodes.push(newGroupNode);
    }

    // handle nodes with same positionIndex with the same offsets
    previousPositionIndex = node.data.positionIndex as number;

    xPosition = isCurrentRowReversed
      ? theme.layout.snake.maxWidthPerRow * 2 -
        widthInCurrentRow -
        100 * nodesInCurrentRow +
        measuredWidth / 2 +
        150
      : widthInCurrentRow + 100 * nodesInCurrentRow - measuredWidth / 2;

    nodesInCurrentRow++;

    // update isReversedStore
    if (node.id) {
      setIsReversedStore(node.id, isCurrentRowReversed);
    }

    return {
      ...node,
      position: {
        x: xPosition,
        y: node.position.y + groupHeight / 2,
      },
      parentId: rowId,
      extent: "parent",
      data: {
        ...node.data,
        isReversed: isCurrentRowReversed, // will be removed
      },
    } as SequenceNodeProps;
  });

  const allNodes: NodeTypes[] = [...groupNodes, ...layoutedNodes];

  return [allNodes, edges];
};
