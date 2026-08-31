// Shared shapes for both providers, so the two agent loops record
// directly comparable trajectories.

export interface JSONSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  // Structural match for @anthropic-ai/sdk's Tool.InputSchema, which allows
  // arbitrary extra keys.
  [k: string]: unknown;
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

// The three inputs both agent loops run against — the same task, system
// prompt, and tool set go to both providers, so the only variable between
// the two trajectories is the model itself.
export interface AgentRunConfig {
  task: string;
  systemPrompt: string;
  tools: ToolDef[];
}

export interface StepRecord {
  index: number;
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export type StopReason =
  | "terminal_tool" // called draft_memo — task complete
  | "no_tool_call" // model stopped without calling a tool
  | "max_steps" // hit the step cap without finishing
  | "error"; // provider/API error

export interface Trajectory {
  provider: "anthropic" | "fireworks";
  model: string;
  task: string;
  steps: StepRecord[];
  stopReason: StopReason;
  finalText: string | null;
  errorMessage?: string;
  totalLatencyMs: number;
  // Summed across every API call in the run, not just tool-call turns —
  // the closing call (a plain-text answer, or a call that errors) is
  // billed too, and StepRecord only exists for turns that used a tool.
  totalInputTokens: number;
  totalOutputTokens: number;
}
