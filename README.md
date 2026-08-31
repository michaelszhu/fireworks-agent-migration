# fireworks-agent-migration

Runs the same agentic task against Claude and a Fireworks model, then shows exactly where their tool-use trajectories diverge.

![Demo](docs/demo.png)

**Live demo:** https://fireworks-agent-migration.vercel.app

## Run it locally

```bash
git clone <this-repo>
cd fireworks-agent-migration
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=
FIREWORKS_API_KEY=
```

```bash
npm run dev
```

Open `http://localhost:3000`. The config panel is prefilled with a working example — click "Run comparison."

## How it works

- Both models get the same system prompt, tool definitions, and task. Each runs its own agent loop (tool call → mocked tool result → repeat) until it calls the terminal tool or hits a step cap.
- Tools are mocked against a small fixed dataset, not real search — the point is to isolate *which* tools a model calls, in what order, with what arguments, not whether the mock data is realistic.
- The two trajectories are diffed step by step and rendered side by side, with divergent steps highlighted.
- Two small rule-based read-outs (no extra model call) turn the raw trajectory and multi-run data into a verdict badge and a plain-language migration recommendation.

## Repo structure

**App**
- `app/page.tsx` — the UI: config panel, trajectory columns, metrics
- `app/api/compare/route.ts` — runs both agent loops, returns trajectories, variance, and recommendations
- `app/layout.tsx` — fonts and root HTML shell
- `app/globals.css` — theme tokens (brand color, font)

**Components**
- `components/ConfigPanel.tsx` — task, system prompt, tools, candidate model, run count
- `components/TrajectoryColumn.tsx` — one model's step-by-step trajectory, diff-highlighted
- `components/VarianceSummary.tsx` — multi-run consistency stats and the verdict badge
- `components/MigrationPlan.tsx` — the plain-language migration recommendation
- `components/MetricsRow.tsx` — steps / tokens / latency / cost table

**Agent logic** (`lib/agent/`)
- `types.ts` — shared trajectory, step, and tool types
- `tools.ts` — the four tool definitions
- `system-prompt.ts` — the agent's system prompt
- `mock-data.ts` — the fictional statutes, cases, and client documents
- `mock-handlers.ts` — executes a tool call against the mock data
- `run-anthropic.ts` — the Claude agent loop
- `run-fireworks.ts` — the Fireworks agent loop
- `diff.ts` — classifies a step as matching, tool-diverged, or argument-diverged
- `variance.ts` — step-count, consistency, and cost stats across N runs
- `rules.ts` — the verdict badge logic (migratable / reliability risk / behavioral difference)
- `migration-plan.ts` — the migration-recommendation logic
- `pricing.ts` — per-token cost table
- `candidate-models.ts` — the two selectable Fireworks models
- `defaults.ts` — task presets and run-count options
- `print.ts` — console logging of trajectories and variance
