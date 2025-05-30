import type { NodeProps } from "@xyflow/react";
import type { SnakeRowProps } from "./snake-row.props.tsx";
import styled from "styled-components";

const RowDiv = styled.div`
  display: inline-block;
`;

function SnakeRow({}: NodeProps<SnakeRowProps>) {
  // adapt width to content of group-node
}

export default SnakeRow;
