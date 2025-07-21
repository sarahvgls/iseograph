import styled from "styled-components";

export const MiniMapContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 0;
  left: ${({ isOpen }) => (isOpen ? "0px" : "-100%")};
  transition: left 0.3s ease-in-out;
`;
