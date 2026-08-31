# Agent Trajectory Diff

## 1. What this is and what it does

A tool that runs the same agentic task against a baseline model (Claude Opus 5) and a candidate open model on Fireworks (Kimi K3 or MiniMax M3), using identical tools, system prompt, and task input. It records every tool call each model makes — name, arguments, latency, tokens — as a step-by-step trajectory, then shows the two trajectories side by side with the divergent steps highlighted. The demo domain is a legal research agent: four tools (search case law, look up a statute, search client documents, draft a memo), working from a small fixed dataset with a deliberate legal conflict built in.

## 2. Who it's for and why it matters to Fireworks' business

PMs, solutions engineers, and prospects deciding whether to move an agentic workflow off a closed model onto Fireworks. Migration stalls less because open models write worse text and more because nobody can tell, before switching, whether the candidate calls the right tool, in the right order, with valid arguments, across a multi-step task. A single-prompt comparison can't show that. This tool gives a concrete answer — same task, two models, here's exactly where they diverged — instead of "it feels different." That's a real adoption blocker Fireworks can address directly in a sales conversation.

## 3. The decision — options considered and why this one

- **Single-call output comparison.** Rejected — doesn't exercise tool use at all, which is where migrations actually break.
- **Full eval harness with scoring/judging.** Rejected — Fireworks' Eval Protocol already covers this, and building a judge is a different, larger problem than the one picked.
- **Trajectory diffing on a fixed task with mocked tools.** Chosen — isolates behavior (tool choice, ordering, argument shape) from output quality, and is cheap to run and read.

Within that: the two providers' agent loops are kept as separate, near-identical functions rather than one shared abstraction. Claude's content blocks and OpenAI-style chat messages are different enough that forcing them through a common adapter would hide the exact differences this tool exists to surface.

## 4. What's in the MVP, what's out and why

**In:** one baseline vs. one of two candidate models; a legal-research domain with 4 mocked tools and 2 task presets (a single-jurisdiction question and a harder cross-jurisdiction one); editable system prompt, tool schema, and task; 1/3/5 runs per model for a consistency signal; per-step diff highlighting; cost/latency/token metrics; two small rule-based read-outs (a verdict badge and a plain-language migration recommendation), both computed from the run data with no extra model call.

**Out:** auth, saved/persisted runs, streaming, more than two candidate models, and any output-quality scoring or LLM-as-judge. These aren't oversights — they're a different problem (quality grading) than the one this tool is built to answer (behavioral fit), and Eval Protocol already exists for the former.

## 5. Known limits and tradeoffs

- Mock tools mostly ignore their arguments and return fixed data. Good for isolating tool-choice behavior; it won't catch a model that asks a badly-formed question.
- One domain. Findings here may not generalize to other tool shapes or task types.
- Reliability signal comes from N=3 or N=5 runs — a small sample. A model that fails one run in five could be over- or under-flagged.
- The "one extra step is not a finding" threshold is a guess (set at 2), not calibrated against real data.
- `search_client_documents` returns all mock documents regardless of query, so the easier task preset can surface facts meant for the harder one.
- Cost figures come from published per-token rates, not measured spend.

## 6. What I'd measure and what I'd validate

Whether the signals used here (step-count gaps, tool-sequence consistency, terminal-tool rate) actually predict real migration outcomes — run this against workloads customers did or didn't end up migrating, and check if the tool would have called it correctly. The false-positive/false-negative rate of both rule functions against a small set of human-labeled trajectories. Whether the four recommendation categories match how a solutions engineer actually triages a candidate model in practice. Whether five runs is enough to see reliability signal, or whether it takes more.

## 7. What I'd do differently next time

Test tool-schema sensitivity directly: same task, tool descriptions rewritten for the candidate's own conventions, and see whether the "prompt/schema issue" category goes away. Add two or three more task domains before trusting that the rule functions generalize. Make the mock tools respect their query arguments so the two task presets stay properly isolated. And before treating any of this output as authoritative, get a solutions engineer or an actual practitioner to sanity-check the recommendation categories against a real migration conversation.
