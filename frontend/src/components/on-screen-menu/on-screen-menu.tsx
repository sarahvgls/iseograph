import {
  SecondaryButton,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef, useState } from "react";
import useGraphStore from "../../graph/store";
import { shallow } from "zustand/shallow";
import { useOutsidePress } from "../../helper/outside-press.tsx";
import styled from "styled-components";
import { theme } from "../../theme";
import { layoutModes, nodeWidthModes } from "../../theme/types.tsx";

const MenuContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 15px;
  pointer-events: none; /* Allow clicks to pass through to the graph by default */
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

const SwitchContainer = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  width: 250px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  align-self: flex-end;
  pointer-events: auto;
`;

const SwitchOptions = styled.div`
  display: flex;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 4px;
  height: 30px;
  padding: 2px;
  box-sizing: border-box;
  width: 100%;
`;

const SwitchOption = styled.button<{ isActive: boolean }>`
  flex: 1;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  z-index: 2;
  color: ${(props) => (props.isActive ? "#fff" : "#333")};
  transition: color 0.2s ease;
  border-radius: 3px;
  padding: 0;
`;

const Slider = styled.div<{ position: number; count: number }>`
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: ${(props) => 100 / props.count}%;
  background-color: #919191;
  border-radius: 3px;
  transition: transform 0.3s ease;
  transform: translateX(${(props) => props.position * 100}%);
  z-index: 1;
`;

export const OnScreenMenu = () => {
  const {
    isoformColorMapping,
    selectedIsoforms,
    toggleIsoformSelection,
    toggleCompleteIsoformSelection,
    updateIsoformColor,
    layoutMode,
    setLayoutMode,
    nodeWidthMode,
    setNodeWidthMode,
  } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      toggleIsoformSelection: state.toggleIsoformSelection,
      toggleCompleteIsoformSelection: state.toggleCompleteIsoformSelection,
      updateIsoformColor: state.updateIsoformColor,
      layoutMode: state.layoutMode,
      setLayoutMode: state.setLayoutMode,
      nodeWidthMode: state.nodeWidthMode,
      setNodeWidthMode: state.setGlobalNodeWidthMode,
    }),
    shallow,
  );

  const [areAllSelected, setAreAllSelected] = useState<boolean>(false);

  useEffect(() => {
    setAreAllSelected(
      Object.keys(isoformColorMapping).every((isoform) =>
        selectedIsoforms.includes(isoform),
      ),
    );
  }, [isoformColorMapping, selectedIsoforms]);

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

  const toggleAllSelection = () => {
    setActiveColorPicker(null);
    toggleCompleteIsoformSelection();
  };

  const allLayoutModes = Object.values(layoutModes);
  const allNodeWidthModes = Object.values(nodeWidthModes);

  const activeLayoutIndex = allLayoutModes.findIndex(
    (mode) => mode === layoutMode,
  );
  const activeWidthIndex = allNodeWidthModes.findIndex(
    (mode) => mode === nodeWidthMode,
  );

  return (
    <MenuContainer>
      <SwitchContainer>
        <StyledLabel>Layout Mode</StyledLabel>
        <SwitchOptions>
          <Slider position={activeLayoutIndex} count={allLayoutModes.length} />
          {allLayoutModes.map((mode) => (
            <SwitchOption
              key={mode}
              isActive={layoutMode === mode}
              onClick={() => setLayoutMode(mode)}
            >
              {mode}
            </SwitchOption>
          ))}
        </SwitchOptions>
      </SwitchContainer>

      <SwitchContainer>
        <StyledLabel>Node Width Mode</StyledLabel>
        <SwitchOptions>
          <Slider
            position={activeWidthIndex}
            count={allNodeWidthModes.length}
          />
          {allNodeWidthModes.map((mode) => (
            <SwitchOption
              key={mode}
              isActive={nodeWidthMode === mode}
              onClick={() => setNodeWidthMode(mode)}
            >
              {mode}
            </SwitchOption>
          ))}
        </SwitchOptions>
      </SwitchContainer>

      <StyledSection
        style={{
          marginBottom: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          pointerEvents: "auto" /* Re-enable pointer events for this element */,
        }}
      >
        <StyledSectionTitle>Isoforms and Colors</StyledSectionTitle>
        <div
          style={{ marginTop: "15px", maxHeight: "250px", overflowY: "auto" }}
        >
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
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <SecondaryButton onClick={resetColors}>Reset colors</SecondaryButton>
          <SecondaryButton
            style={{
              width: "100px",
            }}
            onClick={toggleAllSelection}
          >
            {areAllSelected ? "Deselect All" : "Select All"}
          </SecondaryButton>
        </div>
      </StyledSection>
    </MenuContainer>
  );
};
