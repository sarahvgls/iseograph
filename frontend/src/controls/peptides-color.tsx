export const calculatedPeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
): string => {
  // Calculate color based on the number of peptides in a color range between two contrary colors
  // Color gradient options - uncomment one to test
  //const result = `hsl(${240 - (numberOfPeptides / maxPeptides) * 210}, 100%, 50%)`; // blue-orange version
  //const result = `hsl(${(numberOfPeptides / maxPeptides) * 120}, 100%, 50%)`; // green-red version
  const result = `hsl(${(numberOfPeptides / maxPeptides) * 120}, 100%, ${30 + (1 - numberOfPeptides / maxPeptides) * 40}%)`; // green-red version with variable brightness
  //const result = `hsl(0, 0%, ${60 - (numberOfPeptides / maxPeptides) * 70}%)`; // gray to black version
  //const result = `hsl(0, 100%, ${80 - (numberOfPeptides / maxPeptides) * 60}%)`; // light red to dark red
  //const result = `hsl(${280 - (1 - numberOfPeptides / maxPeptides) * 220}, 100%, 50%)`; // yellow to purple
  //const result = `hsl(${180 - (numberOfPeptides / maxPeptides) * 150}, 100%, 50%)`; // teal to coral
  //const result = `hsl(220, ${100 - (numberOfPeptides / maxPeptides) * 70}%, 50%)`; // saturated blue to desaturated blue
  //const result = `hsl(${120 + (numberOfPeptides / maxPeptides) * 30}, 100%, ${70 - (numberOfPeptides / maxPeptides) * 40}%)`; // light green to dark teal

  return result;
};

export const edgePeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
): string => {
  if (maxPeptides === 0) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(numberOfPeptides, maxPeptides)
    .replace("hsl", "hsla")
    .replace(")", ", 0.1)");
};

export const nodePeptideColor = (
  numberOfPeptides: number,
  maxPeptides: number,
): string => {
  if (maxPeptides === 0) {
    return "hsla(0, 0%, 0%, 0.0)"; // No color for no peptides
  }
  return calculatedPeptideColor(numberOfPeptides, maxPeptides)
    .replace("hsl", "hsla")
    .replace(")", ", 0.2)");
};
