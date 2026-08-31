import { estimateCostUsd } from "./pricing";
import type { Trajectory } from "./types";

export interface RunVariance {
  runs: number;
  stepCounts: number[]; // one entry per run, in run order
  stepCountVaried: boolean;
  terminalToolRate: number; // fraction (0..1) of runs that ended by calling the terminal tool
  toolSequenceIdentical: boolean; // same ordered list of tool names on every run
  medianLatencyMs: number;
  totalCostUsd: number | null; // summed across all runs; null if the model is unpriced
}

function toolSequence(t: Trajectory): string[] {
  return t.steps.map((s) => s.toolName);
}

// Run counts are always odd (1, 3, or 5 — see ConfigPanel's picker), so the
// middle element after sorting is the median with no averaging needed.
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function computeVariance(trajectories: Trajectory[]): RunVariance {
  const stepCounts = trajectories.map((t) => t.steps.length);
  const firstSequence = JSON.stringify(toolSequence(trajectories[0]));

  const costs = trajectories.map((t) =>
    estimateCostUsd(t.model, t.totalInputTokens, t.totalOutputTokens),
  );

  return {
    runs: trajectories.length,
    stepCounts,
    stepCountVaried: new Set(stepCounts).size > 1,
    terminalToolRate:
      trajectories.filter((t) => t.stopReason === "terminal_tool").length /
      trajectories.length,
    toolSequenceIdentical: trajectories.every(
      (t) => JSON.stringify(toolSequence(t)) === firstSequence,
    ),
    medianLatencyMs: median(trajectories.map((t) => t.totalLatencyMs)),
    totalCostUsd: costs.some((c) => c === null)
      ? null
      : (costs as number[]).reduce((sum, c) => sum + c, 0),
  };
}
