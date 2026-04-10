import { Icon } from "../icon";

import styled from "styled-components";

const Container = styled.div`
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  position: fixed;
  right: 15px;
  bottom: calc(100vh - 60px);
`;

export const SettingsButton = ({
  setIsSettingsOpen,
  testId,
}: {
  setIsSettingsOpen: (isOpen: boolean) => void;
  testId?: string;
}) => {
  return (
    <Container>
      <button
        data-testid={testId || "open-menu-button"}
        onClick={() => setIsSettingsOpen(true)}
        style={{
          padding: "8px 12px",
          color: "#dfdfdf",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        <Icon icon={"settings"} />
      </button>
    </Container>
  );
};
