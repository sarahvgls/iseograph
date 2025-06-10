import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  MarkerType,
} from "@xyflow/react";
import { useMemo } from "react";

export default function ArrowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Generate a unique marker ID for this edge
  const markerId = useMemo(() => `arrow-${id}`, [id]);

  // Define the marker's color, using the style color or default black
  const color = style.stroke || "#000";
  const strokeWidth = style.strokeWidth || 1;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={color} stroke="none" />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: color,
          strokeWidth,
          ...style,
        }}
        id={id}
      />
    </>
  );
}
