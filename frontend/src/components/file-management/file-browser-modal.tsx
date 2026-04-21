import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { CircularProgress } from "@mui/material";
import { callApiWithParameters } from "../../helper/api-call.ts";
import { callApi } from "../../helper/api-call.ts";
import { FileItem } from "./file-item";
import { useOutsidePress } from "../../helper/outside-press.tsx";

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

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  z-index: 1001;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }

  button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #000;
    }
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;

    &:hover {
      background: #555;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 14px;

  p {
    margin: 0;
  }
`;

export const FileBrowserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (filename: string) => void;
  onFileDeleted: () => void;
}> = ({ isOpen, onClose, onFileSelected, onFileDeleted }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null!);

  useOutsidePress(modalRef, onClose, isOpen, false);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await callApi("api/get_files_with_metadata/");
      if (response.success) {
        setFiles(response.data);
      } else {
        setError("Failed to load files");
      }
    } catch (err) {
      setError("Error loading files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (filename: string) => {
    try {
      const response = await callApiWithParameters("api/delete_file/", {
        filename: filename,
      });
      if (response.success) {
        // Remove file from list
        setFiles(files.filter((f) => f.filename !== filename));
        onFileDeleted();
      } else {
        setError("Failed to delete file");
      }
    } catch (err) {
      setError("Error deleting file");
      console.error(err);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Backdrop>
      <ModalContainer ref={modalRef}>
        <Header>
          <h2>Select File from Recently Used</h2>
          <button onClick={onClose}>×</button>
        </Header>
        <Content>
          {loading ? (
            <LoadingContainer>
              <CircularProgress size={40} />
            </LoadingContainer>
          ) : error ? (
            <EmptyState>
              <p>{error}</p>
            </EmptyState>
          ) : files.length === 0 ? (
            <EmptyState>
              <p>No files available yet.</p>
              <p>Generate a protein graph to get started.</p>
            </EmptyState>
          ) : (
            files.map((file) => (
              <FileItem
                key={file.filename}
                file={file}
                onSelect={() => {
                  onFileSelected(file.filename);
                  onClose();
                }}
                onDelete={() => handleFileDelete(file.filename)}
              />
            ))
          )}
        </Content>
      </ModalContainer>
    </Backdrop>
  );
};
