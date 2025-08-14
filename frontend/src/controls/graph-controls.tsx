import { Controls, ControlButton } from "@xyflow/react";

interface GraphControlsProps {
  onFocusNextNode: () => void;
  onFocusPreviousNode: () => void;
  onFocusCurrentNode: () => void;
}

const GraphControls = ({
  allowInteraction = false,
  onFocusNextNode,
  onFocusPreviousNode,
  onFocusCurrentNode,
}: GraphControlsProps & {
  allowInteraction?: boolean;
}) => {
  return (
    <Controls showInteractive={allowInteraction}>
      <ControlButton onClick={onFocusNextNode}>→</ControlButton>
      <ControlButton onClick={onFocusPreviousNode}>←</ControlButton>
      <ControlButton onClick={onFocusCurrentNode}>→←</ControlButton>
    </Controls>
  );
};

export default GraphControls;
