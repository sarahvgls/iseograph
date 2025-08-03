import styled from "styled-components";
import {
  BoldStyledLabel,
  CloseButton,
  StyledSection,
} from "./base-components.tsx";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

const GlobalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

const CenteredContainer = styled.div`
  position: relative;
  width: auto;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  z-index: 10002;
`;

export const Modal = ({
  text,
  title,
  isOpen,
  onClose,
}: {
  text: string;
  title?: string;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <GlobalContainer>
      <CenteredContainer ref={modalRef}>
        <StyledSection style={{ maxWidth: "500px", padding: "30px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <BoldStyledLabel>{title}</BoldStyledLabel>
            <CloseButton onClose={onClose} />
          </div>
          <div style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
            {text}
          </div>
        </StyledSection>
      </CenteredContainer>
    </GlobalContainer>,
    document.body, // Render the modal at the root level of the DOM
  );
};
