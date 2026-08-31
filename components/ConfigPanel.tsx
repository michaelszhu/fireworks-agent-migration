"use client";

import type { CandidateModelKey } from "@/lib/agent/candidate-models";
import { CANDIDATE_MODELS } from "@/lib/agent/candidate-models";
import type { RunCount } from "@/lib/agent/defaults";
import { RUN_COUNTS, TASK_PRESETS } from "@/lib/agent/defaults";

interface ConfigPanelProps {
  task: string;
  onTaskChange: (v: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (v: string) => void;
  toolsText: string;
  onToolsTextChange: (v: string) => void;
  candidateModel: CandidateModelKey;
  onCandidateModelChange: (v: CandidateModelKey) => void;
  runs: RunCount;
  onRunsChange: (v: RunCount) => void;
  onRun: () => void;
  isLoading: boolean;
  error: string | null;
}

const fieldLabel =
  "block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1";
const fieldInput =
  "w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 focus:border-brand focus:outline-none";

export function ConfigPanel({
  task,
  onTaskChange,
  systemPrompt,
  onSystemPromptChange,
  toolsText,
  onToolsTextChange,
  candidateModel,
  onCandidateModelChange,
  runs,
  onRunsChange,
  onRun,
  isLoading,
  error,
}: ConfigPanelProps) {
  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">
        Config
      </h2>

      <div>
        <label className={fieldLabel} htmlFor="task-preset">
          Task preset
        </label>
        <select
          id="task-preset"
          className={fieldInput}
          value=""
          onChange={(e) => {
            const preset = TASK_PRESETS.find((p) => p.key === e.target.value);
            if (preset) onTaskChange(preset.task);
          }}
        >
          <option value="">Load example…</option>
          {TASK_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="task">
          Task
        </label>
        <textarea
          id="task"
          className={fieldInput}
          rows={3}
          value={task}
          onChange={(e) => onTaskChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} htmlFor="candidate">
            Candidate model
          </label>
          <select
            id="candidate"
            className={fieldInput}
            value={candidateModel}
            onChange={(e) =>
              onCandidateModelChange(e.target.value as CandidateModelKey)
            }
          >
            {Object.entries(CANDIDATE_MODELS).map(([key, m]) => (
              <option key={key} value={key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="runs">
            Runs per model
          </label>
          <select
            id="runs"
            className={fieldInput}
            value={runs}
            onChange={(e) =>
              onRunsChange(Number(e.target.value) as RunCount)
            }
          >
            {RUN_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="system-prompt">
          System prompt
        </label>
        <textarea
          id="system-prompt"
          className={`${fieldInput} font-mono`}
          rows={8}
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
        />
      </div>

      <div className="flex flex-1 flex-col">
        <label className={fieldLabel} htmlFor="tools">
          Tool definitions (JSON)
        </label>
        <textarea
          id="tools"
          className={`${fieldInput} min-h-[16rem] flex-1 font-mono`}
          spellCheck={false}
          value={toolsText}
          onChange={(e) => onToolsTextChange(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onRun}
        disabled={isLoading}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold tracking-wide text-white uppercase hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Running…" : "Run comparison"}
      </button>
    </aside>
  );
}
