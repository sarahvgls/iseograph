import {
  Handle,
  type NodeProps,
  NodeToolbar,
  Position,
  useStore,
  useUpdateNodeInternals,
} from "@xyflow/react"; //changed to type NodeProps? is that correct?
import styled from "styled-components";
import type { SequenceNodeProps } from "./sequence-node.props.tsx";
import { theme } from "../../theme";
import { SequenceContainer } from "./sequence-container/sequence-container.tsx";
import { memo, useEffect } from "react";

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

const StyledHandleRight = styled(Handle)`
  background: transparent;
  border-color: transparent;
  position: relative;
  z-index: 1;
  top: 50%;
  transform: translateX(-115%);
`;

const StyledHandleLeft = styled(Handle)`
  background: transparent;
  border-color: transparent;
  position: relative;
  z-index: 1;
  top: 50%;
  transform: translateX(+115%);
`;

const useZoom = () => useStore((store) => store.transform[2]); // [x, y, zoom]

const SequenceNode = memo(function SequenceNode({
  id,
  data,
  selected,
}: NodeProps<SequenceNodeProps>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const width = theme.offsets.defaultWidthCollapsed // TODO what happens here
    ? data.sequence.length * 10 + 100
    : theme.offsets.defaultLength; // 10 is the approximated width of each character, plus 50px on each side

  // values for invisible bounding box scale
  const zoom = useZoom();
  const scale = 1 / Math.max(zoom, 0.05);
  const size = 50;
  const hitboxHeight = size * scale * 2;
  const hitboxWidth = width;

  // Update node internals when isReversed changes DO NOT DELETE
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.isReversed, updateNodeInternals]);

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

      <NodeToolbar isVisible={false} position={Position.Top}>
        <div
          style={{ backgroundColor: "#000", width: "10px", height: "10px" }}
        ></div>
        <Bar $intensity={data.intensity} />
      </NodeToolbar>

      <NodeWrapper>
        <StyledHandleLeft
          type={data.isReversed ? "source" : "target"}
          position={Position.Left}
        />
        <StyledNode style={{ borderWidth: selected ? 5 : 1 }}>
          <SequenceContainer
            sequence={data.sequence}
            nodeWidthMode={data.nodeWidthMode}
          />
        </StyledNode>
        <StyledHandleRight
          type={data.isReversed ? "target" : "source"}
          position={Position.Right}
        />
      </NodeWrapper>
    </div>
  );
});

export default SequenceNode;
