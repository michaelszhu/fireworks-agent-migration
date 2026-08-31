// Plain <details>/<summary> — open by default so a first-time visitor sees
// it immediately, collapsible so it doesn't take up space after that.
export function HowToUse() {
  return (
    <details
      open
      className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700"
    >
      <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
        How to use this
      </summary>
      <ul className="mt-3 flex flex-col gap-2">
        <li>
          <strong>Baseline vs. candidate.</strong> Baseline is fixed — Claude
          Opus 5. Candidate is the Fireworks model you&apos;re evaluating for
          migration; pick it on the left.
        </li>
        <li>
          <strong>Task, system prompt, and tools are shared.</strong> Both
          models get the exact same three inputs, so the model is the only
          thing that changes between the two trajectories.
        </li>
        <li>
          <strong>Tools are mocked.</strong> They return fixed data from a
          small legal-research scenario, not real search — this tests tool
          choice and arguments, not tool-result quality.
        </li>
        <li>
          <strong>Runs per model.</strong> Set to 3 or 5 to see whether a
          model&apos;s behavior is consistent, not just what it did on one try.
        </li>
        <li>
          <strong>Reading a trajectory.</strong> Each step is color-coded
          against the matching step in the other column — gray: same tool
          and arguments, amber: same tool, different arguments, red:
          different tool, dashed: this trajectory ended before the other
          one did.
        </li>
        <li>
          <strong>Variance and migration plan.</strong> Appear after a run.
          One is a quick verdict, the other explains why the trajectories
          diverged and what to do next. Both are plain rules over the run
          data — no extra model call grades the output.
        </li>
      </ul>
    </details>
  );
}
