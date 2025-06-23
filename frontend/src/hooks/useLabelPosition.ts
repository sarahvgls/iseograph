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

  const {
    registerLabelPosition,
    unregisterLabelPosition,
    labelPositions,
    activeHoveredLabel,
    setActiveHoveredLabel,
  } = useGraphStore((state) => ({
    registerLabelPosition: state.registerLabelPosition,
    unregisterLabelPosition: state.unregisterLabelPosition,
    labelPositions: state.labelPositions,
    activeHoveredLabel: state.activeHoveredLabel,
    setActiveHoveredLabel: state.setActiveHoveredLabel,
  }));

  // Check if this label is being actively hovered
  const isHovered = activeHoveredLabel === id;

  // Measure the element after it renders
  useEffect(() => {
    if (labelRef.current) {
      const { width, height } = labelRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [labelRef.current]);

  // Find overlapping labels and determine stack index
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      // Find overlapping labels
      const overlaps = labelPositions.filter(
        (pos) =>
          pos.id !== id &&
          Math.abs(pos.x - initialX) < 10 &&
          Math.abs(pos.y - initialY) < 10,
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

      // Register our position
      registerLabelPosition({
        id,
        x: initialX,
        y: initialY,
        width: dimensions.width,
        height: dimensions.height,
        knowsOverlap: overlappingIds.length > 0,
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
    labelPositions.length,
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
        if (isHovered) {
          // When hovered, move label to the side
          const sideOffset = dimensions.width;
          setPosition({
            x: initialX + sideOffset,
            y: initialY,
          });
        } else {
          // Check if any label in our overlap group is being hovered
          const groupIsHovered =
            activeHoveredLabel !== null &&
            overlappingLabels.includes(activeHoveredLabel);

          if (groupIsHovered) {
            // If another label in our group is hovered, maintain our stacked position
            const offsetX = stackIndex * 5;
            const offsetY = stackIndex * 5;
            setPosition({
              x: initialX + offsetX,
              y: initialY + offsetY,
            });
          } else {
            // Normal stacked position when nothing is hovered
            const offsetX = stackIndex * 5;
            const offsetY = stackIndex * 5;
            setPosition({
              x: initialX + offsetX,
              y: initialY + offsetY,
            });
          }
        }
      } else {
        // No overlap, use initial position
        setPosition({
          x: initialX,
          y: initialY,
        });
      }
    }
  }, [
    isHovered,
    activeHoveredLabel,
    initialX,
    initialY,
    dimensions,
    stackIndex,
    overlappingLabels,
  ]);

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent) => {
      e.stopPropagation();

      // Clear any existing timeout
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }

      // Set a small delay before activating hover to prevent flickering
      hoverTimeoutRef.current = window.setTimeout(() => {
        setActiveHoveredLabel(id);
      }, 50);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation();

      // Clear any existing timeout
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }

      // Set a small delay before deactivating hover
      hoverTimeoutRef.current = window.setTimeout(() => {
        if (activeHoveredLabel === id) {
          setActiveHoveredLabel(null);
        }
      }, 50);
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
  };

  return {
    ref: labelRef,
    position,
    hoverHandlers,
    isOverlapping: overlappingLabels.length > 0,
  };
}
