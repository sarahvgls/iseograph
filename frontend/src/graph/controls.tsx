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
  allowInteraction = false,
  onFocusNextNode,
  onFocusPreviousNode,
  onFocusCurrentNode,
  toggleNodeWidthMode,
  toggleSnakeLayout,
}: GraphControlsProps & {
  allowInteraction?: boolean;
}) => {
  return (
    <Controls showInteractive={allowInteraction}>
      <ControlButton onClick={onFocusNextNode}>→</ControlButton>
      <ControlButton onClick={onFocusPreviousNode}>←</ControlButton>
      <ControlButton onClick={onFocusCurrentNode}>→←</ControlButton>
      {/*TODO: think about replacing the following with centered buttons*/}
      <ControlButton onClick={toggleNodeWidthMode}>
        <Icon icon={"compress"} />
      </ControlButton>
      <ControlButton onClick={toggleSnakeLayout}>s</ControlButton>
    </Controls>
  );
};

export default GraphControls;
