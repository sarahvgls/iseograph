export const ColorScaleOptions = {
  blueOrange: "blue-orange",
  greenRed: "green-red",
  grayBlack: "gray-black",
  lightRedDarkRed: "light-red-dark-red",
  yellowPurple: "yellow-purple",
  tealCoral: "teal-coral",
  saturatedDesaturatedBlue: "saturated-desaturated-blue",
  lightGreenDarkTeal: "light-green-dark-teal",
  disabled: "Disabled",
};

export type colorScaleOptions =
  (typeof ColorScaleOptions)[keyof typeof ColorScaleOptions];

export const calculatedPeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
  selectedColorScale: colorScaleOptions,
): string => {
  if (selectedColorScale === ColorScaleOptions.blueOrange) {
    return `hsl(${240 - (numberOfPeptides / maxPeptides) * 210}, 100%, 50%)`; // blue-orange version
  } else if (selectedColorScale === ColorScaleOptions.greenRed) {
    return `hsl(${(numberOfPeptides / maxPeptides) * 120}, 100%, 50%)`; // green-red version
  } else if (selectedColorScale === ColorScaleOptions.grayBlack) {
    return `hsl(0, 0%, ${60 - (numberOfPeptides / maxPeptides) * 70}%)`; // gray to black version
  } else if (selectedColorScale === ColorScaleOptions.lightRedDarkRed) {
    return `hsl(0, 100%, ${80 - (numberOfPeptides / maxPeptides) * 60}%)`; // light red to dark red
  } else if (selectedColorScale === ColorScaleOptions.yellowPurple) {
    return `hsl(${280 - (1 - numberOfPeptides / maxPeptides) * 220}, 100%, 50%)`; // yellow to purple
  } else if (selectedColorScale === ColorScaleOptions.tealCoral) {
    return `hsl(${180 - (numberOfPeptides / maxPeptides) * 150}, 100%, 50%)`; // teal to coral
  } else if (
    selectedColorScale === ColorScaleOptions.saturatedDesaturatedBlue
  ) {
    return `hsl(220, ${100 - (numberOfPeptides / maxPeptides) * 70}%, 50%)`; // saturated blue to desaturated blue
  } else if (selectedColorScale === ColorScaleOptions.lightGreenDarkTeal) {
    return `hsl(${120 + (numberOfPeptides / maxPeptides) * 30}, 100%, ${70 - (numberOfPeptides / maxPeptides) * 40}%)`; // light green to dark teal
  } else {
    return `hsla(0, 0%, 0%, 0.0)`; // Default color if no valid scale is selected
  }
};

export const edgePeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
  colorScale: colorScaleOptions,
): string => {
  if (maxPeptides === 0 || colorScale === ColorScaleOptions.disabled) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(numberOfPeptides, maxPeptides, colorScale)
    .replace("hsl", "hsla")
    .replace(")", ", 0.1)");
};

export const nodePeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
  colorScale: colorScaleOptions,
): string => {
  if (maxPeptides === 0 || colorScale === ColorScaleOptions.disabled) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(numberOfPeptides, maxPeptides, colorScale)
    .replace("hsl", "hsla")
    .replace(")", ", 0.2)");
};
