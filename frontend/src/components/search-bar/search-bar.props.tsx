export interface SearchBarProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: () => void;
  searchResultText: string;
  maxPathLength?: number;
  onMaxPathLengthChange?: (value: number) => void;
}
