import {
  labelVisibility,
  layoutModes,
  localStorageKeys,
  nodeWidthModes,
} from "../../theme/types.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";
import {
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
import { Switch } from "../base-components/switch.tsx";
import { Slider } from "../base-components/slider.tsx";
import { defaultValues } from "../../theme";
import useGraphStore, { type RFState } from "../../graph/store.ts";
import { Checkbox } from "../base-components/checkbox.tsx";

const selector = (state: RFState) => ({
  nodeWidthMode: state.nodeWidthMode,
  setNodeWidthMode: state.setGlobalNodeWidthMode,
  layoutMode: state.layoutMode,
  setLayoutMode: state.setLayoutMode,
  isoformColorMapping: state.isoformColorMapping,
  isAnimated: state.isAnimated,
  setIsAnimated: state.setIsAnimated,
  allowInteraction: state.allowInteraction,
  reverseNodes: state.reverseNodes,
  numberOfAllowedIsoforms: state.numberOfAllowedIsoforms,
  rowWidth: state.rowWidth,
  storeLabelVisibility: state.labelVisibility,
});

export const SideMenu = ({
  isOpen,
  previousSelectedFile,
  onClose,
}: {
  isOpen: boolean;
  previousSelectedFile: string;
  onClose: () => void;
}) => {
  const {
    nodeWidthMode,
    setNodeWidthMode,
    layoutMode,
    setLayoutMode,
    isoformColorMapping,
    isAnimated,
    setIsAnimated,
    allowInteraction,
    reverseNodes,
    numberOfAllowedIsoforms,
    rowWidth,
    storeLabelVisibility,
  } = useGraphStore(selector);
  const set: (arg0: {
    rowWidth?: number;
    allowInteraction?: boolean;
    reverseNodes?: boolean;
    numberOfAllowedIsoforms?: number;
    labelVisibility?: string;
  }) => void = useGraphStore.setState;

  const [selectedNodeWidthMode, setSelectedNodeWidthMode] =
    useState<nodeWidthModes>(nodeWidthMode);
  const [selectedLayoutMode, setSelectedLayoutMode] =
    useState<layoutModes>(layoutMode);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] =
    useState<string>(previousSelectedFile);
  const [newProteinName, setNewProteinName] = useState<string>("");
  const [selectedAllowInteraction, setSelectedAllowInteraction] =
    useState<boolean>(allowInteraction);
  const [selectedIsAnimated, setSelectedIsAnimated] =
    useState<boolean>(isAnimated);
  const [selectedReverseNodes, setSelectedReverseNodes] =
    useState<boolean>(reverseNodes);
  const [selectedNumberOfAllowedIsoforms, setSelectedNumberOfAllowedIsoforms] =
    useState<number>(numberOfAllowedIsoforms);
  const [selectedRowWidth, setSelectedRowWidth] = useState<number>(rowWidth);
  const [selectedLabelVisibility, setSelectedLabelVisibility] =
    useState<labelVisibility>(storeLabelVisibility);

  const allLabelVisibilityOptions = Object.values(labelVisibility);

  const numberOfAvailableIsoforms = Object.keys(isoformColorMapping).length;

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
      String(selectedAllowInteraction),
    );
    localStorage.setItem(
      localStorageKeys.isAnimated,
      String(selectedIsAnimated),
    );
    localStorage.setItem(
      localStorageKeys.reverseNodes,
      String(selectedReverseNodes),
    );
    localStorage.setItem(
      localStorageKeys.numberOfAllowedIsoforms,
      String(selectedNumberOfAllowedIsoforms),
    );
    localStorage.setItem(localStorageKeys.rowWidth, String(selectedRowWidth));
    localStorage.setItem(
      localStorageKeys.labelVisibility,
      selectedLabelVisibility,
    );

    // Update global state
    setNodeWidthMode(selectedNodeWidthMode);
    set({ rowWidth: selectedRowWidth });
    setTimeout(() => {
      setLayoutMode(selectedLayoutMode);
    }, 100);
    setTimeout(() => {
      setIsAnimated(selectedIsAnimated);
      set({ allowInteraction: selectedAllowInteraction });
      set({ reverseNodes: selectedReverseNodes });
      set({ numberOfAllowedIsoforms: selectedNumberOfAllowedIsoforms });
      set({ labelVisibility: selectedLabelVisibility });
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
            label={"Allow movement of nodes (changes are not saved)"}
            checked={selectedAllowInteraction}
            onChange={(checked) => {
              setSelectedAllowInteraction(checked);
            }}
          />
          <Checkbox
            label={"Show animated edges"}
            checked={selectedIsAnimated}
            onChange={(checked) => {
              setSelectedIsAnimated(checked);
            }}
          />
          <Switch
            label={"Show selected edge labels:"}
            options={allLabelVisibilityOptions}
            selected={selectedLabelVisibility}
            selectOption={setSelectedLabelVisibility}
            isShy={true}
          />
          <Checkbox
            label={"Reverse sequence of reversed nodes"}
            checked={selectedReverseNodes}
            onChange={(checked) => {
              setSelectedReverseNodes(checked);
            }}
          />
          <Slider
            label={"Width of snake row:"}
            minValue={1000}
            maxValue={9000}
            minValueLabel={"1000px"}
            maxValueLabel={"9000px"}
            initialValue={selectedRowWidth}
            setValue={(newValue) => setSelectedRowWidth(newValue)}
            defaultValue={defaultValues.rowWidth}
          />
          <Slider
            label={"Number of selectable isoforms:"}
            minValue={1}
            maxValue={numberOfAvailableIsoforms}
            minValueLabel={"1"}
            maxValueLabel={numberOfAvailableIsoforms.toString()}
            initialValue={selectedNumberOfAllowedIsoforms}
            setValue={setSelectedNumberOfAllowedIsoforms}
            defaultValue={defaultValues.numberOfAllowedIsoforms}
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
