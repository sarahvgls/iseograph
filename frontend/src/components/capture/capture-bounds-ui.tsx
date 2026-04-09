import styled from "styled-components";
import { useState, useEffect, useCallback } from "react";
import { Switch } from "../base-components/switch.tsx";

type BoundMode = "horizontal" | "vertical";

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
`;

const ExcludedOverlay = styled.div<{
  mode: BoundMode;
  position: number;
}>`
  position: absolute;
  background-color: rgba(100, 100, 100, 0.4);

  ${(props) =>
    props.mode === "horizontal"
      ? `
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(100vh - ${props.position}px);
  `
      : `
    right: 0;
    top: 0;
    bottom: 0;
    width: calc(100vw - ${props.position}px);
  `}
`;

const DraggableLine = styled.div<{
  mode: BoundMode;
  position: number;
}>`
  position: fixed;
  background-color: rgba(255, 102, 75, 0.58);
  cursor: ${(props) =>
    props.mode === "horizontal" ? "row-resize" : "col-resize"};
  pointer-events: auto;
  z-index: 10000;
  transition: background-color 0.2s ease;
  user-select: none;

  ${(props) =>
    props.mode === "horizontal"
      ? `
    left: 0;
    right: 0;
    width: 100vw;
    top: ${props.position}px;
    height: 4px;
    transform: translateY(-4px);

    &:hover {
      background-color: #ff5252;
      height: 10px;
      transform: translateY(-5px);
    }
  `
      : `
    top: 0;
    bottom: 0;
    height: 100vh;
    left: ${props.position}px;
    width: 4px;
    transform: translateX(-4px);

    &:hover {
      background-color: #ff5252;
      width: 10px;
      transform: translateX(-5px);
    }
  `}
`;

const DragHandle = styled.div<{ mode: BoundMode }>`
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid #ff6b6b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #ff6b6b;

  ${(props) =>
    props.mode === "horizontal"
      ? `
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 20px;
  `
      : `
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 60px;
  `}
`;

const ControlPanel = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  align-items: center;
  background-color: white;
  padding: 5px 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  z-index: 10001;
`;

const BoundsDisplay = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #555;
  padding: 0 10px;
  border-right: 1px solid #ddd;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BoundsInput = styled.input`
  width: 100%;
  padding: 4px 6px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-weight: 600;
  color: #333;

  &:focus {
    outline: none;
    border-color: #ff6b6b;
    box-shadow: 0 0 3px rgba(255, 107, 107, 0.3);
  }

  &::placeholder {
    color: #999;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 24px;
  background-color: #7ab67e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #22d329;
  }

  &:active {
    background-color: #3d8b40;
  }
`;

const CancelButton = styled.button`
  padding: 10px 24px;
  background-color: #ffb2aa;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #da190b;
  }

  &:active {
    background-color: #ba0000;
  }
`;

const SwitchWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`;

const StyledSwitch = styled(Switch)`
  box-shadow: none;
  background-color: transparent;
`;

const ModeLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #333;
`;

interface CaptureBoundsUIProps {
  onConfirm: (bounds: { width?: number; height?: number }) => void;
  onCancel: () => void;
}

const OFFSET_MARGIN = 120; // Offset from edges to make lines visible

export const CaptureBoundsUI = ({
  onConfirm,
  onCancel,
}: CaptureBoundsUIProps) => {
  const [mode, setMode] = useState<BoundMode>("horizontal");
  const [position, setPosition] = useState<number>(
    window.innerHeight - OFFSET_MARGIN,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [heightInput, setHeightInput] = useState<string>(
    String(window.innerHeight - OFFSET_MARGIN),
  );
  const [widthInput, setWidthInput] = useState<string>(
    String(window.innerWidth - OFFSET_MARGIN),
  );

  // Initialize position based on mode
  useEffect(() => {
    if (mode === "horizontal") {
      const initialHeight = window.innerHeight - OFFSET_MARGIN;
      setPosition(initialHeight);
      setHeightInput(String(initialHeight));
    } else {
      const initialWidth = window.innerWidth - OFFSET_MARGIN;
      setPosition(initialWidth);
      setWidthInput(String(initialWidth));
    }
  }, [mode]);

  // Handle height input change - just update the input, don't move the line yet
  const handleHeightInputChange = useCallback((value: string) => {
    setHeightInput(value);
  }, []);

  // Handle width input change - just update the input, don't move the line yet
  const handleWidthInputChange = useCallback((value: string) => {
    setWidthInput(value);
  }, []);

  // Apply height change when Enter is pressed or field loses focus
  const handleHeightInputCommit = useCallback(() => {
    const parsed = parseInt(heightInput, 10);
    if (!isNaN(parsed)) {
      const newPosition = Math.max(
        50,
        Math.min(parsed, window.innerHeight - 50),
      );
      setPosition(newPosition);
      setHeightInput(String(newPosition));
    }
  }, [heightInput]);

  // Apply width change when Enter is pressed or field loses focus
  const handleWidthInputCommit = useCallback(() => {
    const parsed = parseInt(widthInput, 10);
    if (!isNaN(parsed)) {
      const newPosition = Math.max(
        50,
        Math.min(parsed, window.innerWidth - 50),
      );
      setPosition(newPosition);
      setWidthInput(String(newPosition));
    }
  }, [widthInput]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (mode === "horizontal") {
        const newPosition = Math.max(
          50,
          Math.min(e.clientY, window.innerHeight - 50),
        );
        setPosition(newPosition);
        setHeightInput(String(newPosition));
      } else {
        const newPosition = Math.max(
          50,
          Math.min(e.clientX, window.innerWidth - 50),
        );
        setPosition(newPosition);
        setWidthInput(String(newPosition));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, mode]);

  const handleConfirm = () => {
    if (mode === "horizontal") {
      const parsedHeight = parseInt(heightInput, 10);
      const height = Number.isNaN(parsedHeight) ? position : parsedHeight;
      const bounds = { height, width: window.innerWidth };
      onConfirm(bounds);
    } else {
      const parsedWidth = parseInt(widthInput, 10);
      const width = Number.isNaN(parsedWidth) ? position : parsedWidth;
      const bounds = { width, height: window.innerHeight };
      onConfirm(bounds);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as BoundMode);
  };

  return (
    <OverlayContainer>
      {/* Excluded area overlay */}
      <ExcludedOverlay mode={mode} position={position} />

      {/* Draggable line */}
      <DraggableLine
        mode={mode}
        position={position}
        onMouseDown={handleMouseDown}
      >
        <DragHandle mode={mode}>{mode === "horizontal" ? "⇅" : "⇄"}</DragHandle>
      </DraggableLine>

      {/* Control panel */}
      <ControlPanel>
        <BoundsDisplay>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            Height:
            {mode === "horizontal" ? (
              <BoundsInput
                type="number"
                value={heightInput}
                onChange={(e) => handleHeightInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleHeightInputCommit();
                  }
                }}
                onBlur={handleHeightInputCommit}
                placeholder="Height (px)"
                min="50"
                max={window.innerHeight - 50}
              />
            ) : (
              <span style={{ fontWeight: 600, color: "#333" }}>
                {window.innerHeight}px
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            Width:
            {mode === "vertical" ? (
              <BoundsInput
                type="number"
                value={widthInput}
                onChange={(e) => handleWidthInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleWidthInputCommit();
                  }
                }}
                onBlur={handleWidthInputCommit}
                placeholder="Width (px)"
                min="50"
                max={window.innerWidth - 50}
              />
            ) : (
              <span style={{ fontWeight: 600, color: "#333" }}>
                {window.innerWidth}px
              </span>
            )}
          </div>
        </BoundsDisplay>

        <SwitchWrapper>
          <ModeLabel>Bound Mode:</ModeLabel>
          <StyledSwitch
            options={["horizontal", "vertical"]}
            selected={mode}
            selectOption={handleModeChange}
            isShy={false}
            testId="capture-mode-switch"
          />
        </SwitchWrapper>

        <CancelButton onClick={onCancel}>Cancel</CancelButton>
        <ConfirmButton onClick={handleConfirm}>Capture</ConfirmButton>
      </ControlPanel>
    </OverlayContainer>
  );
};
