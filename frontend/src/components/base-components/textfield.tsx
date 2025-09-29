import {
  FlexRow,
  SecondaryButton,
  StyledInputTextField,
} from "./base-components.tsx";
import styled from "styled-components";
import { useState } from "react";
import { Modal } from "./modal.tsx";

const StyledButton = styled(SecondaryButton)`
  margin-bottom: 10px;
`;

export const TextComponent = ({
  placeholder,
  value,
  setValue,
  tooltip,
  tooltipTitle,
  testId,
}: {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
  tooltip?: string;
  tooltipTitle?: string;
  testId?: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      <FlexRow>
        <StyledInputTextField
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid={testId}
        />
        {tooltip && (
          <StyledButton onClick={() => setIsModalOpen(!isModalOpen)}>
            i
          </StyledButton>
        )}
      </FlexRow>
      {tooltip && (
        <Modal
          text={tooltip}
          title={tooltipTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
