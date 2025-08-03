import { FlexRow, SecondaryButton } from "./base-components.tsx";
import { useRef, useState } from "react";
import { Modal } from "./modal.tsx";
import { API_ROOT } from "../../helper/constants.ts";

export const FileUpload = ({
  title = "Upload File",
  onChange,
  acceptedFileTypes = ".csv, .txt",
  tooltip,
  tooltipTitle,
}: {
  title?: string;
  onChange: (filePath: string) => void; // Pass new full file path to onChange
  acceptedFileTypes?: string;
  tooltip?: string;
  tooltipTitle?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>(""); // Displayed file name
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);

      // Upload file to the server
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_ROOT}api/upload_file/`, {
          method: "POST",
          body: formData,
          headers: {
            // Ensure no Content-Type header is set; the browser will set it automatically
          },
        });

        if (!response.ok) {
          console.error("Failed to upload file");
          alert("File upload failed. Please try again.");
          return;
        }

        const result = await response.json();
        if (result.success) {
          onChange(result.filePath);
        } else {
          console.error("File upload error:", result.message);
          alert("File upload failed. Please try again.");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("File upload failed. Please try again.");
      }
    }
  };

  return (
    <FlexRow
      style={{
        marginBottom: "8px",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <SecondaryButton onClick={handleButtonClick}>{title}</SecondaryButton>
      {uploadedFileName && (
        <span
          style={{
            marginLeft: "3px",
            color: "#555",
            fontSize: "14px",
            maxWidth: "100px",
            wordWrap: "break-word",
          }}
        >
          {uploadedFileName}
        </span>
      )}
      <SecondaryButton onClick={() => setIsModalOpen(!isModalOpen)}>
        i
      </SecondaryButton>
      {tooltip && (
        <Modal
          text={tooltip}
          onClose={() => setIsModalOpen(false)}
          isOpen={isModalOpen}
          title={tooltipTitle}
        />
      )}
    </FlexRow>
  );
};
