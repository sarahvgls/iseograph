import { StyledSection, StyledSectionTitle } from "../base-components";

export const UserGuide = () => {
  return (
    <div>
      <StyledSection style={{ marginTop: "24px" }}>
        <StyledSectionTitle>User Guide</StyledSectionTitle>
        <ul
          style={{
            margin: "0",
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#555",
          }}
        >
          <li style={{ marginBottom: "8px" }}>
            Single click on a node to open peptide inspection for it.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Double click on a node to resize it: Toggle through expanded {`->`}{" "}
            small {`->`} collapsed.
          </li>
          <li>Use arrow buttons to navigate between focused nodes.</li>
        </ul>
      </StyledSection>
    </div>
  );
};
