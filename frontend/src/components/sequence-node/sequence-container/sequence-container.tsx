import styled from "styled-components";

interface SequenceContainerProps {
  collapsed?: boolean;
  sequence: string;
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
  collapsed,
  sequence,
}) => {
  return (
    <div>
      {collapsed ? (
        <CollapsedSequence>{sequence}</CollapsedSequence>
      ) : (
        <Sequence>{sequence}</Sequence>
      )}
    </div>
  );
};
