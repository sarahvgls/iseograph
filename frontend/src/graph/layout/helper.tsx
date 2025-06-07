import { nodeWidthModes } from "../../theme/types.tsx";

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
