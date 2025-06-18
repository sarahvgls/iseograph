import { StyledSection, StyledSectionTitle } from "../base-components";

export const OnScreenMenu = ({
  isoformColorMapping,
}: {
  isoformColorMapping: Record<string, string>;
}) => {
  return (
    <StyledSection style={{ padding: "30px" }}>
      <StyledSectionTitle>Isoforms mapped to color:</StyledSectionTitle>
      <br />
      {Object.entries(isoformColorMapping).map(([isoform, color]) => (
        <span key={isoform} style={{ color }}>
          {isoform}
          <br />
        </span>
      ))}
    </StyledSection>
  );
};
