import { color, fontSize, fontWeight, shadow, spacing } from "../../../theme";
import React from "react";
import { styled } from "styled-components";

import type { CardProps } from "./card.props";
import { H3 } from "../text";

const StyledCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${shadow("box_shadow") as unknown as string};
  padding: ${spacing("small") as unknown as string};
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const CardBody = styled.div<{ hasTitle: boolean }>`
  padding: ${spacing("small") as unknown as string};
  flex: 1;

  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
`;

const CardTitle = styled(H3)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: ${fontSize("h3")};
  line-height: ${fontSize("h3")};
  font-weight: ${fontWeight("bold")};
  color: ${color("primary")};
  padding: ${spacing("small")};
`;

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <StyledCard className={className}>
      {title && <CardTitle>{title}</CardTitle>}
      <CardBody hasTitle={Boolean(title)}>{children}</CardBody>
    </StyledCard>
  );
};
