import styled from "styled-components";
import { nodeWidthModes } from "../../../theme/types.tsx";
import { theme } from "../../../theme";

interface SequenceContainerProps {
  nodeWidthMode?: nodeWidthModes;
  sequence: string;
  isReversed?: boolean;
  containerWidthRef: React.RefObject<HTMLDivElement> | null;
  searchResultIndices?: {
    startIndex: number;
    endIndex: number;
  };
}

const CollapsedContainer = styled.div`
  max-width: 100px;
  overflow: auto;
  cursor: pointer;
  user-select: text;

  &::-webkit-scrollbar {
    width: 2px;
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 2px;
  }
`;

const Sequence = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 18px;
  color: #000;
  white-space: normal;
  cursor: pointer;
  user-select: text;
`;

export const SequenceContainer: React.FC<SequenceContainerProps> = ({
  nodeWidthMode,
  sequence,
  isReversed = false,
  containerWidthRef,
  searchResultIndices,
}) => {
  const { startIndex, endIndex } = searchResultIndices || {};

  const renderSequence = () => {
    if (startIndex !== undefined && endIndex !== undefined) {
      const length = sequence.length;
      const before = isReversed
        ? sequence.slice(0, length - endIndex)
        : sequence.slice(0, startIndex);
      const highlighted = isReversed
        ? sequence.slice(length - endIndex, length - startIndex)
        : sequence.slice(startIndex, endIndex);
      const after = isReversed
        ? sequence.slice(length - startIndex, length)
        : sequence.slice(endIndex);

      return (
        <>
          <span style={{ color: "black" }}>{before}</span>
          <span
            style={{
              color: theme.searchResult.matchingAminoAcid,
              fontWeight: "bold",
              // backgroundColor: "red",
            }}
          >
            {highlighted}
          </span>
          <span style={{ color: "black" }}>{after}</span>
        </>
      );
    }
    return <span style={{ color: "black" }}>{sequence}</span>;
  };

  return (
    <div ref={containerWidthRef}>
      {nodeWidthMode === nodeWidthModes.Expanded ? (
        <Sequence>{renderSequence()}</Sequence>
      ) : nodeWidthMode === nodeWidthModes.Small ? (
        <CollapsedContainer>
          <Sequence>{renderSequence()}</Sequence>
        </CollapsedContainer>
      ) : (
        <div></div>
      )}
    </div>
  );
};
