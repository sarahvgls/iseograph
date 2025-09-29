import { SettingsBorder, StyledLabel } from "./base-components.tsx";
import styled from "styled-components";
import { theme } from "../../theme";
import { useState, useEffect } from "react";
import { Icon } from "../icon";

const SliderBox = styled.div`
  padding: 5px 10px 20px 0px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex-wrap: nowrap;
  align-content: center;
  gap: 15px;
`;

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 20px; // Space for the value labels
`;

const StyledSlider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: ${theme.defaultColor};
  border-radius: 5px;
  height: 5px;
  outline: none;
  transition: background-color 0.3s ease;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: ${theme.defaultColor};
    cursor: pointer;
  }
`;

const MinMaxLabel = styled.span`
  position: absolute;
  top: 0;
  font-size: 12px;
  color: ${theme.defaultColor};
`;

const CurrentValueLabel = styled.span`
  position: absolute;
  top: 40px;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  color: ${theme.defaultColor};
  padding: 2px 4px;
  border-radius: 3px;
`;

const ResetButton = styled.button`
  padding: 5px;
  width: 30px;
  height: 30px;
  border: none;
  display: flex;
  align-content: center;
  justify-content: center;

  cursor: pointer;
  color: ${theme.defaultColor};
  border-radius: 15%;
  transition: background-color 0.3s ease;
`;

export const Slider = ({
  label,
  minValue,
  maxValue,
  minValueLabel,
  maxValueLabel,
  setValue,
  initialValue,
  defaultValue,
}: {
  label?: string;
  minValue: number;
  maxValue: number;
  minValueLabel: string;
  maxValueLabel: string;
  setValue: (newValue: number) => void;
  initialValue?: number;
  defaultValue: number;
}) => {
  const [currentValue, setCurrentValue] = useState(initialValue || minValue);

  useEffect(() => {
    if (initialValue !== undefined) {
      setCurrentValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setCurrentValue(newValue);
    setValue(newValue);
  };

  const resetValue = () => {
    setCurrentValue(defaultValue);
    setValue(defaultValue);
  };

  // Calculate position percentage for the current value label
  const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100;

  return (
    <SettingsBorder>
      {label && <StyledLabel>{label}</StyledLabel>}

      <SliderBox>
        <SliderContainer>
          <MinMaxLabel style={{ left: 0 }}>{minValueLabel}</MinMaxLabel>
          <MinMaxLabel style={{ right: 0 }}>{maxValueLabel}</MinMaxLabel>
          <CurrentValueLabel style={{ left: `${percentage}%` }}>
            {currentValue}
          </CurrentValueLabel>
          <StyledSlider
            type="range"
            min={minValue}
            max={maxValue}
            value={currentValue}
            onChange={handleChange}
          />
        </SliderContainer>
        <ResetButton onClick={resetValue}>
          <Icon icon={"reset"} color={"black"} />
        </ResetButton>
      </SliderBox>
    </SettingsBorder>
  );
};
