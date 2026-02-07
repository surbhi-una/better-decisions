import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import meetingsRouter from "./routes/meetings.js";
import decisionsRouter from "./routes/decisions.js";
import githubLinksRouter from "./routes/github-links.js";
import projectsRouter from "./routes/projects.js";
import eventsRouter from "./routes/events.js";
import activitiesRouter from "./routes/activities.js";
import statsRouter from "./routes/stats.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes — backend API
app.route("/api/meetings", meetingsRouter);
app.route("/api/decisions", decisionsRouter);
app.route("/api/decisions/:id/github-links", githubLinksRouter);

// Routes — frontend API
app.route("/api/projects", projectsRouter);
app.route("/api/events", eventsRouter);
app.route("/api/activities", activitiesRouter);
app.route("/api/stats", statsRouter);

const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`Starting server on port ${port}...`);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
