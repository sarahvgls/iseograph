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
};

// --- edge related ---
export const Generic = {
  variant: "VARIANT",
  mutagen: "MUTAGEN",
  conflict: "CONFLICT",
};

export type Generic = (typeof Generic)[keyof typeof Generic];

export const labelVisibility = {
  onHover: "onHover",
  always: "always",
};

export type labelVisibility =
  (typeof labelVisibility)[keyof typeof labelVisibility];
