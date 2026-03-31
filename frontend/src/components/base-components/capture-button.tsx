import { Icon } from "../icon";
import styled from "styled-components";
import { toPng } from "html-to-image";

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  position: fixed;
  right: 170px;
  bottom: calc(100vh - 80px);
  width: 45px;
  max-height: 45px;
`;

const StyledButton = styled.button`
  padding: 10px;
  width: 45px;
  height: 45px;
  border-radius: 15%;
  background-color: #dfdfdf;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 11;
  font-size: 20px;
  transition: transform 0.2s ease;
  pointer-events: auto;

  &:hover {
    transform: scale(1.05);
  }
`;

export const DEFAULT_EXPORT_CONFIG = {
  padding: 30,
  backgroundColor: "#ffffff",
  imageWidth: 2024,
  imageHeight: 768,
};

export const CaptureButton = ({ testId }: { testId?: string }) => {
  function exportPNG() {
    const viewportElement = document.querySelector(
      ".react-flow__viewport",
    ) as HTMLElement;

    try {
      toPng(viewportElement, {
        backgroundColor: DEFAULT_EXPORT_CONFIG.backgroundColor,
        width: DEFAULT_EXPORT_CONFIG.imageWidth,
        height: DEFAULT_EXPORT_CONFIG.imageHeight,
      }).then((dataUrl) => {
        downloadPng(dataUrl, "IseoGraphExport");
      });
    } catch (error) {
      console.error("Error generating PNG:", error);
      throw new Error(`Failed to generate PNG: ${error}`);
    }
  }

  /**
   * Download PNG file to user's computer
   * @param dataUrl The data URL of the PNG
   * @param fileName The name of the file to save
   */
  function downloadPng(dataUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.setAttribute("download", fileName);
    link.setAttribute("href", dataUrl);
    link.click();
  }

  return (
    <Container>
      <StyledButton
        data-testid={testId || "capture-button"}
        onClick={exportPNG}
      >
        <Icon icon={"capture"} color={"onPrimary"} />
      </StyledButton>
    </Container>
  );
};
