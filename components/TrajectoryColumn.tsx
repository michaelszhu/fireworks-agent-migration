import { diffStep, type StepDivergence } from "@/lib/agent/diff";
import { TERMINAL_TOOL_NAME } from "@/lib/agent/tools";
import type { StepRecord, Trajectory } from "@/lib/agent/types";

interface TrajectoryColumnProps {
  label: string;
  trajectory: Trajectory | null;
  other: Trajectory | null;
  isLoading: boolean;
}

interface MemoSection {
  heading: string;
  content: string;
}

function extractMemoSections(steps: StepRecord[]): MemoSection[] | null {
  const last = steps[steps.length - 1];
  if (!last || last.toolName !== TERMINAL_TOOL_NAME) return null;
  const sections = last.arguments.sections;
  if (!Array.isArray(sections)) return null;
  const out: MemoSection[] = [];
  for (const s of sections) {
    const rec = s as Record<string, unknown>;
    if (typeof rec?.heading === "string" && typeof rec?.content === "string") {
      out.push({ heading: rec.heading, content: rec.content });
    }
  }
  return out.length > 0 ? out : null;
}

// Left border + tint communicate at a glance whether this step matches the
// other column at the same index — the whole point of a side-by-side view.
const DIVERGENCE_CLASSES: Record<StepDivergence, string> = {
  same: "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
  different_tool:
    "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40",
  different_args:
    "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  unmatched:
    "border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-600",
};

function StopBadge({ trajectory }: { trajectory: Trajectory }) {
  const label =
    trajectory.stopReason === "terminal_tool"
      ? "done"
      : trajectory.stopReason === "no_tool_call"
        ? "stopped early"
        : trajectory.stopReason === "max_steps"
          ? "hit step limit"
          : "error";
  const classes =
    trajectory.stopReason === "terminal_tool"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : trajectory.stopReason === "error"
        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

export function TrajectoryColumn({
  label,
  trajectory,
  other,
  isLoading,
}: TrajectoryColumnProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {label}
          </h3>
          {trajectory && (
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {trajectory.model}
            </p>
          )}
        </div>
        {trajectory && <StopBadge trajectory={trajectory} />}
      </div>

      {!trajectory && (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          {isLoading ? "Running…" : "Run a comparison to see results here."}
        </p>
      )}

      {trajectory?.errorMessage && (
        <p className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {trajectory.errorMessage}
        </p>
      )}

      {trajectory && (
        <ol className="flex flex-col gap-2">
          {Array.from({
            length: Math.max(trajectory.steps.length, other?.steps.length ?? 0),
          }).map((_, i) => {
            const step = trajectory.steps[i];
            const otherStep = other?.steps[i];
            const divergence = diffStep(step, otherStep);
            if (!step) {
              return (
                <li
                  key={i}
                  className={`rounded-md border-l-4 p-2 text-xs italic ${DIVERGENCE_CLASSES.unmatched}`}
                >
                  (finished — no step {i})
                </li>
              );
            }
            return (
              <li
                key={i}
                className={`rounded-md border-l-4 p-2 text-sm ${DIVERGENCE_CLASSES[divergence]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    [{step.index}] {step.toolName}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {step.latencyMs}ms · {step.inputTokens}in/{step.outputTokens}
                    out
                  </span>
                </div>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(step.arguments, null, 2)}
                </pre>
              </li>
            );
          })}
        </ol>
      )}

      {trajectory && trajectory.stopReason === "no_tool_call" && trajectory.finalText && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {trajectory.finalText}
        </p>
      )}

      {trajectory &&
        (() => {
          const memo = extractMemoSections(trajectory.steps);
          if (!memo) return null;
          return (
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Memo
              </h4>
              <div className="flex flex-col gap-2">
                {memo.map((s, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {s.heading}
                    </p>
                    <p className="whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
