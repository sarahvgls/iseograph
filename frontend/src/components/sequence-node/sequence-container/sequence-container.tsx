import styled from "styled-components";
import { nodeWidthModes } from "../../../theme/types.tsx";

interface SequenceContainerProps {
  nodeWidthMode?: nodeWidthModes;
  sequence: string;
  containerWidthRef: React.RefObject<HTMLDivElement> | null;
}

const CollapsedSequence = styled.div`
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 18px;
  white-space: normal;
  max-width: 100px;
  overflow: auto;

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
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 18px;
  color: #000;
  white-space: normal;
  overflow: hidden;
`;

export const SequenceContainer: React.FC<SequenceContainerProps> = ({
  nodeWidthMode,
  sequence,
  containerWidthRef,
}) => {
  return (
    <div ref={containerWidthRef}>
      {nodeWidthMode === nodeWidthModes.Expanded ? (
        <Sequence>{sequence}</Sequence>
      ) : nodeWidthMode === nodeWidthModes.Small ? (
        <CollapsedSequence>{sequence}</CollapsedSequence>
      ) : (
        <div></div>
      )}
    </div>
  );
};
