import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import type { Node } from "@xyflow/react";

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
  Basic: "basic",
  Snake: "snake",
};

export type layoutModes = (typeof layoutModes)[keyof typeof layoutModes];
