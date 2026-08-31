import type { MigrationAssessment } from "@/lib/agent/rules";
import type { RunVariance } from "@/lib/agent/variance";

interface VarianceSummaryProps {
  baselineLabel: string;
  candidateLabel: string;
  baseline: RunVariance;
  candidate: RunVariance;
  assessment: MigrationAssessment;
}

const VERDICT_STYLES: Record<MigrationAssessment["verdict"], string> = {
  migratable: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  reliability_risk: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  behavioral_difference:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const VERDICT_LABELS: Record<MigrationAssessment["verdict"], string> = {
  migratable: "Migratable",
  reliability_risk: "Reliability risk",
  behavioral_difference: "Behavioral difference",
};

function formatCost(usd: number | null): string {
  return usd === null ? "n/a" : `$${usd.toFixed(4)}`;
}

function VarianceStats({ label, v }: { label: string; v: RunVariance }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        <li>
          Steps per run: {v.stepCounts.join(", ")}
          {v.stepCountVaried && (
            <span className="text-amber-600 dark:text-amber-400"> (varied)</span>
          )}
        </li>
        <li>Reached terminal tool: {(v.terminalToolRate * 100).toFixed(0)}% of runs</li>
        <li>Tool sequence identical across runs: {v.toolSequenceIdentical ? "yes" : "no"}</li>
        <li>Median latency: {v.medianLatencyMs}ms</li>
        <li>
          Total cost ({v.runs} run{v.runs > 1 ? "s" : ""}): {formatCost(v.totalCostUsd)}
        </li>
      </ul>
    </div>
  );
}

export function VarianceSummary({
  baselineLabel,
  candidateLabel,
  baseline,
  candidate,
  assessment,
}: VarianceSummaryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Variance across {baseline.runs} run{baseline.runs > 1 ? "s" : ""}
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[assessment.verdict]}`}
        >
          {VERDICT_LABELS[assessment.verdict]}
        </span>
      </div>

      <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {assessment.reasons.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VarianceStats label={baselineLabel} v={baseline} />
        <VarianceStats label={candidateLabel} v={candidate} />
      </div>
    </div>
  );
}
