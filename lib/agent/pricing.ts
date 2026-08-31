// Standard serverless rates, $ per 1M tokens. Anthropic: anthropic.com
// pricing page. Fireworks: docs.fireworks.ai/serverless/pricing. Checked
// 2026-08-31 — both catalogs change, re-verify before trusting this for
// real budgeting.
export const PRICING_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "accounts/fireworks/models/kimi-k3": { input: 3.0, output: 15.0 },
  "accounts/fireworks/models/minimax-m3": { input: 0.3, output: 1.2 },
};

// Returns null for an unpriced model rather than throwing — a run should
// still display even if pricing is stale or the model is unrecognized.
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const rate = PRICING_PER_MILLION[model];
  if (!rate) return null;
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}
