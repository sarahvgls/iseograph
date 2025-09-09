// Class to encapsulate row node creation logic and constants
import { theme } from "../../theme";
import { type Node } from "@xyflow/react";
import { recordRowMeasurement } from "../../evaluation/trackers/row-tracker.ts";

export class RowNode {
  static style = {
    border: "none",
    backgroundColor: "transparent",
    borderRadius: 0,
  };

  static create(
    id: string,
    rowCount: number,
    isReversed: boolean,
    rowWidth: number,
    rowHeight: number = theme.rowNode.defaultHeight,
    graphHeight: number,
    numberOfNodesInRow: number = 0,
  ): Node {
    recordRowMeasurement(rowCount, rowHeight, numberOfNodesInRow);

    return {
      id,
      type: "row",
      position: {
        x: 0,
        y: graphHeight + rowHeight / 2,
      },
      data: {
        label: `Row ${rowCount}`,
        isReversed,
      },
      style: {
        width: rowWidth * 1.1, // 10% padding
        height: rowHeight,
        ...RowNode.style,
      },
      draggable: false,
    };
  }
}
