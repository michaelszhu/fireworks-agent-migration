// The two candidate models offered in the picker — deliberately just two
// (see CLAUDE.md non-goals: "no more than 2 candidate models"). Keeping the
// key -> model ID mapping server-side means the client can only ever select
// one of these two, rather than passing an arbitrary Fireworks model string.
export const CANDIDATE_MODELS = {
  kimi: {
    id: "accounts/fireworks/models/kimi-k3",
    label: "Kimi K3",
  },
  minimax: {
    id: "accounts/fireworks/models/minimax-m3",
    label: "MiniMax M3",
  },
} as const;

export type CandidateModelKey = keyof typeof CANDIDATE_MODELS;

export function isCandidateModelKey(x: unknown): x is CandidateModelKey {
  return typeof x === "string" && x in CANDIDATE_MODELS;
}
