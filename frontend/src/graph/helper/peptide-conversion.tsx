import type {
  IntensitiesPerPeptide,
  IntensityStatsBySource,
  PeptideEntry,
  PeptideLog,
} from "../../theme/types.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";

const convertIntensities = (
  intensityString: string, // (a1,b1),(a2,b2),... where numbers refers to the ith peptide, and letters to the jth source
  intensitySources: string[], // ordered list of source, refering to the jth souce in the intensity String
  indexOfPeptide: number, // refers to the ith peptide of that node/edge
): IntensitiesPerPeptide[] => {
  if (!intensityString) return [];
  // iterate of string parts that are encapsulated by ()
  const parts = intensityString.match(/\((.*?)\)/g);
  if (!parts) return [];
  const peptidePart = parts[indexOfPeptide];
  if (!peptidePart) return [];
  const intensities = peptidePart
    .replace(/[()]/g, "")
    .split(",")
    .map((item) => item.trim());
  return intensities.map((intensity, index) => {
    return {
      source: intensitySources[index] || "unknown",
      intensity: parseFloat(intensity) || -1, // default to -1 if parsing fails
    };
  });
};

export const convertStringsToPeptideLog = (
  intensitySources: string[],
  peptides: string[],
  node?: SequenceNodeProps,
  edge?: ArrowEdgeProps,
): PeptideLog => {
  if (!node && !edge) {
    throw new Error(
      "Either node or edge must be provided to convert peptides.",
    );
  }
  if (node && edge) {
    throw new Error("Both node and edge provided, please provide only one.");
  }

  const peptideEntries: PeptideEntry[] = [];

  peptides.map((peptide, index) => {
    const intensityString =
      (node && node.data.intensitiesString) ||
      (edge && edge.data.intensitiesString) ||
      "";
    const peptideIntensities: IntensitiesPerPeptide[] = convertIntensities(
      intensityString || "",
      intensitySources,
      index,
    );
    const peptideEntry: PeptideEntry = {
      peptide: peptide,
      intensities: peptideIntensities,
    };
    peptideEntries.push(peptideEntry);
  });

  // calculate median, mean, min and max
  const plainIntensitiesBySource: Record<string, number[]> =
    peptideEntries.reduce(
      (acc: Record<string, number[]>, entry) => {
        entry.intensities.forEach((intensity) => {
          if (!acc[intensity.source]) {
            acc[intensity.source] = [];
          }
          acc[intensity.source].push(intensity.intensity);
        });
        return acc;
      },
      {} as Record<string, number[]>,
    );

  const intensitiesAveraged: IntensityStatsBySource = {};
  for (const plainIntensitiesBySourceKey in plainIntensitiesBySource) {
    const values = plainIntensitiesBySource[plainIntensitiesBySourceKey];
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const median = values[Math.floor(values.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    intensitiesAveraged[plainIntensitiesBySourceKey] = {
      meanIntensity: mean,
      medianIntensity: median,
      minIntensity: min,
      maxIntensity: max,
    };
  }

  const peptideLog: PeptideLog = {
    peptideEntries: peptideEntries,
    intensities: intensitiesAveraged,
  };

  return peptideLog;
};
