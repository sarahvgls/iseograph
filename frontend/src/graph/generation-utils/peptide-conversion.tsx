import type {
  ExtremesBySource,
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

  // calculate median, mean, min and max
  const intensitiesAveraged: IntensityStatsBySource = {};
  for (const plainIntensitiesBySourceKey in plainIntensitiesBySource) {
    const values = plainIntensitiesBySource[plainIntensitiesBySourceKey];
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const median = values[Math.floor(values.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    intensitiesAveraged[plainIntensitiesBySourceKey] = {
      mean: mean,
      median: median,
      min: min,
      max: max,
    };
  }

  return {
    peptideEntries: peptideEntries,
    intensityStats: intensitiesAveraged,
  };
};

export const updateExtremes = (
  intensitySources: string[],
  peptideLog: PeptideLog,
  extremes: ExtremesBySource,
): ExtremesBySource => {
  intensitySources.forEach((source) => {
    peptideLog.peptideEntries.forEach((entry) => {
      // find intensity of the current source
      const value = entry.intensities.find(
        (item) => item.source === source,
      )?.intensity;
      if (value === undefined) {
        throw new Error("Unexpected error while normalizing intensities.");
      }

      if (value < extremes[source].min) {
        extremes[source].min = value;
      }
      if (value > extremes[source].max) {
        extremes[source].max = value;
      }
    });
  });

  return extremes;
};

export const normalize = (
  intensitySources: string[],
  overallIntensityExtremesBySource: ExtremesBySource,
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

  intensitySources.forEach((source) => {
    const extremes = overallIntensityExtremesBySource[source];
    extremes.normalizedMax = extremes.max - extremes.min + 1;

    // cases no peptides
    if (node && node.data.peptideLog?.peptideEntries.length === 0) {
      node.data.peptideLog!.intensityStats[source] = {
        mean: 0,
        min: 0,
        max: 0,
        median: 0,
        normalizedMean: 0,
        normalizedMedian: 0,
        normalizedMin: 0,
        normalizedMax: 0,
      };
      return node.data.peptideLog;
    } else if (edge && edge.data.peptideLog?.peptideEntries.length === 0) {
      edge.data.peptideLog!.intensityStats[source] = {
        mean: 0,
        min: 0,
        max: 0,
        median: 0,
        normalizedMean: 0,
        normalizedMedian: 0,
        normalizedMin: 0,
        normalizedMax: 0,
      };
      return edge.data.peptideLog;
    }

    // cases at least one peptide
    const plainIntensitiesBySource: Record<string, number[]> = (
      (node && node.data.peptideLog?.peptideEntries) ||
      (edge && edge.data.peptideLog?.peptideEntries) ||
      []
    ).reduce(
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

    // normalize values by subtracting min
    const normalizedIntensities = plainIntensitiesBySource[source].map(
      (intensity) => {
        return intensity - extremes.min + 1;
      },
    );

    // calculate median, mean, min and max
    const mean =
      normalizedIntensities.reduce((sum, value) => sum + value, 0) /
      normalizedIntensities.length;
    const median =
      normalizedIntensities[Math.floor(normalizedIntensities.length / 2)];
    const min = Math.min(...normalizedIntensities);
    const max = Math.max(...normalizedIntensities);

    // update extremes
    if (median > extremes.normalizedMedian) {
      extremes.normalizedMedian = median;
    }
    if (mean > extremes.normalizedMean) {
      extremes.normalizedMean = mean;
    }
    if (min > extremes.normalizedMinMax) {
      extremes.normalizedMinMax = min;
    }

    if (node) {
      node.data.peptideLog!.intensityStats[source] = {
        ...node.data.peptideLog!.intensityStats[source],
        normalizedMean: mean,
        normalizedMedian: median,
        normalizedMin: min,
        normalizedMax: max,
      };
    } else if (edge) {
      edge.data.peptideLog!.intensityStats[source] = {
        ...edge.data.peptideLog!.intensityStats[source],
        normalizedMean: mean,
        normalizedMedian: median,
        normalizedMin: min,
        normalizedMax: max,
      };
    }
  });

  return (
    (node && node.data.peptideLog!) ||
    (edge && edge.data.peptideLog!) ||
    ({} as PeptideLog)
  );
};
