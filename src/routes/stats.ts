import { Hono } from "hono";
import { sql } from "../db/client.js";

const app = new Hono();

// GET /api/stats
app.get("/", async (c) => {
  const [projectRows, eventRows] = await Promise.all([
    sql(`SELECT id, status FROM projects`),
    sql(`SELECT id, type, is_decision FROM events`),
  ]);

  const activeProjects = projectRows.filter(
    (p) => p.status === "active"
  ).length;
  const totalDecisions = eventRows.filter(
    (e) => e.is_decision === true
  ).length;
  const totalMeetings = eventRows.filter((e) => e.type === "meeting").length;

  return c.json({
    activeProjects,
    totalProjects: projectRows.length,
    totalDecisions,
    totalMeetings,
    totalEvents: eventRows.length,
  });
});

export default app;
