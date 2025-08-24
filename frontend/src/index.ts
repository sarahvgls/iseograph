// frontend/src/index.ts

import {
  startTracking,
  endTracking,
  exportPerformanceCSV,
  showPerformanceSummary,
} from "./evaluation/performance-tracker";

declare global {
  interface Window {
    startTracking: typeof startTracking;
    endTracking: typeof endTracking;
    exportPerformanceCSV: typeof exportPerformanceCSV;
    showPerformanceSummary: typeof showPerformanceSummary;
  }
}

// Explicitly assign the imported functions to the window object.
// This is the crucial step that was likely missing or not working as expected.
(window as any).startTracking = startTracking;
(window as any).endTracking = endTracking;
(window as any).exportPerformanceCSV = exportPerformanceCSV;
(window as any).showPerformanceSummary = showPerformanceSummary;

console.log("Performance tracking functions exposed to the window object.");
