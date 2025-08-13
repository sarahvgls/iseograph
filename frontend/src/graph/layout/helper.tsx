import { nodeWidthModes } from "../../theme/types.tsx";
import { theme } from "../../theme";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";

export const toggleNodeWidthMode = (mode: nodeWidthModes): nodeWidthModes => {
  switch (mode) {
    case nodeWidthModes.Collapsed:
      return nodeWidthModes.Small;
    case nodeWidthModes.Small:
      return nodeWidthModes.Expanded;
    case nodeWidthModes.Expanded:
      return nodeWidthModes.Collapsed;
    default:
      return nodeWidthModes.Collapsed;
  }
};

export const getNodeWidth = (
  mode: nodeWidthModes,
  sequence: string,
): number => {
  const sequenceLength = sequence.length * 12; // 12 is the approximated width of each character
  return mode === nodeWidthModes.Expanded
    ? sequenceLength
    : mode === nodeWidthModes.Small
      ? theme.node.defaultWidthSmall
      : theme.node.defaultWidthCollapsed;
};

export const sortNodesByPositionIndex = (nodes: SequenceNodeProps[]) => {
  return nodes.sort((a, b) => {
    const positionA = a.data.positionIndex as number;
    const positionB = b.data.positionIndex as number;
    return positionA - positionB;
  });
};

export const getMaxWidthPerDirectSiblings = (
  positionIndex: number,
  nodes: SequenceNodeProps[],
): number => {
  return nodes
    .filter((node) => node.data.positionIndex === positionIndex)
    .reduce((maxWidth, node) => {
      const nodeWidth = getNodeWidth(
        node.data.nodeWidthMode as nodeWidthModes,
        node.data.sequence as string,
      );
      return Math.max(maxWidth, nodeWidth);
    }, 0);
};
