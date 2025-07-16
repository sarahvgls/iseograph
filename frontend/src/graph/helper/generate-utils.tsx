import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import {
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
  setSelectedFile(localStorage.getItem(localStorageKeys.selectedFile) || "");

  const savedLayoutMode = localStorage.getItem(
    localStorageKeys.layoutMode,
  ) as layoutModes;
  if (savedLayoutMode && Object.values(layoutModes).includes(savedLayoutMode)) {
    useGraphStore.setState({ layoutMode: savedLayoutMode });
  }

  const savedNodeWidthMode = localStorage.getItem(
    localStorageKeys.nodeWidthMode,
  ) as nodeWidthModes;
  if (
    savedNodeWidthMode &&
    Object.values(nodeWidthModes).includes(savedNodeWidthMode)
  ) {
    useGraphStore.setState({ nodeWidthMode: savedNodeWidthMode });
  }

  const savedIsAnimated = localStorage.getItem(localStorageKeys.isAnimated);
  if (savedIsAnimated) {
    useGraphStore.getState().setIsAnimated(savedIsAnimated === "true");
  }

  const savedAllowInteraction = localStorage.getItem(
    localStorageKeys.allowInteraction,
  );
  if (savedAllowInteraction) {
    useGraphStore
      .getState()
      .setAllowInteraction(savedAllowInteraction === "true");
  }

  const selectedIsoforms = localStorage.getItem(
    localStorageKeys.selectedIsoforms,
  );
  if (selectedIsoforms) {
    try {
      const parsedSelection = JSON.parse(selectedIsoforms);
      useGraphStore.setState({ selectedIsoforms: parsedSelection });
    } catch (error) {
      console.error("Error parsing selected isoforms", error);
    }
  }

  const isoformColorMapping = localStorage.getItem(
    localStorageKeys.isoformColorMapping,
  );
  if (isoformColorMapping) {
    try {
      const parsedColorMapping = JSON.parse(isoformColorMapping);
      useGraphStore.setState({ isoformColorMapping: parsedColorMapping });
    } catch (error) {
      console.error("Error parsing isoform color mapping", error);
    }
  }
};
