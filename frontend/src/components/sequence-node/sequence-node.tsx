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
import { memo, useEffect, useRef, useState } from "react";
import useGraphStore, { type RFState } from "../../graph/store.ts";

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

const DirectionArrow = styled.svg<{ $isReversed?: boolean }>`
  width: 100%;
  height: 10px;
  margin-top: 5px;
  transform: ${({ $isReversed }) => ($isReversed ? "rotate(180deg)" : "none")};
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

const selector = (state: RFState) => ({
  reverseNodes: state.reverseNodes,
});

const useZoom = () => useStore((store) => store.transform[2]); // [x, y, zoom]

const SequenceNode = memo(function SequenceNode({
  id,
  data,
  selected,
}: NodeProps<SequenceNodeProps>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { reverseNodes } = useGraphStore(selector);
  const [sequence, setSequence] = useState<string>(data.sequence);
  const width = theme.offsets.defaultWidthCollapsed // TODO what happens here
    ? data.sequence.length * 10 + 100
    : theme.offsets.defaultLength; // 10 is the approximated width of each character, plus 50px on each side

  // values for invisible bounding box scale
  const zoom = useZoom();
  const scale = 1 / Math.max(zoom, 0.05);
  const size = 50;
  const hitboxHeight = size * scale * 2;
  const hitboxWidth = width;

  // Update node internals when isReversed changes
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.isReversed, updateNodeInternals]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    //reverse data.sequence string char by char when data.isReveresed
    if (data.isReversed && reverseNodes) {
      const reversedSequence = data.sequence.split("").reverse().join("");
      setSequence(reversedSequence);
    } else {
      setSequence(data.sequence);
    }
  }, [data.sequence, data.isReversed]);

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
            sequence={sequence}
            nodeWidthMode={data.nodeWidthMode}
            containerWidthRef={containerRef! as React.RefObject<HTMLDivElement>}
          />
          <DirectionArrow
            $isReversed={data.isReversed && reverseNodes}
            viewBox={`0 0 ${Math.max(10, containerWidth)} 10`}
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="5"
              x2={Math.max(0, containerWidth - 5)}
              y2="5"
              stroke="#999"
              strokeWidth="1"
            />
            <polygon
              points={`${containerWidth - 5},5 ${containerWidth - 10},2 ${containerWidth - 10},8`}
              fill="#999"
            />
          </DirectionArrow>
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
