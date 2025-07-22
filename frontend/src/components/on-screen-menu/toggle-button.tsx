import styled from "styled-components";
import { theme } from "../../theme";
import { Icon } from "../icon";

const StyledButton = styled.button<{ isOpen: boolean }>`
  position: fixed;
  right: 80px;
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

export const ToggleOnScreenMenuButton = ({
  setIsMenuOpen,
  isMenuOpen,
}: {
  setIsMenuOpen: (isOpen: boolean) => void;
  isMenuOpen: boolean;
}) => {
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <StyledButton onClick={toggleMenu} isOpen={isMenuOpen}>
      <Icon
        icon={"pencil_brush"}
        color={isMenuOpen ? "onPrimary" : "background"}
      />
    </StyledButton>
  );
};

export const ToggleMapButton = ({
  setIsMapOpen,
  isMapOpen,
}: {
  setIsMapOpen: (isOpen: boolean) => void;
  isMapOpen: boolean;
}) => {
  const toggleMenu = () => {
    setIsMapOpen(!isMapOpen);
  };

  return (
    <StyledButton
      style={{ right: 130 }}
      onClick={toggleMenu}
      isOpen={isMapOpen}
    >
      <Icon icon={"map"} color={isMapOpen ? "onPrimary" : "background"} />
    </StyledButton>
  );
};
