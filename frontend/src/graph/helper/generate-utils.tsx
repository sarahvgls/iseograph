import type { ArrowEdgeProps } from "../../components/arrow-edge/arrow-edge.props.tsx";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { nodeTypes, nodeWidthModes } from "../../theme/types.tsx";
import { theme } from "../../theme";

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
