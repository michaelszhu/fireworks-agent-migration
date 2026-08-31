import Anthropic from "@anthropic-ai/sdk";
import { executeTool } from "./mock-handlers";
import { TERMINAL_TOOL_NAME } from "./tools";
import type { AgentRunConfig, StepRecord, Trajectory } from "./types";

const MODEL = "claude-opus-5";
const MAX_STEPS = 10;
// Higher than the Fireworks loop's budget — Opus 5 thinks by default
// (adaptive thinking is its only on-mode, and it runs unless explicitly
// disabled), and reasoning tokens count against max_tokens on top of the
// tool call or memo text itself.
const MAX_TOKENS = 8192;

// disable_parallel_tool_use keeps one tool call per turn, so a "step" here
// means exactly one tool decision — matching how run-fireworks.ts records
// steps, which makes the two trajectories directly comparable.
export async function runAnthropicAgent(
  config: AgentRunConfig,
): Promise<Trajectory> {
  const { task, systemPrompt, tools: toolDefs } = config;
  const client = new Anthropic();
  const tools: Anthropic.Tool[] = toolDefs.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: task },
  ];
  const steps: StepRecord[] = [];
  const runStart = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < MAX_STEPS; i++) {
    const callStart = Date.now();
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        // Adaptive is Opus 5's default even if omitted — set explicitly so
        // the intent is visible here rather than relying on a default a
        // reader has to already know.
        thinking: { type: "adaptive" },
        tools,
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
        messages,
      });
    } catch (err) {
      return {
        provider: "anthropic",
        model: MODEL,
        task,
        steps,
        stopReason: "error",
        finalText: null,
        errorMessage: err instanceof Error ? err.message : String(err),
        totalLatencyMs: Date.now() - runStart,
        totalInputTokens,
        totalOutputTokens,
      };
    }
    const latencyMs = Date.now() - callStart;
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === "text",
      );
      return {
        provider: "anthropic",
        model: MODEL,
        task,
        steps,
        stopReason: "no_tool_call",
        finalText: textBlock?.text ?? null,
        totalLatencyMs: Date.now() - runStart,
        totalInputTokens,
        totalOutputTokens,
      };
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    )!;
    const args = toolUse.input as Record<string, unknown>;
    const result = executeTool(toolUse.name, args);

    steps.push({
      index: steps.length,
      toolName: toolUse.name,
      arguments: args,
      result,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    });

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        },
      ],
    });

    if (toolUse.name === TERMINAL_TOOL_NAME) {
      return {
        provider: "anthropic",
        model: MODEL,
        task,
        steps,
        stopReason: "terminal_tool",
        finalText: null,
        totalLatencyMs: Date.now() - runStart,
        totalInputTokens,
        totalOutputTokens,
      };
    }
  }

  return {
    provider: "anthropic",
    model: MODEL,
    task,
    steps,
    stopReason: "max_steps",
    finalText: null,
    totalLatencyMs: Date.now() - runStart,
    totalInputTokens,
    totalOutputTokens,
  };
}
