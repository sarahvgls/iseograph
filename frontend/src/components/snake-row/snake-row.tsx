import type { NodeProps } from "@xyflow/react";
import type { SnakeRowProps } from "./snake-row.props.tsx";
import styled from "styled-components";

const RowDiv = styled.div`
  display: inline-block;
`;

function SnakeRow({ id }: NodeProps<SnakeRowProps>) {
  return (
    <RowDiv className={"snake-row-" + id}>
      <div className="snake-row__content">
        {/* Content of the snake row can be added here */}
      </div>
    </RowDiv>
  );
}

export default SnakeRow;
