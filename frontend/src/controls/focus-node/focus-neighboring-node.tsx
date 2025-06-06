import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { nodeTypes, type NodeTypes } from "../../theme/types.tsx";

const focusNeighborNode = (
  forward: boolean,
  focusedNode: SequenceNodeProps,
  nodes: NodeTypes[],
) => {
  let nextNode = focusedNode;
  for (const node of nodes) {
    if (
      (focusedNode &&
        node.id === focusedNode.id &&
        node.type === nodeTypes.SequenceNode) ||
      node.type !== nodeTypes.SequenceNode
    ) {
      continue;
    }
    const currentPositionIndex = focusedNode.data.positionIndex;
    for (const node of nodes) {
      if (
        node.type == nodeTypes.SequenceNode &&
        node.data.positionIndex ===
          (forward ? currentPositionIndex + 1 : currentPositionIndex - 1)
      ) {
        nextNode = node as SequenceNodeProps;
      }
    }
  }
  return nextNode;
};

export const focusNextNode = (
  focusedNode: SequenceNodeProps,
  nodes: NodeTypes[],
) => {
  return focusNeighborNode(true, focusedNode, nodes);
};

export const focusPreviousNode = (
  focusedNode: SequenceNodeProps,
  nodes: NodeTypes[],
) => {
  return focusNeighborNode(false, focusedNode, nodes);
};
