import { toPng } from "html-to-image";

export interface ExportConfig {
  backgroundColor: string;
  imageWidth: number;
  imageHeight: number;
}

export interface ExportMetadata {
  highlightMethod: "intensity" | "peptide-count";
  intensitySource?: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  backgroundColor: "#ffffff",
  imageWidth: 2024,
  imageHeight: 768,
};

/**
 * Generate a sophisticated filename with date, time, and highlighting method
 * @param metadata Export metadata including highlighting method and intensity source
 * @returns The generated filename without extension
 */
export function generateFileName(metadata: ExportMetadata): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const dateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  let highlightStr: string;
  if (metadata.highlightMethod === "intensity" && metadata.intensitySource) {
    // convert metadata.intensitySource to a valid string (not empty or containing whitespace)
    const str = metadata.intensitySource.trim().replace(/\s+/g, "-");
    if (str.length === 0) {
      highlightStr = "intensity-unknown";
    } else {
      highlightStr = `intensity-${metadata.intensitySource}`;
    }
  } else {
    highlightStr = "peptide-count";
  }

  return `IseoGraph_${dateTimeStr}_${highlightStr}`;
}

/**
 * Export the React Flow viewport as a PNG with custom dimensions
 * @param config The export configuration including custom dimensions
 * @param metadata Export metadata including highlighting method and intensity source
 */
export async function exportViewportToPNG(
  config: ExportConfig,
  metadata: ExportMetadata,
): Promise<void> {
  const viewportElement = document.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement | null;

  if (!viewportElement) {
    throw new Error("Viewport element not found");
  }

  try {
    const fileName = generateFileName(metadata);
    const dataUrl = await toPng(viewportElement, {
      backgroundColor: config.backgroundColor,
      width: config.imageWidth,
      height: config.imageHeight,
    });
    downloadPng(dataUrl, fileName);
  } catch (error) {
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
