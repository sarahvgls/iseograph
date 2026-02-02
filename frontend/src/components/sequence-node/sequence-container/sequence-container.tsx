import styled from "styled-components";
import { nodeWidthModes } from "../../../theme/types.tsx";
import { theme } from "../../../theme";

interface SequenceContainerProps {
  nodeWidthMode?: nodeWidthModes;
  sequence: string;
  isReversed?: boolean;
  containerWidthRef: React.RefObject<HTMLDivElement> | null;
  searchResultIndices?: Array<{
    startIndex: number;
    endIndex: number;
  }>;
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
  const renderSequence = () => {
    if (!searchResultIndices || searchResultIndices.length === 0) {
      return <span style={{ color: "black" }}>{sequence}</span>;
    }

    const length = sequence.length;

    // Convert indices based on isReversed flag
    const adjustedRanges = searchResultIndices.map(
      ({ startIndex, endIndex }) => {
        if (isReversed) {
          return {
            start: length - endIndex,
            end: length - startIndex,
          };
        }
        return {
          start: startIndex,
          end: endIndex,
        };
      },
    );

    // Sort and merge overlapping ranges
    const sortedRanges = adjustedRanges.sort((a, b) => a.start - b.start);
    const mergedRanges: Array<{ start: number; end: number }> = [];

    for (const range of sortedRanges) {
      if (mergedRanges.length === 0) {
        mergedRanges.push(range);
      } else {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        if (range.start <= lastRange.end) {
          // Overlapping or adjacent, merge them
          lastRange.end = Math.max(lastRange.end, range.end);
        } else {
          mergedRanges.push(range);
        }
      }
    }

    // Build the rendered sequence with highlights
    const parts: React.ReactNode[] = [];
    let currentPos = 0;

    for (let i = 0; i < mergedRanges.length; i++) {
      const range = mergedRanges[i];

      // Add text before the highlight
      if (currentPos < range.start) {
        parts.push(
          <span key={`before-${i}`} style={{ color: "black" }}>
            {sequence.slice(currentPos, range.start)}
          </span>,
        );
      }

      // Add highlighted text
      parts.push(
        <span
          key={`highlight-${i}`}
          style={{
            color: theme.searchResult.matchingAminoAcid,
            fontWeight: "bold",
          }}
        >
          {sequence.slice(range.start, range.end)}
        </span>,
      );

      currentPos = range.end;
    }

    // Add remaining text after the last highlight
    if (currentPos < length) {
      parts.push(
        <span key="after" style={{ color: "black" }}>
          {sequence.slice(currentPos)}
        </span>,
      );
    }

    return <>{parts}</>;
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
