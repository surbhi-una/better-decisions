import { Hono } from "hono";
import { sql } from "../db/client.js";
import * as mcpManager from "../services/mcp-manager.js";

const app = new Hono();

// ─── Hardcoded fallback catalog (when no Smithery API key) ───

const FALLBACK_CATALOG = [
  {
    qualifiedName: "@modelcontextprotocol/server-github",
    displayName: "GitHub",
    description: "Interact with GitHub repositories, issues, PRs, and more",
    iconUrl: null,
    useCount: 50000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      envKeys: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-slack",
    displayName: "Slack",
    description: "Search and interact with Slack workspaces, channels, and messages",
    iconUrl: null,
    useCount: 15000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      envKeys: ["SLACK_BOT_TOKEN", "SLACK_TEAM_ID"],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-memory",
    displayName: "Memory",
    description: "Knowledge graph-based persistent memory for storing and retrieving context",
    iconUrl: null,
    useCount: 30000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
      envKeys: [],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-filesystem",
    displayName: "Filesystem",
    description: "Secure read/write access to local filesystem directories",
    iconUrl: null,
    useCount: 25000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
      envKeys: [],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-git",
    displayName: "Git",
    description: "Git repository operations — log, diff, status, blame, and more",
    iconUrl: null,
    useCount: 20000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-git"],
      envKeys: [],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-postgres",
    displayName: "PostgreSQL",
    description: "Query PostgreSQL databases with read-only access for safe exploration",
    iconUrl: null,
    useCount: 18000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      envKeys: ["DATABASE_URL"],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-fetch",
    displayName: "Fetch",
    description: "Fetch and convert web content to markdown for processing",
    iconUrl: null,
    useCount: 22000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
      envKeys: [],
    },
  },
  {
    qualifiedName: "@modelcontextprotocol/server-brave-search",
    displayName: "Brave Search",
    description: "Web and local search via the Brave Search API",
    iconUrl: null,
    useCount: 12000,
    remote: false,
    defaultConfig: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      envKeys: ["BRAVE_API_KEY"],
    },
  },
];

// ─── Catalog endpoints (Smithery proxy + fallback) ───

// GET /api/mcp/catalog?q=&page=1&pageSize=12
app.get("/catalog", async (c) => {
  const q = c.req.query("q") ?? "";
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") ?? "12", 10);

  const smitheryKey = process.env.SMITHERY_API_KEY;

  if (smitheryKey) {
    try {
      const params = new URLSearchParams({
        q,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(
        `https://registry.smithery.ai/servers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${smitheryKey}`,
            Accept: "application/json",
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Smithery API returned ${res.status}`);
      }
      const data = await res.json();
      return c.json(data);
    } catch (err) {
      console.error("[MCP Catalog] Smithery API error, falling back:", err);
    }
  }

  // Fallback: filter hardcoded catalog client-side
  let filtered = FALLBACK_CATALOG;
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.displayName.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.qualifiedName.toLowerCase().includes(lower)
    );
  }

  return c.json({
    servers: filtered,
    pagination: {
      currentPage: 1,
      pageSize: filtered.length,
      totalPages: 1,
      totalCount: filtered.length,
    },
    source: "fallback",
  });
});

// GET /api/mcp/catalog/:qualifiedName — server detail
app.get("/catalog/:qualifiedName{.+}", async (c) => {
  const qualifiedName = c.req.param("qualifiedName");
  const smitheryKey = process.env.SMITHERY_API_KEY;

  if (smitheryKey) {
    try {
      const res = await fetch(
        `https://registry.smithery.ai/servers/${encodeURIComponent(qualifiedName)}`,
        {
          headers: {
            Authorization: `Bearer ${smitheryKey}`,
            Accept: "application/json",
          },
        }
      );
      if (res.ok) {
        return c.json(await res.json());
      }
    } catch (err) {
      console.error("[MCP Catalog] Smithery detail error:", err);
    }
  }

  // Fallback
  const entry = FALLBACK_CATALOG.find((s) => s.qualifiedName === qualifiedName);
  if (entry) return c.json(entry);
  return c.json({ error: "Server not found" }, 404);
});

// ─── Existing connection CRUD ───

// GET /api/mcp/connections
app.get("/connections", async (c) => {
  const rows = await sql(`SELECT * FROM mcp_connections ORDER BY connected_at DESC`);
  return c.json(rows);
});

// POST /api/mcp/connections — upsert by tool_id
app.post("/connections", async (c) => {
  const body = await c.req.json();
  const { tool_id, enabled = true, config = {} } = body;
  if (!tool_id) {
    return c.json({ error: "tool_id is required" }, 400);
  }
  const rows = await sql(
    `INSERT INTO mcp_connections (tool_id, enabled, config)
     VALUES ($1, $2, $3)
     ON CONFLICT (tool_id) DO UPDATE SET enabled = $2, config = $3, connected_at = now()
     RETURNING *`,
    [tool_id, enabled, JSON.stringify(config)]
  );
  return c.json(rows[0], 201);
});

// DELETE /api/mcp/connections/:toolId
app.delete("/connections/:toolId", async (c) => {
  const toolId = c.req.param("toolId");
  await sql(`DELETE FROM mcp_connections WHERE tool_id = $1`, [toolId]);
  return c.body(null, 204);
});

// ─── Live MCP connection endpoints ───

// POST /api/mcp/connections/:toolId/connect
app.post("/connections/:toolId/connect", async (c) => {
  const toolId = c.req.param("toolId");
  const body = await c.req.json();
  const { config } = body;

  if (!config || (!config.command && !config.url)) {
    return c.json(
      { error: "config must include 'command' (stdio) or 'url' (http)" },
      400
    );
  }

  // Persist config to DB
  await sql(
    `INSERT INTO mcp_connections (tool_id, enabled, config)
     VALUES ($1, true, $2)
     ON CONFLICT (tool_id) DO UPDATE SET enabled = true, config = $2, connected_at = now()
     RETURNING *`,
    [toolId, JSON.stringify(config)]
  );

  // Actually connect via MCP SDK
  const status = await mcpManager.connect(toolId, config);
  return c.json(status, status.status === "error" ? 500 : 200);
});

// POST /api/mcp/connections/:toolId/disconnect
app.post("/connections/:toolId/disconnect", async (c) => {
  const toolId = c.req.param("toolId");

  await mcpManager.disconnect(toolId);

  // Update DB
  await sql(
    `UPDATE mcp_connections SET enabled = false WHERE tool_id = $1`,
    [toolId]
  );

  return c.body(null, 204);
});

// GET /api/mcp/connections/:toolId/tools
app.get("/connections/:toolId/tools", async (c) => {
  const toolId = c.req.param("toolId");
  const tools = mcpManager.listTools(toolId);
  return c.json({ tools });
});

// POST /api/mcp/connections/:toolId/tools/:toolName/call
app.post("/connections/:toolId/tools/:toolName/call", async (c) => {
  const toolId = c.req.param("toolId");
  const toolName = c.req.param("toolName");
  const body = await c.req.json();

  try {
    const result = await mcpManager.callTool(
      toolId,
      toolName,
      body.arguments ?? {}
    );
    return c.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 400);
  }
});

// GET /api/mcp/status — all connection statuses
app.get("/status", async (c) => {
  const dbRows = await sql(`SELECT tool_id, enabled, config, connected_at FROM mcp_connections`);
  const runtimeStatuses = mcpManager.getAllStatuses();

  const merged = dbRows.map((row: any) => ({
    toolId: row.tool_id,
    enabled: row.enabled,
    config: row.config,
    dbConnectedAt: row.connected_at,
    ...(runtimeStatuses[row.tool_id] ?? {
      status: "disconnected",
      error: null,
      tools: [],
      connectedAt: null,
    }),
  }));

  // Add runtime-only connections (not yet persisted)
  for (const [toolId, status] of Object.entries(runtimeStatuses)) {
    if (!merged.find((m: any) => m.toolId === toolId)) {
      merged.push({ toolId, enabled: true, config: {}, dbConnectedAt: null, ...status });
    }
  }

  return c.json(merged);
});

export default app;
