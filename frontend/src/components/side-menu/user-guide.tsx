import { StyledSection, StyledSectionTitle } from "../base-components";

import React from "react";

const interactionData = [
  {
    title: "Core graph interactions",
    items: [
      "Click node: open peptide details.",
      "Double‑click node: cycle width (Expanded → Small → Collapsed).",
      "Arrow controls (→ / ←): focus next / previous node; center: reset view.",
      "Hover node: highlight connected edges.",
      "Drag canvas: pan view.",
      "Scroll: zoom in/out.",
    ],
  },
  // {
  //   title: "Coloring and data",
  //   items: [
  //     "Glow method: count (peptide number) vs intensity (median/mean/max/min).",
  //     "Pick color scale or disable it (no glow).",
  //     "Change intensity source; Dual view compares two sources in a split screen.",
  //     "Isoforms: select a few to restrict colored edges; colors persist.",
  //   ],
  // },
  {
    title: "Data & persistence",
    items: [
      "Upload file: new data applied after successful upload.",
      "Settings & selections persist (local storage). Clear to reset.",
    ],
  },
  {
    title: "Tips and tricks",
    items: [
      "No glow? Check: not Disabled, data source exists, isoform selected, zero values not hidden.",
      "Odd ordering? Try other layout or adjust Row Width.",
      "Missing peptides? Check substitution (I/L) and file format.",
    ],
  },
];

export const InteractionList: React.FC = () => (
  <div style={{ lineHeight: 1.6, marginTop: "1rem" }}>
    {interactionData.map((section, idx) => (
      <div key={idx} style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>{section.title}</h3>
        <ul style={{ paddingLeft: "1.5rem" }}>
          {section.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

export const UserGuide = () => {
  return (
    <div>
      <StyledSection style={{ marginTop: "24px" }}>
        <StyledSectionTitle>User Guide</StyledSectionTitle>
        <InteractionList />
      </StyledSection>
    </div>
  );
};
