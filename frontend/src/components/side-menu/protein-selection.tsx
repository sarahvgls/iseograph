import {
  BoldStyledLabel,
  FlexRow,
  SecondaryButton,
  StyledDropdown,
  StyledInputTextField,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { MultiCompatibleCheckbox } from "../base-components/checkbox.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";
import { localStorageKeys } from "../../theme/types.tsx";

export const ProteinSelection = ({
  previousSelectedFile,
  previousSelectedNewProtein,
}: {
  previousSelectedFile: string;
  previousSelectedNewProtein: string;
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<string>(previousSelectedFile);
  const [newProteinName, setNewProteinName] = useState<string>(
    previousSelectedNewProtein,
  );

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

  const [shouldGenerateVariation, setShouldGenerateVariation] =
    useState<boolean>(false);
  const [shouldGenerateMutagen, setShouldGenerateMutagen] =
    useState<boolean>(false);
  const [shouldGenerateConflict, setShouldGenerateConflict] =
    useState<boolean>(false);

  const handleAddProtein = async () => {
    if (!newProteinName) {
      alert("Please enter a protein name.");
      return;
    }

    // clear dropdown
    setSelectedFile("");
    localStorage.removeItem(localStorageKeys.selectedFile);

    // TODO use shouldGenerate... booleans

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

  return (
    <StyledSection>
      <StyledSectionTitle>Protein Selection</StyledSectionTitle>

      <div style={{ marginBottom: "16px" }}>
        <BoldStyledLabel>Select protein from recently used:</BoldStyledLabel>
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
        <BoldStyledLabel>Add new protein:</BoldStyledLabel>
        <FlexRow>
          <StyledInputTextField
            type="text"
            placeholder="Enter protein name"
            value={newProteinName}
            onChange={(e) => setNewProteinName(e.target.value)}
          />
        </FlexRow>
        <StyledLabel>Generate graph with:</StyledLabel>
        <MultiCompatibleCheckbox
          label={"Variation"}
          checked={shouldGenerateVariation}
          onChange={(checked) => setShouldGenerateVariation(checked)}
        />
        <MultiCompatibleCheckbox
          label={"Mutagen"}
          checked={shouldGenerateMutagen}
          onChange={(checked) => setShouldGenerateMutagen(checked)}
        />
        <MultiCompatibleCheckbox
          label={"Conflict"}
          checked={shouldGenerateConflict}
          onChange={(checked) => setShouldGenerateConflict(checked)}
        />

        <SecondaryButton style={{ width: "100%" }} onClick={handleAddProtein}>
          Add
        </SecondaryButton>
      </div>
    </StyledSection>
  );
};
