import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import type { Node } from "@xyflow/react";

// --- settings ---
export type NodeTypes = SequenceNodeProps | Node;

export const nodeTypes = {
  SequenceNode: "custom",
  RowNode: "row",
} as const;

export const nodeWidthModes = {
  Collapsed: "collapsed", // no sequence visible
  Small: "small", // long nodes become scrollable
  Expanded: "expanded", // all sequence visible
} as const;

export type nodeWidthModes =
  (typeof nodeWidthModes)[keyof typeof nodeWidthModes];

export const layoutModes = {
  Basic: "linear",
  Snake: "snake",
};

export type layoutModes = (typeof layoutModes)[keyof typeof layoutModes];

// --- edge related ---
export const Generic = {
  variant: "VARIANT",
  mutagen: "MUTAGEN",
  conflict: "CONFLICT",
};

export type Generic = (typeof Generic)[keyof typeof Generic];

export const labelVisibilities = {
  onHover: "onHover",
  always: "always",
};

export type labelVisibilities =
  (typeof labelVisibilities)[keyof typeof labelVisibilities];

export const glowMethods = {
  intensity: "intensity",
  count: "count",
};

export type glowMethods = (typeof glowMethods)[keyof typeof glowMethods];

export const intensityMethods = {
  median: "median",
  mean: "mean",
  max: "max",
  min: "min",
};

export type intensityMethods =
  (typeof intensityMethods)[keyof typeof intensityMethods];

export interface IntensitiesPerPeptide {
  // per node there may be multiple peptides, each having multiple intensities from different sources
  source: string;
  intensity: number;
}

export interface PeptideEntry {
  peptide: string;
  intensities: IntensitiesPerPeptide[];
}

export interface IntensityStats {
  // per node there shall be one work-by intensity which is based on the median/mean/max/min intensity of all peptides.
  // this is still constrained by its source
  median: number;
  mean: number;
  max: number;
  min: number;
  normalizedMedian?: number;
  normalizedMean?: number;
  normalizedMax?: number;
  normalizedMin?: number;
  overallMax?: number;
  overallMin?: number;
  normalizedOverallMax?: number;
  normalizedOverallMin?: number;
}

export type IntensityStatsBySource = Record<string, IntensityStats>;

export interface PeptideLog {
  peptideEntries: PeptideEntry[];
  intensityStats: IntensityStatsBySource;
}

export interface Extremes {
  min: number;
  max: number;
  median: number;
  mean: number;
  minMax: number;
}

export type ExtremesBySource = Record<string, Extremes>;

export const ColorScaleOptions = {
  blueOrange: "blue-orange",
  greenRed: "green-red",
  yellowPurple: "yellow-purple",
  tealCoral: "teal-coral",
  grayBlack: "gray-black",
  lightRedDarkRed: "light-red-dark-red",
  saturatedDesaturatedBlue: "saturated-desaturated-blue",
  lightGreenDarkTeal: "light-green-dark-teal",
  disabled: "Disabled",
};

export type colorScaleOptions =
  (typeof ColorScaleOptions)[keyof typeof ColorScaleOptions];

// --- local storage saving related

export const localStorageKeys = {
  nodeWidthMode: "nodeWidthMode",
  layoutMode: "layoutMode",
  isAnimated: "isAnimated",
  allowInteraction: "allowInteraction",
  reverseNodes: "reverseNodes",
  numberOfAllowedIsoforms: "numberOfAllowedIsoforms",
  rowWidth: "rowWidth",
  labelVisibility: "labelVisibility",
  selectedIsoforms: "selectedIsoforms",
  isoformColorMapping: "isoformColorMapping",
  selectedFile: "selectedFile",
  newProteinName: "newProteinName",
  colorScale: "colorScale",
  glowMethod: "glowMethod",
  intensityMethod: "intensityMethod",
  intensitySource: "intensitySource",
  zeroValuesPeptides: "zeroValuesPeptides",
};

export const settingsKeysToTypes: Record<string, any> = {
  nodeWidthMode: nodeWidthModes,
  layoutMode: layoutModes,
  isAnimated: "boolean",
  allowInteraction: "boolean",
  reverseNodes: "boolean",
  numberOfAllowedIsoforms: "number",
  rowWidth: "number",
  labelVisibility: labelVisibilities,
  selectedIsoforms: "JSON",
  isoformColorMapping: "JSON",
  selectedFile: "string",
  newProteinName: "string",
  colorScale: ColorScaleOptions,
  glowMethod: glowMethods,
  intensityMethod: intensityMethods,
  intensitySource: "string",
  zeroValuesPeptides: "boolean",
};
