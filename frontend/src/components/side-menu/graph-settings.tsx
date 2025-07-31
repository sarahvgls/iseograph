import {
  PrimaryButton,
  StyledSection,
  StyledSectionTitle,
} from "../base-components";
import {
  labelVisibilities,
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
  zeroValuesPeptides: state.zeroValuesPeptides,
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
    zeroValuesPeptides,
  } = useGraphStore(selector);
  const set: (arg0: {
    rowWidth?: number;
    allowInteraction?: boolean;
    reverseNodes?: boolean;
    numberOfAllowedIsoforms?: number;
    labelVisibility?: string;
    zeroValuesPeptides?: boolean;
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
    useState<labelVisibilities>(storeLabelVisibility);
  const [selectedZeroValues, setSelectedZeroValues] =
    useState<boolean>(zeroValuesPeptides);

  const allLabelVisibilityOptions = Object.values(labelVisibilities);
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
    localStorage.setItem(
      localStorageKeys.zeroValuesPeptides,
      String(selectedZeroValues),
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
      set({ zeroValuesPeptides: selectedZeroValues });
    }, 500);

    onClose();
  };

  return (
    <div>
      <StyledSection
        style={{ maxHeight: "75vh", overflowY: "scroll", marginBottom: 0 }}
      >
        <StyledSectionTitle>Display Settings</StyledSectionTitle>

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
          <Checkbox
            label={"Reverse sequence of reversed nodes"}
            checked={selectedReverseNodes}
            onChange={(checked) => {
              setSelectedReverseNodes(checked);
            }}
          />
          <Checkbox
            label={"Include zero values in peptide edge glow."}
            checked={selectedZeroValues}
            onChange={(checked) => setSelectedZeroValues(checked)}
          />

          <Switch
            label={"Show selected edge labels:"}
            options={allLabelVisibilityOptions}
            selected={selectedLabelVisibility}
            selectOption={setSelectedLabelVisibility}
            isShy={true}
          />
          <Switch
            label={"Default Layout Mode:"}
            options={Object.values(layoutModes)}
            selected={selectedLayoutMode}
            selectOption={(mode) => setSelectedLayoutMode(mode as layoutModes)}
            isShy={true}
          />
          <Switch
            label={"Default Node Width Mode:"}
            options={Object.values(nodeWidthModes)}
            selected={selectedNodeWidthMode}
            selectOption={(mode) =>
              setSelectedNodeWidthMode(mode as nodeWidthModes)
            }
            isShy={true}
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
