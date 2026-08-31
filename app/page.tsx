"use client";

import { useState } from "react";
import { ConfigPanel } from "@/components/ConfigPanel";
import { MetricsRow } from "@/components/MetricsRow";
import { MigrationPlan } from "@/components/MigrationPlan";
import { TrajectoryColumn } from "@/components/TrajectoryColumn";
import { VarianceSummary } from "@/components/VarianceSummary";
import type { CandidateModelKey } from "@/lib/agent/candidate-models";
import { CANDIDATE_MODELS } from "@/lib/agent/candidate-models";
import type { RunCount } from "@/lib/agent/defaults";
import { DEFAULT_TASK } from "@/lib/agent/defaults";
import type { MigrationPlan as MigrationPlanData } from "@/lib/agent/migration-plan";
import type { MigrationAssessment } from "@/lib/agent/rules";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { TOOLS } from "@/lib/agent/tools";
import type { Trajectory } from "@/lib/agent/types";
import type { RunVariance } from "@/lib/agent/variance";

interface ProviderResult {
  first: Trajectory;
  variance: RunVariance;
}

interface CompareResult {
  anthropic: ProviderResult;
  fireworks: ProviderResult;
  assessment: MigrationAssessment;
  migrationPlan: MigrationPlanData;
}

export default function Home() {
  const [task, setTask] = useState<string>(DEFAULT_TASK);
  const [systemPrompt, setSystemPrompt] = useState<string>(SYSTEM_PROMPT);
  const [toolsText, setToolsText] = useState(JSON.stringify(TOOLS, null, 2));
  const [candidateModel, setCandidateModel] = useState<CandidateModelKey>("kimi");
  const [runs, setRuns] = useState<RunCount>(1);

  const [result, setResult] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setError(null);

    let tools: unknown;
    try {
      tools = JSON.parse(toolsText);
    } catch {
      setError("Tool definitions are not valid JSON.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, systemPrompt, tools, candidateModel, runs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  const candidateLabel = `Candidate — ${CANDIDATE_MODELS[candidateModel].label}`;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]">
      <ConfigPanel
        task={task}
        onTaskChange={setTask}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        toolsText={toolsText}
        onToolsTextChange={setToolsText}
        candidateModel={candidateModel}
        onCandidateModelChange={setCandidateModel}
        runs={runs}
        onRunsChange={setRuns}
        onRun={handleRun}
        isLoading={isLoading}
        error={error}
      />

      <main className="flex flex-col gap-4 p-4">
        <div>
          <p className="font-mono text-xs font-semibold tracking-widest text-brand uppercase">
            Agent trajectory diff
          </p>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Trajectory comparison
          </h1>
        </div>

        {result && (
          <>
            <VarianceSummary
              baselineLabel="Baseline — Claude Opus 5"
              candidateLabel={candidateLabel}
              baseline={result.anthropic.variance}
              candidate={result.fireworks.variance}
              assessment={result.assessment}
            />
            <MigrationPlan plan={result.migrationPlan} />
          </>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TrajectoryColumn
            label="Baseline — Claude Opus 5"
            trajectory={result?.anthropic.first ?? null}
            other={result?.fireworks.first ?? null}
            isLoading={isLoading}
          />
          <TrajectoryColumn
            label={candidateLabel}
            trajectory={result?.fireworks.first ?? null}
            other={result?.anthropic.first ?? null}
            isLoading={isLoading}
          />
        </div>

        <MetricsRow
          baseline={result?.anthropic.first ?? null}
          candidate={result?.fireworks.first ?? null}
        />
      </main>
    </div>
  );
}
