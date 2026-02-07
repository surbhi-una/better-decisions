import { Hono } from "hono";
import { sql } from "../db/client.js";
import { extractDecisions } from "../services/claude.js";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();
  const { title, raw_notes, source } = body;

  if (!title || !raw_notes) {
    return c.json({ error: "title and raw_notes are required" }, 400);
  }

  // Insert meeting
  const meetings = await sql(
    `INSERT INTO meetings (title, raw_notes, source) VALUES ($1, $2, $3) RETURNING *`,
    [title, raw_notes, source ?? null]
  );
  const meeting = meetings[0];

  // Extract decisions with Claude
  let extracted;
  try {
    extracted = await extractDecisions(raw_notes);
  } catch (error) {
    return c.json(
      {
        meeting,
        decisions: [],
        error: `Decision extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      201
    );
  }

  // Collect unique project names from extracted decisions and auto-create projects
  const projectNames = [
    ...new Set(
      extracted.map((d) => d.project).filter((p): p is string => !!p)
    ),
  ];
  const createdProjects: string[] = [];

  for (const projectName of projectNames) {
    const projectId = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Only create if it doesn't already exist
    const existing = await sql(
      `SELECT id FROM projects WHERE id = $1`,
      [projectId]
    );
    if (existing.length === 0) {
      await sql(
        `INSERT INTO projects (id, name, description, status, progress, team, color, tags)
         VALUES ($1, $2, $3, 'active', 0, '{}', $4, '{}')`,
        [
          projectId,
          projectName,
          `Auto-created from meeting: ${title}`,
          `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
        ]
      );
      createdProjects.push(projectName);
    }
  }

  // Insert decisions and participants
  const decisions = [];
  for (const d of extracted) {
    const rows = await sql(
      `INSERT INTO decisions (meeting_id, title, description, rationale, status, confidence, project, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        meeting.id,
        d.title,
        d.description,
        d.rationale ?? null,
        d.status ?? "decided",
        d.confidence ?? "high",
        d.project ?? null,
        d.team ?? null,
      ]
    );
    const decision = rows[0];

    if (d.participants?.length) {
      for (const p of d.participants) {
        await sql(
          `INSERT INTO decision_participants (decision_id, name, role) VALUES ($1, $2, $3)`,
          [decision.id, p.name, p.role ?? "participant"]
        );
      }
    }

    decisions.push({ ...decision, participants: d.participants ?? [] });
  }

  return c.json({ meeting, decisions, createdProjects }, 201);
});

export default app;
