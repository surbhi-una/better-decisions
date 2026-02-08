import { Hono } from "hono";
import { sql } from "../db/client.js";

const app = new Hono();

// GET /api/stats
app.get("/", async (c) => {
  const [projectRows, decisionCount, meetingCount, eventCount] =
    await Promise.all([
      sql(`SELECT id, status FROM projects`),
      sql(`SELECT COUNT(*) as total FROM decisions`),
      sql(`SELECT COUNT(*) as total FROM meetings`),
      sql(`SELECT COUNT(*) as total FROM events`),
    ]);

  const activeProjects = projectRows.filter(
    (p) => p.status === "active"
  ).length;

  return c.json({
    activeProjects,
    totalProjects: projectRows.length,
    totalDecisions: parseInt(decisionCount[0].total as string, 10),
    totalMeetings: parseInt(meetingCount[0].total as string, 10),
    totalEvents: parseInt(eventCount[0].total as string, 10),
  });
});

export default app;
