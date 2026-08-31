import type { RunVariance } from "./variance";
import type { Trajectory } from "./types";

// Plain console output — comparison is done by eye, not scored. Keeping
// this dumb on purpose: the point of the tool is to surface the raw
// trajectories, not to pre-judge them.
export function printTrajectory(t: Trajectory): void {
  console.log(`\n=== ${t.provider} (${t.model}) ===`);
  console.log(`task: ${t.task}`);

  for (const step of t.steps) {
    console.log(
      `  [${step.index}] ${step.toolName}(${JSON.stringify(step.arguments)}) ` +
        `— ${step.latencyMs}ms, ${step.inputTokens}in/${step.outputTokens}out`,
    );
  }

  console.log(`stop_reason: ${t.stopReason}`);
  if (t.finalText) console.log(`final_text: ${t.finalText}`);
  if (t.errorMessage) console.log(`error: ${t.errorMessage}`);
  console.log(
    `total: ${t.totalLatencyMs}ms, ${t.steps.length} steps, ` +
      `${t.totalInputTokens}in/${t.totalOutputTokens}out tokens`,
  );
}

export function printVariance(provider: string, v: RunVariance): void {
  console.log(
    `${provider} variance over ${v.runs} run(s): steps=[${v.stepCounts.join(",")}] ` +
      `(varied=${v.stepCountVaried}), terminal_rate=${(v.terminalToolRate * 100).toFixed(0)}%, ` +
      `sequence_identical=${v.toolSequenceIdentical}, median_latency=${v.medianLatencyMs}ms, ` +
      `total_cost=${v.totalCostUsd === null ? "n/a" : `$${v.totalCostUsd.toFixed(4)}`}`,
  );
}
