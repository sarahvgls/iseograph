// ----- functions for layouting nodes and edges -----
import { type Edge } from "@xyflow/react";
import { layoutModes, nodeTypes, type NodeTypes } from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { defaultValues, theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";
import { applyLinearLayout } from "./linear-layout.tsx";
import { type SourceToTargets } from "../store";

export function filterAndResetNodes(nodes: NodeTypes[]): SequenceNodeProps[] {
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

export function assignPositionIndices(
  nodes: NodeTypes[],
  edges: Edge[],
): [SequenceNodeProps[], SourceToTargets] {
  // Create a map to track the parent nodes and their children with correct index
  const sourceToTargets: SourceToTargets = {};

  // Initialization of data structure
  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = {
        positionIndex: -1,
        all_targets: [],
      };
    }
    if (!sourceToTargets[target]) {
      sourceToTargets[target] = {
        positionIndex: -1,
        all_targets: [],
      };
    }
    sourceToTargets[source].all_targets.push(target);
  });

  const firstSequenceNode = nodes.find(
    (node) => node.type === nodeTypes.SequenceNode && node.id === "n0",
  );
  if (!firstSequenceNode) {
    throw new Error("No sequence node found, layout not possible.");
  }
  let parentIdQueue = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionIndex = 0;

  // loop through all nodes and build correct positionIds
  // all_targets is used as correct iterator
  while (parentIdQueue.length > 0) {
    for (const parent of parentIdQueue) {
      //remove parent from stack
      parentIdQueue = parentIdQueue.filter((id) => id !== parent);

      const children = sourceToTargets[parent].all_targets;
      if (children.length === 0) break;
      for (const childId of children) {
        sourceToTargets[childId].positionIndex =
          sourceToTargets[parent].positionIndex + 1;
        if (!parentIdQueue.includes(childId)) {
          parentIdQueue.push(childId);
        }
      }
    }
  }

  // assign positionIndices to nodes
  nodes.forEach((node) => {
    if (node.type === nodeTypes.SequenceNode) {
      node.data.positionIndex = sourceToTargets[node.id]?.positionIndex ?? 0;
    }
  });

  return [nodes as SequenceNodeProps[], sourceToTargets];
}

export function addSymmetricalOffsetForVariations(
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
  edges: Edge[],
  layoutMode: layoutModes,
  maxWidthPerRow: number,
  cachedNodes?: SequenceNodeProps[],
  cachedSourceToTargets?: SourceToTargets,
): Promise<NodeTypes[]> => {
  // Use cached data or calculate if not provided
  let preparedNodes: SequenceNodeProps[];
  let sourceToTargets: SourceToTargets;

  if (cachedNodes && cachedNodes.length > 0 && cachedSourceToTargets) {
    // apply relevant properties from cached nodes onto current nodes
    nodes = nodes.map((node) => {
      const cachedNode = cachedNodes.find((n) => n.id === node.id);
      if (cachedNode) {
        return {
          ...node,
          data: {
            ...node.data,
            positionIndex: cachedNode.data.positionIndex,
            intensityRank: cachedNode.data.intensityRank,
          },
          position: {
            ...node.position,
            y: cachedNode.position.y,
          },
        } as SequenceNodeProps;
      }
      return node as SequenceNodeProps;
    });

    preparedNodes = nodes.filter(
      (node) => node.type === nodeTypes.SequenceNode,
    ) as SequenceNodeProps[];
    sourceToTargets = cachedSourceToTargets;
  } else {
    // Fall back to calculating values if no cache is provided
    const filteredNodes = filterAndResetNodes(nodes);
    [preparedNodes, sourceToTargets] = assignPositionIndices(
      filteredNodes,
      edges,
    );
    preparedNodes = addSymmetricalOffsetForVariations(preparedNodes);
  }

  return new Promise((resolve) => {
    // --- main layouting algorithm ---
    if (layoutMode === layoutModes.Basic) {
      const linearNodes = applyLinearLayout(preparedNodes, sourceToTargets);
      resolve(linearNodes);
      return;
    } else if (layoutMode === layoutModes.Snake) {
      const snakeNodes = applySnakeLayout(
        preparedNodes,
        maxWidthPerRow,
        sourceToTargets,
      );
      resolve(snakeNodes);
    }
  });
};
