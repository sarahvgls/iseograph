import type { Edge, Node } from "@xyflow/react";
import { theme } from "../../theme";
import type { NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import useGraphStore from "../store.ts";

export const applySnakeLayout = (
  nodes: NodeTypes[],
  edges: Edge[],
): [NodeTypes[], Edge[]] => {
  // expects nodes that are already in a sequence
  let isCurrentRowReversed = false; //should be used
  let rowCount = 1;
  let lastPositonIndex = -1;
  let xOffset = 25;
  let yOffset = 0;
  let nodesInCurrentRow = 0;

  // isReversedStore to keep track of reversed nodes
  const setIsReversedStore = useGraphStore.getState().setIsReversedStore;

  //consts to refactor later
  const groupHeight = 300;
  const style = {
    border: `none`,
    backgroundColor: "transparent",
    height: groupHeight,
    width: 2500,
  };

  // Sort nodes by node.data.positionIndex to ensure they are in the correct order
  nodes.sort((a, b) => {
    const positionA = a.data.positionIndex as number;
    const positionB = b.data.positionIndex as number;
    return positionA - positionB;
  });

  // add subflow groups for each row
  const groupNodes: Node[] = [];
  let rowId = "group-0";
  const initialGroupNode: Node = {
    id: rowId,
    type: "group",
    position: { x: 0, y: 0 },
    data: {
      label: `Row ${rowCount}`,
      isReversed: isCurrentRowReversed,
    },
    style: style,
  };
  groupNodes.push(initialGroupNode);

  // x positions in groups depending on row length for (reversed) nodes
  const positions: number[] = [];

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    if (node.data.positionIndex === lastPositonIndex) {
      // No new calculation if node is a sibling to previous
      if (node.id) {
        setIsReversedStore(node.id, isCurrentRowReversed);
      }

      return {
        ...node,
        position: {
          x: xOffset,
          y: node.position.y + yOffset + groupHeight / 2,
        },
        data: {
          ...node.data,
          isReversed: isCurrentRowReversed,
        },
        parentId: rowId,
        extent: "parent",
      } as SequenceNodeProps;
    }

    nodesInCurrentRow++;

    if (nodesInCurrentRow > theme.layout.snake.maxNodesPerRow) {
      if (theme.layout.snake.splitLargeNodes) {
        // TODO split if not collapsed
      }
      // Start a new row with current node
      isCurrentRowReversed = !isCurrentRowReversed;
      nodesInCurrentRow = 1;
      rowCount++;
      yOffset = 0;

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
    // TODO fix position index
    lastPositonIndex = node.data.positionIndex as number;

    // fill x positions array for first row only and then use
    if (rowCount === 1) {
      positions.push(node.position.x + 25);
      xOffset = node.position.x + 25;
    }
    xOffset = isCurrentRowReversed
      ? positions[
          theme.layout.snake.maxNodesPerRow - (nodesInCurrentRow - 1) - 1
        ]
      : positions[nodesInCurrentRow - 1];

    // update isReversedStore
    if (node.id) {
      setIsReversedStore(node.id, isCurrentRowReversed);
    }

    return {
      ...node,
      position: {
        x: xOffset,
        y: node.position.y + yOffset + groupHeight / 2,
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
