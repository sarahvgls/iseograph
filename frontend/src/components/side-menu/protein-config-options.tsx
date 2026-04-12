import { StyledLabel } from "../base-components";
import { MultiCompatibleCheckbox } from "../base-components/checkbox.tsx";
import { DropdownComponent } from "../base-components/dropdown.tsx";
import { TextComponent } from "../base-components/textfield.tsx";
import { tooltips } from "./tooltip-content.tsx";
import { FileUpload } from "../base-components/file-upload.tsx";

export const ProteinConfigOptions = ({
  shouldGenerateVariant,
  setShouldGenerateVariant,
  shouldGenerateMutagen,
  setShouldGenerateMutagen,
  shouldGenerateConflict,
  setShouldGenerateConflict,
  peptideFilePath,
  setPeptideFilePath,
  metadataFilePath,
  setMetadataFilePath,
  compareColumn,
  setCompareColumn,
  hasIntensity,
  setHasIntensity,
  shouldCountPeptides,
  setShouldCountPeptides,
  shouldSubstitue,
  setShouldSubstitue,
  shouldMergePeptides,
  setShouldMergePeptides,
  selectedOAggregation,
  setSelectedOAggregation,
  selectedMAggregation,
  setSelectedMAggregation,
  newFileName,
  setNewFileName,
  AggregationOptions,
  shouldIncludeInitMet,
  setShouldIncludeInitMet,
  shouldIncludeSignal,
  setShouldIncludeSignal,
  shouldIncludePropep,
  setShouldIncludePropep,
  shouldIncludeChain,
  setShouldIncludeChain,
  shouldIncludePeptide,
  setShouldIncludePeptide,
  selectedDigestion,
  setSelectedDigestion,
  shouldCollapseEdges,
  setShouldCollapseEdges,
}: {
  shouldGenerateVariant: boolean;
  setShouldGenerateVariant: (value: boolean) => void;
  shouldGenerateMutagen: boolean;
  setShouldGenerateMutagen: (value: boolean) => void;
  shouldGenerateConflict: boolean;
  setShouldGenerateConflict: (value: boolean) => void;
  peptideFilePath: string;
  setPeptideFilePath: (value: string) => void;
  metadataFilePath: string;
  setMetadataFilePath: (value: string) => void;
  compareColumn: string;
  setCompareColumn: (value: string) => void;
  hasIntensity: boolean;
  setHasIntensity: (value: boolean) => void;
  shouldCountPeptides: boolean;
  setShouldCountPeptides: (value: boolean) => void;
  shouldSubstitue: boolean;
  setShouldSubstitue: (value: boolean) => void;
  shouldMergePeptides: boolean;
  setShouldMergePeptides: (value: boolean) => void;
  selectedOAggregation: string;
  setSelectedOAggregation: (value: string) => void;
  selectedMAggregation: string;
  setSelectedMAggregation: (value: string) => void;
  newFileName: string;
  setNewFileName: (value: string) => void;
  AggregationOptions: Record<string, string>;
  shouldIncludeInitMet: boolean;
  setShouldIncludeInitMet: (value: boolean) => void;
  shouldIncludeSignal: boolean;
  setShouldIncludeSignal: (value: boolean) => void;
  shouldIncludePropep: boolean;
  setShouldIncludePropep: (value: boolean) => void;
  shouldIncludeChain: boolean;
  setShouldIncludeChain: (value: boolean) => void;
  shouldIncludePeptide: boolean;
  setShouldIncludePeptide: (value: boolean) => void;
  selectedDigestion: string;
  setSelectedDigestion: (value: string) => void;
  shouldCollapseEdges: boolean;
  setShouldCollapseEdges: (value: boolean) => void;
}) => {
  return (
    <>
      <StyledLabel>Generate graph with:</StyledLabel>
      <MultiCompatibleCheckbox
        label={"Sequence Variants"}
        checked={shouldGenerateVariant}
        onChange={(checked) => setShouldGenerateVariant(checked)}
        tooltip={tooltips.variant}
        tooltipTitle={"Sequence Variants"}
      />
      <MultiCompatibleCheckbox
        label={"Mutagenesis Sites"}
        checked={shouldGenerateMutagen}
        onChange={(checked) => setShouldGenerateMutagen(checked)}
        tooltip={tooltips.mutagen}
        tooltipTitle={"Mutagenesis Sites"}
      />
      <MultiCompatibleCheckbox
        label={"Sequence Conflicts"}
        checked={shouldGenerateConflict}
        onChange={(checked) => setShouldGenerateConflict(checked)}
        tooltip={tooltips.conflict}
        tooltipTitle={"Sequence Conflicts"}
      />
      <MultiCompatibleCheckbox
        label={"Initial Methionine"}
        checked={shouldIncludeInitMet}
        onChange={(checked) => setShouldIncludeInitMet(checked)}
        tooltip={tooltips.initialMethionine}
        tooltipTitle={"Initial Methionine"}
      />
      <MultiCompatibleCheckbox
        label={"Signal Peptide"}
        checked={shouldIncludeSignal}
        onChange={(checked) => setShouldIncludeSignal(checked)}
        tooltip={tooltips.signalPeptide}
        tooltipTitle={"Signal Peptide"}
      />
      <MultiCompatibleCheckbox
        label={"Pro-Protein"}
        checked={shouldIncludePropep}
        onChange={(checked) => setShouldIncludePropep(checked)}
        tooltip={tooltips.proProtein}
        tooltipTitle={"Pro-Protein"}
      />
      <MultiCompatibleCheckbox
        label={"Polypeptide Chain"}
        checked={shouldIncludeChain}
        onChange={(checked) => setShouldIncludeChain(checked)}
        tooltip={tooltips.polypeptideChain}
        tooltipTitle={"Polypeptide Chain"}
      />
      <MultiCompatibleCheckbox
        label={"Bioactive Peptide"}
        checked={shouldIncludePeptide}
        onChange={(checked) => setShouldIncludePeptide(checked)}
        tooltip={tooltips.peptide}
        tooltipTitle={"Bioactive Peptide"}
      />

      <DropdownComponent
        placeholder={"-- Select digestion method --"}
        value={selectedDigestion}
        setValue={setSelectedDigestion}
        options={["Skip", "Gluc", "Trypsin", "Full"]}
        label={"Digestion method:"}
      />

      {/*<MultiCompatibleCheckbox*/}
      {/*  label={"Collapse edges"}*/}
      {/*  checked={shouldCollapseEdges}*/}
      {/*  onChange={(checked) => setShouldCollapseEdges(checked)}*/}
      {/*  tooltip={tooltips.collapse}*/}
      {/*  tooltipTitle={"Collapse Edges"}*/}
      {/*/>*/}

      <StyledLabel>If available, provide experiment background:</StyledLabel>
      <div>
        <FileUpload
          title={"Upload Peptide File"}
          acceptedFileTypes=".csv"
          onChange={(filePath) => setPeptideFilePath(filePath)}
          tooltip={tooltips.peptideFile}
          tooltipTitle={"Peptide File"}
        />
        {peptideFilePath !== "" && (
          <>
            <FileUpload
              title={"Upload Metadata File"}
              acceptedFileTypes=".csv"
              onChange={(filePath) => setMetadataFilePath(filePath)}
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
            label={"Substitution of amino acids I and L with J."}
            checked={shouldSubstitue}
            onChange={setShouldSubstitue}
            tooltip={tooltips.substitute}
            tooltipTitle={"Substitute I and L"}
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
            value={selectedOAggregation}
            setValue={setSelectedOAggregation}
            options={Object.values(AggregationOptions)}
            label={
              "How to handle overlapping different peptides with (different) intensities on one node/edge:"
            }
            tooltipTitle={"Overlapping intensities"}
            tooltip={tooltips.OAggregation}
          />
          <DropdownComponent
            placeholder={"-- Select one of the methods below --"}
            value={selectedMAggregation}
            setValue={setSelectedMAggregation}
            options={Object.values(AggregationOptions)}
            label={
              "How to handle multiple instances of the same peptide with different intensities:"
            }
          />
        </>
      )}

      <TextComponent
        placeholder={"Optional: Custom file name"}
        value={newFileName}
        setValue={setNewFileName}
        tooltipTitle={"File Name"}
        tooltip={tooltips.FileName}
      />
    </>
  );
};
