import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import type { Edge, Node } from "@xyflow/react";
import { theme } from "../../theme";

export const applySnakeLayout = (
  nodes: SequenceNodeProps[],
  edges: Edge[],
): [(SequenceNodeProps | Node)[], Edge[]] => {
  // expects nodes that are already in a sequence
  let aaCountForRow = 0;
  let isCurrentRowReversed = false;
  let rowCount = 0;
  let lastPositonIndex = -1;
  let endOfRowXOffset = 0; // used to calculate the x offset for the next node in the row
  let xOffset = 0;
  let yOffset = 0;

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
      height: 300,
      width: 2000,
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
          y: node.position.y + yOffset + 150,
        },
        parentId: rowId,
        extent: "parent",
      };
    }

    const sequence: string = node.data.sequence as string;
    aaCountForRow += sequence.length;

    if (aaCountForRow > theme.layout.snake.maxAAsPerRow) {
      if (theme.layout.snake.splitLargeNodes) {
        // TODO
      }
      // Start a new row with current node
      aaCountForRow = sequence.length;
      isCurrentRowReversed = !isCurrentRowReversed;

      rowCount++;
      yOffset = 0;
      xOffset -= node.position.x;

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
          height: 300,
          width: 2000,
        },
      };
      groupNodes.push(newGroupNode);
    }

    lastPositonIndex = node.data.positionIndex as number;

    return {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset + 150,
      },
      parentId: rowId,
      extent: "parent",
    };
  });

  const allNodes: (SequenceNodeProps | Node)[] = [
    ...groupNodes,
    ...layoutedNodes,
  ];

  return [allNodes, edges];
};
