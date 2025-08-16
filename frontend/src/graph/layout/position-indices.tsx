import { nodeTypes, type NodeTypes } from "../../theme/types.tsx";
import type { Edge } from "@xyflow/react";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";

export function assignPositionIndices(
  nodes: NodeTypes[],
  edges: Edge[],
): SequenceNodeProps[] {
  // Create a map to track the parent nodes and their children with correct index
  const sourceToTargets: Record<
    string,
    {
      positionIndex: number;
      all_targets: string[];
    }
  > = {};

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
  let parentIdStack = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionIndex = 0;

  // loop through all nodes and build correct positionIds
  // all_targets is used as correct iterator
  while (parentIdStack.length > 0) {
    for (const parent of parentIdStack) {
      //remove parent from stack
      parentIdStack = parentIdStack.filter((id) => id !== parent);

      const children = sourceToTargets[parent].all_targets;
      if (children.length === 0) break;
      for (const childId of children) {
        sourceToTargets[childId].positionIndex =
          sourceToTargets[parent].positionIndex + 1;
        if (!parentIdStack.includes(childId)) {
          parentIdStack.push(childId);
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

  return nodes as SequenceNodeProps[];
}
