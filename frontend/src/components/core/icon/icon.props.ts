import type React from "react";

import type * as icons from "./icons";
import type { Color } from "../../../theme";

export type IconType = keyof typeof icons;
export type DefaultColoredIconType =
  | "complete"
  | "incomplete"
  | "failed"
  | "outdated";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: IconType;
  color?: Color;

  /** If set to `true`, displays a different sized icon. */
  isSmall?: boolean;
  isBig?: boolean;
  isDisabled?: boolean;
}

export interface IconButtonProps extends IconProps {
  hoverColor?: Color;
}
