import { BaseEdge, type EdgeProps, getBezierPath } from "@xyflow/react";
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
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    // labelX and labelY can be used here too
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
            stroke={"#000"}
            strokeWidth={1}
          />
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
