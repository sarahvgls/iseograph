import useGraphStore from "../../graph/store.ts";
import type { PeptideLog } from "../../theme/types.tsx";

export const PeptideMonitor = () => {
  const { hoveredNodeId, getPeptides } = useGraphStore((state) => ({
    hoveredNodeId: state.hoveredNode,
    getPeptides: state.getPeptidesForNode,
  }));

  const currentPeptideLog: PeptideLog = getPeptides(
    hoveredNodeId ? hoveredNodeId : "",
  );
  const intensityStats = currentPeptideLog.intensityStats || {};

  return (
    <div>
      <h3>Peptide Monitor</h3>
      {currentPeptideLog && currentPeptideLog.peptideEntries?.length > 0 ? (
        <>
          <ul>
            {currentPeptideLog.peptideEntries.map((peptide, index) => (
              <li key={index}>
                <strong>Peptide:</strong> {peptide.peptide} <br />
                <strong>Intensity:</strong>{" "}
                {peptide.intensities.map((intensity) => (
                  <>
                    <span>Intensity: {intensity.intensity} </span>
                    <span>Source: {intensity.source} </span>
                  </>
                ))}{" "}
                <br />
              </li>
            ))}
          </ul>
          <ul>
            {intensityStats &&
              Object.entries(intensityStats).map(([source, stats]) => (
                <li key={source}>
                  <strong>{source}:</strong> Mean: {stats.mean}, Max:{" "}
                  {stats.max}, Min: {stats.min}, median: {stats.median}
                  <>
                    Normalized mean: {stats.normalizedMean}, nom-max:{" "}
                    {stats.normalizedMax}, nom-min: {stats.normalizedMin},
                    nom-median: {stats.normalizedMedian}
                  </>
                </li>
              ))}
          </ul>
        </>
      ) : (
        <p>No peptides found for this node.</p>
      )}
    </div>
  );
};
