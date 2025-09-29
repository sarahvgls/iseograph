import styled from "styled-components";

const SwitchContainer = styled.div`
  border-radius: 8px;
  width: 100%;
  margin: 0 0 10px 0;
  align-self: flex-end;
  pointer-events: auto;
`;

const SwitchOptions = styled.div`
  display: flex;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 4px;
  height: 40px;
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
  background-color: #dfdfdf;
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
  transition: color 0.2s ease;
  border-radius: 3px;
  padding: 0;
`;

export const SettingsSwitch = ({
  options,
  selected,
  selectOption,
  ...rest
}: {
  options: string[];
  selected: string;
  selectOption: (newOption: string) => void;
  isShy?: boolean;
}) => {
  const activeIndex = options.findIndex((option) => option === selected);
  return (
    <SwitchContainer {...rest}>
      <SwitchOptions>
        <Slider position={activeIndex} count={options.length} />
        {options.map((mode) => (
          <SwitchOption
            key={mode}
            isActive={selected === mode}
            onClick={() => selectOption(mode)}
          >
            {mode}
          </SwitchOption>
        ))}
      </SwitchOptions>
    </SwitchContainer>
  );
};
