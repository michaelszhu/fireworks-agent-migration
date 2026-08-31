// Prefilled config for the UI — working examples the user can run
// immediately without typing anything in first.
export const TASK_PRESETS = [
  {
    key: "enforceability",
    label: "Single-state enforceability",
    task: "Is the non-compete in our client's employment agreement enforceable?",
  },
  {
    key: "relocation",
    label: "Relocation to neighboring state",
    task:
      "Our client wants to enforce the non-compete against a former " +
      "employee who moved to a neighboring state and joined a competitor. " +
      "Can we?",
  },
] as const;

export const DEFAULT_TASK = TASK_PRESETS[0].task;

export const RUN_COUNTS = [1, 3, 5] as const;
export type RunCount = (typeof RUN_COUNTS)[number];
