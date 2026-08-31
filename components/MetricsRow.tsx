import { estimateCostUsd } from "@/lib/agent/pricing";
import type { Trajectory } from "@/lib/agent/types";

interface MetricsRowProps {
  baseline: Trajectory | null;
  candidate: Trajectory | null;
}

interface Summary {
  steps: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number | null;
}

function summarize(t: Trajectory): Summary {
  return {
    steps: t.steps.length,
    inputTokens: t.totalInputTokens,
    outputTokens: t.totalOutputTokens,
    latencyMs: t.totalLatencyMs,
    costUsd: estimateCostUsd(t.model, t.totalInputTokens, t.totalOutputTokens),
  };
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function formatCost(usd: number | null): string {
  return usd === null ? "n/a" : `$${usd.toFixed(4)}`;
}

function ratio(candidate: number, baseline: number): string {
  if (baseline === 0) return "n/a";
  return `${(candidate / baseline).toFixed(2)}×`;
}

const th = "px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400";
const td = "px-3 py-2 text-zinc-900 dark:text-zinc-100";

export function MetricsRow({ baseline, candidate }: MetricsRowProps) {
  if (!baseline && !candidate) return null;

  const b = baseline ? summarize(baseline) : null;
  const c = candidate ? summarize(candidate) : null;

  const rows: {
    label: string;
    baseline: string;
    candidate: string;
    ratio: string;
  }[] = [
    {
      label: "Steps",
      baseline: b ? String(b.steps) : "—",
      candidate: c ? String(c.steps) : "—",
      ratio: b && c ? ratio(c.steps, b.steps) : "—",
    },
    {
      label: "Tokens (in/out)",
      baseline: b ? `${b.inputTokens}/${b.outputTokens}` : "—",
      candidate: c ? `${c.inputTokens}/${c.outputTokens}` : "—",
      ratio:
        b && c
          ? ratio(c.inputTokens + c.outputTokens, b.inputTokens + b.outputTokens)
          : "—",
    },
    {
      label: "Latency",
      baseline: b ? formatMs(b.latencyMs) : "—",
      candidate: c ? formatMs(c.latencyMs) : "—",
      ratio: b && c ? ratio(c.latencyMs, b.latencyMs) : "—",
    },
    {
      label: "Est. cost / run",
      baseline: b ? formatCost(b.costUsd) : "—",
      candidate: c ? formatCost(c.costUsd) : "—",
      ratio:
        b && c && b.costUsd !== null && c.costUsd !== null
          ? ratio(c.costUsd, b.costUsd)
          : "—",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead className="border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className={th}>Metric</th>
            <th className={th}>Baseline</th>
            <th className={th}>Candidate</th>
            <th className={th}>Ratio (candidate / baseline)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.label}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
            >
              <td className={`${td} font-medium`}>{r.label}</td>
              <td className={`${td} font-mono`}>{r.baseline}</td>
              <td className={`${td} font-mono`}>{r.candidate}</td>
              <td className={`${td} font-mono`}>{r.ratio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
