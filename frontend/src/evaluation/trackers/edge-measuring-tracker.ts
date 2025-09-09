interface EdgeMeasurement {
  edgeId: string;
  sourceId: string;
  targetId: string;
  length: number;
  peptideCount?: number;
  isoforms?: string[];
}

interface MeasuringSessionData {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalEdgeLength: number;
  edgeCount: number;
  averageEdgeLength: number;
  edgeMeasurements: EdgeMeasurement[];
  context: Record<string, any>;
}

class EdgeMeasuringTracker {
  private static instance: EdgeMeasuringTracker;
  private isActive = false;
  private isTracking = false;
  private sessionStartTime = 0;
  private sessionId = "";
  private currentMeasurements: EdgeMeasurement[] = [];
  private sessionContext: Record<string, any> = {};
  private allSessions: MeasuringSessionData[] = [];

  static getInstance(): EdgeMeasuringTracker {
    if (!EdgeMeasuringTracker.instance) {
      EdgeMeasuringTracker.instance = new EdgeMeasuringTracker();
    }
    return EdgeMeasuringTracker.instance;
  }

  startTracking(context: Record<string, any> = {}): void {
    if (!this.isActive) {
      console.log("📏 Edge measuring tracker is disabled");
      return;
    }

    if (this.isTracking) {
      console.warn("⚠️ Measuring tracking already active");
      return;
    }

    this.isTracking = true;
    this.sessionStartTime = performance.now();
    const hours_and_minutes = new Date().toISOString().slice(11, 16);
    this.sessionId = `measuring_${hours_and_minutes}_${Math.random().toString(36).substr(2, 6)}`;
    this.currentMeasurements = [];
    this.sessionContext = { ...context };

    console.log(`📏 Edge measuring tracking started: ${this.sessionId}`);
    console.log(`📊 Context:`, this.sessionContext);
  }

  endTracking(): MeasuringSessionData | null {
    if (!this.isTracking) {
      console.warn("⚠️ No active measuring tracking session");
      return null;
    }

    const endTime = performance.now();
    const totalEdgeLength = this.currentMeasurements.reduce(
      (sum, measurement) => sum + measurement.length,
      0,
    );
    const edgeCount = this.currentMeasurements.length;
    const averageEdgeLength = edgeCount > 0 ? totalEdgeLength / edgeCount : 0;

    const sessionData: MeasuringSessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: endTime,
      totalEdgeLength,
      edgeCount,
      averageEdgeLength,
      edgeMeasurements: [...this.currentMeasurements],
      context: { ...this.sessionContext },
    };

    this.allSessions.push(sessionData);
    this.isTracking = false;

    // Console output
    console.log(`⏹️ Edge measuring tracking ended: ${this.sessionId}`);
    console.log(`📏 Total edge length: ${totalEdgeLength.toFixed(2)}`);
    console.log(`🔢 Total edges: ${edgeCount}`);
    console.log(`📐 Average edge length: ${averageEdgeLength.toFixed(2)}`);

    if (this.currentMeasurements.length > 0) {
      console.table(
        this.currentMeasurements.slice(0, 10).map((measurement, index) => ({
          Index: index + 1,
          "Edge ID": measurement.edgeId,
          Source: measurement.sourceId,
          Target: measurement.targetId,
          Length: measurement.length.toFixed(2),
          Peptides: measurement.peptideCount || 0,
        })),
      );
      if (this.currentMeasurements.length > 10) {
        console.log(
          `... and ${this.currentMeasurements.length - 10} more edges`,
        );
      }
    }

    return sessionData;
  }

  // Method to record edge measurements
  recordEdge(
    edgeId: string,
    sourceId: string,
    targetId: string,
    length: number,
    peptideCount?: number,
    isoforms?: string[],
  ): void {
    if (!this.isActive || !this.isTracking) {
      return;
    }

    this.currentMeasurements.push({
      edgeId,
      sourceId,
      targetId,
      length,
      peptideCount,
      isoforms,
    });
  }

  // Method to record multiple edges at once
  recordEdges(edges: EdgeMeasurement[]): void {
    if (!this.isActive || !this.isTracking) {
      return;
    }

    this.currentMeasurements.push(...edges);
  }

  // Export all sessions to CSV
  exportToCSV(filename?: string): void {
    if (this.allSessions.length === 0) {
      console.warn("⚠️ No measuring data to export");
      return;
    }

    const headers = [
      "sessionId",
      "sessionStartTime",
      "sessionDuration",
      "totalEdgeLength",
      "edgeCount",
      "averageEdgeLength",
      "edgeId",
      "sourceId",
      "targetId",
      "edgeLength",
      "peptideCount",
      "isoforms",
      "context",
    ];

    const rows: string[][] = [];

    this.allSessions.forEach((session) => {
      if (session.edgeMeasurements.length === 0) {
        // Session with no edges
        rows.push([
          session.sessionId,
          new Date(
            Date.now() - (performance.now() - session.startTime),
          ).toISOString(),
          (session.endTime - session.startTime).toFixed(2),
          session.totalEdgeLength.toFixed(2),
          session.edgeCount.toString(),
          session.averageEdgeLength.toFixed(2),
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          JSON.stringify(session.context),
        ]);
      } else {
        session.edgeMeasurements.forEach((measurement) => {
          rows.push([
            session.sessionId,
            new Date(
              Date.now() - (performance.now() - session.startTime),
            ).toISOString(),
            (session.endTime - session.startTime).toFixed(2),
            session.totalEdgeLength.toFixed(2),
            session.edgeCount.toString(),
            session.averageEdgeLength.toFixed(2),
            measurement.edgeId,
            measurement.sourceId,
            measurement.targetId,
            measurement.length.toFixed(2),
            (measurement.peptideCount || 0).toString(),
            JSON.stringify(measurement.isoforms || []),
            JSON.stringify(session.context),
          ]);
        });
      }
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      filename ||
        `edge_measurements_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(
      `📁 Exported ${this.allSessions.length} measuring sessions to CSV`,
    );
    console.log(
      `📏 Total edges measured: ${this.allSessions.reduce((sum, s) => sum + s.edgeCount, 0)}`,
    );
    console.log(
      `📐 Total edge length: ${this.allSessions.reduce((sum, s) => sum + s.totalEdgeLength, 0).toFixed(2)}`,
    );
  }

  // Get summary statistics
  getSummary(): void {
    if (this.allSessions.length === 0) {
      console.log("📊 No measuring data available");
      return;
    }

    const totalSessions = this.allSessions.length;
    const totalEdges = this.allSessions.reduce(
      (sum, s) => sum + s.edgeCount,
      0,
    );
    const totalLength = this.allSessions.reduce(
      (sum, s) => sum + s.totalEdgeLength,
      0,
    );
    const avgLengthOverall = totalEdges > 0 ? totalLength / totalEdges : 0;

    const sessionStats = this.allSessions.map((session) => ({
      sessionId: session.sessionId,
      edgeCount: session.edgeCount,
      totalLength: session.totalEdgeLength,
      avgLength: session.averageEdgeLength,
    }));

    console.log("📏 EDGE MEASURING SUMMARY");
    console.log(`Sessions: ${totalSessions}`);
    console.log(`Total edges measured: ${totalEdges}`);
    console.log(`Total edge length: ${totalLength.toFixed(2)}`);
    console.log(
      `Average edge length (overall): ${avgLengthOverall.toFixed(2)}`,
    );
    console.log("\n📈 SESSION STATISTICS:");
    console.table(sessionStats);
  }

  // Clear all data
  clearData(): void {
    this.allSessions = [];
    console.log("🗑️ All measuring data cleared");
  }

  // Get current tracking status
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Get current session measurements
  getCurrentMeasurements(): EdgeMeasurement[] {
    return [...this.currentMeasurements];
  }

  // Stop tracking without saving session data
  stopTracking(): void {
    if (this.isTracking) {
      this.isTracking = false;
      this.currentMeasurements = [];
      console.log(`🛑 Edge measuring tracking stopped: ${this.sessionId}`);
    }
  }

  // Activate or deactivate the tracker
  activate(active: boolean): void {
    this.isActive = active;
    if (!active && this.isTracking) {
      this.stopTracking();
    }
    console.log(
      `📏 Edge measuring tracker ${active ? "activated" : "deactivated"}`,
    );
  }

  // Get activation status
  getActivationStatus(): boolean {
    return this.isActive;
  }
}

export const measuringTracker = EdgeMeasuringTracker.getInstance();

// Convenience methods for global use
export const startMeasuring = (context?: Record<string, any>) =>
  measuringTracker.startTracking(context);
export const endMeasuring = () => measuringTracker.endTracking();
export const recordEdgeMeasurement = (
  edgeId: string,
  sourceId: string,
  targetId: string,
  length: number,
  peptideCount?: number,
  isoforms?: string[],
) =>
  measuringTracker.recordEdge(
    edgeId,
    sourceId,
    targetId,
    length,
    peptideCount,
    isoforms,
  );
export const recordEdgeMeasurements = (edges: EdgeMeasurement[]) =>
  measuringTracker.recordEdges(edges);
export const exportMeasuringCSV = (filename?: string) =>
  measuringTracker.exportToCSV(filename);
export const showMeasuringSummary = () => measuringTracker.getSummary();
export const clearMeasuringData = () => measuringTracker.clearData();
// Stop all tracking across all trackers
export const stopAllTracking = () => {
  measuringTracker.stopTracking();

  // Import and stop other trackers
  try {
    const { performanceTracker } = require("./performance-tracker");
    performanceTracker.getInstance().stopTracking();
  } catch (e) {}

  try {
    const { rowTracker } = require("./row-tracker");
    rowTracker.getInstance().stopTracking();
  } catch (e) {}

  console.log("🛑 All tracking stopped");
};

export const stopMeasuring = () => measuringTracker.stopTracking();
export const activateEdgeMeasuring = (active: boolean) =>
  measuringTracker.activate(active);
export const activateAllTrackers = (active: boolean) => {
  measuringTracker.activate(active);

  try {
    const { performanceTracker } = require("./performance-tracker");
    performanceTracker.getInstance().activate(active);
  } catch (e) {}

  try {
    const { rowTracker } = require("./row-tracker");
    rowTracker.getInstance().activate(active);
  } catch (e) {}

  console.log(`🎛️ All trackers ${active ? "activated" : "deactivated"}`);
};
