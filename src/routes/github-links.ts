import { Hono } from "hono";
import { sql } from "../db/client.js";
import { parseGitHubUrl } from "../services/github.js";

const app = new Hono();

// POST /api/decisions/:id/github-links — link a decision to a GitHub URL
app.post("/", async (c) => {
  const decisionId = c.req.param("id");
  const body = await c.req.json();
  const { url, title } = body;

  if (!url) {
    return c.json({ error: "url is required" }, 400);
  }

  // Verify decision exists
  const decisions = await sql(`SELECT id FROM decisions WHERE id = $1`, [
    decisionId,
  ]);
  if (decisions.length === 0) {
    return c.json({ error: "Decision not found" }, 404);
  }

  const parsed = parseGitHubUrl(url);

  const rows = await sql(
    `INSERT INTO github_links (decision_id, url, link_type, repo, ref, title)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      decisionId,
      url,
      parsed.link_type,
      parsed.repo || null,
      parsed.ref || null,
      title ?? null,
    ]
  );

  return c.json(rows[0], 201);
});

// GET /api/decisions/:id/github-links — list links for a decision
app.get("/", async (c) => {
  const decisionId = c.req.param("id");

  const rows = await sql(
    `SELECT * FROM github_links WHERE decision_id = $1 ORDER BY created_at DESC`,
    [decisionId]
  );

  return c.json(rows);
});

// DELETE /api/decisions/:id/github-links/:linkId — remove a link
app.delete("/:linkId", async (c) => {
  const decisionId = c.req.param("id");
  const linkId = c.req.param("linkId");

  const rows = await sql(
    `DELETE FROM github_links WHERE id = $1 AND decision_id = $2 RETURNING *`,
    [linkId, decisionId]
  );

  if (rows.length === 0) {
    return c.json({ error: "GitHub link not found" }, 404);
  }

  return c.json({ deleted: true });
});

export default app;
