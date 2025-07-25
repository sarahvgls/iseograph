import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
  labelVisibilities,
  layoutModes,
  localStorageKeys,
  nodeTypes,
  nodeWidthModes,
  type PeptideLog,
} from "../../theme/types.tsx";
import { theme } from "../../theme";
import useGraphStore from "../store.ts";
import { convertStringsToPeptideLog } from "./peptide-conversion.tsx";

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
): [SequenceNodeProps[], number, string[], Record<string, PeptideLog>] => {
  const startNode = nodes.find((node) => node.data.sequence === "__start__");
  const intensitySources = convertStringToList(
    startNode?.data.intensitiesString || "",
  );

  // map node id to peptideLogs
  let peptidesDict: Record<string, PeptideLog> = {};

  //
  const newNodes = nodes.map((node) => {
    const peptides = convertStringToList(node.data.peptidesString);
    const intensities = convertStringToList(node.data.intensitiesString || "");
    const peptideLog = convertStringsToPeptideLog(
      intensitySources,
      peptides,
      node,
    );

    peptidesDict[node.id] = peptideLog;

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
        peptideLogs: peptideLog,
      },
    };
  });

  // iterate over all nodes and calculate the maximum number of peptides
  let maxPeptides = 0;
  newNodes.map((node) => {
    maxPeptides = Math.max(maxPeptides, node.data.peptides.length);
  });

  return [newNodes, maxPeptides, intensitySources, peptidesDict];
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
): [ArrowEdgeProps[], number] => {
  const isoformsToColors = generateIsoformColorMatching(edges);
  let maxPeptides = 0;

  const newEdges = edges.map((edge) => {
    const peptides = convertStringToList(edge.data.peptidesString || "");
    const intensities = convertStringToList(edge.data.intensitiesString || "");
    const peptideLog = convertStringsToPeptideLog(
      intensitySources,
      peptides,
      undefined,
      edge,
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
        peptideLogs: peptideLog,
      },
    };
  });

  newEdges.map((edge) => {
    maxPeptides = Math.max(maxPeptides, edge.data.peptides.length);
  });

  return [newEdges, maxPeptides];
};

export const applyLocalStorageValues = (
  setSelectedFile: (file: string) => void,
) => {
  for (const key of Object.values(localStorageKeys)) {
    switch (key) {
      // special values
      case localStorageKeys.selectedFile:
        setSelectedFile(
          localStorage.getItem(localStorageKeys.selectedFile) || "",
        );
        break;
      case localStorageKeys.layoutMode: {
        const savedLayoutMode = localStorage.getItem(
          localStorageKeys.layoutMode,
        ) as layoutModes;
        if (
          savedLayoutMode &&
          Object.values(layoutModes).includes(savedLayoutMode)
        ) {
          useGraphStore.setState({ layoutMode: savedLayoutMode });
        }
        break;
      }
      case localStorageKeys.nodeWidthMode: {
        const savedNodeWidthMode = localStorage.getItem(
          localStorageKeys.nodeWidthMode,
        ) as nodeWidthModes;
        if (
          savedNodeWidthMode &&
          Object.values(nodeWidthModes).includes(savedNodeWidthMode)
        ) {
          useGraphStore.setState({ nodeWidthMode: savedNodeWidthMode });
        }
        break;
      }
      case localStorageKeys.labelVisibility: {
        const savedLabelVisibility = localStorage.getItem(
          localStorageKeys.labelVisibility,
        );
        if (
          savedLabelVisibility &&
          Object.values(labelVisibilities).includes(savedLabelVisibility)
        ) {
          useGraphStore.setState({ labelVisibility: savedLabelVisibility });
        }
        break;
      }
      case localStorageKeys.peptideColorScale: {
        const savedPeptideColorScale = localStorage.getItem(
          localStorageKeys.peptideColorScale,
        );
        if (savedPeptideColorScale) {
          useGraphStore.setState({ colorScale: savedPeptideColorScale });
        }
        break;
      }

      // boolean values
      case localStorageKeys.allowInteraction:
      case localStorageKeys.reverseNodes: {
        const savedBooleanValue = localStorage.getItem(key);
        try {
          if (savedBooleanValue) {
            useGraphStore.setState({ [key]: savedBooleanValue === "true" });
          }
        } catch (error) {
          console.error(
            `Error parsing local storage value for ${key}: ${error}`,
          );
        }
        break;
      }
      case localStorageKeys.isAnimated: {
        const savedIsAnimated = localStorage.getItem(
          localStorageKeys.isAnimated,
        );
        if (savedIsAnimated) {
          // different from the other boolean values due to rerendering of edges if animation changes
          useGraphStore.getState().setIsAnimated(savedIsAnimated === "true");
        }
        break;
      }

      // numeric values
      case localStorageKeys.rowWidth:
      case localStorageKeys.numberOfAllowedIsoforms: {
        const savedNumericValue = localStorage.getItem(key);
        if (savedNumericValue) {
          const parsedValue = parseInt(savedNumericValue, 10);
          if (!isNaN(parsedValue)) {
            useGraphStore.setState({ [key]: parsedValue });
          } else {
            console.error(`Error parsing local storage value for ${key}`);
          }
        }
        break;
      }

      // JSON values
      case localStorageKeys.selectedIsoforms:
      case localStorageKeys.isoformColorMapping: {
        const selectedJSONValue = localStorage.getItem(key);
        if (selectedJSONValue) {
          try {
            const parsedJSONValue = JSON.parse(selectedJSONValue);
            useGraphStore.setState({ [key]: parsedJSONValue });
          } catch (error) {
            console.error(
              `Error parsing local stoarge value for ${key}: ${error}`,
            );
          }
        }
      }
    }
  }
};
