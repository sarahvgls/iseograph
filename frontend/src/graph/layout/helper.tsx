import { nodeWidthModes } from "../../theme/types.tsx";
import { theme } from "../../theme";

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
