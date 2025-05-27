import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import type { Node } from "@xyflow/react";

export type NodeTypes = SequenceNodeProps | Node;

export const nodeTypes = {
  SequenceNode: "custom",
  GroupNode: "group",
} as const;

export const nodeWidthModes = {
  Collapsed: "collapsed",
  Expanded: "expanded",
} as const;

export type nodeWidthModes =
  (typeof nodeWidthModes)[keyof typeof nodeWidthModes];

export const layoutModes = {
  Basic: "basic",
  Snake: "snake",
};

export type layoutModes = (typeof layoutModes)[keyof typeof layoutModes];
