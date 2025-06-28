import { useEffect, useRef, useState } from "react";
import useGraphStore from "../graph/store";

export default function useLabelPosition(
  id: string,
  initialX: number,
  initialY: number,
) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({
    x: initialX,
    y: initialY,
  });
  const hoverTimeoutRef = useRef<number | null>(null);
  const [overlappingLabels, setOverlappingLabels] = useState<string[]>([]);
  const [stackIndex, setStackIndex] = useState(0);

  const { registerLabelPosition, unregisterLabelPosition, labelPositions } =
    useGraphStore((state) => ({
      registerLabelPosition: state.registerLabelPosition,
      unregisterLabelPosition: state.unregisterLabelPosition,
      labelPositions: state.labelPositions,
    }));

  // Measure the element after it renders
  useEffect(() => {
    if (labelRef.current) {
      const { width, height } = labelRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [labelRef.current]);

  // Register the label position on mount and when dimensions change
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      registerLabelPosition({
        id,
        x: initialX,
        y: initialY,
        width: dimensions.width,
        height: dimensions.height,
        knowsOverlap: false,
      });
    }

    return () => {
      unregisterLabelPosition(id);
    };
  }, [
    id,
    initialX,
    initialY,
    dimensions.width,
    dimensions.height,
    registerLabelPosition,
    unregisterLabelPosition,
  ]);

  // Detect overlaps separately from registration
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      // Find overlapping labels
      const overlaps = labelPositions.filter(
        (pos) =>
          pos.id !== id &&
          Math.abs(pos.x - initialX) < 25 &&
          Math.abs(pos.y - initialY) < 25,
      );

      const overlappingIds = overlaps.map((pos) => pos.id);
      setOverlappingLabels(overlappingIds);

      // Determine stack index - position in the overlap group
      if (overlappingIds.length > 0) {
        // Sort overlapping IDs to ensure consistent ordering
        const allIds = [...overlappingIds, id].sort();
        const index = allIds.indexOf(id);
        setStackIndex(index);
      } else {
        setStackIndex(0);
      }
    }
  }, [
    id,
    initialX,
    initialY,
    dimensions.width,
    dimensions.height,
    labelPositions,
  ]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Update position based on hover state and stack index
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const hasOverlap = overlappingLabels.length > 0;

      if (hasOverlap) {
        // Normal stacked position when nothing is hovered
        const offsetX = stackIndex * 5;
        const offsetY = stackIndex * 5;
        setPosition({
          x: initialX + offsetX,
          y: initialY + offsetY,
        });
      } else {
        // No overlap, use initial position
        setPosition({
          x: initialX,
          y: initialY,
        });
      }
    }
  }, [initialX, initialY, dimensions, stackIndex, overlappingLabels]);

  return {
    ref: labelRef,
    position,
    isOverlapping: overlappingLabels.length > 0,
  };
}
