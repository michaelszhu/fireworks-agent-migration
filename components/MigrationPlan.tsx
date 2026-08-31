import type { MigrationPlan as MigrationPlanData } from "@/lib/agent/migration-plan";

interface MigrationPlanProps {
  plan: MigrationPlanData;
}

const CATEGORY_LABELS: Record<MigrationPlanData["category"], string> = {
  prompt_schema_issue: "Prompt / schema issue",
  planning_gap: "Planning gap",
  narrow_repeatable_failure: "Narrow, repeatable failure",
  fails_broadly: "Fails broadly",
  no_significant_gap: "No significant gap",
};

// Deliberately not badge-styled like VarianceSummary's verdict pill — this
// is a short plan to read, not a pass/fail signal to glance at.
export function MigrationPlan({ plan }: MigrationPlanProps) {
  return (
    <div className="rounded-lg border-l-2 border-brand-accent border-y border-r border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">
        Migration plan — {CATEGORY_LABELS[plan.category]}
      </h2>
      <p className="mt-2 text-sm text-zinc-700">{plan.recommendation}</p>
      <p className="mt-2 text-xs italic text-zinc-400">
        Inferred from this run&apos;s trajectories — a heuristic reading, not a measured outcome.
      </p>
    </div>
  );
}
