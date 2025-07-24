import useGraphStore from "../../graph/store.ts";
import type { PeptideLog } from "../../theme/types.tsx";

export const PeptideMonitor = () => {
  const { hoveredNodeId, getPeptides } = useGraphStore((state) => ({
    hoveredNodeId: state.hoveredNode,
    getPeptides: state.getPeptides,
  }));

  const currentPeptideLog: PeptideLog = getPeptides(
    hoveredNodeId ? hoveredNodeId : "",
  );
  const intensityStats = currentPeptideLog.intensities || {};

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
                  <strong>{source}:</strong> Mean: {stats.meanIntensity}, Max:{" "}
                  {stats.maxIntensity}, Min: {stats.minIntensity}, median:{" "}
                  {stats.medianIntensity}
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
