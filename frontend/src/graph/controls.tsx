import { Controls, ControlButton } from "@xyflow/react";

interface GraphControlsProps {
  onFocusNextNode: () => void;
  onFocusPreviousNode: () => void;
  onFocusCurrentNode: () => void;
}

const GraphControls = ({
  onFocusNextNode,
  onFocusPreviousNode,
  onFocusCurrentNode,
}: GraphControlsProps) => {
  return (
    <Controls showInteractive={false}>
      <ControlButton onClick={onFocusNextNode}>→</ControlButton>
      <ControlButton onClick={onFocusPreviousNode}>←</ControlButton>
      <ControlButton onClick={onFocusCurrentNode}>→←</ControlButton>
    </Controls>
  );
};

export default GraphControls;
