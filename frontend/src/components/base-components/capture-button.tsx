import { Icon } from "../icon";
import styled from "styled-components";
import { theme } from "../../theme";

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  position: fixed;
  right: 170px;
  bottom: calc(100vh - 80px);
  width: 45px;
  max-height: 45px;
`;

const StyledButton = styled.button<{
  isActive: boolean;
}>`
  padding: 10px;
  width: 45px;
  height: 45px;
  border-radius: 15%;
  background-color: ${({ isActive }) =>
    isActive ? "#dfdfdf" : theme.defaultColor};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 11;
  font-size: 20px;
  transition: transform 0.2s ease;
  pointer-events: auto;

  &:hover {
    transform: scale(1.05);
  }
`;

export const CaptureButton = ({
  setIsActive,
  onActivate,
  isActive,
  testId,
}: {
  setIsActive: (isActive: boolean) => void;
  onActivate: () => void;
  isActive: boolean;
  testId?: string;
}) => {
  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive) {
      onActivate();
    }
  };

  return (
    <Container>
      <StyledButton
        data-testid={testId || "capture-button"}
        onClick={toggleActive}
        isActive={isActive ?? false}
      >
        <Icon icon={"capture"} color={isActive ? "onPrimary" : "background"} />
      </StyledButton>
    </Container>
  );
};
