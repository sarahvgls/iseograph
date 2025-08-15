import {
  FlexRow,
  SecondaryButton,
  StyledDropdown,
  StyledLabel,
} from "./base-components.tsx";
import { useState } from "react";
import { Modal } from "./modal.tsx";

export const DropdownComponent = ({
  placeholder,
  value,
  setValue,
  options,
  label,
  tooltip,
  tooltipTitle,
}: {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  label?: string;
  tooltip?: string;
  tooltipTitle?: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div style={{ paddingBottom: "10px" }}>
      <FlexRow>
        <StyledLabel style={{ marginBottom: "5px" }}>{label}</StyledLabel>
        {tooltip && (
          <SecondaryButton onClick={() => setIsModalOpen(!isModalOpen)}>
            i
          </SecondaryButton>
        )}
      </FlexRow>
      <StyledDropdown
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </StyledDropdown>
      {tooltip && (
        <Modal
          text={tooltip}
          title={tooltipTitle}
          onClose={() => setIsModalOpen(false)}
          isOpen={isModalOpen}
        />
      )}
    </div>
  );
};
