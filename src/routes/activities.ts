import { Hono } from "hono";
import { sql } from "../db/client.js";

const app = new Hono();

// GET /api/activities
app.get("/", async (c) => {
  const rows = await sql(
    `SELECT * FROM activities ORDER BY id DESC LIMIT 20`
  );
  return c.json(rows);
});

// POST /api/activities
app.post("/", async (c) => {
  const body = await c.req.json();
  const { user, action, target, time } = body;
  if (!user || !action || !target || !time) {
    return c.json(
      { message: "user, action, target, and time are required" },
      400
    );
  }
  const rows = await sql(
    `INSERT INTO activities ("user", action, target, time) VALUES ($1, $2, $3, $4) RETURNING *`,
    [user, action, target, time]
  );
  return c.json(rows[0], 201);
});

export default app;
