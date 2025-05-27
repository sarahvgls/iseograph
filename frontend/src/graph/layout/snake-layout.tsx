import type { Edge, Node } from "@xyflow/react";
import { theme } from "../../theme";
import type { NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";

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

  //consts to refactor later
  const groupHeight = 300;
  const groupWidth = 2500;

  // Sort nodes by node.data.positionIndex to ensure they are in the correct order
  nodes.sort((a, b) => {
    const positionA = a.data.positionIndex as number;
    const positionB = b.data.positionIndex as number;
    return positionA - positionB;
  });

  // add subflow groups for each row
  let groupNodes: Node[] = [];
  let rowId = "group-0";
  const initialGroupNode: Node = {
    id: rowId,
    type: "group",
    position: { x: 0, y: 0 },
    data: {
      label: `Row ${rowCount}`,
      isReversed: isCurrentRowReversed,
    },
    style: {
      backgroundColor: "rgba(255, 0, 255, 0.2)",
      height: groupHeight,
      width: groupWidth,
    },
  };
  groupNodes.push(initialGroupNode);

  const layoutedNodes: SequenceNodeProps[] = nodes.map((node) => {
    if (node.data.positionIndex === lastPositonIndex) {
      // No new calculation if node is a sibling to previous
      return {
        ...node,
        position: {
          x: node.position.x + xOffset,
          y: node.position.y + yOffset + groupHeight / 2,
        },
        parentId: rowId,
        extent: "parent",
      } as SequenceNodeProps;
    }

    if (
      (node.data.positionIndex as number) >
      theme.layout.snake.maxNodesPerRow * rowCount - 1
    ) {
      if (theme.layout.snake.splitLargeNodes) {
        // TODO split if not collapsed
      }
      // Start a new row with current node
      isCurrentRowReversed = !isCurrentRowReversed; // TODO implement reverse order of node
      rowCount++;
      yOffset = 0;
      xOffset = -(node.position.x - 100);

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
          isReversed: isCurrentRowReversed,
        },
        style: {
          backgroundColor: "rgba(40, 0, 255, 0.09)",
          height: groupHeight,
          width: groupWidth,
        },
      };
      groupNodes.push(newGroupNode);
    }

    // handle nodes with same positionIndex with the same offsets
    // TODO fix position index
    lastPositonIndex = node.data.positionIndex as number;

    return {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset + groupHeight / 2,
      },
      parentId: rowId,
      extent: "parent",
    } as SequenceNodeProps;
  });

  const allNodes: NodeTypes[] = [...groupNodes, ...layoutedNodes];

  return [allNodes, edges];
};
