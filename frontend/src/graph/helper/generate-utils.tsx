import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
  labelVisibilities,
  layoutModes,
  localStorageKeys,
  nodeTypes,
  nodeWidthModes,
} from "../../theme/types.tsx";
import { theme } from "../../theme";
import useGraphStore from "../store.ts";

// --- Nodes ---
// create nodes of type sequence node for each node in the nodes.json file
export const createNodes = (
  nodes: SequenceNodeProps[],
): SequenceNodeProps[] => {
  return nodes.map((node) => ({
    ...node,
    type: nodeTypes.SequenceNode,
    data: {
      sequence: node.data.sequence,
      intensity: node.data.intensity,
      feature: node.data.feature,
      nodeWidthMode: node.data.nodeWidthMode || nodeWidthModes.Collapsed, // default to Collapsed if not provided
      positionIndex: 0,
      intensityRank: 0,
    },
  }));
};

// --- Edges ---
const convertIsoforms = (isoforms: string): string[] => {
  // split string at commas and trim whitespace
  if (!isoforms) return [];
  return isoforms.split(",").map((isoform) => isoform.trim());
};

export const generateIsoformColorMatching = (
  edges: ArrowEdgeProps[],
): Record<string, string> => {
  const isoformsSet = new Set<string>();
  edges.forEach((edge) => {
    if (edge.source === "n0" && edge.data.isoformString) {
      const isoforms = convertIsoforms(edge.data.isoformString);
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

export const createEdges = (edges: ArrowEdgeProps[]): ArrowEdgeProps[] => {
  const isoformsToColors = generateIsoformColorMatching(edges);

  return edges.map((edge) => ({
    ...edge,
    type: "arrow",
    animated: false,
    label: edge.data.generic || "none",
    data: {
      ...edge.data,
      isoforms: convertIsoforms(edge.data.isoformString || ""),
      isoformsToColors: isoformsToColors || [],
      generic: edge.data.generic || "",
    },
  }));
};

export const applyLocalStorageValues = (
  setSelectedFile: (file: string) => void,
) => {
  // iterate over localStorageKeys:
  for (const key of Object.values(localStorageKeys)) {
    switch (key) {
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
