// Class to encapsulate group node creation logic and constants
import { theme } from "../../theme";
import { type Node } from "@xyflow/react";

export class GroupNode {
  static style = {
    border: "none",
    backgroundColor: "transparent",
    height: theme.rowNode.height,
    width: theme.layout.snake.maxWidthPerRow,
    borderRadius: 0,
  };

  static create(id: string, rowCount: number, isReversed: boolean): Node {
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
      style: GroupNode.style,
    };
  }
}
