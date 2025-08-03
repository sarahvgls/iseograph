import {
  BoldStyledLabel,
  FlexRow,
  SecondaryButton,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { MultiCompatibleCheckbox } from "../base-components/checkbox.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";
import { localStorageKeys } from "../../theme/types.tsx";
import { DropdownComponent } from "../base-components/dropdown.tsx";
import { TextComponent } from "../base-components/textfield.tsx";
import { tooltips } from "./tooltip-content.tsx";
import { FileUpload } from "../base-components/file-upload.tsx";

export const ProteinSelection = ({
  previousSelectedFile,
}: {
  previousSelectedFile: string;
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<string>(previousSelectedFile);

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

  // configurations for new protein
  const [newProteinName, setNewProteinName] = useState<string>("");
  const [shouldGenerateVariant, setShouldGenerateVariant] =
    useState<boolean>(true);
  const [shouldGenerateMutagen, setShouldGenerateMutagen] =
    useState<boolean>(true);
  const [shouldGenerateConflict, setShouldGenerateConflict] =
    useState<boolean>(true);
  const [peptideFilePath, setPeptideFilePath] = useState<string>(""); // Store full path
  const [metadataFilePath, setMetadataFilePath] = useState<string>(""); // Store full path
  const [compareColumn, setCompareColumn] = useState<string>("");
  const [hasIntensity, setHasIntensity] = useState<boolean>(true);
  const [shouldCountPeptides, setShouldCountPeptides] = useState<boolean>(true);
  const [shouldMergePeptides, setShouldMergePeptides] =
    useState<boolean>(false);

  const AggregationOptions = ["Median", "Sum", "Mean", "None"];
  type AggregationOptions =
    (typeof AggregationOptions)[keyof typeof AggregationOptions];
  const [selectedOAggregation, setSelectedOAggregation] =
    useState<AggregationOptions>(AggregationOptions[3]);
  const [selectedMAggregation, setSelectedMAggregation] =
    useState<AggregationOptions>(AggregationOptions[0]);

  const handleAddProtein = async () => {
    if (!newProteinName) {
      alert("Please enter a protein name.");
      return;
    }

    // clear dropdown
    setSelectedFile("");

    // prepare parameters dynamically
    const bodyParameters: Record<string, any> = {
      protein_id: newProteinName,
    };

    const features: string[] = [];
    if (shouldGenerateConflict) features.push("CONFLICT");
    if (shouldGenerateMutagen) features.push("MUTAGEN");
    if (shouldGenerateVariant) features.push("VARIANT");
    if (features.length > 0) bodyParameters.features = features;

    if (peptideFilePath) {
      bodyParameters.peptide_file = peptideFilePath;
      if (metadataFilePath) {
        bodyParameters.metadata_file = metadataFilePath;
        if (compareColumn) bodyParameters.compare_column = compareColumn;
      }
      if (hasIntensity) bodyParameters.intensity = true;
      if (shouldCountPeptides) bodyParameters.count = true;
      if (shouldMergePeptides) bodyParameters.merge_peptides = true;
      if (selectedOAggregation !== "None")
        bodyParameters.o_aggregation = selectedOAggregation;
      if (selectedMAggregation !== "None")
        bodyParameters.m_aggregation = selectedMAggregation;
    }

    if (bodyParameters.o_aggregation && bodyParameters.compare_column) {
      alert(
        "Overlapping aggregation method is not allowed to be selected when a comparison column is selected. Please choose either one of them.",
      );
      return;
    }

    try {
      const response = await callApiWithParameters(
        "api/generate_base_graph/",
        bodyParameters,
      );
      console.log("Response from add_protein:", response);
      if (!response.success) {
        alert("Failed to add protein: " + response.message);
        return;
      } else {
        // reset local storage
        localStorage.setItem(localStorageKeys.newProteinName, newProteinName);
        localStorage.setItem(localStorageKeys.selectedFile, "");
        localStorage.removeItem(localStorageKeys.selectedIsoforms);
        localStorage.removeItem(localStorageKeys.isoformColorMapping);
      }
      // Optionally, refresh the file names or handle success
    } catch (error) {
      console.error("Error adding protein:", error);
    }
  };

  return (
    <StyledSection
      style={{ maxHeight: "75vh", overflowY: "scroll", marginBottom: 0 }}
    >
      <StyledSectionTitle>Protein Selection</StyledSectionTitle>

      <div style={{ marginBottom: "16px" }}>
        <BoldStyledLabel>Select protein from recently used:</BoldStyledLabel>
        <FlexRow>
          <DropdownComponent
            placeholder={"--- Select a file ---"}
            value={selectedFile}
            setValue={setSelectedFile}
            options={fileNames}
          />
          <SecondaryButton onClick={handleRecentFileSubmit}>
            Load
          </SecondaryButton>
        </FlexRow>
      </div>

      {/* --- New protein configurations --- */}
      <div>
        <BoldStyledLabel>Add new protein:</BoldStyledLabel>
        <TextComponent
          placeholder={"Enter a protein name"}
          value={newProteinName}
          setValue={setNewProteinName}
        />
        <StyledLabel>Generate graph with:</StyledLabel>
        <MultiCompatibleCheckbox
          label={"Variant"}
          checked={shouldGenerateVariant}
          onChange={(checked) => setShouldGenerateVariant(checked)}
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
        <StyledLabel>If available, provide experiment background:</StyledLabel>
        <div>
          <FileUpload
            title={"Upload Peptide File"}
            acceptedFileTypes=".csv, .txt"
            onChange={(filePath) => setPeptideFilePath(filePath)} // Store full path
            tooltip={tooltips.peptideFile}
            tooltipTitle={"Peptide File"}
          />
          {peptideFilePath !== "" && (
            <>
              <FileUpload
                title={"Upload Metadata File"}
                acceptedFileTypes=".csv"
                onChange={(filePath) => setMetadataFilePath(filePath)} // Store full path
                tooltip={tooltips.metadataFile}
                tooltipTitle={"Metadata File"}
              />
              {metadataFilePath && (
                <TextComponent
                  placeholder={"Optional: Name of comparison column"}
                  value={compareColumn}
                  setValue={setCompareColumn}
                  tooltipTitle={"Comparison column"}
                  tooltip={tooltips.compareColumn}
                />
              )}
            </>
          )}
        </div>
        {peptideFilePath && (
          <>
            <MultiCompatibleCheckbox
              label={`Include intensities from peptides file in graph`}
              checked={hasIntensity}
              onChange={(checked) => setHasIntensity(checked)}
            />
            <MultiCompatibleCheckbox
              label={"Include count of peptides in graph"}
              checked={shouldCountPeptides}
              onChange={setShouldCountPeptides}
            />
            <MultiCompatibleCheckbox
              label={"Merge completely overlapping peptides"}
              checked={shouldMergePeptides}
              onChange={(checked) => setShouldMergePeptides(checked)}
              tooltip={tooltips.mergePeptides}
              tooltipTitle={"Merge Peptides"}
            />
            <DropdownComponent
              placeholder={"-- Select one of the methods below --"}
              value={selectedOAggregation as string}
              setValue={setSelectedOAggregation}
              options={AggregationOptions}
              label={
                "How to handle overlapping different peptides with (different) intensities on one node/edge:"
              }
              tooltipTitle={"Overlapping intensities"}
              tooltip={tooltips.OAggregation}
            />
            <DropdownComponent
              placeholder={"-- Select one of the methods below --"}
              value={selectedMAggregation as string}
              setValue={setSelectedMAggregation}
              options={AggregationOptions}
              label={
                "How to handle multiple instances of the same peptide with different intensities:"
              }
            />
          </>
        )}

        <SecondaryButton style={{ width: "100%" }} onClick={handleAddProtein}>
          Add
        </SecondaryButton>
      </div>
    </StyledSection>
  );
};
