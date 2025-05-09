import { Handle, type NodeProps, Position } from "@xyflow/react"; //changed to type NodeProps? is that correct?
import styled from "styled-components";

export type NodeData = {
  label: string;
  position: { x: number; y: number };
  data: { sequence: string; intensity: number };
  id: string;
};

const StyledNode = styled.div`
  background: #fff;
  border-radius: 5px;
  padding: 10px;
  border: 1px solid #222;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// const Bar = styled.div<{ intensity: number }>`
//     width: 100%;
//     height: 10px;
//     background-color: #ddd;
//     border-radius: 5px;
//     margin-top: 5px;
//     position: relative;
//     overflow: hidden;
//
//     &::after {
//       content: '';
//       position: absolute;
//       top: 0;
//       left: 0;
//       height: 100%;
//       width: ${(props) => props.intensity * 10}%;
//       background-color: #007bff;
//       transition: width 0.3s ease-in-out;
//     }
// `;

// create a bar that takes the intensity and creates a bar-chart like bar horizontal bar
const Bar = styled.div<{ intensity: number }>`
  width: 10%;
  height: ${(props) => props.intensity * 100}px;
  background-color: #ddd;
  border-radius: 5px;
  margin: 5px auto 0 auto; /* Top margin and horizontal centering */
  position: relative;
  overflow: hidden;
  transition: height 0.3s ease-in-out;
`;

const StyledHandle = styled(Handle)`
  background: #222;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 1;
`;

// const handleLeftStyle = {top: -50};
// const handleRightStyle = { right: 10 };

export const CustomNode = ({ data }: NodeProps<NodeData>) => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Bar on top */}
      <Bar intensity={data.intensity} />

      {/* Node box with handles */}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        {/* Left Handle (centered relative to node box only) */}
        <StyledHandle
          type="target"
          position={Position.Left}
          style={{
            position: "absolute",
            left: "-10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        {/* Node content box */}
        <div
          style={{
            border: "1px solid black",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <StyledNode>
            <p>{data.sequence}</p>
          </StyledNode>
        </div>

        {/* Right Handle (centered relative to node box only) */}
        <StyledHandle
          type="source"
          position={Position.Right}
          style={{
            position: "absolute",
            right: "-10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
};
