import { Hono } from "hono";
import { sql } from "../db/client.js";

const app = new Hono();

// Helper to map snake_case DB rows to camelCase expected by frontend
function mapEvent(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    isDecision: row.is_decision,
    label: row.label,
    description: row.description,
    timestamp: row.timestamp,
    status: row.status,
    impact: row.impact,
    summary: row.summary,
    participants: row.participants,
    transcript: row.transcript,
    codeSnippet: row.code_snippet,
    actionItems: row.action_items,
    openQuestions: row.open_questions,
    relatedLinks: row.related_links,
    tags: row.tags,
    sortOrder: row.sort_order,
  };
}

// GET /api/events
app.get("/", async (c) => {
  const projectId = c.req.query("projectId");
  let rows;
  if (projectId) {
    rows = await sql(
      `SELECT * FROM events WHERE project_id = $1 ORDER BY sort_order ASC`,
      [projectId]
    );
  } else {
    rows = await sql(`SELECT * FROM events ORDER BY sort_order ASC`);
  }
  return c.json(rows.map((r) => mapEvent(r as Record<string, unknown>)));
});

// GET /api/events/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await sql(`SELECT * FROM events WHERE id = $1`, [id]);
  if (rows.length === 0) {
    return c.json({ message: "Event not found" }, 404);
  }
  return c.json(mapEvent(rows[0] as Record<string, unknown>));
});

// POST /api/events
app.post("/", async (c) => {
  const body = await c.req.json();
  const rows = await sql(
    `INSERT INTO events (project_id, type, is_decision, label, description, timestamp, status, impact, summary, participants, transcript, code_snippet, action_items, open_questions, related_links, tags, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [
      body.projectId,
      body.type,
      body.isDecision ?? false,
      body.label,
      body.description,
      body.timestamp,
      body.status ?? "active",
      body.impact ?? "medium",
      body.summary ?? null,
      body.participants ?? [],
      body.transcript ?? null,
      body.codeSnippet ?? null,
      JSON.stringify(body.actionItems ?? []),
      body.openQuestions ?? [],
      JSON.stringify(body.relatedLinks ?? []),
      body.tags ?? [],
      body.sortOrder ?? 0,
    ]
  );
  return c.json(mapEvent(rows[0] as Record<string, unknown>), 201);
});

// PATCH /api/events/:id
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  // Map camelCase fields to snake_case columns
  const fieldMap: Record<string, string> = {
    projectId: "project_id",
    isDecision: "is_decision",
    codeSnippet: "code_snippet",
    actionItems: "action_items",
    openQuestions: "open_questions",
    relatedLinks: "related_links",
    sortOrder: "sort_order",
  };

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (key === "id") continue;
    const col = fieldMap[key] ?? key;
    sets.push(`${col} = $${idx++}`);
    if (key === "actionItems" || key === "relatedLinks") {
      params.push(JSON.stringify(value));
    } else {
      params.push(value);
    }
  }

  if (sets.length === 0) {
    return c.json({ message: "No fields to update" }, 400);
  }

  params.push(id);
  const rows = await sql(
    `UPDATE events SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (rows.length === 0) {
    return c.json({ message: "Event not found" }, 404);
  }
  return c.json(mapEvent(rows[0] as Record<string, unknown>));
});

// DELETE /api/events/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await sql(`DELETE FROM events WHERE id = $1`, [id]);
  return c.body(null, 204);
});

export default app;
