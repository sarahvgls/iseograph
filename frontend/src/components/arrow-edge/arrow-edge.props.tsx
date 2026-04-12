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
    init_met?: boolean;
    signal?: boolean;
    cleaved?: boolean;
    cleaved_feature?: string;
  };
}
