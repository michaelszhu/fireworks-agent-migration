// Fixed mock dataset for the legal research agent. Everything here is
// fictional (states, statutes, cases, client) — built to contain two
// conflicts:
// 1. The client's contract has an 18-month non-compete; Meridian caps
//    non-competes at 12 months (blue-pencil/severable).
// 2. The employee relocated to Aldermere, which voids non-competes
//    entirely — and Meridian case law says the state where the employee
//    now works, not where the contract was signed, controls. Missing this
//    second jurisdiction is the failure mode the harder task is built to
//    surface (see defaults.ts TASK_PRESETS).

export const STATUTES: Record<string, { citation: string; state: string; topic: string; text: string }> = {
  meridian: {
    citation: "Meridian Bus. & Prof. Code § 16601.5",
    state: "Meridian",
    topic: "non-compete",
    text:
      "A covenant not to compete ancillary to an employment agreement is " +
      "enforceable only if its post-employment restricted period does not " +
      "exceed twelve (12) months from the date of termination. A provision " +
      "purporting to restrict competition beyond twelve months is void and " +
      "unenforceable as to the excess period only; the remainder of the " +
      "agreement remains in force.",
  },
  aldermere: {
    citation: "Aldermere Lab. Code § 2750",
    state: "Aldermere",
    topic: "non-compete",
    text:
      "Except as otherwise provided by law, every contract by which anyone " +
      "is restrained from engaging in a lawful profession, trade, or " +
      "business of any kind is to that extent void. Post-employment " +
      "non-compete covenants are unenforceable in Aldermere regardless of " +
      "duration, geographic scope, or the parties' agreement to the contrary.",
  },
};

// Lenient by design — the mock exists to test the agent's research
// behavior, not its ability to guess our exact state-name formatting.
export function lookupStatute(rawState: string) {
  const key = rawState.trim().toLowerCase();
  for (const [name, statute] of Object.entries(STATUTES)) {
    if (key.includes(name) || name.includes(key)) return statute;
  }
  return null;
}

export const CLIENT_DOCUMENTS = [
  {
    source: "Smith_Employment_Agreement_2023.pdf",
    section: "8.2 Non-Competition",
    text:
      "Employee agrees that for a period of eighteen (18) months following " +
      "the termination of employment for any reason, Employee shall not, " +
      "directly or indirectly, engage in or provide services to any business " +
      "that competes with the Company within the State of Meridian.",
  },
  {
    source: "HR_Separation_Notes_Smith.docx",
    section: "Separation Summary",
    text:
      "Employee relocated to Aldermere immediately following separation and " +
      "began working for Northgate Rivals Inc., a direct competitor, at its " +
      "Aldermere office.",
  },
];

export const CASE_LAW = [
  {
    case_name: "Doe v. Alpine Consulting Group",
    citation: "Meridian Ct. App. 2019",
    summary:
      "Court reformed ('blue-penciled') a 24-month non-compete down to the " +
      "12-month statutory cap rather than voiding the clause entirely.",
  },
  {
    case_name: "Reyes v. Northfield Analytics",
    citation: "Meridian Sup. Ct. 2021",
    summary:
      "Held that a non-compete exceeding the statutory cap is enforceable " +
      "only up to the statutory maximum; the excess period is severable " +
      "from the rest of the agreement.",
  },
  {
    case_name: "Chen v. Vantage Partners LLC",
    citation: "Meridian Ct. App. 2022",
    summary:
      "Refused to enforce a non-compete's geographic scope where it was " +
      "broader than necessary to protect a legitimate business interest, " +
      "but enforced its durational term up to the statutory cap.",
  },
  {
    case_name: "Patel v. Ironwood Systems, Inc.",
    citation: "Meridian Sup. Ct. 2020",
    summary:
      "Held that for a post-employment non-compete dispute, the covenant's " +
      "enforceability is governed by the law of the state where the " +
      "employee currently works, not the state where the contract was " +
      "signed, where the employee has genuinely relocated their primary " +
      "place of employment.",
  },
];
