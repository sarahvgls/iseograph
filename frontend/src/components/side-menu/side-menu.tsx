import {
  layoutModes,
  localStorageKeys,
  nodeWidthModes,
} from "../../theme/types.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";
import {
  Checkbox,
  CloseButton,
  FlexRow,
  PrimaryButton,
  SecondaryButton,
  StyledDropdown,
  StyledInputTextField,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { UserGuide } from "./user-guide.tsx";

export const SideMenu = ({
  isOpen,
  previousSelectedFile,
  onClose,
  nodeWidthMode,
  setNodeWidthMode,
  layoutMode,
  setLayoutMode,
  storeIsAnimated,
  setStoreIsAnimated,
  storeAllowInteraction,
  setStoreAllowInteraction,
}: {
  isOpen: boolean;
  previousSelectedFile: string;
  onClose: () => void;
  nodeWidthMode: nodeWidthModes;
  setNodeWidthMode: (mode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (mode: layoutModes) => void;
  storeIsAnimated: boolean;
  setStoreIsAnimated: (isAnimated: boolean) => void;
  storeAllowInteraction: boolean;
  setStoreAllowInteraction: (allowInteraction: boolean) => void;
}) => {
  const [selectedNodeWidthMode, setSelectedNodeWidthMode] =
    useState<nodeWidthModes>(nodeWidthMode);
  const [selectedLayoutMode, setSelectedLayoutMode] =
    useState<layoutModes>(layoutMode);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<string>(previousSelectedFile);
  const [newProteinName, setNewProteinName] = useState<string>("");
  const [allowInteraction, setAllowInteraction] = useState<boolean>(
    storeAllowInteraction,
  );
  const [isAnimated, setIsAnimated] = useState<boolean>(storeIsAnimated);

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
      if (!response.success) {
        console.error("Failed to convert file:", response.error);
        return;
      } else {
        // reset local storage
        localStorage.setItem(localStorageKeys.selectedFile, selectedFile);
        localStorage.removeItem(localStorageKeys.selectedIsoforms);
        localStorage.removeItem(localStorageKeys.isoformColorMapping);
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

    // clear dropdown
    setSelectedFile("");

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
    localStorage.setItem(localStorageKeys.nodeWidthMode, selectedNodeWidthMode);
    localStorage.setItem(localStorageKeys.layoutMode, selectedLayoutMode);
    localStorage.setItem(
      localStorageKeys.allowInteraction,
      String(allowInteraction),
    );
    localStorage.setItem(localStorageKeys.isAnimated, String(isAnimated));

    // Update global state
    setNodeWidthMode(selectedNodeWidthMode);
    setLayoutMode(selectedLayoutMode);
    setTimeout(() => {
      setStoreIsAnimated(isAnimated);
      setStoreAllowInteraction(allowInteraction);
    }, 500);

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
        <CloseButton onClose={onClose} />
      </div>

      {/*--- Protein Selection ---*/}

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

      {/*--- Display Settings ---*/}

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

        <div>
          <Checkbox
            label={"Allow movement of nodes [not saved]"}
            checked={allowInteraction}
            onChange={(checked) => {
              setAllowInteraction(checked);
            }}
          />
          <Checkbox
            label={"Show animated edges"}
            checked={isAnimated}
            onChange={(checked) => {
              setIsAnimated(checked);
            }}
          />
        </div>
      </StyledSection>

      <PrimaryButton onClick={handleSave}>Save Settings</PrimaryButton>

      {/*--- User Guide ---*/}

      <StyledSection style={{ marginTop: "24px" }}>
        <UserGuide />
      </StyledSection>
    </div>
  );
};
