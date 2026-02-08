import { Hono } from "hono";
import { listDecisions, getDecisionDetail } from "../services/decisions.js";

const app = new Hono();

// GET /api/decisions — list with filters + pagination
app.get("/", async (c) => {
  const filters = {
    search: c.req.query("search"),
    project: c.req.query("project"),
    team: c.req.query("team"),
    status: c.req.query("status"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    page: c.req.query("page") ? parseInt(c.req.query("page")!, 10) : undefined,
    per_page: c.req.query("per_page")
      ? parseInt(c.req.query("per_page")!, 10)
      : undefined,
  };

  const result = await listDecisions(filters);
  return c.json(result);
});

// GET /api/decisions/:id — detail with participants, meeting, github links
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const detail = await getDecisionDetail(id);

  if (!detail) {
    return c.json({ error: "Decision not found" }, 404);
  }

  return c.json(detail);
});

export default app;
