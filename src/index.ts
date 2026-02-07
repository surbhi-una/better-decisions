import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import meetingsRouter from "./routes/meetings.js";
import decisionsRouter from "./routes/decisions.js";
import githubLinksRouter from "./routes/github-links.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.route("/api/meetings", meetingsRouter);
app.route("/api/decisions", decisionsRouter);
// GitHub links are nested under decisions
app.route("/api/decisions/:id/github-links", githubLinksRouter);

const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`Starting server on port ${port}...`);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
