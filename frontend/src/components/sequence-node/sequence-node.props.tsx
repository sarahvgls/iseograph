import type { NodeProps } from "@xyflow/react";
import { nodeTypes } from "../../theme/types.tsx";

export interface SequenceNodeProps extends NodeProps {
  label: string;
  position: { x: number; y: number };
  data: {
    sequence: string;
    intensity: number;
    visualWidth: number; // grows with each amino acid, is limited if nodes are collapsed
    feature: string;
    positionIndex: number;
    intensityRank: number;
    isReversed?: boolean;
  };
  id: string;
  type: typeof nodeTypes.SequenceNode;
  parentId?: string; // optional, used for grouping nodes in layouts
  extent?: "parent"; // optional, used for grouping nodes in layouts
}
