import type { Edge, Node } from "@xyflow/react";
import { theme } from "../../theme";
import type { NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";

export const applySnakeLayout = (
  nodes: NodeTypes[],
  edges: Edge[],
): [(SequenceNodeProps | Node)[], Edge[]] => {
): [NodeTypes[], Edge[]] => {
  // expects nodes that are already in a sequence
  let aaCountForRow = 0; //not used right now
  let widthCountForRow = 0;
  let isCurrentRowReversed = false; //should be used
  let rowCount = 0;
  let lastPositonIndex = -1;
  let xOffset = 0;
  let yOffset = 0;

  //consts to refactor later
  const groupHeight = 300;
  const groupWidth = 2000;

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
      aaCountForRow: aaCountForRow,
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

    widthCountForRow += node.width ?? 1;

    if (widthCountForRow > theme.layout.snake.maxWidthPerRow) {
      if (theme.layout.snake.splitLargeNodes) {
        // TODO
      }
      // Start a new row with current node
      widthCountForRow = node.width ?? 1;
      isCurrentRowReversed = !isCurrentRowReversed;

      rowCount++;
      yOffset = 0;
      xOffset = -node.position.x;

      rowId = `group-${rowCount}`;
      const newGroupNode: Node = {
        id: rowId,
        type: "group",
        position: { x: 0, y: theme.layout.snake.yOffsetBetweenRows * rowCount },
        data: {
          label: `Row ${rowCount}`,
          isReversed: isCurrentRowReversed,
          aaCountForRow: aaCountForRow,
        },
        style: {
          backgroundColor: "rgba(40, 0, 255, 0.09)",
          height: groupHeight,
          width: groupWidth,
        },
      };
      groupNodes.push(newGroupNode);
    }

    lastPositonIndex = node.data.positionIndex as number;

    const groupedNode = {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset + groupHeight / 2,
      },
      parentId: rowId,
      extent: "parent",
    } as SequenceNodeProps;

    return groupedNode;
  });

  const allNodes: NodeTypes[] = [...groupNodes, ...layoutedNodes];

  return [allNodes, edges];
};
