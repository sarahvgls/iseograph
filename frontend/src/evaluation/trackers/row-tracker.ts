interface RowMeasurement {
  rowIndex: number;
  rowHeight: number;
  nodesInRow: number;
}

interface RowSessionData {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalRows: number;
  averageRowHeight: number;
  averageNodesPerRow: number;
  totalNodes: number;
  rowMeasurements: RowMeasurement[];
  context: Record<string, any>;
}

class RowTracker {
  private static instance: RowTracker;
  private isTracking = false;
  private sessionStartTime = 0;
  private sessionId = "";
  private currentMeasurements: RowMeasurement[] = [];
  private sessionContext: Record<string, any> = {};
  private allSessions: RowSessionData[] = [];

  static getInstance(): RowTracker {
    if (!RowTracker.instance) {
      RowTracker.instance = new RowTracker();
    }
    return RowTracker.instance;
  }

  startTracking(context: Record<string, any> = {}): void {
    if (this.isTracking) {
      console.warn("⚠️ Row tracking already active");
      return;
    }

    this.isTracking = true;
    this.sessionStartTime = performance.now();
    const hours_and_minutes = new Date().toISOString().slice(11, 16);
    this.sessionId = `row_${hours_and_minutes}_${Math.random().toString(36).substr(2, 6)}`;
    this.currentMeasurements = [];
    this.sessionContext = { ...context };

    console.log(`📊 Row tracking started: ${this.sessionId}`);
    console.log(`📋 Context:`, this.sessionContext);
  }

  endTracking(): RowSessionData | null {
    if (!this.isTracking) {
      console.warn("⚠️ No active row tracking session");
      return null;
    }

    const endTime = performance.now();
    const totalRows = this.currentMeasurements.length;
    const averageRowHeight =
      totalRows > 0
        ? this.currentMeasurements.reduce(
            (sum, measurement) => sum + measurement.rowHeight,
            0,
          ) / totalRows
        : 0;
    const averageNodesPerRow =
      totalRows > 0
        ? this.currentMeasurements.reduce(
            (sum, measurement) => sum + measurement.nodesInRow,
            0,
          ) / totalRows
        : 0;
    const totalNodes = this.currentMeasurements.reduce(
      (sum, measurement) => sum + measurement.nodesInRow,
      0,
    );

    const sessionData: RowSessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: endTime,
      totalRows,
      averageRowHeight,
      averageNodesPerRow,
      totalNodes,
      rowMeasurements: [...this.currentMeasurements],
      context: { ...this.sessionContext },
    };

    this.allSessions.push(sessionData);
    this.isTracking = false;

    // Console output
    console.log(`⏹️ Row tracking ended: ${this.sessionId}`);
    console.log(`📊 Total rows: ${totalRows}`);
    console.log(`📏 Average row height: ${averageRowHeight.toFixed(2)}`);
    console.log(`🔢 Average nodes per row: ${averageNodesPerRow.toFixed(2)}`);
    console.log(`📦 Total nodes: ${totalNodes}`);

    if (this.currentMeasurements.length > 0) {
      console.table(
        this.currentMeasurements.slice(0, 10).map((measurement) => ({
          "Row Index": measurement.rowIndex,
          "Row Height": measurement.rowHeight.toFixed(2),
          "Nodes in Row": measurement.nodesInRow,
        })),
      );
      if (this.currentMeasurements.length > 10) {
        console.log(
          `... and ${this.currentMeasurements.length - 10} more rows`,
        );
      }
    }

    return sessionData;
  }

  // Method to record row measurements
  recordRow(rowIndex: number, rowHeight: number, nodesInRow: number): void {
    if (!this.isTracking) {
      return;
    }

    this.currentMeasurements.push({
      rowIndex,
      rowHeight,
      nodesInRow,
    });
  }

  // Method to record multiple rows at once
  recordRows(rows: RowMeasurement[]): void {
    if (!this.isTracking) {
      return;
    }

    this.currentMeasurements.push(...rows);
  }

  // Export all sessions to CSV
  exportToCSV(filename?: string): void {
    if (this.allSessions.length === 0) {
      console.warn("⚠️ No row data to export");
      return;
    }

    const headers = [
      "sessionId",
      "sessionStartTime",
      "sessionDuration",
      "totalRows",
      "averageRowHeight",
      "averageNodesPerRow",
      "totalNodes",
      "rowIndex",
      "rowHeight",
      "nodesInRow",
      "context",
    ];

    const rows: string[][] = [];

    this.allSessions.forEach((session) => {
      if (session.rowMeasurements.length === 0) {
        // Session with no rows
        rows.push([
          session.sessionId,
          new Date(
            Date.now() - (performance.now() - session.startTime),
          ).toISOString(),
          (session.endTime - session.startTime).toFixed(2),
          session.totalRows.toString(),
          session.averageRowHeight.toFixed(2),
          session.averageNodesPerRow.toFixed(2),
          session.totalNodes.toString(),
          "N/A",
          "N/A",
          "N/A",
          JSON.stringify(session.context),
        ]);
      } else {
        session.rowMeasurements.forEach((measurement) => {
          rows.push([
            session.sessionId,
            new Date(
              Date.now() - (performance.now() - session.startTime),
            ).toISOString(),
            (session.endTime - session.startTime).toFixed(2),
            session.totalRows.toString(),
            session.averageRowHeight.toFixed(2),
            session.averageNodesPerRow.toFixed(2),
            session.totalNodes.toString(),
            measurement.rowIndex.toString(),
            measurement.rowHeight.toFixed(2),
            measurement.nodesInRow.toString(),
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
        `row_measurements_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`📁 Exported ${this.allSessions.length} row sessions to CSV`);
    console.log(
      `📊 Total rows measured: ${this.allSessions.reduce((sum, s) => sum + s.totalRows, 0)}`,
    );
    console.log(
      `📦 Total nodes measured: ${this.allSessions.reduce((sum, s) => sum + s.totalNodes, 0)}`,
    );
  }

  // Get summary statistics
  getSummary(): void {
    if (this.allSessions.length === 0) {
      console.log("📊 No row data available");
      return;
    }

    const totalSessions = this.allSessions.length;
    const totalRows = this.allSessions.reduce((sum, s) => sum + s.totalRows, 0);
    const totalNodes = this.allSessions.reduce(
      (sum, s) => sum + s.totalNodes,
      0,
    );
    const avgRowHeight =
      totalRows > 0
        ? this.allSessions.reduce(
            (sum, s) => s.averageRowHeight * s.totalRows,
            0,
          ) / totalRows
        : 0;
    const avgNodesPerRow = totalRows > 0 ? totalNodes / totalRows : 0;

    const sessionStats = this.allSessions.map((session) => ({
      sessionId: session.sessionId,
      totalRows: session.totalRows,
      avgRowHeight: session.averageRowHeight,
      avgNodesPerRow: session.averageNodesPerRow,
      totalNodes: session.totalNodes,
    }));

    console.log("📊 ROW MEASURING SUMMARY");
    console.log(`Sessions: ${totalSessions}`);
    console.log(`Total rows measured: ${totalRows}`);
    console.log(`Total nodes measured: ${totalNodes}`);
    console.log(`Average row height (overall): ${avgRowHeight.toFixed(2)}`);
    console.log(
      `Average nodes per row (overall): ${avgNodesPerRow.toFixed(2)}`,
    );
    console.log("\n📈 SESSION STATISTICS:");
    console.table(sessionStats);
  }

  // Clear all data
  clearData(): void {
    this.allSessions = [];
    console.log("🗑️ All row data cleared");
  }

  // Get current tracking status
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Get current session measurements
  getCurrentMeasurements(): RowMeasurement[] {
    return [...this.currentMeasurements];
  }
}

export const rowTracker = RowTracker.getInstance();

// Convenience methods for global use
export const startRowTracking = (context?: Record<string, any>) =>
  rowTracker.startTracking(context);
export const endRowTracking = () => rowTracker.endTracking();
export const recordRowMeasurement = (
  rowIndex: number,
  rowHeight: number,
  nodesInRow: number,
) => rowTracker.recordRow(rowIndex, rowHeight, nodesInRow);
export const recordRowMeasurements = (rows: RowMeasurement[]) =>
  rowTracker.recordRows(rows);
export const exportRowCSV = (filename?: string) =>
  rowTracker.exportToCSV(filename);
export const showRowSummary = () => rowTracker.getSummary();
export const clearRowData = () => rowTracker.clearData();
