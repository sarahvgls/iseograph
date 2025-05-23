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
