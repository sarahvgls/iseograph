import { Controls, ControlButton } from "@xyflow/react";
import { Icon } from "../components/icon";

interface GraphControlsProps {
  onFocusNextNode: () => void;
  onFocusPreviousNode: () => void;
  onFocusCurrentNode: () => void;
  toggleNodeWidthMode: () => void;
  toggleSnakeLayout: () => void;
}

const GraphControls = ({
  onFocusNextNode,
  onFocusPreviousNode,
  onFocusCurrentNode,
  toggleNodeWidthMode,
  toggleSnakeLayout,
}: GraphControlsProps) => {
  return (
    <Controls showInteractive={false}>
      <ControlButton onClick={onFocusNextNode}>→</ControlButton>
      <ControlButton onClick={onFocusPreviousNode}>←</ControlButton>
      <ControlButton onClick={onFocusCurrentNode}>→←</ControlButton>
      <ControlButton onClick={toggleNodeWidthMode}>
        <Icon icon={"compress"} />
      </ControlButton>
      <ControlButton onClick={toggleSnakeLayout}>s</ControlButton>
    </Controls>
  );
};

export default GraphControls;
