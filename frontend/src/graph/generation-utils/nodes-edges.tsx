import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
  type ExtremesBySource,
  nodeTypes,
  nodeWidthModes,
  type PeptideLog,
} from "../../theme/types.tsx";
import { theme } from "../../theme";
import {
  convertStringsToPeptideLog,
  normalize,
  updateExtremes,
} from "./peptide-conversion.tsx";

// --- Helper Functions ---
const convertStringToList = (input: string): string[] => {
  // split string at commas and trim whitespace
  if (!input) return [];
  const stringList = input
    .replace(/[()]/g, "")
    .split(",")
    .map((input) => input.trim());
  const cleanedStringList = stringList.filter(
    (item) => item.toLowerCase() !== "none",
  );
  return cleanedStringList;
};

// --- Nodes ---
// create nodes of type sequence node for each node in the nodes.json file
export const createNodes = (
  nodes: SequenceNodeProps[],
): [
  SequenceNodeProps[],
  number,
  ExtremesBySource,
  string[],
  Record<string, PeptideLog>,
] => {
  const startNode = nodes.find((node) => node.data.sequence === "__start__");
  const intensitySources = convertStringToList(
    startNode?.data.intensitiesString || "",
  );

  // map node id to peptideLogs
  let peptidesDict: Record<string, PeptideLog> = {};

  let intensityExtremesBySource: ExtremesBySource = {};
  intensitySources.forEach((source) => {
    intensityExtremesBySource[source] = {
      min: Infinity,
      max: -Infinity,
      median: -Infinity,
      mean: -Infinity,
      minMax: -Infinity,
    };
  });

  const newNodes = nodes.map((node) => {
    const peptides = convertStringToList(node.data.peptidesString);
    const intensities = convertStringToList(node.data.intensitiesString || "");
    const peptideLog: PeptideLog = convertStringsToPeptideLog(
      intensitySources,
      peptides,
      node,
    );

    // update overall intensity extremes
    intensityExtremesBySource = updateExtremes(
      intensitySources,
      peptideLog,
      intensityExtremesBySource,
    );

    return {
      ...node,
      type: nodeTypes.SequenceNode,
      data: {
        ...node.data,
        sequence: node.data.sequence,
        feature: node.data.feature,
        nodeWidthMode: node.data.nodeWidthMode || nodeWidthModes.Collapsed, // default to Collapsed if not provided
        positionIndex: 0,
        intensityRank: 0,
        peptides: peptides,
        intensities: intensities,
        peptideLog: peptideLog,
      },
    };
  });

  // iterate over all nodes, normalize and calculate the maximum number of peptides
  let maxPeptides = 0;
  newNodes.map((node) => {
    peptidesDict[node.id] = normalize(
      intensitySources,
      intensityExtremesBySource,
      node,
    );
    maxPeptides = Math.max(maxPeptides, node.data.peptides.length);
  });

  return [
    newNodes,
    maxPeptides,
    intensityExtremesBySource,
    intensitySources,
    peptidesDict,
  ];
};

// --- Edges ---
export const generateIsoformColorMatching = (
  edges: ArrowEdgeProps[],
): Record<string, string> => {
  const isoformsSet = new Set<string>();
  edges.forEach((edge) => {
    if (edge.source === "n0" && edge.data.isoformString) {
      const isoforms = convertStringToList(edge.data.isoformString);
      isoforms.forEach((isoform) => isoformsSet.add(isoform));
    }
  });
  const isoformsColors: Record<string, string> = {};
  const colors = Object.values(theme.colors);
  let colorIndex = 0;
  isoformsSet.forEach((isoform) => {
    isoformsColors[isoform] = colors[colorIndex % colors.length];
    colorIndex++;
  });

  // Add a default color for no isoform
  isoformsColors["Default"] = theme.defaultColor;
  return isoformsColors;
};

export const createEdges = (
  edges: ArrowEdgeProps[],
  intensitySources: string[],
): [ArrowEdgeProps[], number, ExtremesBySource, Record<string, PeptideLog>] => {
  const isoformsToColors = generateIsoformColorMatching(edges);
  const peptidesDict: Record<string, PeptideLog> = {};

  let overallIntensityExtremesBySource: ExtremesBySource = {};
  intensitySources.forEach((source) => {
    overallIntensityExtremesBySource[source] = {
      min: Infinity,
      max: -Infinity,
      mean: -Infinity,
      median: -Infinity,
      minMax: -Infinity,
    };
  });

  const newEdges = edges.map((edge) => {
    const peptides = convertStringToList(edge.data.peptidesString || "");
    const intensities = convertStringToList(edge.data.intensitiesString || "");
    const peptideLog = convertStringsToPeptideLog(
      intensitySources,
      peptides,
      undefined,
      edge,
    );

    // update overall intensity extremes
    overallIntensityExtremesBySource = updateExtremes(
      intensitySources,
      peptideLog,
      overallIntensityExtremesBySource,
    );

    return {
      ...edge,
      type: "arrow",
      animated: false,
      label: edge.data.generic || "none",
      data: {
        ...edge.data,
        isoforms: convertStringToList(edge.data.isoformString || ""),
        isoformsToColors: isoformsToColors || [],
        generic: edge.data.generic || "",
        peptides: peptides,
        intensities: intensities,
        peptideLog: peptideLog,
      },
    };
  });

  let maxPeptides = 0;

  newEdges.map((edge) => {
    peptidesDict[edge.id] = normalize(
      intensitySources,
      overallIntensityExtremesBySource,
      undefined,
      edge,
    );

    maxPeptides = Math.max(maxPeptides, edge.data.peptides.length);
  });

  return [
    newEdges,
    maxPeptides,
    overallIntensityExtremesBySource,
    peptidesDict,
  ];
};
