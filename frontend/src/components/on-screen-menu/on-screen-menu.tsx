import {
  SecondaryButton,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { HexColorPicker } from "react-colorful";
import { useRef, useState } from "react";
import useGraphStore from "../../graph/store";
import { shallow } from "zustand/shallow";
import { useOutsidePress } from "../../helper/outside-press.tsx";
import styled from "styled-components";
import { theme } from "../../theme";
import { layoutModes, nodeWidthModes } from "../../theme/types.tsx";
import { Switch } from "../base-components/switch.tsx";

const MenuContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 15px;
  pointer-events: none; /* Allow clicks to pass through to the graph by default */
  position: fixed;
  right: ${({ isOpen }) => (isOpen ? "20px" : "-100%")};
  bottom: 20px;
  transition: right 0.3s ease-in-out;
  z-index: 10;
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
    layoutMode,
    setLayoutMode,
    nodeWidthMode,
    setNodeWidthMode,
  } = useGraphStore(
    (state) => ({
      isoformColorMapping: state.isoformColorMapping,
      selectedIsoforms: state.selectedIsoforms,
      toggleIsoformSelection: state.toggleIsoformSelection,
      deselectAllIsoforms: state.deselectAllIsoforms,
      updateIsoformColor: state.updateIsoformColor,
      layoutMode: state.layoutMode,
      setLayoutMode: state.setLayoutMode,
      nodeWidthMode: state.nodeWidthMode,
      setNodeWidthMode: state.setGlobalNodeWidthMode,
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

  const allLayoutModes = Object.values(layoutModes);
  const allNodeWidthModes = Object.values(nodeWidthModes);

  return (
    <div>
      <MenuContainer isOpen={isOpen}>
        <Switch
          label={"Layout Mode"}
          options={allLayoutModes}
          selected={layoutMode}
          selectOption={setLayoutMode}
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

        <StyledSection
          style={{
            marginBottom: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            pointerEvents:
              "auto" /* Re-enable pointer events for this element */,
          }}
        >
          <StyledSectionTitle>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>Isoforms and Colors</div>
              <button
                style={{ border: "none", height: "30px" }}
                onClick={() => {
                  setIsOpen(false);
                }}
              >{`>>`}</button>
            </div>
          </StyledSectionTitle>
          <div
            style={{
              marginTop: "15px",
              maxHeight: "250px",
              overflowY: "auto",
            }}
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
