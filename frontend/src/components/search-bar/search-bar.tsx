import { memo, useState, useEffect } from "react";
import styled from "styled-components";
import type { SearchBarProps } from "./search-bar.props.tsx";
import { SecondaryButton } from "../base-components";
import { Icon } from "../icon";

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  top: 5px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const SearchInput = styled.input`
  width: 250px;
  padding: 8px 32px 8px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

const SettingsIconButton = styled.button`
  position: absolute;
  right: 80px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }

  &:focus {
    outline: none;
  }
`;

const SettingsPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 150px;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #333;
`;

const SettingInput = styled.input`
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 90%;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

const SearchResultText = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f0f0f0;
  color: #333;
  font-size: 14px;
  text-align: center;
  min-height: 20px;
`;

export const SearchBar = memo(function SearchBar({
  searchValue,
  onSearchValueChange,
  onSearch,
  searchResultText,
  maxPathLength = 5,
  onMaxPathLengthChange,
}: SearchBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [maxPathLengthInput, setMaxPathLengthInput] = useState<string>(
    String(maxPathLength),
  );

  // Update local input state when prop changes
  useEffect(() => {
    setMaxPathLengthInput(String(maxPathLength));
  }, [maxPathLength]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleMaxPathLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputValue = e.target.value;
    setMaxPathLengthInput(inputValue);

    // Only update parent if it's a valid number
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && onMaxPathLengthChange) {
      onMaxPathLengthChange(numValue);
    }
  };

  const handleMaxPathLengthBlur = () => {
    // On blur, validate and reset to last valid value if invalid
    const numValue = parseInt(maxPathLengthInput, 10);
    if (isNaN(numValue) || numValue < 1) {
      setMaxPathLengthInput(String(maxPathLength));
    }
  };

  return (
    <SearchContainer onClick={() => isSettingsOpen && setIsSettingsOpen(false)}>
      <SearchInputWrapper>
        <SearchInput
          type="search"
          placeholder="Enter an amino acid sequence"
          value={searchValue}
          onChange={(e) => onSearchValueChange(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <SettingsIconButton
          onClick={handleSettingsClick}
          title="Search settings"
          type="button"
        >
          <Icon icon={"settings"} />
        </SettingsIconButton>
        <SettingsPanel
          $isOpen={isSettingsOpen}
          onClick={(e) => e.stopPropagation()}
        >
          <SettingRow>Advanced Settings</SettingRow>
          <SettingRow>
            <SettingLabel htmlFor="maxPathLength">
              Maximum Path Length (amount of nodes)
            </SettingLabel>
            <SettingInput
              id="maxPathLength"
              type="number"
              min="1"
              value={maxPathLengthInput}
              onChange={handleMaxPathLengthChange}
              onBlur={handleMaxPathLengthBlur}
            />
          </SettingRow>
        </SettingsPanel>
        <SecondaryButton style={{ marginLeft: "8px" }} onClick={onSearch}>
          Search
        </SecondaryButton>
      </SearchInputWrapper>
      {searchResultText && (
        <SearchResultText>{searchResultText}</SearchResultText>
      )}
    </SearchContainer>
  );
});
