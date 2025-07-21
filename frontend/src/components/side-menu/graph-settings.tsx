import {
  PrimaryButton,
  StyledDropdown,
  StyledLabel,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import {
  labelVisibility,
  layoutModes,
  localStorageKeys,
  nodeWidthModes,
} from "../../theme/types.tsx";
import { Checkbox } from "../base-components/checkbox.tsx";
import { Switch } from "../base-components/switch.tsx";
import { Slider } from "../base-components/slider.tsx";
import { defaultValues } from "../../theme";
import useGraphStore, { type RFState } from "../../graph/store.ts";
import { useEffect, useState } from "react";

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

export const GraphSettings = ({ onClose }: { onClose: () => void }) => {
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
    <div>
      <StyledSection style={{ maxHeight: "70vh", overflowY: "scroll" }}>
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
    </div>
  );
};
