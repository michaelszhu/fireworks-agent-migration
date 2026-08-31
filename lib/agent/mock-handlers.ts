import { CASE_LAW, CLIENT_DOCUMENTS, lookupStatute } from "./mock-data";
import { TERMINAL_TOOL_NAME } from "./tools";

// Executes a tool call against the fixed mock dataset. Most tools ignore
// their arguments and return the one fixed record — the interesting
// variable is *which tools the model calls, in what order*, not what the
// tools return. get_statute is the one exception: two statutes now exist
// (Meridian and Aldermere), so it has to actually look up the requested
// state — that lookup is what lets the harder task (defaults.ts
// TASK_PRESETS) test whether the model checks both jurisdictions.
export function executeTool(
  name: string,
  args: Record<string, unknown>,
): unknown {
  switch (name) {
    case "search_case_law":
      return { results: CASE_LAW };
    case "get_statute": {
      const state = typeof args.state === "string" ? args.state : "";
      const statute = lookupStatute(state);
      return statute
        ? { statute }
        : { error: `No statute on file for state: "${state}"` };
    }
    case "search_client_documents":
      return { documents: CLIENT_DOCUMENTS };
    case TERMINAL_TOOL_NAME:
      return { status: "memo_drafted", sections: args.sections ?? [] };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
