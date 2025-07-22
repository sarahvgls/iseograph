import type { NodeProps } from "@xyflow/react";
import { nodeTypes, type nodeWidthModes } from "../../theme/types.tsx";

export interface SequenceNodeProps extends NodeProps {
  label: string;
  position: { x: number; y: number };
  data: {
    sequence: string;
    intensity: number;
    feature: string;
    positionIndex: number;
    intensityRank: number;
    isReversed?: boolean;
    nodeWidthMode: nodeWidthModes; // mode for this node, can be overridden by the store
    peptides?: string[];
    peptidesString: string;
  };
  id: string;
  type: typeof nodeTypes.SequenceNode;
  parentId?: string; // optional, used for grouping nodes in layouts
  extent?: "parent"; // optional, used for grouping nodes in layouts
}
