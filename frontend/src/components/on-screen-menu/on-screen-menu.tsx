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

const MenuContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: end;
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
  top: 120px;
  left: -170px;
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
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const {
    isoformColorMapping,
    selectedIsoforms,
    toggleIsoformSelection,
    deselectAllIsoforms,
    updateIsoformColor,
  } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      toggleIsoformSelection: state.toggleIsoformSelection,
      deselectAllIsoforms: state.deselectAllIsoforms,
      updateIsoformColor: state.updateIsoformColor,
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

  return (
    <div>
      <MenuContainer isOpen={isOpen}>
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
