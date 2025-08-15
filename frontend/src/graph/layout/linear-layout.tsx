import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
  getMaxWidthPerDirectSiblings,
  sortNodesByPositionIndex,
} from "./helper.tsx";
import { theme } from "../../theme";

export const applyLinearLayout = (
  nodes: SequenceNodeProps[],
): SequenceNodeProps[] => {
  let previousPositionIndex = -1;
  let graphWidth = 0;
  let xPosition = 0;

  const sortedNodes = sortNodesByPositionIndex(nodes);

  return sortedNodes.map((node) => {
    const nodeWidth = getMaxWidthPerDirectSiblings(
      node.data.positionIndex,
      nodes,
    );

    if (node.data.positionIndex === previousPositionIndex) {
      return {
        ...node,
        position: {
          x: xPosition,
          y: node.position.y, // already assigned y-offset
        },
      };
    }
    // reset position count if position index changed
    previousPositionIndex = node.data.positionIndex;
    graphWidth += nodeWidth + theme.layout.linear.xOffsetBetweenNodes;
    xPosition = graphWidth - nodeWidth / 2;

    return {
      ...node,
      position: {
        x: xPosition,
        y: node.position.y,
      },
    };
  });
};
