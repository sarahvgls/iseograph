import type { MiniMapNodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { nodeTypes, nodeWidthModes } from "../../theme/types";

const DirectionMiniMapNode = ({
  id,
  x,
  y,
  width,
  height,
  strokeColor,
  onClick,
}: MiniMapNodeProps) => {
  const { getInternalNode } = useReactFlow();
  const node = getInternalNode(id);

  // Check if it's a sequence node and has the isReversed property
  const isSequenceNode = node?.type === nodeTypes.SequenceNode;
  const isReversed = node?.data?.isReversed;
  const nodeWidthMode = isSequenceNode ? node?.data?.nodeWidthMode : null;

  // Calculate dimensions for the arrow (slightly larger than original square)
  const arrowWidthCollapsed = width * 2.5;
  const arrowHeightCollapsed = height * 3.5;
  const arrowWidthSmall = width * 1.5;
  const arrowHeightSmall = height * 1.7;
  const arrowWidthExpanded = width > 200 ? width * 0.9 : width * 1.5;
  const arrowHeightExpanded = height * 1.5;
  const arrowWidthRow = width;
  const arrowHeightRow = height * 0.8;

  let arrowWidth = isSequenceNode
    ? nodeWidthMode === nodeWidthModes.Collapsed
      ? arrowWidthCollapsed
      : nodeWidthMode === nodeWidthModes.Small
        ? arrowWidthSmall
        : arrowWidthExpanded
    : arrowWidthRow;
  let arrowHeight = isSequenceNode
    ? nodeWidthMode === nodeWidthModes.Collapsed
      ? arrowHeightCollapsed
      : nodeWidthMode === nodeWidthModes.Small
        ? arrowHeightSmall
        : arrowHeightExpanded
    : arrowHeightRow;

  // Calculate center positions for the arrow
  const arrowX = x + (width - arrowWidth) / 2;
  const arrowY = y + (height - arrowHeight) / 2;

  // Calculate the arrow's path
  // The arrow tip size (how much it protrudes)
  const tipSize = isSequenceNode ? 25 : 150;

  // Create path for the arrow
  let pathData = "";
  if (isReversed) {
    // Left-pointing arrow (←)
    pathData = `
      M ${arrowX + arrowWidth} ${arrowY}
      L ${arrowX + arrowWidth - tipSize} ${arrowY + arrowHeight / 2}
      L ${arrowX + arrowWidth} ${arrowY + arrowHeight}
      L ${arrowX + tipSize} ${arrowY + arrowHeight}
      L ${arrowX} ${arrowY + arrowHeight / 2}
      L ${arrowX + tipSize} ${arrowY}
      Z
    `;
  } else {
    // Right-pointing arrow (→)
    pathData = `
      M ${arrowX} ${arrowY}
      L ${arrowX + tipSize} ${arrowY + arrowHeight / 2}
      L ${arrowX} ${arrowY + arrowHeight}
      L ${arrowX + arrowWidth - tipSize} ${arrowY + arrowHeight}
      L ${arrowX + arrowWidth} ${arrowY + arrowHeight / 2}
      L ${arrowX + arrowWidth - tipSize} ${arrowY}
      Z
    `;
  }

  return (
    <g onClick={(event) => onClick?.(event, id)}>
      {/* Arrow shape */}
      <path
        d={pathData}
        fill={
          isSequenceNode ? "rgb(191, 117, 255, 0.5)" : "rgb(255, 234, 0, 0.3)"
        }
        stroke={strokeColor || "rgb(0, 0, 0, 0.1)"}
        strokeWidth={1}
      />
    </g>
  );
};

export default DirectionMiniMapNode;
