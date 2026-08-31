import { NextResponse } from "next/server";
import {
  CANDIDATE_MODELS,
  isCandidateModelKey,
} from "@/lib/agent/candidate-models";
import { DEFAULT_TASK } from "@/lib/agent/defaults";
import { inferMigrationPlan } from "@/lib/agent/migration-plan";
import { printTrajectory, printVariance } from "@/lib/agent/print";
import { assessMigration } from "@/lib/agent/rules";
import { runAnthropicAgent } from "@/lib/agent/run-anthropic";
import { runFireworksAgent } from "@/lib/agent/run-fireworks";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { TOOLS } from "@/lib/agent/tools";
import type { AgentRunConfig, JSONSchema, ToolDef, Trajectory } from "@/lib/agent/types";
import { computeVariance } from "@/lib/agent/variance";

const VALID_RUN_COUNTS = [1, 3, 5] as const;

function isJSONSchema(x: unknown): x is JSONSchema {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  return (
    s.type === "object" &&
    typeof s.properties === "object" &&
    s.properties !== null &&
    Array.isArray(s.required) &&
    s.required.every((r) => typeof r === "string")
  );
}

function isToolDef(x: unknown): x is ToolDef {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.name === "string" &&
    typeof t.description === "string" &&
    isJSONSchema(t.input_schema)
  );
}

// Sequential per model — one run informs nothing about the next (each
// starts fresh), so this is just about not hammering the API with
// N concurrent requests. The baseline's sequence and the candidate's
// sequence still run concurrently with each other (see handle() below).
async function runSequentially(
  runOnce: () => Promise<Trajectory>,
  count: number,
): Promise<Trajectory[]> {
  const results: Trajectory[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await runOnce());
  }
  return results;
}

async function handle(
  config: AgentRunConfig,
  candidateModelId: string,
  runs: number,
) {
  const [anthropicRuns, fireworksRuns] = await Promise.all([
    runSequentially(() => runAnthropicAgent(config), runs),
    runSequentially(
      () => runFireworksAgent({ ...config, model: candidateModelId }),
      runs,
    ),
  ]);

  const anthropicVariance = computeVariance(anthropicRuns);
  const fireworksVariance = computeVariance(fireworksRuns);
  const assessment = assessMigration(
    anthropicRuns[0],
    fireworksRuns[0],
    anthropicVariance,
    fireworksVariance,
  );
  const migrationPlan = inferMigrationPlan(
    anthropicRuns[0],
    fireworksRuns[0],
    fireworksVariance,
    config.tools,
  );

  printTrajectory(anthropicRuns[0]);
  printVariance("anthropic", anthropicVariance);
  printTrajectory(fireworksRuns[0]);
  printVariance("fireworks", fireworksVariance);
  console.log(`assessment: ${assessment.verdict} — ${assessment.reasons.join(" ")}`);
  console.log(`migration plan: ${migrationPlan.category} — ${migrationPlan.recommendation}`);

  return NextResponse.json({
    anthropic: { first: anthropicRuns[0], variance: anthropicVariance },
    fireworks: { first: fireworksRuns[0], variance: fireworksVariance },
    assessment,
    migrationPlan,
  });
}

// GET runs the prefilled legal-research example once against the default
// candidate (Kimi) — a quick way to trigger a comparison without a UI.
export async function GET() {
  return handle(
    { task: DEFAULT_TASK, systemPrompt: SYSTEM_PROMPT, tools: TOOLS },
    CANDIDATE_MODELS.kimi.id,
    1,
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const task =
    typeof body.task === "string" && body.task.trim()
      ? body.task
      : DEFAULT_TASK;
  const systemPrompt =
    typeof body.systemPrompt === "string" && body.systemPrompt.trim()
      ? body.systemPrompt
      : SYSTEM_PROMPT;

  let tools: ToolDef[] = TOOLS;
  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools) || !body.tools.every(isToolDef)) {
      return NextResponse.json(
        { error: "tools must be an array of { name, description, input_schema }" },
        { status: 400 },
      );
    }
    tools = body.tools;
  }

  const candidateKey = body.candidateModel ?? "kimi";
  if (!isCandidateModelKey(candidateKey)) {
    return NextResponse.json(
      { error: `candidateModel must be one of: ${Object.keys(CANDIDATE_MODELS).join(", ")}` },
      { status: 400 },
    );
  }

  const runs = body.runs ?? 1;
  if (!VALID_RUN_COUNTS.includes(runs)) {
    return NextResponse.json(
      { error: `runs must be one of: ${VALID_RUN_COUNTS.join(", ")}` },
      { status: 400 },
    );
  }

  return handle({ task, systemPrompt, tools }, CANDIDATE_MODELS[candidateKey].id, runs);
}
