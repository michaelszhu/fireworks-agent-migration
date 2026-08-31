import type { StepRecord } from "./types";

export type StepDivergence =
  | "same" // same tool, same arguments
  | "different_tool" // baseline and candidate called different tools at this index
  | "different_args" // same tool, but different arguments
  | "unmatched"; // one trajectory has no step at this index (it finished earlier, or the other ran longer)

export function diffStep(
  mine: StepRecord | undefined,
  other: StepRecord | undefined,
): StepDivergence {
  if (!mine || !other) return "unmatched";
  if (mine.toolName !== other.toolName) return "different_tool";
  if (JSON.stringify(mine.arguments) !== JSON.stringify(other.arguments)) {
    return "different_args";
  }
  return "same";
}
