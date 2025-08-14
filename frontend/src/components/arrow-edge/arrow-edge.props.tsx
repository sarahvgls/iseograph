import type { EdgeProps } from "@xyflow/react";
import type { Generic, PeptideLog } from "../../theme/types.tsx";

export interface ArrowEdgeProps extends EdgeProps {
  data: {
    isoformsToColors?: Record<string, string>;
    isoforms?: string[];
    isoformString?: string;
    generic?: Generic;
    peptidesString?: string;
    intensitiesString?: string;
    peptideLog?: PeptideLog;
    peptideCount?: number;
    intensitySource?: string;
    isSecondary?: boolean; // indicates if this node is node of the secondary graph
  };
}
