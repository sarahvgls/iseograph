import { useState } from "react";
import { CloseButton } from "../base-components";
import { UserGuide } from "./user-guide.tsx";
import { SettingsSwitch } from "../base-components/settings-switch.tsx";
import { GraphSettings } from "./graph-settings.tsx";
import { ProteinSelection } from "./protein-selection.tsx";

export const SideMenu = ({
  isOpen,
  previousSelectedFile,
  onClose,
}: {
  isOpen: boolean;
  previousSelectedFile: string;
  onClose: () => void;
}) => {
  const settingsSections = {
    proteinSelection: "Protein Selection",
    graphSettings: "Graph Settings",
    userGuide: "User Guide",
  };
  const [selectedSection, setSelectedSection] = useState(
    settingsSections.proteinSelection,
  );

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
          marginBottom: "4px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "12px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>
          Settings
        </h2>
        <CloseButton onClose={onClose} />
      </div>

      <SettingsSwitch
        options={Object.values(settingsSections)}
        selected={selectedSection}
        selectOption={(section) => setSelectedSection(section)}
      />

      {/*--- Protein Selection ---*/}
      {selectedSection === settingsSections.proteinSelection && (
        <ProteinSelection previousSelectedFile={previousSelectedFile} />
      )}

      {/*--- Display Settings ---*/}
      {selectedSection === settingsSections.graphSettings && (
        <GraphSettings onClose={onClose} />
      )}

      {/*--- User Guide ---*/}
      {selectedSection === settingsSections.userGuide && <UserGuide />}
    </div>
  );
};
