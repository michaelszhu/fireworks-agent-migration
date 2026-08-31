import type { ToolDef } from "./types";

// The tool the agent must call to finish the task. Calling it ends the loop —
// see run-anthropic.ts / run-fireworks.ts.
export const TERMINAL_TOOL_NAME = "draft_memo";

export const TOOLS: ToolDef[] = [
  {
    name: "search_case_law",
    description:
      "Search case law for judicial decisions relevant to a legal question.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms, e.g. 'non-compete blue pencil enforceability'.",
        },
        jurisdiction: {
          type: "string",
          description: "Jurisdiction to search, e.g. 'Meridian'.",
        },
      },
      required: ["query", "jurisdiction"],
    },
  },
  {
    name: "get_statute",
    description:
      "Look up the controlling statute for a given state and legal topic.",
    input_schema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "State whose statute governs, e.g. 'Meridian'.",
        },
        topic: {
          type: "string",
          description: "Legal topic, e.g. 'non-compete'.",
        },
      },
      required: ["state", "topic"],
    },
  },
  {
    name: "search_client_documents",
    description:
      "Search the client's own documents (contracts, agreements, correspondence) for relevant language.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms, e.g. 'non-compete clause employment agreement'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: TERMINAL_TOOL_NAME,
    description:
      "Write the final memo answering the attorney's question. This ends the research task — call it only once, after gathering the statute, the client's contract language, and supporting case law.",
    input_schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          description: "Ordered memo sections, e.g. Issue, Analysis, Conclusion.",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              content: { type: "string" },
            },
            required: ["heading", "content"],
          },
        },
      },
      required: ["sections"],
    },
  },
];
