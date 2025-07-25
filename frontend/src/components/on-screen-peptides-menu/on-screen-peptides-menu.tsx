import styled from "styled-components";
import {
  BoldStyledLabel,
  StyledDropdown,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
  StyledSectionTitleWithButton,
} from "../base-components";
import {
  type colorScaleOptions,
  ColorScaleOptions,
} from "../../controls/peptides-color.tsx";
import useGraphStore from "../../graph/store.ts";
import { glowMethods, intensityMethods } from "../../theme/types.tsx";
import { useState } from "react";
import { theme } from "../../theme";

const MenuContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  align-content: flex-end;
  justify-content: flex-end;
  justify-self: flex-end;
  width: 10px;
  gap: 99px;
  transform: translateX(${({ isOpen }) => (isOpen ? "0" : "100%")});
  transition: transform 0.3s ease-in-out;
  pointer-events: none;
  z-index: 5;
`;

export const OnScreenPeptidesMenu = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const { intensitySources, colorScale, setColorScale } = useGraphStore(
    (state) => ({
      intensitySources: state.intensitySources,
      colorScale: state.colorScale,
      setColorScale: state.setColorScale,
    }),
  );
  const [selectedGlowMethod, setSelectedGlowMethod] = useState<glowMethods>(
    theme.edgeGlow.defaultMethod,
  );
  const [selectedIntensitySource, setSelectedIntensitySource] =
    useState<string>(intensitySources[0] || "");
  const [selectedIntensityMethod, setSelectedIntensityMethod] =
    useState<string>(theme.edgeGlow.defaultMultiplePeptidesMethod);

  return (
    <div>
      <MenuContainer isOpen={isOpen}>
        <StyledSection style={{ pointerEvents: "auto", marginBottom: 0 }}>
          <StyledSectionTitleWithButton
            title={"Peptide edge colorscale:"}
            setIsOpen={setIsOpen}
          />
          <div style={{ width: "200px" }}>
            {Object.values(ColorScaleOptions).map((option) => (
              <StyledLabel key={option}>
                <input
                  type="radio"
                  name="colorScale"
                  value={option} // TODO add visual color scale, not just name
                  checked={colorScale === option}
                  onChange={() => setColorScale(option as colorScaleOptions)}
                />
                {option}
              </StyledLabel>
            ))}
            <StyledSectionTitle>Method selection:</StyledSectionTitle>
            <StyledDropdown
              value={selectedGlowMethod}
              onChange={(e) =>
                setSelectedGlowMethod(e.target.value as glowMethods)
              }
            >
              {Object.values(glowMethods).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </StyledDropdown>
            {selectedGlowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose source for intensities:
                </BoldStyledLabel>
                <StyledDropdown
                  value={selectedIntensitySource}
                  onChange={(e) => setSelectedIntensitySource(e.target.value)}
                >
                  {intensitySources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </StyledDropdown>
              </div>
            )}
            {selectedGlowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose method for multiple peptides:
                </BoldStyledLabel>
                <StyledDropdown
                  value={selectedIntensityMethod}
                  onChange={(e) => setSelectedIntensityMethod(e.target.value)}
                >
                  {Object.values(intensityMethods).map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </StyledDropdown>
              </div>
            )}
          </div>
        </StyledSection>
      </MenuContainer>
    </div>
  );
};
