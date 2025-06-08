import type { NodeProps } from "@xyflow/react";

export interface SnakeRowProps extends NodeProps {
  label: string;
  position: { x: number; y: number };
  id: string;
}
