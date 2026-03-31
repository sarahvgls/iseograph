import { toPng } from "html-to-image";

export interface ExportConfig {
  padding: number;
  backgroundColor: string;
  imageWidth: number;
  imageHeight: number;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  padding: 30,
  backgroundColor: "#ffffff",
  imageWidth: 2024,
  imageHeight: 768,
};

/**
 * Export the React Flow viewport as a PNG with custom dimensions
 * @param config The export configuration including custom dimensions
 * @param fileName The name of the file to save (without extension)
 */
export async function exportViewportToPNG(
  config: ExportConfig,
  fileName: string = "IseoGraphExport",
): Promise<void> {
  const viewportElement = document.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement;

  if (!viewportElement) {
    throw new Error("Viewport element not found");
  }

  try {
    const dataUrl = await toPng(viewportElement, {
      backgroundColor: config.backgroundColor,
      width: config.imageWidth,
      height: config.imageHeight,
    });
    downloadPng(dataUrl, fileName);
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
  link.setAttribute("download", `${fileName}.png`);
  link.setAttribute("href", dataUrl);
  link.click();
}

