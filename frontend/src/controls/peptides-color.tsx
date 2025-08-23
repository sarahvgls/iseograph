import {
  ColorScaleOptions,
  type colorScaleOptions,
  type Extremes,
  type ExtremesBySource,
  glowMethods,
  intensityMethods,
  type IntensityStats,
  type PeptideLog,
} from "../theme/types.tsx";
import useGraphStore from "../graph/store.ts";
import { theme } from "../theme";

export const getColor = (
  i: number,
  n: number,
  selectedColorScale: colorScaleOptions,
  opacity: number = 1,
): string => {
  if (i === 0 && !useGraphStore.getState().zeroValuesPeptides) {
    return `hsla(0, 0%, 0%, 0.0)`; // No color for no peptides
  }
  if (selectedColorScale === ColorScaleOptions.blueOrange) {
    return `hsla(${240 - (i / n) * 210}, 100%, 50%, ${opacity})`; // blue-orange version
  } else if (selectedColorScale === ColorScaleOptions.greenRed) {
    return `hsla(${(i / n) * 120}, 100%, 50%, ${opacity})`; // green-red version
  } else if (selectedColorScale === ColorScaleOptions.grayBlack) {
    return `hsla(0, 0%, ${90 - (i / n) * 100}%, ${opacity})`; // gray to black version
  } else if (selectedColorScale === ColorScaleOptions.lightRedDarkRed) {
    return `hsla(0, 100%, ${80 - (i / n) * 60}%, ${opacity})`; // light red to dark red
  } else if (selectedColorScale === ColorScaleOptions.yellowPurple) {
    return `hsla(${280 - (1 - i / n) * 220}, 100%, 50%, ${opacity})`; // yellow to purple
  } else if (selectedColorScale === ColorScaleOptions.tealCoral) {
    return `hsla(${180 - (i / n) * 150}, 100%, 50%, ${opacity})`; // teal to coral
  } else if (
    selectedColorScale === ColorScaleOptions.saturatedDesaturatedBlue
  ) {
    return `hsla(220, ${100 - (i / n) * 70}%, 50%, ${opacity})`; // saturated blue to desaturated blue
  } else if (selectedColorScale === ColorScaleOptions.lightGreenDarkTeal) {
    return `hsla(${120 + (i / n) * 30}, 100%, ${70 - (i / n) * 40}%, ${opacity})`; // light green to dark teal
  } else {
    return `hsla(0, 0%, 0%, 0.0)`; // Default color if no valid scale is selected
  }
};

const colorByIntensity = (
  colorScale: colorScaleOptions,
  opacity: number,
  intensityStats: IntensityStats,
  method: intensityMethods,
  extremes: Extremes,
) => {
  let value = 0;
  let maxValue = 1;

  if (
    intensityStats === ({} as IntensityStats) ||
    extremes === ({} as Extremes)
  ) {
    return getColor(0, 0, ColorScaleOptions.disabled, 0.0);
  }

  if (method === intensityMethods.max) {
    value = intensityStats.normalizedMax as number;
    maxValue = extremes.normalizedMax;
  } else if (method === intensityMethods.min) {
    value = intensityStats.normalizedMin as number;
    maxValue = extremes.normalizedMinMax;
  } else if (method === intensityMethods.median) {
    value = intensityStats.normalizedMedian as number;
    maxValue = extremes.normalizedMedian;
  } else if (method === intensityMethods.mean) {
    value = intensityStats.normalizedMean as number;
    maxValue = extremes.normalizedMean;
  }

  return getColor(value, maxValue > 0 ? maxValue : 1, colorScale, opacity);
};

export const calculatedPeptideColor = (
  colorScale: colorScaleOptions,
  opacity: number,
  type: glowMethods,
  // needed for count type
  numberOfPeptides?: number,
  maxPeptides?: number,
  // needed for intensity type
  extremes?: ExtremesBySource,
  method?: intensityMethods,
  source?: string,
  peptideLog?: PeptideLog,
): string => {
  if (
    (peptideLog === undefined && type === glowMethods.intensity) ||
    (method === undefined && type === glowMethods.intensity)
  ) {
    throw new Error(
      "There was an error calculating the color. Please check metadata.",
    );
  }
  if (type === glowMethods.count) {
    if (numberOfPeptides === undefined || maxPeptides === undefined) {
      throw new Error(
        "Number of peptides and max peptides must be provided for count type",
      );
    }
    return getColor(numberOfPeptides, maxPeptides, colorScale, opacity);
  } else if (type === glowMethods.intensity) {
    let validStats = {} as IntensityStats;
    let validExtremes = {} as Extremes;
    if (source !== undefined) {
      validStats = peptideLog?.intensityStats[source] as IntensityStats;
    }
    if (extremes![source!] !== undefined) {
      validExtremes = extremes![source!] as Extremes;
    }

    return colorByIntensity(
      colorScale,
      opacity,
      validStats,
      method!,
      validExtremes,
    );
  } else {
    throw new Error("Not implemented yet");
  }
};

export const edgePeptideColor = (
  colorScale: colorScaleOptions,
  type: glowMethods,
  // needed for type count
  numberOfPeptides: number,
  maxPeptides: number,
  // needed for type intensity
  extremes: ExtremesBySource,
  method?: intensityMethods,
  source?: string,
  peptideLog?: PeptideLog,
): string => {
  if (
    maxPeptides === 0 ||
    colorScale === ColorScaleOptions.disabled ||
    (type === glowMethods.intensity &&
      (peptideLog === undefined ||
        method === undefined ||
        source === undefined))
  ) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(
    colorScale,
    theme.edgeGlow.edgeOpacity,
    type,
    numberOfPeptides,
    maxPeptides,
    extremes,
    method,
    source,
    peptideLog,
  );
};

export const nodePeptideColor = (
  colorScale: colorScaleOptions,
  type: glowMethods,
  // needed for type count
  numberOfPeptides: number,
  maxPeptides: number,
  // needed for type intensity
  extremes: ExtremesBySource,
  method?: intensityMethods,
  source?: string,
  peptideLog?: PeptideLog,
): string => {
  if (
    maxPeptides === 0 ||
    colorScale === ColorScaleOptions.disabled ||
    (type === glowMethods.intensity &&
      (peptideLog === undefined ||
        method === undefined ||
        source === undefined))
  ) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(
    colorScale,
    theme.edgeGlow.nodeOpacity,
    type,
    numberOfPeptides,
    maxPeptides,
    extremes,
    method,
    source,
    peptideLog,
  );
};
