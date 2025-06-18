import { layoutModes, nodeWidthModes } from "../../theme/types.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";
import {
  FlexRow,
  PrimaryButton,
  SecondaryButton,
  StyledDropdown,
  StyledInputTextField,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";

export const SettingsMenu = ({
  isOpen,
  onClose,
  nodeWidthMode,
  setNodeWidthMode,
  layoutMode,
  setLayoutMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  nodeWidthMode: nodeWidthModes;
  setNodeWidthMode: (mode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (mode: layoutModes) => void;
}) => {
  const [selectedNodeWidthMode, setSelectedNodeWidthMode] =
    useState<nodeWidthModes>(nodeWidthMode);
  const [selectedLayoutMode, setSelectedLayoutMode] =
    useState<layoutModes>(layoutMode);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [newProteinName, setNewProteinName] = useState<string>("");

  useEffect(() => {
    setSelectedNodeWidthMode(nodeWidthMode);
    setSelectedLayoutMode(layoutMode);
  }, [nodeWidthMode, layoutMode]);

  useEffect(() => {
    const getFileNames = async () => {
      const response = await callApi("api/get_available_files/");
      if (!response.success) {
        console.error("Failed to fetch file names");
        return;
      } else {
        const names = response.data || [];

        setFileNames(names);
        if (names.length > 0) {
          setSelectedFile(names[0]); // Set the first file as selected by default
        }
      }
    };

    void getFileNames();
  }, []);

  const handleRecentFileSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      const response = await callApiWithParameters("api/convert_file/", {
        file_name: selectedFile,
      });
      console.log("Response from convert_file:", response);
      if (!response.success) {
        console.error("Failed to convert file:", response.error);
        return;
      }
    } catch (error) {
      console.error("Error executing script:", error);
    }
  };

  const handleAddProtein = async () => {
    if (!newProteinName) {
      alert("Please enter a protein name.");
      return;
    }

    alert("not implemented yet. Protein: " + newProteinName);
    // try {
    //   const response = await callApiWithParameters("api/add_protein/", {
    //     protein_name: proteinName,
    //   });
    //   console.log("Response from add_protein:", response);
    //   if (!response.success) {
    //     console.error("Failed to add protein:", response.error);
    //     return;
    //   }
    //   // Optionally, refresh the file names or handle success
    // } catch (error) {
    //   console.error("Error adding protein:", error);
    // }
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("defaultNodeWidthMode", selectedNodeWidthMode);
    localStorage.setItem("defaultLayoutMode", selectedLayoutMode);

    // Update global state
    setNodeWidthMode(selectedNodeWidthMode);
    setLayoutMode(selectedLayoutMode);

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "350px",
        height: "100%",
        backgroundColor: "white",
        boxShadow: "-2px 0 15px rgba(0, 0, 0, 0.15)",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease-in-out",
        zIndex: 1000,
        padding: "24px",
        boxSizing: "border-box",
        overflow: "auto",
        color: "#333",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "12px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>
          Settings
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#f5f5f5")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          ✕
        </button>
      </div>

      <StyledSection>
        <StyledSectionTitle>Protein Selection</StyledSectionTitle>

        <div style={{ marginBottom: "16px" }}>
          <StyledLabel>Select protein from recently used:</StyledLabel>
          <FlexRow>
            <StyledDropdown
              value={selectedFile}
              onChange={(e) => {
                setSelectedFile(e.target.value);
              }}
            >
              <option value="" disabled>
                -- Select a file --
              </option>
              {fileNames.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </StyledDropdown>
            <SecondaryButton onClick={handleRecentFileSubmit}>
              Load
            </SecondaryButton>
          </FlexRow>
        </div>

        <div>
          <StyledLabel>Add new protein:</StyledLabel>
          <FlexRow>
            <StyledInputTextField
              type="text"
              placeholder="Enter protein name"
              value={newProteinName}
              onChange={(e) => setNewProteinName(e.target.value)}
            />
            <SecondaryButton onClick={handleAddProtein}>Add</SecondaryButton>
          </FlexRow>
        </div>
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle>Display Settings</StyledSectionTitle>

        <div style={{ marginBottom: "16px" }}>
          <StyledLabel>Default Node Width Mode:</StyledLabel>
          <StyledDropdown
            value={selectedNodeWidthMode}
            onChange={(e) =>
              setSelectedNodeWidthMode(e.target.value as nodeWidthModes)
            }
          >
            {Object.values(nodeWidthModes).map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </StyledDropdown>
        </div>

        <div>
          <StyledLabel>Default Layout Mode:</StyledLabel>
          <StyledDropdown
            value={selectedLayoutMode}
            onChange={(e) =>
              setSelectedLayoutMode(e.target.value as layoutModes)
            }
          >
            {Object.values(layoutModes).map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </StyledDropdown>
        </div>
      </StyledSection>

      <PrimaryButton onClick={handleSave}>Save Settings</PrimaryButton>

      <StyledSection style={{ marginTop: "24px" }}>
        <StyledSectionTitle>User Guide</StyledSectionTitle>
        <ul
          style={{
            margin: "0",
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#555",
          }}
        >
          <li style={{ marginBottom: "8px" }}>
            Double click on a node to focus it
          </li>
          <li style={{ marginBottom: "8px" }}>
            Single click on a node to change its width mode
          </li>
          <li>Use arrow keys to navigate between nodes</li>
        </ul>
      </StyledSection>
    </div>
  );
};
