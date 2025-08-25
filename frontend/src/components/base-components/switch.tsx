import styled from "styled-components";
import { SettingsBorder, StyledLabel } from "./base-components.tsx";
import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { theme } from "../../theme";

const SwitchContainer = styled.div<{ isShy: boolean }>`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: ${(props) => (props.isShy ? "0" : "15px")};
  width: 250px;
  box-shadow: ${(props) =>
    props.isShy ? "none" : "0 2px 10px rgba(0, 0, 0, 0.1)"};
  align-self: flex-end;
  pointer-events: auto;
`;

const SwitchOptions = styled.div`
  display: flex;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 4px;
  height: 30px;
  padding: 2px;
  box-sizing: border-box;
  width: 100%;
`;

const Slider = styled.div<{ position: number; count: number }>`
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: ${(props) => 100 / props.count}%;
  background-color: #919191;
  border-radius: 3px;
  transition: transform 0.3s ease;
  transform: translateX(${(props) => props.position * 100}%);
  z-index: 1;
`;

const SwitchOption = styled.button<{ isActive: boolean }>`
  flex: 1;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  z-index: 2;
  color: ${(props) => (props.isActive ? "#fff" : "#333")};
  transition: color 0.2s ease;
  border-radius: 3px;
  padding: 0;
`;

export const Switch = ({
  label,
  options,
  selected,
  selectOption,
  isShy = false,
  testId,
  ...rest
}: {
  label?: string;
  options: string[];
  selected: string;
  selectOption: (newOption: string) => void | Promise<void>;
  isShy?: boolean;
  testId?: string;
}) => {
  const activeIndex = options.findIndex((option) => option === selected);
  const [loadingOption, setLoadingOption] = useState<string | null>(null);

  const handleOptionSelect = async (mode: string) => {
    if (mode === selected || loadingOption) return;

    setLoadingOption(mode);

    setTimeout(async () => {
      try {
        const result = selectOption(mode);
        if (result instanceof Promise) {
          await result;
        }
      } finally {
        setLoadingOption(null);
      }
    }, theme.delay.shortest); // Allow UI to update before executing selectOption
  };

  return (
    <div
      data-testid={testId}
      data-selected={selected}
      data-loading={loadingOption !== null}
    >
      {isShy ? (
        <SettingsBorder>
          <SwitchContainer {...rest} isShy={isShy}>
            {label && <StyledLabel>{label}</StyledLabel>}
            <SwitchOptions>
              <Slider position={activeIndex} count={options.length} />
              {options.map((mode) => (
                <SwitchOption
                  key={mode}
                  isActive={selected === mode}
                  onClick={() => handleOptionSelect(mode)}
                  data-testid={`${testId}-option-${mode}`}
                  data-option={mode}
                >
                  {loadingOption === mode ? (
                    <CircularProgress size={15} />
                  ) : (
                    mode
                  )}
                </SwitchOption>
              ))}
            </SwitchOptions>
          </SwitchContainer>
        </SettingsBorder>
      ) : (
        <SwitchContainer {...rest} isShy={isShy}>
          {label && <StyledLabel>{label}</StyledLabel>}
          <SwitchOptions>
            <Slider position={activeIndex} count={options.length} />
            {options.map((mode) => (
              <SwitchOption
                key={mode}
                isActive={selected === mode}
                onClick={() => handleOptionSelect(mode)}
                data-testid={`${testId}-option-${mode}`}
                data-option={mode}
              >
                {loadingOption === mode ? <CircularProgress size={15} /> : mode}
              </SwitchOption>
            ))}
          </SwitchOptions>
        </SwitchContainer>
      )}
    </div>
  );
};
