import styled from "styled-components";
import {
  BoldStyledLabel,
  StyledDropdown,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
  StyledSectionTitleWithButton,
} from "../base-components";
import useGraphStore from "../../graph/store.ts";
import {
  type colorScaleOptions,
  ColorScaleOptions,
  glowMethods,
  intensityMethods,
} from "../../theme/types.tsx";

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
              value={glowMethod}
              onChange={(e) => setGlowMethod(e.target.value as glowMethods)}
            >
              {Object.values(glowMethods).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </StyledDropdown>
            {glowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose source for intensities:
                </BoldStyledLabel>
                <StyledDropdown
                  value={intensitySource}
                  onChange={(e) => setIntensitySource(e.target.value)}
                >
                  {allIntensitySources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </StyledDropdown>
              </div>
            )}
            {glowMethod === glowMethods.intensity && (
              <div>
                <BoldStyledLabel>
                  Choose method for multiple peptides:
                </BoldStyledLabel>
                <StyledDropdown
                  value={intensityMethod}
                  onChange={(e) => setIntensityMethod(e.target.value)}
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
