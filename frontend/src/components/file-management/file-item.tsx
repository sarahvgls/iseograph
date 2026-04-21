import React, { useState } from "react";
import styled from "styled-components";
import { MetadataDisplay } from "./metadata-display";
import { IconButton } from "../icon/icon";

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
  compare_column?: string | null;
  has_intensity?: boolean;
  count_peptides?: boolean;
  merge_peptides?: boolean;
  o_aggregation?: string | null;
  m_aggregation?: string | null;
  substitute?: boolean;
}

const FileItemContainer = styled.div`
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 16px;
  transition: background-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: #f9f9f9;
  }
`;

const FileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  gap: 12px;

  &:hover {
    .expand-icon {
      opacity: 1;
    }
  }
`;

const FileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FileName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  word-break: break-word;
`;

const FileDate = styled.div`
  font-size: 12px;
  color: #999;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const DeleteButton = styled(IconButton)`
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ExpandIcon = styled.span<{ isExpanded: boolean }>`
  opacity: 0.5;
  transition:
    transform 0.2s,
    opacity 0.2s;
  margin-left: 8px;
  font-size: 16px;
  transform: rotate(${(props) => (props.isExpanded ? "180deg" : "0deg")});
`;

const MetadataSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #efefef;
`;

export const FileItem: React.FC<{
  file: FileMetadata;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ file, onDelete, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileItemClick = (e: React.MouseEvent) => {
    // Prevent selection if clicking on expand icon or delete button
    const target = e.target as HTMLElement;
    const isExpandIcon = target.closest(".expand-icon");
    const isDeleteButton = target.closest("svg") || target.closest("button");

    if (!isExpandIcon && !isDeleteButton) {
      onSelect();
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <FileItemContainer onClick={handleFileItemClick}>
      <FileHeader>
        <FileInfo>
          <FileName>{file.filename}</FileName>
          <FileDate>{formatDate(file.created_at)}</FileDate>
        </FileInfo>
        <ActionButtons>
          <DeleteButton icon="trash" onClick={handleDeleteClick} isBig />
          <ExpandIcon
            isExpanded={isExpanded}
            className="expand-icon"
            onClick={handleExpandClick}
          >
            ▼
          </ExpandIcon>
        </ActionButtons>
      </FileHeader>

      {isExpanded && (
        <MetadataSection>
          <MetadataDisplay metadata={file} />
        </MetadataSection>
      )}
    </FileItemContainer>
  );
};
