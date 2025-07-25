import type { EdgeProps } from "@xyflow/react";
import type { Generic, PeptideLog } from "../../theme/types.tsx";

export interface ArrowEdgeProps extends EdgeProps {
  data: {
    isoformsToColors?: Record<string, string>;
    isoforms?: string[];
    isoformString?: string;
    generic?: Generic;
    peptides?: string[];
    peptidesString?: string;
    intensities?: string[]; // not clean TODO
    intensitiesString?: string;
    peptideLogs?: PeptideLog;
  };
}
