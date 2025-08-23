import {
  SecondaryButton,
  StyledSection,
  StyledSectionTitleWithButton,
} from "../base-components";
import { HexColorPicker } from "react-colorful";
import { useRef, useState } from "react";
import useGraphStore from "../../graph/store";
import { shallow } from "zustand/shallow";
import { useOutsidePress } from "../../helper/outside-press.tsx";
import styled from "styled-components";
import { theme } from "../../theme";
import { layoutModes, nodeTypes, nodeWidthModes } from "../../theme/types.tsx";
import { Switch } from "../base-components/switch.tsx";
import type { SequenceNodeProps } from "../sequence-node/sequence-node.props.tsx";

const MenuContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 15px;
  transform: translateX(${({ isOpen }) => (isOpen ? "0" : "100%")});
  transition: transform 0.3s ease-in-out;
  pointer-events: none;
`;

const ColorSelection = styled.div`
  margin-top: 15px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 20px;
  }
`;

const ColorPickerBox = styled.div`
  position: absolute;
  top: 10px;
  left: 375px;
  display: inline-block;
  width: 200px;
  height: 200px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  pointer-events: auto;
`;

export const OnScreenMenu = ({
  isOpen,
  setIsOpen,
  focusNodeWithDelay,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  focusNodeWithDelay: (nodeToBeFocused: SequenceNodeProps) => void;
}) => {
  const {
    nodes,
    isoformColorMapping,
    selectedIsoforms,
    toggleIsoformSelection,
    deselectAllIsoforms,
    updateIsoformColor,
    layoutMode,
    setLayoutMode,
    nodeWidthMode,
    setNodeWidthMode,
  } = useGraphStore(
    (state) => ({
      nodes: state.nodes,
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      toggleIsoformSelection: state.toggleIsoformSelection,
      deselectAllIsoforms: state.deselectAllIsoforms,
      updateIsoformColor: state.updateIsoformColor,
      layoutMode: state.layoutMode,
      setLayoutMode: state.setLayoutMode,
      nodeWidthMode: state.nodeWidthMode,
      setNodeWidthMode: state.setGlobalNodeWidthModeAndApplyLayout,
    }),
    shallow,
  );

  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(
    null,
  );
  const closeColorPicker = () => setActiveColorPicker(null);
  const refActiveColorPicker = useRef<HTMLDivElement>(null);
  useOutsidePress(
    refActiveColorPicker as React.MutableRefObject<HTMLDivElement>,
    closeColorPicker,
    activeColorPicker !== null,
    false,
  );

  const changeLayoutMode = (mode: layoutModes) => {
    setLayoutMode(mode);
    const firstSequenceNode = nodes.find(
      (node) => node.type === nodeTypes.SequenceNode,
    ) as SequenceNodeProps;
    focusNodeWithDelay(firstSequenceNode);
  };

  const resetColors = () => {
    const defaultColors = theme.colors;
    Object.keys(isoformColorMapping).forEach((isoform, index) => {
      const defaultColor =
        Object.values(defaultColors)[
          index % Object.values(defaultColors).length
        ];
      updateIsoformColor(isoform, defaultColor);
    });
    updateIsoformColor("Default", theme.defaultColor);
  };

  const deselectAll = () => {
    setActiveColorPicker(null);
    deselectAllIsoforms();
  };

  const allLayoutModes = Object.values(layoutModes);
  const allNodeWidthModes = Object.values(nodeWidthModes);

  return (
    <div>
      <MenuContainer isOpen={isOpen}>
        {/*--- Graph Settings Switches ---*/}
        <Switch
          label={"Layout Mode"}
          options={allLayoutModes}
          selected={layoutMode}
          selectOption={changeLayoutMode}
          isShy={false}
        />
        <Switch
          label={"Node Width Mode"}
          options={allNodeWidthModes}
          selected={nodeWidthMode}
          selectOption={(option) => {
            setNodeWidthMode(option as nodeWidthModes);
          }}
          isShy={false}
        />

        {/*--- Isoform color selection ---*/}
        <StyledSection
          style={{
            marginBottom: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            pointerEvents: "auto",
          }}
        >
          <StyledSectionTitleWithButton
            onClose={() => {
              setIsOpen(false);
              useGraphStore.setState({ isIsoformMenuFullSize: false });
            }}
            title={"Isoform-colored edges"}
          />
          <ColorSelection>
            {Object.entries(isoformColorMapping).map(([isoform, color]) => (
              <div
                key={isoform}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(245, 245, 245, 0.7)",
                }}
              >
                <input
                  type="checkbox"
                  id={`isoform-${isoform}`}
                  checked={selectedIsoforms.includes(isoform)}
                  onChange={() => toggleIsoformSelection(isoform)}
                  style={{ marginRight: "10px" }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    opacity: selectedIsoforms.includes(isoform) ? 1 : 0.5,
                  }}
                  onClick={() =>
                    activeColorPicker === isoform
                      ? setActiveColorPicker(null)
                      : setActiveColorPicker(isoform)
                  }
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: color,
                      borderRadius: "4px",
                      marginRight: "10px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <span style={{ color }}>{isoform}</span>
                </div>

                {activeColorPicker === isoform && (
                  <ColorPickerBox>
                    <div ref={refActiveColorPicker}>
                      <HexColorPicker
                        color={color}
                        onChange={(newColor) =>
                          updateIsoformColor(isoform, newColor)
                        }
                      />
                    </div>
                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "white",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{color}</span>
                      <button
                        onClick={() => setActiveColorPicker(null)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "#555",
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </ColorPickerBox>
                )}
              </div>
            ))}
          </ColorSelection>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <SecondaryButton onClick={resetColors}>
              Reset colors
            </SecondaryButton>
            <SecondaryButton
              style={{
                width: "100px",
              }}
              onClick={deselectAll}
            >
              Deselect All
            </SecondaryButton>
          </div>
        </StyledSection>
      </MenuContainer>
    </div>
  );
};
