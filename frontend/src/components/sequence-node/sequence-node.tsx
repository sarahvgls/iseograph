import {
  Handle,
  type NodeProps,
  NodeToolbar,
  Position,
  useStore,
} from "@xyflow/react"; //changed to type NodeProps? is that correct?
import styled from "styled-components";
import type { SequenceNodeProps } from "./sequence-node.props.tsx";
import { theme } from "../../theme";
import { SequenceContainer } from "./sequence-container/sequence-container.tsx";
import useGraphStore, { type RFState } from "../../graph/store.ts";
import { shallow } from "zustand/vanilla/shallow";
import { nodeWidthModes } from "../../theme/types.tsx";

const selector = (state: RFState) => ({
  nodeWidthMode: state.nodeWidthMode,
});

const NodeWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
`;

const StyledNode = styled.div`
  background: #fff;
  border-radius: 5px;
  border: 1px solid #222;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Bar = styled.div<{ $intensity: number }>`
  width: 10%;
  height: ${({ $intensity }) => $intensity * 100}px;
  background-color: #ddd;
  border-radius: 5px;
  margin: 5px auto 0 auto; /* Top margin and horizontal centering */
  position: relative;
  overflow: hidden;
  transition: height 0.3s ease-in-out;
`;

const StyledHandle = styled(Handle)`
  background: #222;
  width: 3px;
  height: 3px;
  position: relative;
  z-index: 1;
  top: 50%;
`;

const useZoom = () => useStore((store) => store.transform[2]); // [x, y, zoom]

function SequenceNode({ data }: NodeProps<SequenceNodeProps>) {
  const { nodeWidthMode } = useGraphStore(selector, shallow);
  const width = theme.offsets.defaultWidthCollapsed // TODO what happens here
    ? data.sequence.length * 10 + 100
    : theme.offsets.defaultLength; // 10 is the approximated width of each character, plus 50px on each side

  // values for invisible bounding box scale
  const zoom = useZoom();
  const scale = 1 / Math.max(zoom, 0.05);
  const size = 50;
  const hitboxHeight = size * scale * 2;
  const hitboxWidth = width;

  return (
    <div>
      <div
        style={{
          position: "absolute",
          top: `calc(50% - ${hitboxHeight / 2}px)`,
          left: `calc(50% - ${hitboxWidth / 2}px)`,
          width: hitboxWidth,
          height: hitboxHeight,
          backgroundColor: "transparent",
          zIndex: 0,
        }}
      />

      <NodeToolbar isVisible={true} position={Position.Top}>
        <div
          style={{ backgroundColor: "#000", width: "10px", height: "10px" }}
        ></div>
        <Bar $intensity={data.intensity} />
      </NodeToolbar>

      <NodeWrapper>
        <StyledHandle type="target" position={Position.Left} />
        <StyledNode>
          <SequenceContainer
            sequence={data.sequence}
            collapsed={nodeWidthMode == nodeWidthModes.Collapsed}
          />
        </StyledNode>
        <StyledHandle type="source" position={Position.Right} />
      </NodeWrapper>
    </div>
  );
}

export default SequenceNode;
