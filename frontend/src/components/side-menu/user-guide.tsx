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
            Double click on a node to focus it
          </li>
          <li style={{ marginBottom: "8px" }}>
            Single click on a node to change its width mode
          </li>
          <li>Use arrow keys to navigate between nodes</li>
        </ul>
      </StyledSection>
    </div>
  );
};
