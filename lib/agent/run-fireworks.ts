import { executeTool } from "./mock-handlers";
import { TERMINAL_TOOL_NAME } from "./tools";
import type { AgentRunConfig, StepRecord, Trajectory } from "./types";

const BASE_URL = "https://api.fireworks.ai/inference/v1";
const MAX_STEPS = 10;
const MAX_TOKENS = 4096;

// OpenAI-compatible chat-completions message shape (only the fields we use).
interface FireworksMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: FireworksToolCall[];
  tool_call_id?: string;
}

interface FireworksToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface FireworksResponse {
  choices: {
    message: FireworksMessage;
    finish_reason: string;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface FireworksRunConfig extends AgentRunConfig {
  // Resolved Fireworks model ID — see lib/agent/candidate-models.ts. The
  // caller resolves the picker's "kimi" | "minimax" key to this string, so
  // this file doesn't need to know about the picker at all.
  model: string;
}

// One tool call per turn, to match the Anthropic loop's
// disable_parallel_tool_use behavior — see run-anthropic.ts. Fireworks'
// OpenAI-compatible endpoint doesn't guarantee a single call per turn for
// every model, so if more than one comes back, only the first is executed.
export async function runFireworksAgent(
  config: FireworksRunConfig,
): Promise<Trajectory> {
  const { task, systemPrompt, tools: toolDefs, model } = config;
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    return {
      provider: "fireworks",
      model,
      task,
      steps: [],
      stopReason: "error",
      finalText: null,
      errorMessage: "FIREWORKS_API_KEY is not set",
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }

  const tools = toolDefs.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

  const messages: FireworksMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];
  const steps: StepRecord[] = [];
  const runStart = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < MAX_STEPS; i++) {
    const callStart = Date.now();
    let data: FireworksResponse;
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          messages,
          tools,
          tool_choice: "auto",
          parallel_tool_calls: false,
        }),
      });
      if (!res.ok) {
        throw new Error(`Fireworks API ${res.status}: ${await res.text()}`);
      }
      data = await res.json();
    } catch (err) {
      return {
        provider: "fireworks",
        model,
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
    totalInputTokens += data.usage?.prompt_tokens ?? 0;
    totalOutputTokens += data.usage?.completion_tokens ?? 0;

    const message = data.choices[0].message;
    const toolCall = message.tool_calls?.[0];

    if (!toolCall) {
      return {
        provider: "fireworks",
        model,
        task,
        steps,
        stopReason: "no_tool_call",
        finalText: message.content ?? null,
        totalLatencyMs: Date.now() - runStart,
        totalInputTokens,
        totalOutputTokens,
      };
    }

    const args = JSON.parse(toolCall.function.arguments) as Record<
      string,
      unknown
    >;
    const result = executeTool(toolCall.function.name, args);

    steps.push({
      index: steps.length,
      toolName: toolCall.function.name,
      arguments: args,
      result,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      latencyMs,
    });

    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: [toolCall],
    });
    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    });

    if (toolCall.function.name === TERMINAL_TOOL_NAME) {
      return {
        provider: "fireworks",
        model,
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
    provider: "fireworks",
    model,
    task,
    steps,
    stopReason: "max_steps",
    finalText: null,
    totalLatencyMs: Date.now() - runStart,
    totalInputTokens,
    totalOutputTokens,
  };
}
