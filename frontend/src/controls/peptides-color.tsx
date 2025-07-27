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

export const getColor = (
  i: number,
  n: number,
  selectedColorScale: colorScaleOptions,
): string => {
  if (selectedColorScale === ColorScaleOptions.blueOrange) {
    return `hsl(${240 - (i / n) * 210}, 100%, 50%)`; // blue-orange version
  } else if (selectedColorScale === ColorScaleOptions.greenRed) {
    return `hsl(${(i / n) * 120}, 100%, 50%)`; // green-red version
  } else if (selectedColorScale === ColorScaleOptions.grayBlack) {
    return `hsl(0, 0%, ${60 - (i / n) * 70}%)`; // gray to black version
  } else if (selectedColorScale === ColorScaleOptions.lightRedDarkRed) {
    return `hsl(0, 100%, ${80 - (i / n) * 60}%)`; // light red to dark red
  } else if (selectedColorScale === ColorScaleOptions.yellowPurple) {
    return `hsl(${280 - (1 - i / n) * 220}, 100%, 50%)`; // yellow to purple
  } else if (selectedColorScale === ColorScaleOptions.tealCoral) {
    return `hsl(${180 - (i / n) * 150}, 100%, 50%)`; // teal to coral
  } else if (
    selectedColorScale === ColorScaleOptions.saturatedDesaturatedBlue
  ) {
    return `hsl(220, ${100 - (i / n) * 70}%, 50%)`; // saturated blue to desaturated blue
  } else if (selectedColorScale === ColorScaleOptions.lightGreenDarkTeal) {
    return `hsl(${120 + (i / n) * 30}, 100%, ${70 - (i / n) * 40}%)`; // light green to dark teal
  } else {
    return `hsla(0, 0%, 0%, 0.0)`; // Default color if no valid scale is selected
  }
};

const colorByIntensity = (
  colorScale: colorScaleOptions,
  intensityStats: IntensityStats,
  method: intensityMethods,
  extremes: Extremes,
) => {
  let value = 0;
  let maxValue = intensityStats.normalizedOverallMax || 1;

  if (method === intensityMethods.max) {
    value = intensityStats.normalizedMax as number;
  } else if (method === intensityMethods.min) {
    value = intensityStats.normalizedMin as number;
    maxValue = extremes.minMax;
  } else if (method === intensityMethods.median) {
    value = intensityStats.normalizedMedian as number;
    maxValue = extremes.median;
  } else if (method === intensityMethods.mean) {
    value = intensityStats.normalizedMean as number;
    maxValue = extremes.mean;
  }

  return getColor(value, maxValue, colorScale);
};

export const calculatedPeptideColor = (
  colorScale: colorScaleOptions,
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
    extremes === undefined ||
    (peptideLog === undefined && type === glowMethods.intensity) ||
    (source === undefined && type === glowMethods.intensity) ||
    (method === undefined && type === glowMethods.intensity)
  ) {
    throw new Error(
      "Number of peptides and max peptides must be provided for count type",
    );
  }
  if (type === glowMethods.count) {
    if (numberOfPeptides === undefined || maxPeptides === undefined) {
      throw new Error(
        "Number of peptides and max peptides must be provided for count type",
      );
    }
    return getColor(numberOfPeptides, maxPeptides, colorScale);
  } else if (type === glowMethods.intensity) {
    return colorByIntensity(
      colorScale,
      peptideLog!.intensityStats[source!] as IntensityStats,
      method!,
      extremes![source!] as Extremes,
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
  if (maxPeptides === 0 || colorScale === ColorScaleOptions.disabled) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(
    colorScale,
    type,
    numberOfPeptides,
    maxPeptides,
    extremes,
    method,
    source,
    peptideLog,
  )
    .replace("hsl", "hsla")
    .replace(")", ", 0.1)");
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
  if (maxPeptides === 0 || colorScale === ColorScaleOptions.disabled) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(
    colorScale,
    type,
    numberOfPeptides,
    maxPeptides,
    extremes,
    method,
    source,
    peptideLog,
  )
    .replace("hsl", "hsla")
    .replace(")", ", 0.2)");
};
