import { Icon } from "../icon";
import styled from "styled-components";
import { theme } from "../../theme";

const StyledButton = styled.button<{
  isActive: boolean;
  positionIndex: number;
}>`
  bottom: calc(100vh - 50px);
  position: fixed;
  padding: 10px;
  width: 45px;
  height: 45px;
  right: ${({ positionIndex }) =>
    theme.offsets.rightTopButtonOffsets[positionIndex]};
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
  positionIndex,
  testId,
}: {
  setIsActive: (isActive: boolean) => void;
  onActivate: () => void;
  isActive: boolean;
  positionIndex: number;
  testId?: string;
}) => {
  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive) {
      onActivate();
    }
  };

  return (
    <StyledButton
      data-testid={testId || "capture-button"}
      onClick={toggleActive}
      positionIndex={positionIndex}
      isActive={isActive ?? false}
    >
      <Icon icon={"capture"} color={isActive ? "onPrimary" : "background"} />
    </StyledButton>
  );
};
