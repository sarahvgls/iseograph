import { layoutModes, nodeWidthModes } from "../../theme/types.tsx";
import { useEffect, useState } from "react";
import { callApi, callApiWithParameters } from "../../helper/api-call.ts";

// Reusable styling objects
const styles = {
  section: {
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
    borderBottom: "1px solid #e1e4e8",
    paddingBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
    fontSize: "14px",
  },
  primaryButton: {
    padding: "10px 16px",
    backgroundColor: "#4361ee",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s",
    fontSize: "14px",
    width: "100%",
  },
  secondaryButton: {
    padding: "8px 12px",
    backgroundColor: "#e9ecef",
    color: "#495057",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s",
    fontSize: "14px",
  },
  flexRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

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

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Protein Selection</h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            Select protein from recently used:
          </label>
          <div style={styles.flexRow}>
            <select
              style={styles.select}
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
            </select>
            <button
              style={styles.secondaryButton}
              onClick={handleRecentFileSubmit}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#dee2e6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#e9ecef")
              }
            >
              Load
            </button>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            Add new protein:
          </label>
          <div style={styles.flexRow}>
            <input
              type="text"
              placeholder="Enter protein name"
              style={styles.input}
              value={newProteinName}
              onChange={(e) => setNewProteinName(e.target.value)}
            />
            <button
              style={styles.secondaryButton}
              onClick={handleAddProtein}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#dee2e6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#e9ecef")
              }
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Display Settings</h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            Default Node Width Mode:
          </label>
          <select
            value={selectedNodeWidthMode}
            onChange={(e) =>
              setSelectedNodeWidthMode(e.target.value as nodeWidthModes)
            }
            style={styles.select}
          >
            {Object.values(nodeWidthModes).map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            Default Layout Mode:
          </label>
          <select
            value={selectedLayoutMode}
            onChange={(e) =>
              setSelectedLayoutMode(e.target.value as layoutModes)
            }
            style={styles.select}
          >
            {Object.values(layoutModes).map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={styles.primaryButton}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#3a56d4")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4361ee")}
      >
        Save Settings
      </button>

      <div style={{ ...styles.section, marginTop: "24px" }}>
        <h3 style={styles.sectionTitle}>User Guide</h3>
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
      </div>
    </div>
  );
};
