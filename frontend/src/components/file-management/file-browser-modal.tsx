import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { CircularProgress } from "@mui/material";
import { callApiWithParameters } from "../../helper/api-call.ts";
import { callApi } from "../../helper/api-call.ts";
import { FileItem } from "./file-item";
import { IconButton } from "../icon";
import { createPortal } from "react-dom";

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

const GlobalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

const CenteredContainer = styled.div`
  position: relative;
  width: auto;
  max-width: 90vw;
  max-height: 90vh;
  z-index: 10002;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 40vw;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
    flex: 1;
    min-width: 200px;
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

const SearchContainer = styled.div<{ isVisible: boolean }>`
  display: ${(props) => (props.isVisible ? "flex" : "none")};
  padding: 10px 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: #999;
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle outside click to close modal
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    const query = searchQuery.toLowerCase();
    return files.filter((file) => {
      // Search in filename
      if (file.filename.toLowerCase().includes(query)) {
        return true;
      }
      // Search in protein ID
      if (file.protein_id?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in UniProt ID
      if (file.uniprot_id?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in features
      if (file.features?.some((f) => f.toLowerCase().includes(query))) {
        return true;
      }
      // Search in digestion method
      if (file.digestion?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in file names
      if (file.peptide_file?.toLowerCase().includes(query)) {
        return true;
      }
      if (file.metadata_file?.toLowerCase().includes(query)) {
        return true;
      }
      // Search in compare column
      if (file.compare_column?.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });
  }, [files, searchQuery]);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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

  return createPortal(
    <GlobalContainer>
      <CenteredContainer ref={containerRef}>
        <ModalContainer>
          <Header>
            <h2>Select File from Recently Used</h2>
            <IconButton
              icon="search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            />
            <button onClick={onClose}>×</button>
          </Header>
          <SearchContainer isVisible={isSearchOpen}>
            <SearchInput
              ref={searchInputRef}
              type="text"
              placeholder="Search by filename, protein ID, features, digestion method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
          <Content>
            {loading ? (
              <LoadingContainer>
                <CircularProgress size={40} />
              </LoadingContainer>
            ) : error ? (
              <EmptyState>
                <p>{error}</p>
              </EmptyState>
            ) : filteredFiles.length === 0 ? (
              <EmptyState>
                <p>
                  {searchQuery
                    ? "No files match your search."
                    : "No files available yet."}
                </p>
                {!searchQuery && (
                  <p>Generate a protein graph to get started.</p>
                )}
              </EmptyState>
            ) : (
              filteredFiles.map((file) => (
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
      </CenteredContainer>
    </GlobalContainer>,
    document.body,
  );
};
