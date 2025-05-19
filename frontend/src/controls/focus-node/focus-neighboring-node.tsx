import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";

const focusNeighborNode = (
  forward: boolean,
  focusedNode: SequenceNodeProps,
  nodes: SequenceNodeProps[],
  viewport: { x: number; y: number; zoom: number },
) => {
  const screenWidth = window.innerWidth;
  const currentX = focusedNode
    ? focusedNode.position.x
    : viewport.x + screenWidth / 2;
  let minDistance = forward ? 1000000 : -1000000;
  let nextNode = focusedNode;
  for (const node of nodes) {
    if (focusedNode && node.id === focusedNode.id) {
      continue;
    }
    const distance = node.position.x - currentX;
    if (
      (forward ? distance < minDistance : distance > minDistance) &&
      (forward ? distance > 0 : distance < 0)
    ) {
      minDistance = distance;
      nextNode = node as SequenceNodeProps;
    }
  }
  return nextNode;
};

export const focusNextNode = (
  focusedNode: SequenceNodeProps,
  nodes: SequenceNodeProps[],
  viewport: { x: number; y: number; zoom: number },
) => {
  return focusNeighborNode(true, focusedNode, nodes, viewport);
};

export const focusPreviousNode = (
  focusedNode: SequenceNodeProps,
  nodes: SequenceNodeProps[],
  viewport: { x: number; y: number; zoom: number },
) => {
  return focusNeighborNode(false, focusedNode, nodes, viewport);
};
