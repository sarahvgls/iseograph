// Class to encapsulate group node creation logic and constants
import { theme } from "../../theme";
import { type Node } from "@xyflow/react";

export class GroupNode {
  static style = {
    border: "none",
    backgroundColor: "transparent",
    height: theme.rowNode.height,
    borderRadius: 0,
  };

  static create(
    id: string,
    rowCount: number,
    isReversed: boolean,
    rowWidth: number,
  ): Node {
    return {
      id,
      type: "row",
      position: {
        x: 0,
        y: theme.layout.snake.yOffsetBetweenRows * (rowCount - 1),
      },
      data: {
        label: `Row ${rowCount}`,
        isReversed,
      },
      style: {
        width: rowWidth * 1.1, // 10% padding
        ...GroupNode.style,
      },
      draggable: false,
    };
  }
}
