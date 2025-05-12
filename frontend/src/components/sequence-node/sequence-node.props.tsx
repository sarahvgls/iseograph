import type { NodeProps } from "@xyflow/react";

export interface SequenceNodeProps extends NodeProps {
  label: string;
  position: { x: number; y: number };
  data: { sequence: string; intensity: number; feature: string };
  id: string;
}
