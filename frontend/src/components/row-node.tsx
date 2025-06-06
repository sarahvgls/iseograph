import { memo } from "react";
import styled from "styled-components";
import type { NodeProps } from "@xyflow/react";

const RowNodeWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: transparent;
  border: none;
`;

const RowNode = memo(function RowNode({ id }: NodeProps) {
  return <RowNodeWrapper id={id} />;
});

export default RowNode;
