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
import { labelVisibilities } from "../../theme/types.tsx";
import { edgePeptideColor } from "../../controls/peptides-color.tsx";

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
  source,
  target,
}: EdgeProps<ArrowEdgeProps>) {
  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const {
    isoformColorMapping,
    selectedIsoforms,
    hoveredNode,
    labelVisibility,
    maxPeptides,
    extremes,
    colorScale,
    glowMethod,
    intensityMethod,
    intensitySource,
    getPeptides,
  } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      hoveredNode: state.hoveredNode,
      labelVisibility: state.labelVisibility,
      maxPeptides: state.maxPeptidesEdges,
      extremes: state.edgeExtremes,
      colorScale: state.colorScale,
      glowMethod: state.glowMethod,
      intensityMethod: state.intensityMethod,
      intensitySource: state.intensitySource,
      getPeptides: state.getPeptidesForEdge,
    }),
    shallow,
  );
  // Peptide attributes for edge
  const peptideCount = data.peptides?.length || 0;
  const peptideLog = getPeptides(id);

  // Isoform attributes for edge
  const isoforms =
    data.isoforms?.length || 0 > 0
      ? data.isoforms!.filter((isoform: string) =>
          selectedIsoforms.includes(isoform),
        )
      : ["Unknown"];

  const isConnectedNodeHovered =
    hoveredNode === source || hoveredNode === target;

  // prepare path elements to be rendered in the correct order
  const pathElements = [];

  // add a colored wide edge underneath for peptide score
  const [peptidePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  pathElements.push(
    <BaseEdge
      path={peptidePath}
      style={{
        strokeWidth: 30,
        stroke: edgePeptideColor(
          colorScale,
          glowMethod,
          peptideCount,
          maxPeptides,
          extremes,
          intensityMethod,
          intensitySource,
          peptideLog,
        ),
      }}
      key={`${id}-peptide`}
      id={id}
    />,
  );

  // add a gray wide edge underneath hovered edges
  if (isConnectedNodeHovered) {
    const [hoverPath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    pathElements.push(
      <BaseEdge
        path={hoverPath}
        style={{
          strokeWidth: 20,
          stroke: "rgba(218,218,218,0.48)",
        }}
        key={`${id}-hover`}
        id={id}
      />,
    );
  }

  const hasSelectedIsoform = isoforms.some((isoform) =>
    selectedIsoforms.includes(isoform),
  );

  // prepare ID used for marker and label & colors
  const edgeId = useMemo(() => `arrow-${id}`, [id]);
  const labelColor = isoforms.includes("Canonical")
    ? isoformColorMapping["Canonical"]
    : hasSelectedIsoform
      ? isoformColorMapping[isoforms[0]] || theme.defaultColor
      : isoformColorMapping["Default"] || theme.defaultColor;
  // get text color based on the label color with much contrast
  const labelTextColor = useMemo(() => {
    const rgb = labelColor.match(/\d+/g);
    if (!rgb) return "#000"; // Fallback to black if color is invalid
    const [r, g, b] = rgb.map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff"; // Return black for light colors, white for dark colors
  }, [labelColor]);

  // Valid label that is not none
  const labelValid =
    label && (label as String).toLowerCase() !== "none"
      ? (label as string)
      : undefined;

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
        markerEnd={`url(#${edgeId})`}
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
      if (index === centerIndex) return; // Skip the center isoform for correct order of rendering
      const color = isoformColorMapping[isoform] || "#000";
      const offset = index - (isoforms.length - 1) / 2;
      const offsetDistance = (style.strokeWidth as number) || 2; // Distance between parallel lines in pixels

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
          markerEnd={`url(#${edgeId})`}
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
          id={edgeId}
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

      {labelValid &&
        (labelVisibility === labelVisibilities.always ||
          (labelVisibility === labelVisibilities.onHover &&
            isConnectedNodeHovered)) && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                background: labelColor,
                color: labelTextColor,
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
