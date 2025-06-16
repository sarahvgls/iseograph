import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { useMemo } from "react";
import type { ArrowEdgeProps } from "./arrow-edge.props.tsx";

export default function ArrowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  label,
  data = {},
}: EdgeProps<ArrowEdgeProps>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Edge color depending on isoforms
  let edgeColor = "#000"; // default color
  if (data.isoforms) {
    const isoformsToColors = data.isoformsToColors || {};
    if (data.isoforms.includes("Canonical")) {
      edgeColor = isoformsToColors["Canonical"];
    } else {
      // it is expected that there is only one isoform if "Canonical" is not in array
      edgeColor = isoformsToColors[data.isoforms[0]];
    }
  }

  // Valid label that is not none or None
  let labelValid: string | undefined;
  if (label && label !== "None" && label !== "none") {
    labelValid = label as string;
  } else {
    labelValid = undefined;
  }

  // Generate a unique marker ID for this edge
  const markerId = useMemo(() => `arrow-${id}`, [id]);

  // Define the marker's color, using the style color or default black
  const strokeWidth = style.strokeWidth || 2;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="15"
          markerHeight="15"
          refX="9.8"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M1,1
              L1,9
              L9.5,5
              L1,1
              Z"
            fill={"#fff"}
            stroke={edgeColor}
            strokeWidth={1}
          />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: edgeColor,
          strokeWidth,
          ...style,
        }}
        id={id}
      />
      {labelValid && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeColor,
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            {labelValid}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
