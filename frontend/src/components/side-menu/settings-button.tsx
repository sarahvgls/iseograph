import { Icon } from "../icon";

import styled from "styled-components";

const Container = styled.div<{ isShifted?: boolean }>`
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  position: fixed;
  right: ${({ isShifted }) => (isShifted ? "257px" : "15px")};
  bottom: calc(100vh - 80px);
`;

export const SettingsButton = ({
  setIsSettingsOpen,
  isShifted,
  testId,
}: {
  setIsSettingsOpen: (isOpen: boolean) => void;
  isShifted: boolean;
  testId?: string;
}) => {
  return (
    <Container isShifted={isShifted}>
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
