import {
  BoldStyledLabel,
  FlexRow,
  SecondaryButton,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import { useEffect, useState } from "react";
import { callApiWithParameters } from "../../helper/api-call.ts";
import { localStorageKeys } from "../../theme/types.tsx";
import { TextComponent } from "../base-components/textfield.tsx";
import { FileUpload } from "../base-components/file-upload.tsx";
import { getFileNames } from "./protein-selection-helper.tsx";
import useGraphStore from "../../graph/store.ts";
import { CircularProgress } from "@mui/material";
import { ProteinConfigOptions } from "./protein-config-options.tsx";
import { FileBrowserModal } from "../file-management/file-browser-modal";

export const ProteinSelection = ({
  previousSelectedFile,
}: {
  previousSelectedFile: string;
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<string>(previousSelectedFile);
  const [isAddLoading, setIsAddLoading] = useState<boolean>(false);
  const [isLoadLoading, setIsLoadLoading] = useState<boolean>(false);
  const [isFileBrowserOpen, setIsFileBrowserOpen] = useState<boolean>(false);

  useEffect(() => {
    void getFileNames(setFileNames);
  }, []);

  const handleRecentFileSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    setIsLoadLoading(true);

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
        localStorage.removeItem(localStorageKeys.glowMethod);
        localStorage.removeItem(localStorageKeys.intensitySource);

        // force rerender
        useGraphStore.setState({ shouldRerender: true });
      }
    } catch (error) {
      console.error("Error executing script:", error);
    } finally {
      setIsLoadLoading(false); // Stop loading
    }
  };

  // Option B: Upload protein file
  const [uploadedProteinFilePath, setUploadedProteinFilePath] =
    useState<string>("");
  const [uploadedProteinId, setUploadedProteinId] = useState<string>("");
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  const handleProteinFileUpload = async (filePath: string) => {
    setUploadedProteinFilePath(filePath);
    setIsProcessingUpload(true);

    try {
      const response = await callApiWithParameters(
        "api/process_protein_file/",
        {
          protein_file_path: filePath,
        },
      );

      if (!response.success) {
        alert("Failed to process protein file: " + response.message);
        setUploadedProteinFilePath("");
        setUploadedProteinId("");
        return;
      }

      setUploadedProteinId(response.protein_id);
      // Clear option C when option B is activated
      setNewProteinName("");
    } catch (error) {
      console.error("Error processing protein file:", error);
      alert("Error processing protein file");
      setUploadedProteinFilePath("");
      setUploadedProteinId("");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const resetOptionB = () => {
    setUploadedProteinFilePath("");
    setUploadedProteinId("");
  };

  // configurations for new protein
  const [newProteinName, setNewProteinName] = useState<string>("");
  const [newFileName, setNewFileName] = useState<string>("");
  const [shouldGenerateVariant, setShouldGenerateVariant] =
    useState<boolean>(true);
  const [shouldGenerateMutagen, setShouldGenerateMutagen] =
    useState<boolean>(true);
  const [shouldGenerateConflict, setShouldGenerateConflict] =
    useState<boolean>(true);
  const [peptideFilePath, setPeptideFilePath] = useState<string>("");
  const [metadataFilePath, setMetadataFilePath] = useState<string>("");
  const [compareColumn, setCompareColumn] = useState<string>("");
  const [hasIntensity, setHasIntensity] = useState<boolean>(true);
  const [shouldCountPeptides, setShouldCountPeptides] = useState<boolean>(true);
  const [shouldSubstitue, setShouldSubstitue] = useState<boolean>(false);
  const [shouldMergePeptides, setShouldMergePeptides] =
    useState<boolean>(false);

  // TODO implement Low and High median
  const AggregationOptions = {
    lmedian: "Low Median",
    hmedian: "High Median",
    sum: "Sum",
    mean: "Mean",
    None: "None",
  };
  type AggregationOption = keyof typeof AggregationOptions;
  const [selectedOAggregation, setSelectedOAggregation] =
    useState<AggregationOption>("None");
  const [selectedMAggregation, setSelectedMAggregation] =
    useState<AggregationOption>("lmedian");

  // Feature selections for protein processing
  const [shouldIncludeInitMet, setShouldIncludeInitMet] =
    useState<boolean>(false);
  const [shouldIncludeSignal, setShouldIncludeSignal] =
    useState<boolean>(false);
  const [shouldIncludePropep, setShouldIncludePropep] =
    useState<boolean>(false);
  const [shouldIncludeChain, setShouldIncludeChain] = useState<boolean>(false);
  const [shouldIncludePeptide, setShouldIncludePeptide] =
    useState<boolean>(false);
  const [selectedDigestion, setSelectedDigestion] = useState<string>("Skip");
  const [shouldCollapseEdges, setShouldCollapseEdges] =
    useState<boolean>(false);

  // Reset option C when option B is activated
  const handleNewProteinNameChange = (value: string) => {
    setNewProteinName(value);
    if (value.length > 0) {
      resetOptionB();
    }
  };

  const handleAddProtein = async () => {
    // Determine which option is being used
    const isOptionB = uploadedProteinId.length > 0;
    const isOptionC = newProteinName.length > 0;

    if (!isOptionB && !isOptionC) {
      alert(
        "Please either upload a protein file (Option B) or enter a protein ID (Option C).",
      );
      return;
    }

    setIsAddLoading(true);

    // clear dropdown
    setSelectedFile("");
    localStorage.removeItem(localStorageKeys.selectedFile);

    // prepare parameters dynamically
    const bodyParameters: Record<string, string | boolean | string[]> = {};

    if (isOptionB) {
      bodyParameters.protein_file = uploadedProteinFilePath;
      bodyParameters.protein_id = uploadedProteinId;
    } else {
      bodyParameters.protein_id = newProteinName;
    }

    if (newFileName) bodyParameters.new_file_name = newFileName;
    const features: string[] = [];
    if (shouldGenerateConflict) features.push("CONFLICT");
    if (shouldGenerateMutagen) features.push("MUTAGEN");
    if (shouldGenerateVariant) features.push("VARIANT");
    if (shouldIncludeInitMet) features.push("INIT_MET");
    if (shouldIncludeSignal) features.push("SIGNAL");
    if (shouldIncludePropep) features.push("PROPEP");
    if (shouldIncludeChain) features.push("CHAIN");
    if (shouldIncludePeptide) features.push("PEPTIDE");
    if (features.length > 0) bodyParameters.features = features;

    // Add digestion selection
    if (selectedDigestion && selectedDigestion !== "Skip") {
      bodyParameters.digestion = selectedDigestion.toLowerCase();
    }

    // Add collapse parameter only if digestion is not skip
    if (shouldCollapseEdges) {
      bodyParameters.collapse = false;
    }

    if (peptideFilePath) {
      bodyParameters.peptide_file = peptideFilePath;
      if (metadataFilePath) {
        bodyParameters.metadata_file = metadataFilePath;
        if (compareColumn) bodyParameters.compare_column = compareColumn;
      }
      if (hasIntensity) bodyParameters.intensity = true;
      if (shouldCountPeptides) bodyParameters.count = true;
      if (shouldSubstitue) bodyParameters.substitue = true;
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
      setIsAddLoading(false);
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
        localStorage.removeItem(localStorageKeys.selectedIsoforms);
        localStorage.removeItem(localStorageKeys.isoformColorMapping);

        // force rerender
        useGraphStore.setState({ shouldRerender: true });

        // reset file dropdown
        const names = await getFileNames(setFileNames);
        // Determine the file name to look for
        const searchFileName =
          newFileName || uploadedProteinId || newProteinName;
        const fileName = `${searchFileName}.graphml`;
        if (names.includes(fileName)) {
          setSelectedFile(fileName);
          localStorage.setItem(localStorageKeys.selectedFile, fileName);
          setNewProteinName("");
          localStorage.removeItem(localStorageKeys.newProteinName);
          resetOptionB();
        } else {
          console.warn(`New protein file ${fileName} not found in fileNames.`);
          setSelectedFile("");
          localStorage.setItem(localStorageKeys.selectedFile, "");
        }
      }
    } catch (error) {
      console.error("Error adding protein:", error);
    } finally {
      setIsAddLoading(false);
      useGraphStore.setState({ shouldRerender: true });
    }
  };

  return (
    <StyledSection
      style={{ maxHeight: "100%", overflowY: "scroll", marginBottom: 0 }}
    >
      <StyledSectionTitle>Protein Selection</StyledSectionTitle>
      <p style={{ fontSize: "12px", display: "block" }}>
        Choose one of the following methods to change the currently visualized
        protein.
      </p>
      <div style={{ marginBottom: "16px" }}>
        <BoldStyledLabel>A) Select protein from recently used:</BoldStyledLabel>
        <FlexRow>
          <SecondaryButton
            onClick={() => setIsFileBrowserOpen(true)}
            disabled={isLoadLoading}
            id="browse-files-button"
            data-status={isLoadLoading ? "loading" : "idle"}
            style={{ flex: 1 }}
          >
            {isLoadLoading ? <CircularProgress size={20} /> : "Browse Files"}
          </SecondaryButton>
          {selectedFile && (
            <SecondaryButton
              onClick={handleRecentFileSubmit}
              disabled={isLoadLoading}
              id="load-button"
              data-status={isLoadLoading ? "loading" : "idle"}
            >
              {isLoadLoading ? <CircularProgress size={20} /> : "Load"}
            </SecondaryButton>
          )}
        </FlexRow>
        {selectedFile && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            Selected: <strong>{selectedFile}</strong>
          </div>
        )}
      </div>

      <FileBrowserModal
        isOpen={isFileBrowserOpen}
        onClose={() => setIsFileBrowserOpen(false)}
        onFileSelected={(filename) => {
          setSelectedFile(filename);
          localStorage.setItem(localStorageKeys.selectedFile, filename);
        }}
        onFileDeleted={() => {
          setFileNames(fileNames.filter((f) => f !== selectedFile));
          setSelectedFile("");
          localStorage.removeItem(localStorageKeys.selectedFile);
        }}
      />

      {/* Option B: Upload protein file */}
      <div style={{ marginBottom: "16px" }}>
        <BoldStyledLabel>B) Upload protein text file:</BoldStyledLabel>
        <FileUpload
          title={"Upload Protein File"}
          acceptedFileTypes=".txt"
          onChange={handleProteinFileUpload}
          tooltip={"Upload a protein file in UniProt text format (.txt)"}
          tooltipTitle={"Protein File Upload"}
        />
        {isProcessingUpload && (
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CircularProgress size={20} />
            <span>Processing file...</span>
          </div>
        )}

        {/* Show configuration options for Option B */}
        {uploadedProteinId && !newProteinName && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #ccc",
            }}
          >
            <ProteinConfigOptions
              shouldGenerateVariant={shouldGenerateVariant}
              setShouldGenerateVariant={setShouldGenerateVariant}
              shouldGenerateMutagen={shouldGenerateMutagen}
              setShouldGenerateMutagen={setShouldGenerateMutagen}
              shouldGenerateConflict={shouldGenerateConflict}
              setShouldGenerateConflict={setShouldGenerateConflict}
              peptideFilePath={peptideFilePath}
              setPeptideFilePath={setPeptideFilePath}
              metadataFilePath={metadataFilePath}
              setMetadataFilePath={setMetadataFilePath}
              compareColumn={compareColumn}
              setCompareColumn={setCompareColumn}
              hasIntensity={hasIntensity}
              setHasIntensity={setHasIntensity}
              shouldCountPeptides={shouldCountPeptides}
              setShouldCountPeptides={setShouldCountPeptides}
              shouldSubstitue={shouldSubstitue}
              setShouldSubstitue={setShouldSubstitue}
              shouldMergePeptides={shouldMergePeptides}
              setShouldMergePeptides={setShouldMergePeptides}
              selectedOAggregation={selectedOAggregation as string}
              setSelectedOAggregation={
                setSelectedOAggregation as (value: string) => void
              }
              selectedMAggregation={selectedMAggregation as string}
              setSelectedMAggregation={
                setSelectedMAggregation as (value: string) => void
              }
              newFileName={newFileName}
              setNewFileName={setNewFileName}
              AggregationOptions={AggregationOptions}
              shouldIncludeInitMet={shouldIncludeInitMet}
              setShouldIncludeInitMet={setShouldIncludeInitMet}
              shouldIncludeSignal={shouldIncludeSignal}
              setShouldIncludeSignal={setShouldIncludeSignal}
              shouldIncludePropep={shouldIncludePropep}
              setShouldIncludePropep={setShouldIncludePropep}
              shouldIncludeChain={shouldIncludeChain}
              setShouldIncludeChain={setShouldIncludeChain}
              shouldIncludePeptide={shouldIncludePeptide}
              setShouldIncludePeptide={setShouldIncludePeptide}
              selectedDigestion={selectedDigestion}
              setSelectedDigestion={setSelectedDigestion}
              shouldCollapseEdges={shouldCollapseEdges}
              setShouldCollapseEdges={setShouldCollapseEdges}
            />
            <SecondaryButton
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "16px",
              }}
              onClick={handleAddProtein}
              disabled={isAddLoading}
              id="add-button-b"
              data-testid="add-protein-button-b"
              data-status={isAddLoading ? "loading" : "idle"}
            >
              {isAddLoading ? <CircularProgress size={20} /> : "Add"}
            </SecondaryButton>
          </div>
        )}
      </div>

      {/* Option C: Add new protein by ID */}
      <div>
        <BoldStyledLabel>C) Add new protein by ID:</BoldStyledLabel>
        <TextComponent
          placeholder={"Enter a protein name"}
          value={newProteinName}
          setValue={handleNewProteinNameChange}
          testId={"new-protein-name-input"}
        />

        {/* Show configuration options for Option C */}
        {newProteinName && !uploadedProteinId && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #ccc",
            }}
          >
            <ProteinConfigOptions
              shouldGenerateVariant={shouldGenerateVariant}
              setShouldGenerateVariant={setShouldGenerateVariant}
              shouldGenerateMutagen={shouldGenerateMutagen}
              setShouldGenerateMutagen={setShouldGenerateMutagen}
              shouldGenerateConflict={shouldGenerateConflict}
              setShouldGenerateConflict={setShouldGenerateConflict}
              peptideFilePath={peptideFilePath}
              setPeptideFilePath={setPeptideFilePath}
              metadataFilePath={metadataFilePath}
              setMetadataFilePath={setMetadataFilePath}
              compareColumn={compareColumn}
              setCompareColumn={setCompareColumn}
              hasIntensity={hasIntensity}
              setHasIntensity={setHasIntensity}
              shouldCountPeptides={shouldCountPeptides}
              setShouldCountPeptides={setShouldCountPeptides}
              shouldSubstitue={shouldSubstitue}
              setShouldSubstitue={setShouldSubstitue}
              shouldMergePeptides={shouldMergePeptides}
              setShouldMergePeptides={setShouldMergePeptides}
              selectedOAggregation={selectedOAggregation as string}
              setSelectedOAggregation={
                setSelectedOAggregation as (value: string) => void
              }
              selectedMAggregation={selectedMAggregation as string}
              setSelectedMAggregation={
                setSelectedMAggregation as (value: string) => void
              }
              newFileName={newFileName}
              setNewFileName={setNewFileName}
              AggregationOptions={AggregationOptions}
              shouldIncludeInitMet={shouldIncludeInitMet}
              setShouldIncludeInitMet={setShouldIncludeInitMet}
              shouldIncludeSignal={shouldIncludeSignal}
              setShouldIncludeSignal={setShouldIncludeSignal}
              shouldIncludePropep={shouldIncludePropep}
              setShouldIncludePropep={setShouldIncludePropep}
              shouldIncludeChain={shouldIncludeChain}
              setShouldIncludeChain={setShouldIncludeChain}
              shouldIncludePeptide={shouldIncludePeptide}
              setShouldIncludePeptide={setShouldIncludePeptide}
              selectedDigestion={selectedDigestion}
              setSelectedDigestion={setSelectedDigestion}
              shouldCollapseEdges={shouldCollapseEdges}
              setShouldCollapseEdges={setShouldCollapseEdges}
            />
            <SecondaryButton
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "16px",
              }}
              onClick={handleAddProtein}
              disabled={isAddLoading}
              id="add-button-c"
              data-testid="add-protein-button-c"
              data-status={isAddLoading ? "loading" : "idle"}
            >
              {isAddLoading ? <CircularProgress size={20} /> : "Add"}
            </SecondaryButton>
          </div>
        )}
      </div>
    </StyledSection>
  );
};
