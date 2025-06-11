import React from "react";
import { styled } from "styled-components";

import { CircularButton } from "../button";
import { Icon } from "../icon";
import { SectionTitle } from "../section-title";
import type { ModalProps } from "./modal.props";
import { color, zIndex } from "../../../theme";
import { Card } from "../card";

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${color("popUpBackdrop") as unknown as string};
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  z-index: ${zIndex("modal") as unknown as string};
`;

const ModalContent = styled.div`
  width: 400px;
  max-width: 90%;
`;

const CloseButton = styled(CircularButton)`
  background-color: ${color("protzillaGray") as unknown as string};
  color: ${color("primary") as unknown as string};
  display: flex;
  justif-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 30px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const StyledCard = styled(Card)`
  overflow-y: visible;
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  return (
    isOpen && (
      <Backdrop isOpen={isOpen} onClick={onClose}>
        <ModalContent
          className={className}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <StyledCard
            title={
              <CardHeader>
                <SectionTitle baseComponent={"h2"} title={title} />
                <CloseButton onClick={onClose}>
                  <Icon icon="close"></Icon>
                </CloseButton>
              </CardHeader>
            }
          >
            {children}
          </StyledCard>
        </ModalContent>
      </Backdrop>
    )
  );
};
