import styled from "styled-components";

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  margin: 20px 0 8px 0px;
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

interface CheckboxProps {
  label: string;
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

export const MultiCompatibleCheckbox = styled(Checkbox)`
  margin: 0 0 5px 10px;
`;
