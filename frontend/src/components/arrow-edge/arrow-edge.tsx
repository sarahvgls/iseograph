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
  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isoforms =
    data.isoforms?.length || 0 > 0 ? (data.isoforms as string[]) : ["Unknown"];

  const isoformsToColors =
    Object.keys(data.isoformsToColors || {}).length > 0
      ? data.isoformsToColors
      : {
          Unknown: "#000",
        };

  // Valid label that is not none or None
  let labelValid: string | undefined;
  if (label && label !== "None" && label !== "none") {
    labelValid = label as string;
  } else {
    labelValid = undefined;
  }

  const markerId = useMemo(() => `arrow-${id}`, [id]);
  const centerIndex = Math.floor(isoforms.length / 2);
  const defaultColor = isoforms.includes("Canonical")
    ? isoformsToColors!["Canonical"]
    : isoforms.length > 0
      ? isoformsToColors![isoforms[0]]
      : "#000";

  // prepare path elements to be rendered in the correct order
  const pathElements = [];

  isoforms.map((isoform, index) => {
    if (index === centerIndex) return; // Skip the center isoform for now
    const color = isoformsToColors![isoform] || "#000";
    const offset = index - (isoforms.length - 1) / 2;
    const offsetDistance = 2; // Distance between parallel lines in pixels

    // Calculate perpendicular offset
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * offset * offsetDistance;
    const offsetY = (dx / length) * offset * offsetDistance;

    // Get path with offset
    const [offsetPath] = getBezierPath({
      sourceX: sourceX + offsetX,
      sourceY: sourceY + offsetY,
      sourcePosition,
      targetX: targetX + offsetX,
      targetY: targetY + offsetY,
      targetPosition,
    });

    pathElements.push(
      <BaseEdge
        key={`${id}-${isoform}`}
        path={offsetPath}
        style={{
          stroke: color,
          strokeWidth: style.strokeWidth || 2,
          ...style,
        }}
        id={`${id}-${isoform}`}
      />,
    );
  });

  if (isoforms.length > 0) {
    const centerIsoform = isoforms[centerIndex];
    const color = isoformsToColors![centerIsoform] || "#000";
    const offset = centerIndex - (isoforms.length - 1) / 2;
    const offsetDistance = 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * offset * offsetDistance;
    const offsetY = (dx / length) * offset * offsetDistance;

    const [offsetPath] = getBezierPath({
      sourceX: sourceX + offsetX,
      sourceY: sourceY + offsetY,
      sourcePosition,
      targetX: targetX + offsetX,
      targetY: targetY + offsetY,
      targetPosition,
    });

    pathElements.push(
      <BaseEdge
        key={`${id}-${centerIsoform}-marker`}
        path={offsetPath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: color,
          strokeWidth: style.strokeWidth || 2,
          ...style,
        }}
        id={`${id}-${centerIsoform}`}
      />,
    );
  }

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
            d="M1,1 L1,9 L9.5,5 L1,1 Z"
            fill={"#fff"}
            stroke={"#000"}
            strokeWidth={1}
          />
        </marker>
      </defs>

      {/* Render multiple parallel paths for each isoform */}
      {pathElements}

      {labelValid && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: defaultColor,
              color: "#000000",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: "all",
              border: "1px solid #ccc",
            }}
          >
            {labelValid}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
