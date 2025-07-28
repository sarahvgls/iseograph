import styled from "styled-components";
import {
  BoldStyledLabel,
  StyledSection,
  StyledSectionTitle,
  StyledSectionTitleWithButton,
  StyledSlimmDropdown,
} from "../base-components";
import useGraphStore from "../../graph/store.ts";
import {
  type colorScaleOptions,
  ColorScaleOptions,
  glowMethods,
  intensityMethods,
} from "../../theme/types.tsx";
import { getColor } from "../../controls/peptides-color.tsx";
import { useState } from "react";

const MenuContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  align-content: flex-end;
  justify-content: flex-end;
  justify-self: flex-end;
  gap: 99px;
  transform: translateX(${({ isOpen }) => (isOpen ? "0" : "100%")});
  transition: transform 0.3s ease-in-out;
  pointer-events: none;
  z-index: 5;
`;

const PeptidesMenuContainer = styled.div`
  width: 200px;
  padding: 5px;
`;

const ColorSelection = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  max-height: 90px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    height: 4px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }
`;

const ColorLegendBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ColorScaleOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
  cursor: pointer;
`;

const ColorScalePreview = styled.div`
  width: 20px;
  height: 200px;
  margin: 4px 5px 2px 5px;
  border-radius: 3px;
`;

export const OnScreenPeptidesMenu = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const {
    allIntensitySources,
    colorScale,
    setColorScale,
    intensitySource,
    setIntensitySource,
    intensityMethod,
    setIntensityMethod,
    glowMethod,
    setGlowMethod,
  } = useGraphStore((state) => ({
    allIntensitySources: state.allIntensitySources,
    colorScale: state.colorScale,
    setColorScale: state.setColorScale,
    intensitySource: state.intensitySource,
    setIntensitySource: state.setIntensitySource,
    intensityMethod: state.intensityMethod,
    setIntensityMethod: state.setIntensityMethod,
    glowMethod: state.glowMethod,
    setGlowMethod: state.setGlowMethod,
  }));

  const [isScaleSelectionOpen, setIsScaleSelectionOpen] =
    useState<boolean>(true);

  // Helper function to generate gradient CSS for each color scale
  const generateGradient = (colorScaleOption: colorScaleOptions) => {
    const steps = 20;
    const colors = Array.from({ length: steps }, (_, i) =>
      getColor(i, steps - 1, colorScaleOption),
    );

    return `linear-gradient(to bottom, ${colors.join(", ")})`;
  };

  return (
    <div>
      <MenuContainer isOpen={isOpen}>
        <StyledSection
          style={{
            pointerEvents: "auto",
            marginBottom: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <StyledSectionTitleWithButton
            title={"Peptide edge colorscale:"}
            onClose={() => {
              setIsOpen(false);
              useGraphStore.setState({ isPeptideMenuFullSize: false });
            }}
          />
          <PeptidesMenuContainer>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <ColorLegendBox>
                {isScaleSelectionOpen && (
                  <>
                    <button
                      style={{
                        background: "#e8e8e8",
                        borderRadius: "5px",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        cursor: "pointer",
                        margin: "0",
                      }}
                      onClick={() => setIsScaleSelectionOpen(false)}
                    >{`>>`}</button>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "60px",
                      }}
                    >
                      <div>0</div>
                      <div>∞</div>
                    </div>
                  </>
                )}
              </ColorLegendBox>
              {isScaleSelectionOpen ? (
                <ColorSelection>
                  {Object.values(ColorScaleOptions).map((option) => (
                    <ColorScaleOption
                      key={option}
                      onClick={() => setColorScale(option as colorScaleOptions)}
                    >
                      <input
                        type="radio"
                        style={{ margin: "0px" }}
                        name="colorScale"
                        value={option}
                        checked={colorScale === option}
                        onChange={() =>
                          setColorScale(option as colorScaleOptions)
                        }
                      />
                      <ColorScalePreview
                        style={{
                          background:
                            option === ColorScaleOptions.disabled
                              ? "transparent"
                              : generateGradient(option as colorScaleOptions),
                        }}
                      />
                    </ColorScaleOption>
                  ))}
                </ColorSelection>
              ) : (
                <>
                  <button
                    style={{
                      background: "#e8e8e8",
                      borderRadius: "5px",
                      padding: "4px",
                      border: "none",
                      height: "25px",
                    }}
                    onClick={() => setIsScaleSelectionOpen(true)}
                  >
                    {`<<`}
                  </button>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "80px",
                        marginLeft: "30px",
                      }}
                    >
                      <div>0</div>
                      <div>∞</div>
                    </div>
                    <ColorScaleOption
                      style={{
                        marginLeft: "10px",
                        borderRadius: "5px",
                        height: "80px",
                        width: "100px",
                        background: generateGradient(
                          colorScale as colorScaleOptions,
                        ),
                      }}
                    ></ColorScaleOption>
                    <small style={{ marginLeft: "6px" }}>{colorScale}</small>
                  </div>
                </>
              )}
            </div>
            <StyledSectionTitle>Method selection:</StyledSectionTitle>
            <StyledSlimmDropdown
              style={{ marginBottom: "10px" }}
              value={glowMethod}
              onChange={(e) => {
                setGlowMethod(e.target.value as glowMethods);
                if (e.target.value === glowMethods.intensity) {
                  useGraphStore.setState({ isPeptideMenuFullSize: true });
                } else {
                  useGraphStore.setState({ isPeptideMenuFullSize: false });
                }
              }}
            >
              {Object.values(glowMethods).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </StyledSlimmDropdown>
            {glowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose source for intensities:
                </BoldStyledLabel>
                <StyledSlimmDropdown
                  style={{ marginBottom: "10px" }}
                  value={intensitySource}
                  onChange={(e) => setIntensitySource(e.target.value)}
                >
                  {allIntensitySources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </StyledSlimmDropdown>
              </div>
            )}
            {glowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose how to handle multiple peptides in one node:
                </BoldStyledLabel>
                <StyledSlimmDropdown
                  value={intensityMethod}
                  onChange={(e) => setIntensityMethod(e.target.value)}
                >
                  {Object.values(intensityMethods).map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </StyledSlimmDropdown>
              </div>
            )}
          </PeptidesMenuContainer>
        </StyledSection>
      </MenuContainer>
    </div>
  );
};
