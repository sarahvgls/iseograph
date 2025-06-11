/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { useMultiRef } from "../../../hooks";
import {
  color,
  fontSize,
  fontWeight,
  opacity,
  radius,
  size,
  spacing,
} from "../../../theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css, styled } from "styled-components";

import { FocusOutline } from "../box";
import { Icon, iconColor, type IconType } from "../icon";
import { Text } from "../text";
import { Tooltip, useTooltipScheduling } from "../tooltip";
import {
  ButtonProps,
  ButtonRef,
  CSVButtonProps,
  StatusButtonProps,
  ToggleableButtonProps,
} from "./button.props";

const StyledButton = styled.button.withConfig({
  shouldForwardProp: (prop: string) =>
    ![
      "isDisabled",
      "isActive",
      "onlyIcon",
      "onlyText",
      "isShy",
      "isSmall",
    ].includes(prop.toString()),
})<
  Pick<ButtonProps, "iconRight" | "isDisabled" | "isShy" | "isSmall"> & {
    onlyIcon?: boolean;
    onlyText?: boolean;
  }
>`
  -webkit-tap-highlight-color: transparent;
  align-items: center;
  display: flex;
  gap: ${({ isSmall }) =>
    spacing(isSmall ? "smallButtonGap" : "buttonGap") as unknown as string};
  justify-content: ${({ iconRight }) =>
    iconRight ? "space-between" : "center"};
  position: relative;
  margin: 0;

  padding: ${({ isSmall, onlyIcon }) =>
    spacing(
      isSmall
        ? onlyIcon
          ? "smallButtonIconPadding"
          : "smallButtonPadding"
        : onlyIcon
          ? "buttonIconPadding"
          : "buttonPadding",
    )};

  ${({ iconRight, isSmall, onlyText }) =>
    !onlyText &&
    (iconRight
      ? css`
          padding-right: ${spacing(
            isSmall ? "smallButtonIconPadding" : "buttonIconPadding",
          )};
        `
      : css`
          padding-left: ${spacing(
            isSmall ? "smallButtonIconPadding" : "buttonIconPadding",
          )};
        `)}
  ${(props) =>
    props.isDisabled
      ? css`
          cursor: not-allowed;
        `
      : css`
          cursor: pointer;

          &:active > * {
            opacity: 1;
          }
        `}
    .text {
    font-size: ${({ isSmall }) => fontSize(isSmall ? "small" : "button")};
    font-weight: ${fontWeight("bold")};
    line-height: 16px;
    color: ${color("onPrimary")};
  }

  .icon {
    box-sizing: border-box;
    ${iconColor("onPrimary")}
  }

  :focus {
    .focus-outline {
      display: unset;
    }
  }
`;

const BaseButton = React.forwardRef<ButtonRef, ButtonProps>(function BaseButton(
  {
    "aria-label": ariaLabel,
    children,
    icon,
    pressedIcon,
    tag,
    tagTx,
    showTooltip: externalShowTooltip = true,
    tooltip,
    iconRight,
    anchorTooltipToMouse = true,
    tooltipPosition = "bottomRight",
    tooltipDistance = 13,
    tooltipPositionFocus = anchorTooltipToMouse ? "bottom" : tooltipPosition,
    tooltipDistanceFocus = 10,
    showTooltipImmediately,
    isDisabled,
    text,
    textStyle,
    isShy,
    isSmall,
    isBig,
    showFocusOutline = true,
    onPointerDown,
    onPointerEnter,
    onPointerLeave,
    onPointerUp,
    onKeyDown,
    onPress,
    ...rest
  },
  ref,
) {
  // Tooltip Scheduling

  const {
    handlePointerEnter: onEnter,
    handlePointerLeave: onLeave,
    showTooltip,
    mouseAnchor,
  } = useTooltipScheduling(anchorTooltipToMouse, showTooltipImmediately);

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent) => {
      onEnter();
      onPointerEnter?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    [onPointerEnter, onEnter],
  );
  const handlePointerLeave = useCallback(
    (event: React.PointerEvent) => {
      onLeave();
      onPointerLeave?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    [onPointerLeave, onLeave],
  );

  // Press Handling
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(event);
      if (!isDisabled && isPressed) onPress?.(event);
    },
    [onPointerUp, isDisabled, isPressed, onPress],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);

      if (event.key === "Enter") {
        setShowFocus(true);
        if (!isDisabled) onPress?.(event);
      }
    },
    [onKeyDown, isDisabled, onPress],
  );

  // Focus and pressed state handling
  const pressedPointerRef = useRef<number>();
  const [showFocus, setShowFocus] = useState(true);
  const handleGlobalPointerUp = useCallback((event: PointerEvent) => {
    if (event.pointerId !== pressedPointerRef.current) return;
    pressedPointerRef.current = undefined;
    setIsPressed(false);
    document.removeEventListener("pointerup", handleGlobalPointerUp);
  }, []);
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      pressedPointerRef.current = event.pointerId;
      setShowFocus(false);
      setIsPressed(true);
      document.addEventListener("pointerup", handleGlobalPointerUp);
      onPointerDown?.(event as React.PointerEvent<HTMLButtonElement>);
    },
    [onPointerDown, handleGlobalPointerUp],
  );
  useEffect(
    () => () => {
      if (pressedPointerRef.current === undefined) return;
      document.removeEventListener("pointerup", handleGlobalPointerUp);
    },
    [handleGlobalPointerUp],
  );

  const [showFocusTooltip, setShowFocusTooltip] = useState(false);
  const handleFocus = useCallback(() => {
    setShowFocusTooltip(true);
  }, []);

  const handleBlur = useCallback(() => {
    setShowFocus(true);
    setShowFocusTooltip(false);
  }, []);

  // Ref Management

  const [buttonRef, setButtonRef] = useState<ButtonRef | null>(null);
  const updateButtonRef = useMultiRef<ButtonRef>(setButtonRef, ref);

  const handleButtonRef = useCallback(
    (newRef: HTMLButtonElement | null) => {
      updateButtonRef(
        newRef
          ? Object.assign(newRef, {
              hideFocus: () => {
                setShowFocus(false);
              },
            })
          : newRef,
      );
    },
    [updateButtonRef],
  );

  const iconElement =
    icon &&
    (typeof icon === "string" ? (
      <Icon
        className="icon"
        icon={(isPressed && pressedIcon) || icon}
        isSmall={isSmall}
        isBig={isBig}
      />
    ) : (
      (isPressed && pressedIcon) || icon
    ));

  return (
    <>
      <StyledButton
        {...rest}
        isDisabled={isDisabled}
        isShy={isShy}
        isSmall={isSmall}
        onKeyDown={handleKeyDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onlyIcon={Boolean(icon) && !(text || children)}
        onlyText={Boolean(text || children) && !icon}
        iconRight={iconRight}
        ref={handleButtonRef}
        aria-label={ariaLabel || tooltip}
      >
        {!iconRight && iconElement}
        {(text || text === "") && (
          <Text className="text" text={text} style={textStyle} />
        )}
        {iconRight && iconElement}
        {children}
        {(tag || tagTx) && (
          <Text className="text" text={tag} style={textStyle} />
        )}

        {showFocusOutline && showFocus && (
          <FocusOutline className="focus-outline" />
        )}
      </StyledButton>
      {tooltip && (
        <Tooltip
          text={tooltip}
          isShown={
            (showTooltip || (showFocus && showFocusTooltip)) &&
            externalShowTooltip
          }
          anchor={anchorTooltipToMouse && showTooltip ? mouseAnchor : buttonRef}
          position={showTooltip ? tooltipPosition : tooltipPositionFocus}
          distance={showFocusTooltip ? tooltipDistanceFocus : tooltipDistance}
        />
      )}
    </>
  );
});

export const Button = styled(BaseButton)`
  background-color: ${(props) =>
    color(
      props.isShy
        ? "transparent"
        : props.isDisabled
          ? "primaryDisabled"
          : "primary",
    )};
  border: none;
  border-radius: ${({ isSmall }) => radius(isSmall ? "smallButton" : "button")};
  box-sizing: border-box;
  display: inline-flex;
  height: ${({ isSmall }) =>
    size(isSmall ? "smallButtonHeight" : "buttonHeight")};
  min-height: ${({ isSmall }) =>
    size(isSmall ? "smallButtonHeight" : "buttonHeight")};
  outline: none;
  pointer-events: auto;
  user-select: none;

  &:hover {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "primaryDisabled"
          : props.isCautious
            ? "caution"
            : "primaryHover",
      )};
  }

  &:active {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "primaryDisabled"
          : props.isCautious
            ? "caution"
            : "primaryActive",
      )};
  }
`;

export const GreenButton = styled(Button)`
  background-color: ${(props) =>
    color(
      props.isShy
        ? "transparent"
        : props.isDisabled
          ? "greenDisabled"
          : "green",
    )};

  &:hover {
    background-color: ${(props) =>
      color(props.isDisabled ? "greenDisabled" : "greenHover")};
  }

  &:active {
    background-color: ${(props) =>
      color(props.isDisabled ? "greenDisabled" : "greenActive")};
  }
`;

export const RedButton = styled(Button)`
  background-color: ${(props) =>
    color(
      props.isShy ? "transparent" : props.isDisabled ? "redDisabled" : "red",
    )};

  &:hover {
    background-color: ${(props) =>
      color(props.isDisabled ? "redDisabled" : "redHover")};
  }

  &:active {
    background-color: ${(props) =>
      color(props.isDisabled ? "redDisabled" : "redActive")};
  }
`;

export const YellowButton = styled(Button)`
  background-color: ${(props) =>
    color(
      props.isShy
        ? "transparent"
        : props.isDisabled
          ? "yellowDisabled"
          : "yellow",
    )};

  :hover {
    background-color: ${(props) =>
      color(props.isDisabled ? "yellowDisabled" : "yellowHover")};
  }

  &:active {
    background-color: ${(props) =>
      color(props.isDisabled ? "yellowDisabled" : "yellowActive")};
  }
`;

const secondaryButtonMixin = css<ButtonProps>`
  background-color: ${(props) =>
    color(
      props.isShy
        ? "transparent"
        : props.isDisabled
          ? "secondaryDisabled"
          : "secondary",
    )};

  &:hover {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "secondaryDisabled"
          : props.isCautious
            ? "caution"
            : "secondaryHover",
      )};
  }

  &:active {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "secondaryDisabled"
          : props.isCautious
            ? "caution"
            : "secondaryActive",
      )};
  }

  .text {
    color: ${({ isDisabled }) =>
      color(isDisabled ? "primaryDisabled" : "primary")};
  }

  .icon {
    ${({ isDisabled }) => iconColor(isDisabled ? "primaryDisabled" : "primary")}
  }
`;

export const SecondaryButton = styled(Button)`
  ${secondaryButtonMixin}
`;

export const BigButton = styled(SecondaryButton)`
  height: ${size("bigButtonDimension")};
  width: ${size("bigButtonDimension")};
`;

export const GrayButton = styled(Button)`
  background-color: ${(props) =>
    color(
      props.isShy ? "transparent" : props.isDisabled ? "grayDisabled" : "gray",
    )};

  .text {
    color: ${(props) =>
      color(
        props.color
          ? props.color
          : props.isDisabled
            ? "blackDisabled"
            : "black",
      )};
  }

  .icon {
    ${({ color, isDisabled }) =>
      iconColor(color ? color : isDisabled ? "blackDisabled" : "black")}
  }

  &:hover {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "grayDisabled"
          : props.isCautious
            ? "caution"
            : "grayHover",
      )};
  }

  &:active {
    background-color: ${(props) =>
      color(
        props.isDisabled
          ? "grayDisabled"
          : props.isCautious
            ? "caution"
            : "grayActive",
      )};
  }
`;

export const RedSecondaryButton = styled(Button)`
  ${secondaryButtonMixin}
  .text {
    color: ${({ isDisabled }) => color(isDisabled ? "redDisabled" : "red")};
  }

  .icon {
    ${({ isDisabled }) => iconColor(isDisabled ? "redDisabled" : "red")}
  }
`;

export const SquareButton = styled(Button)`
  padding: 0;
  width: ${size("buttonHeight")};
`;

export const GraySquareButton = styled(GrayButton)`
  padding: 0;
  width: ${size("buttonHeight")};
`;

export const CircularButton = styled(Button)`
  border-radius: 50%;
  padding: 0;
  width: ${size("buttonHeight")};

  .focus-outline {
    border-radius: 50%;
  }
`;

export const InvisibleButton = styled(Button)`
    background: none;
    border: none;
    outline: none;

    box-sizing: border-box;
    pointer-events: auto;
    user-select: none;

    ${(props) =>
      props.isDisabled &&
      css`
        cursor: default;
      `}
    .text {
        color: ${({ isDisabled }) => color(isDisabled ? "textDisabled" : "text")};
    }

    .icon {
        color: ${({ color }) => iconColor(color ?? "primary")}
        opacity: ${({ isDisabled }) => (isDisabled ? opacity("disabled") : 1)};
    }

    &:hover {
        border-radius: ${({ isSmall }) => radius(isSmall ? "smallButton" : "button")};
        display: inline-flex;
        height: ${({ isSmall }) => size(isSmall ? "smallButtonHeight" : "buttonHeight")};
        min-height: ${({ isSmall }) => size(isSmall ? "smallButtonHeight" : "buttonHeight")};
        background-color: ${(props) => color(props.isDisabled ? "transparent" : "invisibleHover")};
    }
`;

export const BorderButton = styled(Button)`
  box-sizing: border-box;

  background-color: ${color("background")};
  border: 1px solid
    ${({ isDisabled }) => color(isDisabled ? "primaryDisabled" : "primary")};

  &:hover {
    border: 1px solid
      ${({ isDisabled }) =>
        color(isDisabled ? "primaryDisabled" : "primaryHover")};
    background-color: ${color("background")};

    .text {
      color: ${({ isDisabled }) =>
        color(isDisabled ? "primaryDisabled" : "primaryHover")};
    }
  }

  &:active {
    border: 1px solid
      ${({ isDisabled }) =>
        color(isDisabled ? "primaryDisabled" : "primaryActive")};
    background-color: ${color("background")};
  }

  .text {
    color: ${({ isDisabled }) =>
      color(isDisabled ? "primaryDisabled" : "primary")};
    font-weight: ${fontWeight("bold")};

    &:active {
      color: ${({ isDisabled }) =>
        color(isDisabled ? "primaryDisabled" : "primaryActive")};
    }
  }
`;

/** Displays a `Button` if `isActive` is set, a `SecondaryButton` if not. */
export const ToggleableButton = styled(Button)<ToggleableButtonProps>`
  ${({ isActive }) =>
    !isActive &&
    css`
      ${secondaryButtonMixin}
    `}
`;

const Spinner = styled(Icon)`
  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(359deg);
    }
  }

  animation: rotation 1.5s infinite linear;
`;

const BlockedButton = styled(Button)`
  cursor: not-allowed;
`;

const BlockedGreenButton = styled(GreenButton)`
  cursor: not-allowed;
`;

export const StatusButton: React.FC<StatusButtonProps> = ({
  icon,
  isLoading,
  isDone,
  isDisabled,
  onPress,
  ...rest
}) =>
  isLoading ? (
    <BlockedButton
      icon={
        (<Spinner icon="spinner" color="onPrimary" />) as unknown as IconType
      }
      {...rest}
    />
  ) : isDone ? (
    <BlockedGreenButton icon="checkmark" {...rest} />
  ) : (
    <Button icon={icon} isDisabled={isDisabled} onPress={onPress} {...rest} />
  );

export const SubmitButton = styled(Button)`
  color: ${color("gray50")};
  font-size: ${fontSize("default")};
`;

// Implementation based on
// https://dev.to/graciesharma/implementing-csv-data-export-in-react-without-external-libraries-3030
export const CSVButton: React.FC<CSVButtonProps> = ({
  data,
  fileName = "data.csv",
  ...params
}) => {
  const downloadCSV = () => {
    if (data.length === 0) return;

    const header = Object.keys(data[0]);
    const rows = data.map((row) =>
      header
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "NaN";
          // Value will be explicitly converted via String()
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const stringified =
            typeof value === "object" ? JSON.stringify(value) : String(value);
          return `"${stringified.replace(/"/g, '""')}"`;
        })
        .join(","),
    );

    const csvString = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SecondaryButton text="Download as CSV" onPress={downloadCSV} {...params} />
  );
};
