import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { useMemo } from "react";
import type { ArrowEdgeProps } from "./arrow-edge.props.tsx";
import useGraphStore from "../../graph/store.ts";
import { shallow } from "zustand/shallow";
import { theme } from "../../theme";
import useLabelPosition from "../../hooks/useLabelPosition.ts";

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
  const { isoformColorMapping, selectedIsoforms } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
    }),
    shallow,
  );
  const isoforms =
    data.isoforms?.length || 0 > 0
      ? data.isoforms!.filter((isoform: string) =>
          selectedIsoforms.includes(isoform),
        )
      : ["Unknown"];

  // prepare path elements to be rendered in the correct order
  const pathElements = [];

  const hasSelectedIsoform = isoforms.some((isoform) =>
    selectedIsoforms.includes(isoform),
  );

  // prepare marker ID and color
  const markerId = useMemo(() => `arrow-${id}`, [id]);
  const markerColor = isoforms.includes("Canonical")
    ? isoformColorMapping["Canonical"]
    : hasSelectedIsoform
      ? isoformColorMapping[isoforms[0]] || theme.defaultColor
      : isoformColorMapping["Default"] || theme.defaultColor;
  // get marker label color based on the label color to have much contrast
  const markerLabelColor = useMemo(() => {
    const rgb = markerColor.match(/\d+/g);
    if (!rgb) return "#000"; // Fallback to black if color is invalid
    const [r, g, b] = rgb.map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff"; // Return black for light colors, white for dark colors
  }, [markerColor]);

  // Valid label that is not none or None
  let labelValid: string | undefined;
  if (label && label !== "None" && label !== "none") {
    labelValid = label as string;
  } else {
    labelValid = undefined;
  }

  // Use the modified hook to get hover-dependent position
  const {
    ref: labelRef,
    position,
    hoverHandlers,
  } = labelValid
    ? useLabelPosition(`edge-label-${id}`, labelX, labelY)
    : { ref: null, position: { x: labelX, y: labelY }, hoverHandlers: {} };

  // If no isoforms are selected, render simple black edge
  if (!hasSelectedIsoform) {
    const [defaultPath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    pathElements.push(
      <BaseEdge
        key={`${id}-default`}
        id={id}
        path={defaultPath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: isoformColorMapping["Default"] || theme.defaultColor,
          strokeWidth: style.strokeWidth || 2,
          ...style,
        }}
      />,
    );
  } else {
    const centerIndex = Math.floor(isoforms.length / 2);

    isoforms.map((isoform, index) => {
      if (index === centerIndex) return; // Skip the center isoform for now
      if (!selectedIsoforms.includes(isoform)) return; // Skip if not selected
      const color = isoformColorMapping[isoform] || "#000";
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
      const color = isoformColorMapping[centerIsoform] || "#000";
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
            ref={labelRef}
            {...hoverHandlers}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${position.x}px,${position.y}px)`,
              background: markerColor,
              color: markerLabelColor,
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: "all", // This is crucial for capturing mouse events
              border: "1px solid #ccc",
              zIndex: 10, // Ensure the label is above other elements
              cursor: "default", // Show default cursor to indicate interactivity
              userSelect: "none", // Prevent text selection
            }}
          >
            {labelValid}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
