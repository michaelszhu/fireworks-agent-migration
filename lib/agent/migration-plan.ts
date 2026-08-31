import type { RunVariance } from "./variance";
import type { ToolDef, StepRecord, Trajectory } from "./types";

export type MigrationCategory =
  | "prompt_schema_issue"
  | "planning_gap"
  | "narrow_repeatable_failure"
  | "fails_broadly"
  | "no_significant_gap";

export interface MigrationPlan {
  category: MigrationCategory;
  recommendation: string;
}

// Mirrors rules.ts's own threshold — one extra step is not a finding.
const MATERIAL_STEP_GAP = 2;

function hasAllRequiredArgs(step: StepRecord, tools: ToolDef[]): boolean {
  const def = tools.find((t) => t.name === step.toolName);
  if (!def) return false; // called a tool that isn't even declared
  return def.input_schema.required.every((f) => step.arguments[f] !== undefined);
}

// No model call — reads only the trajectories and variance stats the
// runners and computeVariance() already produced. A heuristic diagnosis of
// *why* the candidate diverged, not just *that* it did (see rules.ts for
// the latter) — read as a plan to investigate, not a graded outcome.
export function inferMigrationPlan(
  baselineFirst: Trajectory,
  candidateFirst: Trajectory,
  candidateVariance: RunVariance,
  tools: ToolDef[],
): MigrationPlan {
  const baselineTools = new Set(baselineFirst.steps.map((s) => s.toolName));
  const wrongTool = candidateFirst.steps.some((s) => !baselineTools.has(s.toolName));
  const malformedArgs = candidateFirst.steps.some((s) => !hasAllRequiredArgs(s, tools));

  if (wrongTool || malformedArgs) {
    return {
      category: "prompt_schema_issue",
      recommendation:
        "Candidate called a tool the baseline never used, or produced arguments missing required fields. Likely a prompt/schema issue — tool descriptions were probably written for the baseline's conventions. Rewrite them to be model-agnostic and re-test.",
    };
  }

  if (candidateVariance.terminalToolRate < 1) {
    if (candidateVariance.toolSequenceIdentical) {
      return {
        category: "narrow_repeatable_failure",
        recommendation:
          "Candidate fails to finish the same way on every run — a narrow, repeatable failure. Worth a fine-tuning pass: the failure mode is consistent enough to target directly.",
      };
    }
    return {
      category: "fails_broadly",
      recommendation:
        "Candidate fails to finish, and inconsistently — a different path or dead end each run. Keep this workload on the closed model for now.",
    };
  }

  if (candidateFirst.steps.length - baselineFirst.steps.length >= MATERIAL_STEP_GAP) {
    return {
      category: "planning_gap",
      recommendation:
        "Candidate reaches the right tools but takes materially more steps to get there — a planning gap, not a comprehension problem. Try a stronger open model, or expose fewer tools per turn to cut the branching factor.",
    };
  }

  return {
    category: "no_significant_gap",
    recommendation: "Trajectories closely match baseline — looks migratable as-is.",
  };
}
