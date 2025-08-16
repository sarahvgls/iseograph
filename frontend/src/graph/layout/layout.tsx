// ----- functions for layouting nodes and edges -----
import { type Edge } from "@xyflow/react";
import { layoutModes, nodeTypes, type NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";
import { applyLinearLayout } from "./linear-layout.tsx";

function filterNodes(nodes: NodeTypes[]): SequenceNodeProps[] {
  return nodes.filter(
    (node) => node.type === nodeTypes.SequenceNode,
  ) as SequenceNodeProps[];
}

function filterAndResetNodes(nodes: NodeTypes[]): SequenceNodeProps[] {
  // remove groups and reset layouting properties
  return nodes
    .filter((node) => node.type === nodeTypes.SequenceNode)
    .map((node) => ({
      ...node,
      parentId: undefined,
      extent: undefined,
      position: {
        x: 0,
        y: 0,
      },
      data: {
        ...node.data,
        positionIndex: 0,
        intensityRank: 0,
        isReversed: false, // Reset isReversed
        nodeWidthMode: node.data.nodeWidthMode || defaultValues.nodeWidthMode,
      },
    })) as SequenceNodeProps[];
}

function addSymmetricalOffsetForVariations(
  nodes: SequenceNodeProps[],
): SequenceNodeProps[] {
  // Group nodes by positionIndex
  const nodesByPosition: Record<number, SequenceNodeProps[]> = {};

  nodes.forEach((node) => {
    if (!nodesByPosition[node.data.positionIndex]) {
      nodesByPosition[node.data.positionIndex] = [];
    }
    nodesByPosition[node.data.positionIndex].push(node);
  });

  // Sort each position group by peptide count (once per position)
  Object.values(nodesByPosition).forEach((positionNodes) => {
    positionNodes.sort(
      (a, b) =>
        (Number(b.data.peptideCount) || 0) - (Number(a.data.peptideCount) || 0),
    );
  });

  // Apply positions to all nodes based on their rank in their position group
  return nodes.map((node) => {
    const positionNodes = nodesByPosition[node.data.positionIndex];

    // If this is the only node at this position, no offset needed
    if (positionNodes.length <= 1) return node;

    const intensityRank = positionNodes.findIndex((n) => n.id === node.id);
    const spacing = theme.debugMode
      ? theme.offsets.debugYSpacingBetweenNodes
      : theme.offsets.defaultYSpacingBetweenNodes;

    const yOffset = (intensityRank - (positionNodes.length - 1) / 2) * spacing;

    return {
      ...node,
      position: {
        x: 0,
        y: yOffset,
      },
      data: {
        ...node.data,
        intensityRank,
      },
    };
  });
}

export const applyLayout = (
  nodes: NodeTypes[],
  layoutMode: layoutModes,
  maxWidthPerRow: number,
): Promise<NodeTypes[]> => {
  console.log(`Applying initial layout: ${layoutMode}`);

  const filteredNodes: SequenceNodeProps[] = filterAndResetNodes(nodes);
  const layoutedNodes = addSymmetricalOffsetForVariations(filteredNodes);

  return new Promise((resolve) => {
    if (layoutMode === layoutModes.Basic) {
      const linearNodes = applyLinearLayout(layoutedNodes);
      resolve(linearNodes);
      return;
    } else if (layoutMode === layoutModes.Snake) {
      const snakeNodes = applySnakeLayout(layoutedNodes, maxWidthPerRow);
      resolve(snakeNodes);
      return;
    } else {
      throw new Error(`Unsupported layout mode: ${layoutMode}`);
    }
  });
};

// export const applyLayout = (
//   nodes: NodeTypes[],
//   layoutMode: layoutModes,
//   maxWidthPerRow: number,
// ): Promise<NodeTypes[]> => {
//   console.log(`Applying layout: ${layoutMode}`);
//   console.log("hier könnte ihr layout passieren");
//
//   // reset x and y positions
//   const filteredNodes: SequenceNodeProps[] = filterNodes(nodes);
//
//   if (layoutMode === layoutModes.Basic) {
//     return Promise.resolve(applyLinearLayout(filteredNodes));
//   } else if (layoutMode === layoutModes.Snake) {
//     return Promise.resolve(applySnakeLayout(filteredNodes, maxWidthPerRow));
//   } else {
//     return Promise.reject(new Error(`Unsupported layout mode: ${layoutMode}`));
//   }
// };
