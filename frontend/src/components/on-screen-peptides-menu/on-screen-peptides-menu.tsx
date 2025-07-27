import styled from "styled-components";
import {
  BoldStyledLabel,
  StyledLabel,
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
  flex-grow: 1;
  max-height: 125px;
  overflow: auto;

  &::-webkit-scrollbar {
    height: 4px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }
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
        <StyledSection
          style={{
            pointerEvents: "auto",
            marginBottom: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <StyledSectionTitleWithButton
            title={"Peptide edge colorscale:"}
            setIsOpen={setIsOpen}
          />
          <PeptidesMenuContainer>
            <ColorSelection>
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
            </ColorSelection>
            <StyledSectionTitle>Method selection:</StyledSectionTitle>
            <StyledSlimmDropdown
              style={{ marginBottom: "10px" }}
              value={glowMethod}
              onChange={(e) => {
                setGlowMethod(e.target.value as glowMethods);
                if (e.target.value === glowMethods.intensity) {
                  useGraphStore.setState({ shouldShiftButtons: true });
                } else if (e.target.value !== glowMethods.intensity) {
                  useGraphStore.setState({ shouldShiftButtons: false });
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
