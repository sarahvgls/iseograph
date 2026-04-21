import React from "react";
import styled from "styled-components";

interface FileMetadata {
  filename: string;
  created_at: string;
  protein_id?: string;
  uniprot_id?: string;
  features?: string[];
  digestion?: string;
  collapse_edges?: boolean;
  peptide_file?: string | null;
  metadata_file?: string | null;
  peptide_file_name?: string | null;
  metadata_file_name?: string | null;
  compare_column?: string | null;
  has_intensity?: boolean;
  count_peptides?: boolean;
  merge_peptides?: boolean;
  o_aggregation?: string | null;
  m_aggregation?: string | null;
  substitute?: boolean;
  peptide_overlap_handling?: string;
  multiple_peptide_instances?: string;
}

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 12px;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  color: #666;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const Value = styled.span<{ isEmpty?: boolean }>`
  color: ${(props) => (props.isEmpty ? "#ccc" : "#333")};
  font-size: 12px;
  word-break: break-word;
  font-family: "Monaco", "Menlo", monospace;
`;

const FeaturesList = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const FeatureTag = styled.span`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
`;

const BooleanBadge = styled.span<{ value: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  background-color: ${(props) => (props.value ? "#c8e6c9" : "#f5f5f5")};
  color: ${(props) => (props.value ? "#2e7d32" : "#999")};
  width: fit-content;
`;

export const MetadataDisplay: React.FC<{ metadata: FileMetadata }> = ({
  metadata,
}) => {
  // Check if a peptide file was uploaded
  const hasPeptideFile = !!(metadata.peptide_file_name || metadata.peptide_file);

  return (
    <MetadataGrid>
      {/* Protein Information */}
      {metadata.protein_id && (
        <MetadataItem>
          <Label>Protein ID</Label>
          <Value>{metadata.protein_id}</Value>
        </MetadataItem>
      )}

      {metadata.uniprot_id && (
        <MetadataItem>
          <Label>UniProt ID</Label>
          <Value>{metadata.uniprot_id}</Value>
        </MetadataItem>
      )}

      {/* Features */}
      {metadata.features && metadata.features.length > 0 && (
        <MetadataItem>
          <Label>Features</Label>
          <FeaturesList>
            {metadata.features.map((feature) => (
              <FeatureTag key={feature}>{feature}</FeatureTag>
            ))}
          </FeaturesList>
        </MetadataItem>
      )}

      {/* Digestion */}
      {metadata.digestion && (
        <MetadataItem>
          <Label>Digestion</Label>
          <Value>{metadata.digestion}</Value>
        </MetadataItem>
      )}

      {/* Collapse Edges */}
      {/*{metadata.collapse_edges !== undefined && (*/}
      {/*  <MetadataItem>*/}
      {/*    <Label>Collapse Edges</Label>*/}
      {/*    <BooleanBadge value={metadata.collapse_edges}>*/}
      {/*      {metadata.collapse_edges ? "Yes" : "No"}*/}
      {/*    </BooleanBadge>*/}
      {/*  </MetadataItem>*/}
      {/*)}*/}

       {/* Intensity - only show if peptide file exists */}
       {hasPeptideFile && metadata.has_intensity !== undefined && (
         <MetadataItem>
           <Label>Intensity</Label>
           <BooleanBadge value={metadata.has_intensity}>
             {metadata.has_intensity ? "Yes" : "No"}
           </BooleanBadge>
         </MetadataItem>
       )}

       {/* Count Peptides - only show if peptide file exists */}
       {hasPeptideFile && metadata.count_peptides !== undefined && (
         <MetadataItem>
           <Label>Count Peptides</Label>
           <BooleanBadge value={metadata.count_peptides}>
             {metadata.count_peptides ? "Yes" : "No"}
           </BooleanBadge>
         </MetadataItem>
       )}

       {/* Merge Peptides - only show if peptide file exists */}
       {hasPeptideFile && metadata.merge_peptides !== undefined && (
         <MetadataItem>
           <Label>Merge Peptides</Label>
           <BooleanBadge value={metadata.merge_peptides}>
             {metadata.merge_peptides ? "Yes" : "No"}
           </BooleanBadge>
         </MetadataItem>
       )}

      {/* Substitute */}
      {metadata.substitute !== undefined && (
        <MetadataItem>
          <Label>Substitute</Label>
          <BooleanBadge value={metadata.substitute}>
            {metadata.substitute ? "Yes" : "No"}
          </BooleanBadge>
        </MetadataItem>
      )}

        {/* Aggregation Options - only show if peptide file exists */}
        {hasPeptideFile && metadata.o_aggregation && (
          <MetadataItem>
            <Label>Output Aggregation</Label>
            <Value>{metadata.o_aggregation}</Value>
          </MetadataItem>
        )}

        {hasPeptideFile && metadata.m_aggregation && (
          <MetadataItem>
            <Label>Metadata Aggregation</Label>
            <Value>{metadata.m_aggregation}</Value>
          </MetadataItem>
        )}

        {/* Peptide Handling Methods - only show if peptide file exists */}
        {hasPeptideFile && metadata.peptide_overlap_handling && (
          <MetadataItem>
            <Label>Overlapping Peptides</Label>
            <Value>
              {metadata.peptide_overlap_handling === "merge"
                ? "Merged"
                : "Default"}
            </Value>
          </MetadataItem>
        )}

        {hasPeptideFile && metadata.multiple_peptide_instances && (
          <MetadataItem>
            <Label>Multiple Instances</Label>
            <Value>
              {metadata.multiple_peptide_instances === "aggregated"
                ? `Aggregated (${metadata.m_aggregation || "median"})`
                : "Default"}
            </Value>
          </MetadataItem>
        )}

       {/* File Names */}
       {metadata.peptide_file_name && (
         <MetadataItem>
           <Label>Peptide File Name</Label>
           <Value>{metadata.peptide_file_name}</Value>
         </MetadataItem>
       )}

       {metadata.metadata_file_name && (
         <MetadataItem>
           <Label>Metadata File Name</Label>
           <Value>{metadata.metadata_file_name}</Value>
         </MetadataItem>
       )}

       {/* Metadata Column for Comparison */}
       {metadata.compare_column && (
         <MetadataItem>
           <Label>Metadata Column</Label>
           <Value>{metadata.compare_column}</Value>
         </MetadataItem>
       )}

       {/* File Paths (fallback display) */}
       {metadata.peptide_file && !metadata.peptide_file_name && (
         <MetadataItem>
           <Label>Peptide File</Label>
           <Value>{metadata.peptide_file}</Value>
         </MetadataItem>
       )}

       {metadata.metadata_file && !metadata.metadata_file_name && (
         <MetadataItem>
           <Label>Metadata File</Label>
           <Value>{metadata.metadata_file}</Value>
         </MetadataItem>
       )}
    </MetadataGrid>
  );
};









