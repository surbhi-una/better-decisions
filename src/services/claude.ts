import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedDecision } from "../types/index.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a decision extraction assistant. Given meeting notes, extract all decisions that were made or proposed.

For each decision, return a JSON object with:
- title: A concise title for the decision (max 100 chars)
- description: What was decided, in detail
- rationale: Why this decision was made (if mentioned)
- status: One of "decided", "proposed", "revisiting", "superseded"
- confidence: Your confidence the notes clearly support this decision — "high", "medium", or "low"
- project: IMPORTANT — always assign a project name in human-readable form (e.g. "Mobile Auth", "Payment Gateway", "Dashboard Redesign"). If a specific project is mentioned, use that name. Otherwise, infer a short descriptive name (2-4 words) from the topic. Never leave this null.
- team: The team name if mentioned (null otherwise)
- participants: Array of {name, role} where role is one of "decider", "approver", "contributor", "informed", "participant"

Return ONLY a JSON array of decision objects. No markdown, no explanation. If no decisions are found, return an empty array [].`;

export async function extractDecisions(
  meetingNotes: string
): Promise<ExtractedDecision[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract all decisions from these meeting notes:\n\n${meetingNotes}`,
      },
    ],
  });

  let text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const decisions = JSON.parse(text);
    if (!Array.isArray(decisions)) {
      throw new Error("Expected an array of decisions");
    }
    return decisions as ExtractedDecision[];
  } catch (error) {
    console.error("Failed to parse Claude response:", text);
    throw new Error(
      `Failed to parse decision extraction response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
