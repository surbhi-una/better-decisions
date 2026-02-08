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

  // Build a lookup from project name → project slug ID
  const projectIdMap = new Map<string, string>();
  for (const projectName of projectNames) {
    const projectId = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    projectIdMap.set(projectName, projectId);
  }

  // Insert a "meeting" event into the stream for each project mentioned
  const meetingTimestamp = new Date().toISOString();
  const touchedProjectIds = new Set<string>();

  for (const projectName of projectNames) {
    const pid = projectIdMap.get(projectName)!;
    touchedProjectIds.add(pid);
  }

  // If no projects identified, still add a general meeting event
  if (touchedProjectIds.size === 0) {
    touchedProjectIds.add("general");
  }

  // Get the current max sort_order to append after existing events
  const maxOrderResult = await sql(`SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM events`);
  let sortBase = parseInt(maxOrderResult[0].next_order as string, 10);

  for (const pid of touchedProjectIds) {
    await sql(
      `INSERT INTO events (project_id, type, is_decision, label, description, timestamp, status, impact, summary, participants, transcript, tags, sort_order, action_items, open_questions, related_links)
       VALUES ($1, 'meeting', false, $2, $3, $4, 'active', 'medium', $5, $6, $7, '{}', $8, '[]', '{}', '[]')`,
      [
        pid,
        title,
        `Meeting notes imported: ${title}`,
        meetingTimestamp,
        `${extracted.length} decision(s) extracted`,
        extracted.flatMap((d) => d.participants?.map((p) => p.name) ?? []),
        raw_notes.slice(0, 2000),
        sortBase++,
      ]
    );
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

    // Also insert a decision event into the stream
    const eventProjectId = d.project
      ? projectIdMap.get(d.project) ?? "general"
      : "general";

    await sql(
      `INSERT INTO events (project_id, type, is_decision, label, description, timestamp, status, impact, summary, participants, tags, sort_order, action_items, open_questions, related_links)
       VALUES ($1, 'note', true, $2, $3, $4, 'active', $5, $6, $7, '{}', $8, '[]', '{}', '[]')`,
      [
        eventProjectId,
        d.title,
        d.description,
        meetingTimestamp,
        d.confidence === "high" ? "high" : d.confidence === "low" ? "low" : "medium",
        d.rationale ?? null,
        d.participants?.map((p) => p.name) ?? [],
        sortBase++,
      ]
    );

    decisions.push({ ...decision, participants: d.participants ?? [] });
  }

  // Create activity entries for the dashboard feed
  const timeLabel = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await sql(
    `INSERT INTO activities ("user", action, target, time) VALUES ($1, $2, $3, $4)`,
    [
      "System",
      `imported meeting with ${decisions.length} decision(s)`,
      title,
      timeLabel,
    ]
  );

  for (const projectName of createdProjects) {
    await sql(
      `INSERT INTO activities ("user", action, target, time) VALUES ($1, $2, $3, $4)`,
      ["System", "auto-created project from meeting", projectName, timeLabel]
    );
  }

  return c.json({ meeting, decisions, createdProjects }, 201);
});

export default app;
