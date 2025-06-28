import type { EdgeProps } from "@xyflow/react";
import type { Generic } from "../../theme/types.tsx";

export interface ArrowEdgeProps extends EdgeProps {
  data: {
    isoformsToColors?: Record<string, string>;
    isoforms?: string[];
    isoformString?: string;
    generic?: Generic;
  };
}
