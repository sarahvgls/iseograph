export const nodeWidthModes = {
  Collapsed: "collapsed",
  Expanded: "expanded",
} as const;

export type nodeWidthModes =
  (typeof nodeWidthModes)[keyof typeof nodeWidthModes];
