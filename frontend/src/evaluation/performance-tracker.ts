// performanceTracker.ts
interface FunctionTiming {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  params?: any;
}

interface SessionData {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  functionTimings: FunctionTiming[];
  context: Record<string, any>;
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private isTracking = false;
  private sessionStartTime = 0;
  private sessionId = "";
  private functionStack: { name: string; startTime: number; params?: any }[] = [];
  private completedTimings: FunctionTiming[] = [];
  private sessionContext: Record<string, any> = {};
  private allSessions: SessionData[] = [];

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startTracking(context: Record<string, any> = {}): void {
    if (this.isTracking) {
      console.warn("⚠️ Performance tracking already active");
      return;
    }

    this.isTracking = true;
    this.sessionStartTime = performance.now();
    const hours_and_minutes = new Date().toISOString().slice(11, 16);
    this.sessionId = `session_${hours_and_minutes}_${Math.random().toString(36).substr(2, 6)}`;
    this.functionStack = [];
    this.completedTimings = [];
    this.sessionContext = { ...context };

    console.log(`🚀 Performance tracking started: ${this.sessionId}`);
    console.log(`📊 Context:`, this.sessionContext);
  }

  endTracking(): SessionData | null {
    if (!this.isTracking) {
      console.warn("⚠️ No active performance tracking session");
      return null;
    }

    const endTime = performance.now();
    const totalDuration = endTime - this.sessionStartTime;

    // Close any remaining open function calls
    while (this.functionStack.length > 0) {
      const openFunction = this.functionStack.pop()!;
      this.completedTimings.push({
        name: openFunction.name,
        startTime: openFunction.startTime,
        endTime: endTime,
        duration: endTime - openFunction.startTime,
        params: openFunction.params,
      });
    }

    const sessionData: SessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: endTime,
      totalDuration,
      functionTimings: [...this.completedTimings],
      context: { ...this.sessionContext },
    };

    this.allSessions.push(sessionData);
    this.isTracking = false;

    // Console output
    console.log(`⏹️ Performance tracking ended: ${this.sessionId}`);
    console.log(`⏱️ Total duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`📈 Functions tracked: ${this.completedTimings.length}`);

    if (this.completedTimings.length > 0) {
      console.table(
        this.completedTimings.map(timing => ({
          "Function": timing.name,
          "Duration (ms)": timing.duration.toFixed(2),
          "Start (ms)": (timing.startTime - this.sessionStartTime).toFixed(2),
          "End (ms)": (timing.endTime - this.sessionStartTime).toFixed(2),
        })),
      );
    }

    return sessionData;
  }

  // Method to wrap function calls for automatic timing
  time<T extends any[], R>(name: string, fn: (...args: T) => R): (...args: T) => R {
    return (...args: T): R => {
      if (!this.isTracking) {
        return fn(...args);
      }

      const startTime = performance.now();
      this.functionStack.push({ name, startTime, params: args.length > 0 ? args : undefined });

      try {
        const result = fn(...args);

        // Handle completed function
        const functionData = this.functionStack.pop()!;
        const endTime = performance.now();

        this.completedTimings.push({
          name: functionData.name,
          startTime: functionData.startTime,
          endTime: endTime,
          duration: endTime - functionData.startTime,
          params: functionData.params,
        });

        return result;
      } catch (error) {
        // Still record timing even if function throws
        const functionData = this.functionStack.pop()!;
        const endTime = performance.now();

        this.completedTimings.push({
          name: `${functionData.name} (ERROR)`,
          startTime: functionData.startTime,
          endTime: endTime,
          duration: endTime - functionData.startTime,
          params: functionData.params,
        });

        throw error;
      }
    };
  }

  // Method for async functions
  timeAsync<T extends any[], R>(name: string, fn: (...args: T) => Promise<R>): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      if (!this.isTracking) {
        return fn(...args);
      }

      const startTime = performance.now();
      this.functionStack.push({ name, startTime, params: args.length > 0 ? args : undefined });

      try {
        const result = await fn(...args);

        // Handle completed function
        const functionData = this.functionStack.pop()!;
        const endTime = performance.now();

        this.completedTimings.push({
          name: functionData.name,
          startTime: functionData.startTime,
          endTime: endTime,
          duration: endTime - functionData.startTime,
          params: functionData.params,
        });

        return result;
      } catch (error) {
        // Still record timing even if function throws
        const functionData = this.functionStack.pop()!;
        const endTime = performance.now();

        this.completedTimings.push({
          name: `${functionData.name} (ERROR)`,
          startTime: functionData.startTime,
          endTime: endTime,
          duration: endTime - functionData.startTime,
          params: functionData.params,
        });

        throw error;
      }
    };
  }

  // Export all sessions to CSV
  exportToCSV(filename?: string): void {
    if (this.allSessions.length === 0) {
      console.warn("⚠️ No performance data to export");
      return;
    }

    const headers = [
      "sessionId",
      "sessionStartTime",
      "sessionDuration",
      "functionName",
      "functionDuration",
      "functionStart",
      "functionEnd",
      "context",
    ];

    const rows: string[][] = [];

    this.allSessions.forEach(session => {
      if (session.functionTimings.length === 0) {
        // Session with no function calls
        rows.push([
          session.sessionId,
          new Date(Date.now() - (performance.now() - session.startTime)).toISOString(),
          session.totalDuration.toFixed(2),
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          JSON.stringify(session.context),
        ]);
      } else {
        session.functionTimings.forEach(timing => {
          rows.push([
            session.sessionId,
            new Date(Date.now() - (performance.now() - session.startTime)).toISOString(),
            session.totalDuration.toFixed(2),
            timing.name,
            timing.duration.toFixed(2),
            (timing.startTime - session.startTime).toFixed(2),
            (timing.endTime - session.startTime).toFixed(2),
            JSON.stringify(session.context),
          ]);
        });
      }
    });

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename || `performance_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`📁 Exported ${this.allSessions.length} sessions to CSV`);
    console.log(`📊 Total function calls: ${this.allSessions.reduce((sum, s) => sum + s.functionTimings.length, 0)}`);
  }

  // Get summary statistics
  getSummary(): void {
    if (this.allSessions.length === 0) {
      console.log("📊 No performance data available");
      return;
    }

    const totalSessions = this.allSessions.length;
    const totalDurations = this.allSessions.map(s => s.totalDuration);
    const avgDuration = totalDurations.reduce((a, b) => a + b, 0) / totalSessions;

    const allFunctionTimings = this.allSessions.flatMap(s => s.functionTimings);
    const functionStats = allFunctionTimings.reduce((acc, timing) => {
      if (!acc[timing.name]) {
        acc[timing.name] = { calls: 0, totalTime: 0, avgTime: 0, minTime: timing.duration, maxTime: timing.duration };
      }
      acc[timing.name].calls++;
      acc[timing.name].totalTime += timing.duration;
      acc[timing.name].avgTime = acc[timing.name].totalTime / acc[timing.name].calls;
      acc[timing.name].minTime = Math.min(acc[timing.name].minTime, timing.duration);
      acc[timing.name].maxTime = Math.max(acc[timing.name].maxTime, timing.duration);
      return acc;
    }, {} as Record<string, { calls: number; totalTime: number; avgTime: number; minTime: number; maxTime: number }>);

    console.log("📊 PERFORMANCE SUMMARY");
    console.log(`Sessions: ${totalSessions}`);
    console.log(`Average session duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Min session duration: ${Math.min(...totalDurations).toFixed(2)}ms`);
    console.log(`Max session duration: ${Math.max(...totalDurations).toFixed(2)}ms`);
    console.log("\n📈 FUNCTION STATISTICS:");
    console.table(
      Object.entries(functionStats).map(([name, stats]) => ({
        "Function": name,
        "Calls": stats.calls,
        "Avg Duration (ms)": stats.avgTime.toFixed(2),
        "Min Duration (ms)": stats.minTime.toFixed(2),
        "Max Duration (ms)": stats.maxTime.toFixed(2),
        "Total Time (ms)": stats.totalTime.toFixed(2),
      })),
    );
  }

  // Clear all data
  clearData(): void {
    this.allSessions = [];
    console.log("🗑️ All performance data cleared");
  }
}

export const performanceTracker = PerformanceTracker.getInstance();

// Convenience methods for global use
export const startTracking = (context?: Record<string, any>) => performanceTracker.startTracking(context);
export const endTracking = () => performanceTracker.endTracking();
export const exportPerformanceCSV = (filename?: string) => performanceTracker.exportToCSV(filename);
export const showPerformanceSummary = () => performanceTracker.getSummary();
export const clearPerformanceData = () => performanceTracker.clearData();

// If you want to track specific functions without modifying them, you can do:
// const trackedFunction = performanceTracker.time('functionName', originalFunction);
// const trackedAsyncFunction = performanceTracker.timeAsync('asyncFunctionName', originalAsyncFunction);