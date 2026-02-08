import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// --- Types ---

export interface McpConnectionConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ConnectionStatus {
  status: "connecting" | "connected" | "error" | "disconnected";
  error: string | null;
  tools: DiscoveredTool[];
  connectedAt: string | null;
}

interface ConnectionState {
  client: Client;
  transport: StdioClientTransport | StreamableHTTPClientTransport;
  status: "connecting" | "connected" | "error" | "disconnected";
  tools: DiscoveredTool[];
  error: string | null;
  connectedAt: Date | null;
}

// --- Module-level state ---

const connections = new Map<string, ConnectionState>();

// --- Exported functions ---

export async function connect(
  toolId: string,
  config: McpConnectionConfig
): Promise<ConnectionStatus> {
  // Disconnect existing connection if any
  if (connections.has(toolId)) {
    await disconnect(toolId);
  }

  let transport: StdioClientTransport | StreamableHTTPClientTransport;

  if (config.command) {
    // Stdio transport — spawn local process
    transport = new StdioClientTransport({
      command: config.command,
      args: config.args ?? [],
      env: { ...process.env, ...(config.env ?? {}) } as Record<string, string>,
    });
  } else if (config.url) {
    // HTTP transport — connect to remote server
    transport = new StreamableHTTPClientTransport(
      new URL(config.url),
      { requestInit: { headers: config.headers ?? {} } }
    );
  } else {
    throw new Error("Config must include either 'command' (stdio) or 'url' (http)");
  }

  const client = new Client({ name: "better-decisions", version: "1.0.0" });

  const state: ConnectionState = {
    client,
    transport,
    status: "connecting",
    tools: [],
    error: null,
    connectedAt: null,
  };
  connections.set(toolId, state);

  try {
    // Connect with 15-second timeout
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out after 15s")), 15000)
      ),
    ]);

    // Discover tools
    const result = await client.listTools();
    state.tools = (result.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
    }));

    state.status = "connected";
    state.connectedAt = new Date();
    state.error = null;

    console.log(
      `[MCP] Connected to ${toolId} — ${state.tools.length} tools discovered`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    state.status = "error";
    state.error = message;
    console.error(`[MCP] Failed to connect to ${toolId}: ${message}`);

    // Clean up failed connection
    try {
      await client.close();
    } catch {
      // ignore cleanup errors
    }
  }

  return toStatus(state);
}

export async function disconnect(toolId: string): Promise<void> {
  const state = connections.get(toolId);
  if (!state) return;

  try {
    await state.client.close();
  } catch (err) {
    console.error(`[MCP] Error closing ${toolId}:`, err);
  }

  connections.delete(toolId);
  console.log(`[MCP] Disconnected from ${toolId}`);
}

export function getStatus(toolId: string): ConnectionStatus {
  const state = connections.get(toolId);
  if (!state) {
    return { status: "disconnected", error: null, tools: [], connectedAt: null };
  }
  return toStatus(state);
}

export function getAllStatuses(): Record<string, ConnectionStatus> {
  const result: Record<string, ConnectionStatus> = {};
  for (const [toolId, state] of connections) {
    result[toolId] = toStatus(state);
  }
  return result;
}

export function listTools(toolId: string): DiscoveredTool[] {
  const state = connections.get(toolId);
  if (!state || state.status !== "connected") {
    return [];
  }
  return state.tools;
}

export async function callTool(
  toolId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const state = connections.get(toolId);
  if (!state) {
    throw new Error(`No connection found for ${toolId}`);
  }
  if (state.status !== "connected") {
    throw new Error(`${toolId} is not connected (status: ${state.status})`);
  }

  const result = await state.client.callTool({ name: toolName, arguments: args });
  return result;
}

export async function shutdownAll(): Promise<void> {
  const ids = [...connections.keys()];
  console.log(`[MCP] Shutting down ${ids.length} connection(s)...`);

  await Promise.allSettled(
    ids.map((id) => disconnect(id))
  );

  console.log("[MCP] All connections closed");
}

// --- Helpers ---

function toStatus(state: ConnectionState): ConnectionStatus {
  return {
    status: state.status,
    error: state.error,
    tools: state.tools,
    connectedAt: state.connectedAt?.toISOString() ?? null,
  };
}
