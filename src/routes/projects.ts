import { Hono } from "hono";
import { sql } from "../db/client.js";

const app = new Hono();

// GET /api/projects
app.get("/", async (c) => {
  const rows = await sql(`SELECT * FROM projects`);
  return c.json(rows);
});

// GET /api/projects/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await sql(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (rows.length === 0) {
    return c.json({ message: "Project not found" }, 404);
  }
  return c.json(rows[0]);
});

// POST /api/projects
app.post("/", async (c) => {
  const body = await c.req.json();
  const { id, name, description, status, progress, team, color, tags } = body;
  if (!id || !name || !description) {
    return c.json({ message: "id, name, and description are required" }, 400);
  }
  const rows = await sql(
    `INSERT INTO projects (id, name, description, status, progress, team, color, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      id,
      name,
      description,
      status ?? "active",
      progress ?? 0,
      team ?? [],
      color ?? "hsl(262, 83%, 58%)",
      tags ?? [],
    ]
  );
  return c.json(rows[0], 201);
});

// PATCH /api/projects/:id
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (key === "id") continue;
    sets.push(`${key} = $${idx++}`);
    params.push(value);
  }

  if (sets.length === 0) {
    return c.json({ message: "No fields to update" }, 400);
  }

  params.push(id);
  const rows = await sql(
    `UPDATE projects SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (rows.length === 0) {
    return c.json({ message: "Project not found" }, 404);
  }
  return c.json(rows[0]);
});

// DELETE /api/projects/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await sql(`DELETE FROM events WHERE project_id = $1`, [id]);
  await sql(`DELETE FROM projects WHERE id = $1`, [id]);
  return c.body(null, 204);
});

export default app;
