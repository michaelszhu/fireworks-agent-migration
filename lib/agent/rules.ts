import type { RunVariance } from "./variance";
import type { Trajectory } from "./types";

export type MigrationVerdict =
  | "migratable"
  | "reliability_risk"
  | "behavioral_difference";

export interface MigrationAssessment {
  verdict: MigrationVerdict;
  reasons: string[];
}

// A single extra call to a tool the baseline also used isn't a finding —
// it's normal exploration (e.g. a refined search query on a second try).
// A *missing* call gets no such allowance: skipping a lookup the baseline
// made is exactly the risk this tool exists to surface (e.g. checking only
// one of two jurisdictions), so any gap in that direction counts.
const MIN_EXTRA_CALLS_TO_FLAG = 2;

function toolCounts(t: Trajectory): Map<string, number> {
  const counts = new Map<string, number>();
  for (const step of t.steps) {
    counts.set(step.toolName, (counts.get(step.toolName) ?? 0) + 1);
  }
  return counts;
}

export function assessMigration(
  baselineFirst: Trajectory,
  candidateFirst: Trajectory,
  baselineVariance: RunVariance,
  candidateVariance: RunVariance,
): MigrationAssessment {
  // A caveat, not a finding — doesn't change any verdict below, but the
  // verdict isn't trustworthy without it, so it's computed once up front
  // and appended no matter which branch fires.
  const baselineCaveat =
    baselineVariance.runs > 1 && !baselineVariance.toolSequenceIdentical
      ? "Note: baseline itself was inconsistent across runs — treat this comparison with caution."
      : null;

  if (candidateVariance.runs > 1 && !candidateVariance.toolSequenceIdentical) {
    const reasons = [
      `Candidate's tool sequence varied across ${candidateVariance.runs} runs on the same task — same input, different path each time.`,
    ];
    if (baselineCaveat) reasons.push(baselineCaveat);
    return { verdict: "reliability_risk", reasons };
  }

  const baselineCounts = toolCounts(baselineFirst);
  const candidateCounts = toolCounts(candidateFirst);
  const allTools = new Set([...baselineCounts.keys(), ...candidateCounts.keys()]);

  const reasons: string[] = [];
  for (const tool of allTools) {
    const b = baselineCounts.get(tool) ?? 0;
    const c = candidateCounts.get(tool) ?? 0;
    if (c < b) {
      reasons.push(
        `Candidate called ${tool} ${c}× vs baseline's ${b}× — check what it may have skipped.`,
      );
    } else if (c - b >= MIN_EXTRA_CALLS_TO_FLAG) {
      reasons.push(
        `Candidate called ${tool} ${c}× vs baseline's ${b}× — worth a look, though extra research isn't necessarily wrong.`,
      );
    }
  }

  const verdict: MigrationVerdict =
    reasons.length === 0 ? "migratable" : "behavioral_difference";
  if (reasons.length === 0) {
    reasons.push("Candidate's tool usage matches baseline.");
  }
  if (baselineCaveat) reasons.push(baselineCaveat);

  return { verdict, reasons };
}
