import styled from "styled-components";
import { Panel } from "@xyflow/react";

export const StyledSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const StyledSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 8px;
`;

export const StyledLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
`;

export const StyledDropdown = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 14px;
`;

export const StyledInputTextField = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 14px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 16px;
  background-color: #076997;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  width: 100%;
`;

export const SecondaryButton = styled.button`
  padding: 8px 12px;
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface CheckboxProps {
  label: any;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className,
}) => {
  return (
    <CheckboxContainer className={className}>
      <HiddenCheckbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <StyledCheckboxControl checked={checked}>
        {checked && <CheckMark>✓</CheckMark>}
      </StyledCheckboxControl>
      <CheckboxLabel>{label}</CheckboxLabel>
    </CheckboxContainer>
  );
};

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 8px 0;
  font-size: 14px;
  color: #555;
  margin-top: 20px;
  margin-left: 5px;
`;

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
`;

const StyledCheckboxControl = styled.div<{ checked: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.checked ? "#076997" : "#ddd")};
  background-color: ${(props) => (props.checked ? "#076997" : "white")};
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    border-color: #076997;
  }
`;

const CheckMark = styled.span`
  color: white;
  font-size: 12px;
  line-height: 1;
`;

const CheckboxLabel = styled.span`
  margin-left: 8px;
`;

export const StyledCheckbox = styled(Checkbox)`
  margin-top: 10px;
`;

export const StyledPanel = styled(Panel)`
  pointer-events: none !important;
`;
