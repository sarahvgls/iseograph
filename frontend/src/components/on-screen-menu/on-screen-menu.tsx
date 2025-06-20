import {
  SecondaryButton,
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

const ColorPickerBox = styled.div`
  position: absolute;
  top: 10px;
  left: -210px;
  display: inline-block;
  width: 200px;
  height: 200px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

export const OnScreenMenu = () => {
  const {
    isoformColorMapping,
    selectedIsoforms,
    toggleIsoformSelection,
    toggleCompleteIsoformSelection,
    updateIsoformColor,
  } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      toggleIsoformSelection: state.toggleIsoformSelection,
      toggleCompleteIsoformSelection: state.toggleCompleteIsoformSelection,
      updateIsoformColor: state.updateIsoformColor,
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

  return (
    <StyledSection
      style={{
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <StyledSectionTitle>Isoforms and Colors</StyledSectionTitle>
      <div style={{ marginTop: "15px", maxHeight: "250px", overflowY: "auto" }}>
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

            {/* Color Picker */}
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
  );
};
