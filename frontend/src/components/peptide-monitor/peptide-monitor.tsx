import useGraphStore from "../../graph/store.ts";
import type { PeptideLog } from "../../theme/types.tsx";
import styled from "styled-components";
import { CloseButton } from "../base-components";

const Container = styled.div<{ isOpen: boolean }>`
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 100%;
  overflow-y: auto;
  font-size: 0.85rem;
  width: 200px;
  transform: translateX(${({ isOpen }) => (isOpen ? "0" : "-110%")});
  transition: transform 0.2s ease-in-out;
  pointer-events: auto;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
  font-size: 0.95rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PeptideEntries = styled.div`
  max-height: 220px;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 6px 0;
  color: #444;
  font-size: 0.85rem;
`;

const PeptideCard = styled.div`
  background: white;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const PeptideSequence = styled.div`
  margin-bottom: 3px;
  font-size: 0.8rem;
  overflow-wrap: break-word;
`;

const Label = styled.span`
  font-weight: 600;
  color: #555;
`;

const IntensityList = styled.ul`
  list-style: none;
  padding-left: 8px;
  margin: 2px 0;
`;

const IntensityItem = styled.li`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1px;
  font-size: 0.75rem;
`;

const Source = styled.span`
  color: #666;
  margin-right: 5px;
`;

const Value = styled.span`
  font-family: monospace;
`;

const NoData = styled.p`
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 8px;
  font-size: 0.8rem;
`;

const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 0.7rem;
`;

const TableHeader = styled.th`
  padding: 6px 4px;
  text-align: center;
  border-bottom: 1px solid #eee;
  color: #555;
  font-weight: 600;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const TableCell = styled.td`
  padding: 4px;
  text-align: center;
  border-right: 1px solid #eee;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:last-child {
    border-right: none;
  }
`;

const StatCategory = styled.td`
  padding: 4px;
  text-align: left;
  font-weight: 500;
  color: #666;
  border-right: 1px solid #eee;
`;

const SectionRow = styled.tr`
  background-color: #f0f0f0;
`;

const SectionHeader = styled.td`
  padding: 5px 4px;
  font-weight: 600;
  color: #444;
  font-size: 0.75rem;
  text-align: left;
`;

export const PeptideMonitor = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const { selectedNodeId, setSelectedNodeId, getPeptides } = useGraphStore(
    (state) => ({
      selectedNodeId: state.clickedNode,
      setSelectedNodeId: state.setClickedNode,
      getPeptides: state.getPeptidesForNode,
    }),
  );

  const currentPeptideLog: PeptideLog = getPeptides(
    selectedNodeId ? selectedNodeId : "",
  );
  const intensityStats = currentPeptideLog.intensityStats || {};
  const hasPeptides =
    currentPeptideLog && currentPeptideLog.peptideEntries?.length > 0;

  const sources = Object.keys(intensityStats);

  return (
    <Container isOpen={isOpen}>
      <Title>
        Peptide Monitor
        <CloseButton
          onClose={() => {
            setSelectedNodeId("");
            setIsOpen(false);
          }}
        />
      </Title>
      {hasPeptides ? (
        <Content>
          <PeptideEntries>
            <SectionTitle>Peptide Entries:</SectionTitle>
            {currentPeptideLog.peptideEntries.map((peptide, index) => (
              <PeptideCard key={index}>
                <PeptideSequence>
                  <Label>Sequence:</Label> {peptide.peptide}
                </PeptideSequence>
                <div>
                  <Label>Intensity: </Label>
                  {peptide.intensities.length > 0 ? (
                    <IntensityList>
                      {peptide.intensities.map((intensity, idx) => (
                        <IntensityItem key={idx}>
                          <Source>{intensity.source}:</Source>
                          <Value>{intensity.intensity}</Value>
                        </IntensityItem>
                      ))}
                    </IntensityList>
                  ) : (
                    <p>No intensities found. Add metadata.</p>
                  )}
                </div>
              </PeptideCard>
            ))}
          </PeptideEntries>

          {sources.length > 0 &&
            currentPeptideLog.peptideEntries.length > 1 && (
              <div>
                <SectionTitle>Intensity Stats:</SectionTitle>
                <StatsTable>
                  <thead>
                    <tr>
                      <TableHeader>Stat</TableHeader>
                      {sources.map((source) => (
                        <TableHeader key={source}>{source}</TableHeader>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <SectionRow>
                      <SectionHeader colSpan={sources.length + 1}>
                        Raw Values
                      </SectionHeader>
                    </SectionRow>
                    <TableRow>
                      <StatCategory>Mean</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].mean}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Max</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].max}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Min</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].min}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Median</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].median}
                        </TableCell>
                      ))}
                    </TableRow>

                    <SectionRow>
                      <SectionHeader colSpan={sources.length + 1}>
                        Normalized Values
                      </SectionHeader>
                    </SectionRow>
                    <TableRow>
                      <StatCategory>Mean</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].normalizedMean}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Max</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].normalizedMax}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Min</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].normalizedMin}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <StatCategory>Median</StatCategory>
                      {sources.map((source) => (
                        <TableCell key={source}>
                          {intensityStats[source].normalizedMedian}
                        </TableCell>
                      ))}
                    </TableRow>
                  </tbody>
                </StatsTable>
              </div>
            )}
        </Content>
      ) : (
        <NoData>
          No peptides found for this node. Click on a node with peptides to see
          more.
        </NoData>
      )}
    </Container>
  );
};
