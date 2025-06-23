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
  const [isHovered, setIsHovered] = useState(false);
  const [isOverlapping, setIsOverlapping] = useState(false);

  const {
    registerLabelPosition,
    unregisterLabelPosition,
    getAdjustedLabelPosition,
  } = useGraphStore((state) => ({
    registerLabelPosition: state.registerLabelPosition,
    unregisterLabelPosition: state.unregisterLabelPosition,
    getAdjustedLabelPosition: state.getAdjustedLabelPosition,
  }));

  // Measure the element after it renders
  useEffect(() => {
    if (labelRef.current) {
      const { width, height } = labelRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [labelRef.current, initialX, initialY]);

  // Register position
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      // first check if the position is already registered
      const existingPosition = useGraphStore.getState().labelPositions;
      console.log(existingPosition);
      // find entries with same position (id is irrelevant here) and count how many it occurs
      const overlap = existingPosition.filter(
        (pos) =>
          Math.abs(pos.x - initialX) < 15 &&
          Math.abs(pos.y - initialY) < 15 &&
          pos.id !== id &&
          !pos.knowsOverlap,
      );
      // If there are overlaps, adjust position
      if (overlap.length > 0) {
        console.log("found overlap for label:", id);
        setIsOverlapping(true);
        const adjustedPosition = {
          x: initialX + 15,
          y: initialY + 15,
        };
        setPosition(adjustedPosition);
        registerLabelPosition({
          id,
          x: adjustedPosition.x,
          y: adjustedPosition.y,
          width: dimensions.width,
          height: dimensions.height,
          knowsOverlap: true, // Mark this position as knowing about overlap
        });
      } else {
        setIsOverlapping(false);
        registerLabelPosition({
          id,
          x: initialX,
          y: initialY,
          width: dimensions.width,
          height: dimensions.height,
          knowsOverlap: false, // Mark this position as not knowing about overlap
        });
      }
    }

    return () => {
      unregisterLabelPosition(id);
    };
  }, [id, initialX, initialY, dimensions.width, dimensions.height]);

  // Update position when hover state changes
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      if (isHovered && isOverlapping) {
        console.log("Hovering over label with overlap, adjusting position");
        // // check if label position is registered twice
        // const existingPosition = useGraphStore.getState().labelPositions;
        // console.log(existingPosition);
        // // find entries with same position (id is irrelevant here) and count how many it occurs
        // const overlap = existingPosition.filter(
        //   (pos) =>
        //     Math.abs(pos.x - initialX) < 25 &&
        //     Math.abs(pos.y - initialY) < 25 &&
        //     pos.id !== id,
        // );
        // console.log(
        //   "Duplicate position found for x:",
        //   initialX,
        //   "y:",
        //   initialY,
        //   "Count:",
        //   overlap.length,
        // );
        // // If there are overlaps, adjust position
        // if (overlap.length > 0) {
        const adjustedPosition = {
          x: initialX + dimensions.width,
          y: initialY,
        };
        console.log("adjusted position on hover:", adjustedPosition);
        setPosition(adjustedPosition);
        // } else {
        //   setPosition({ x: initialX, y: initialY });
        // }
      } else {
        setPosition({ x: initialX, y: initialY });
      }
    }
  }, [isHovered, initialX, initialY, dimensions, id]);

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling
      e.preventDefault();
      setIsHovered(true);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling
      e.preventDefault();
      setIsHovered(false);
    },
    onClick: (e: React.MouseEvent) => {
      // Ensure clicks are captured
      e.stopPropagation();
    },
  };

  return { ref: labelRef, position, hoverHandlers };
}
