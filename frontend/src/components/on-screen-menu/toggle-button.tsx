import styled from "styled-components";
import { theme } from "../../theme";
import { Icon, type IconType } from "../icon";

const ScreenPositions = ["80px", "130px", "180px"];
const ShiftedScreenPositions = ["322px", "372px", "422px"];

const StyledButton = styled.button<{
  isOpen: boolean;
  positionIndex: number;
  isShifted: boolean;
}>`
  position: fixed;
  right: ${({ positionIndex, isShifted }) =>
    isShifted
      ? ShiftedScreenPositions[positionIndex]
      : ScreenPositions[positionIndex]};
  bottom: calc(100vh - 70px);
  width: 45px;
  height: 45px;
  border-radius: 15%;
  background-color: ${({ isOpen }) =>
    isOpen ? "#dfdfdf" : theme.defaultColor};
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

export const ToggleMenuButton = ({
  setIsOpen,
  onToggle = () => {},
  isOpen,
  icon,
  positionIndex,
  isShifted,
}: {
  setIsOpen: (isOpen: boolean) => void;
  onToggle?: () => void;
  isOpen: boolean;
  icon: IconType;
  positionIndex: number;
  isShifted: boolean;
}) => {
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    onToggle();
  };

  return (
    <StyledButton
      onClick={toggleMenu}
      isOpen={isOpen}
      positionIndex={positionIndex}
      isShifted={isShifted}
    >
      <Icon icon={icon} color={isOpen ? "onPrimary" : "background"} />
    </StyledButton>
  );
};
