import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Bot,
  Code2,
  Terminal,
  ShieldAlert,
  GitBranch,
  RefreshCw,
  Search,
  Plug,
  Unplug,
  CheckCircle2,
  ExternalLink,
  Zap,
  Loader2,
  AlertCircle,
  Play,
  Wrench,
  Settings2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
} from "lucide-react";

// --- Types ---

interface CatalogServer {
  qualifiedName: string;
  displayName: string;
  description: string;
  iconUrl: string | null;
  useCount: number;
  remote: boolean;
  homepage?: string;
  defaultConfig?: {
    command: string;
    args: string[];
    envKeys: string[];
  };
}

interface CatalogResponse {
  servers: CatalogServer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
  source?: string;
}

interface ConnectionStatus {
  toolId: string;
  enabled: boolean;
  config: Record<string, unknown>;
  status: "connecting" | "connected" | "error" | "disconnected";
  error: string | null;
  tools: DiscoveredTool[];
  connectedAt: string | null;
}

interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// --- Helpers ---

function StatusDot({ status }: { status: string }) {
  switch (status) {
    case "connected":
      return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />;
    case "connecting":
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />;
    case "error":
      return <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />;
    default:
      return <span className="w-2.5 h-2.5 rounded-full bg-gray-500/50" />;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "connected": return "Connected";
    case "connecting": return "Connecting...";
    case "error": return "Error";
    default: return "Not connected";
  }
}

// --- Main Component ---

export default function MCPConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Catalog state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  // Detail sheet state
  const [selectedServer, setSelectedServer] = React.useState<CatalogServer | null>(null);
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [transportType, setTransportType] = React.useState<"stdio" | "http">("stdio");
  const [httpUrl, setHttpUrl] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("overview");

  // Tool execution state
  const [selectedToolName, setSelectedToolName] = React.useState<string>("");
  const [toolArgs, setToolArgs] = React.useState<string>("{}");
  const [toolResult, setToolResult] = React.useState<string>("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- Queries ---

  const { data: catalogData, isLoading: catalogLoading } = useQuery<CatalogResponse>({
    queryKey: ["/api/mcp/catalog", searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams({ q: searchQuery, page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`/api/mcp/catalog?${params}`);
      return res.json();
    },
  });

  const { data: statuses = [] } = useQuery<ConnectionStatus[]>({
    queryKey: ["/api/mcp/status"],
    queryFn: async () => {
      const res = await fetch("/api/mcp/status");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch discovered tools for selected connected server
  const selectedStatus = selectedServer
    ? statuses.find((s) => s.toolId === selectedServer.qualifiedName)
    : null;

  const { data: discoveredToolsData } = useQuery<{ tools: DiscoveredTool[] }>({
    queryKey: ["/api/mcp/connections", selectedServer?.qualifiedName, "tools"],
    queryFn: async () => {
      const res = await fetch(`/api/mcp/connections/${encodeURIComponent(selectedServer!.qualifiedName)}/tools`);
      return res.json();
    },
    enabled: !!selectedServer && selectedStatus?.status === "connected",
  });

  const discoveredTools = discoveredToolsData?.tools ?? selectedStatus?.tools ?? [];

  // Status lookup map
  const statusMap = React.useMemo(() => {
    const map: Record<string, ConnectionStatus> = {};
    statuses.forEach((s) => { map[s.toolId] = s; });
    return map;
  }, [statuses]);

  const connectedCount = statuses.filter((s) => s.status === "connected").length;

  // --- Mutations ---

  const connectMutation = useMutation({
    mutationFn: async ({ toolId, config }: { toolId: string; config: Record<string, unknown> }) => {
      const res = await apiRequest("POST", `/api/mcp/connections/${encodeURIComponent(toolId)}/connect`, { config });
      return res.json();
    },
    onSuccess: (data, { toolId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/connections"] });
      if (data.status === "connected") {
        toast({ title: "Connected", description: `${data.tools?.length ?? 0} tools discovered` });
        setActiveTab("tools");
      } else {
        toast({ title: "Connection failed", description: data.error ?? "Unknown error", variant: "destructive" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("POST", `/api/mcp/connections/${encodeURIComponent(toolId)}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp/connections"] });
      toast({ title: "Disconnected" });
      setActiveTab("overview");
    },
  });

  const callToolMutation = useMutation({
    mutationFn: async ({ toolId, toolName, args }: { toolId: string; toolName: string; args: Record<string, unknown> }) => {
      const res = await apiRequest("POST", `/api/mcp/connections/${encodeURIComponent(toolId)}/tools/${encodeURIComponent(toolName)}/call`, { arguments: args });
      return res.json();
    },
    onSuccess: (data) => {
      setToolResult(JSON.stringify(data.result, null, 2));
    },
    onError: (err: Error) => {
      setToolResult(`Error: ${err.message}`);
    },
  });

  // --- Handlers ---

  function handleConnect() {
    if (!selectedServer) return;
    let config: Record<string, unknown>;

    if (transportType === "stdio") {
      const defaultCfg = selectedServer.defaultConfig;
      const env: Record<string, string> = {};
      for (const [key, val] of Object.entries(configValues)) {
        if (val.trim()) env[key] = val.trim();
      }
      config = {
        command: defaultCfg?.command ?? "npx",
        args: defaultCfg?.args ?? ["-y", selectedServer.qualifiedName],
        env: Object.keys(env).length > 0 ? env : undefined,
      };
    } else {
      config = {
        url: httpUrl,
        headers: configValues,
      };
    }

    connectMutation.mutate({ toolId: selectedServer.qualifiedName, config });
  }

  function handleCallTool() {
    if (!selectedServer || !selectedToolName) return;
    try {
      const args = JSON.parse(toolArgs);
      callToolMutation.mutate({
        toolId: selectedServer.qualifiedName,
        toolName: selectedToolName,
        args,
      });
    } catch {
      setToolResult("Error: Invalid JSON in arguments");
    }
  }

  // Reset sheet state when opening a new server
  function openServer(server: CatalogServer) {
    setSelectedServer(server);
    setActiveTab("overview");
    setConfigValues({});
    setTransportType("stdio");
    setHttpUrl("");
    setSelectedToolName("");
    setToolArgs("{}");
    setToolResult("");
  }

  const servers = catalogData?.servers ?? [];
  const pagination = catalogData?.pagination;
  const isSmithery = !catalogData?.source;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MCP Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Manage how context flows into your AI coding assistants via Model Context Protocol.
        </p>
      </div>

      {/* Existing Config Section */}
      <div className="grid gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Cursor / Windsurf Bridge</CardTitle>
                  <CardDescription>Active connection to IDE agents</CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Inject Decisions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically prompt IDE when code violates recorded decisions.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Context Window Budget</Label>
                <p className="text-sm text-muted-foreground">
                  Max tokens allocated for meeting context per session.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="8000" className="w-24 text-right font-mono" />
                <span className="text-sm text-muted-foreground">tokens</span>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground mb-2">
                <Terminal className="w-4 h-4" />
                Server Endpoint
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/40 p-2 rounded text-sm text-primary">
                  wss://api.unanexus.io/mcp/v1/stream
                </code>
                <Button variant="outline" size="sm">Copy</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-lg">Privacy & Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>PII Redaction</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Internal Only (No Cloud)</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Repo Scope</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Monitor 'main' branch</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Include PR Comments</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="ghost">Reset Defaults</Button>
          <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      </div>

      {/* ─── MCP Marketplace ─── */}
      <Separator className="my-8" />

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">MCP Marketplace</h2>
            <p className="text-muted-foreground text-sm">
              Browse, connect, and use real MCP servers
              {isSmithery && (
                <span className="ml-1 text-xs text-muted-foreground/60">— powered by Smithery Registry</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-4 mb-6">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            {connectedCount} live
          </Badge>
          {pagination && (
            <Badge variant="outline" className="text-muted-foreground">
              {pagination.totalCount} servers
            </Badge>
          )}
          {catalogData?.source === "fallback" && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
              Fallback catalog — set SMITHERY_API_KEY for full registry
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search MCP servers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-black/20 border-white/10"
            />
          </div>
        </div>

        {/* Server Grid */}
        {catalogLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-white/10">
                <CardContent className="p-5">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/50" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-secondary/50 rounded w-24" />
                        <div className="h-3 bg-secondary/30 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-3 bg-secondary/30 rounded w-full" />
                    <div className="h-3 bg-secondary/30 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server, i) => {
              const st = statusMap[server.qualifiedName];
              const isConnected = st?.status === "connected";
              const isConnecting = st?.status === "connecting";
              const isError = st?.status === "error";

              return (
                <motion.div
                  key={server.qualifiedName}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Card
                    className={`relative cursor-pointer transition-all hover:shadow-lg group ${
                      isConnected
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                        : isError
                        ? "border-red-500/20 bg-red-500/5"
                        : "bg-card/50 border-white/10 hover:border-primary/30"
                    }`}
                    onClick={() => openServer(server)}
                  >
                    {/* Status indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {(isConnected || isConnecting || isError) && (
                        <>
                          <StatusDot status={st?.status ?? "disconnected"} />
                          {isConnected && st?.tools && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {st.tools.length} tools
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isConnected ? "bg-emerald-500/15" : "bg-secondary/50"
                        }`}>
                          {server.iconUrl ? (
                            <img
                              src={server.iconUrl}
                              alt=""
                              className="w-5 h-5 rounded"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <Wrench className={`w-5 h-5 ${isConnected ? "text-emerald-400" : "text-muted-foreground"}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                          <h3 className="font-semibold text-sm truncate">{server.displayName}</h3>
                          <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                            {server.qualifiedName}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {server.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                          <Download className="w-3 h-3" />
                          {server.useCount?.toLocaleString() ?? "—"}
                        </div>
                        <Button
                          size="sm"
                          variant={isConnected ? "outline" : "default"}
                          className={`text-xs h-7 ${
                            isConnected
                              ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openServer(server);
                            setActiveTab("configure");
                          }}
                        >
                          {isConnected ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Connected</>
                          ) : isConnecting ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Connecting</>
                          ) : (
                            <><Plug className="w-3.5 h-3.5 mr-1" />Connect</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!catalogLoading && servers.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No servers found.</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearchInput(""); setSearchQuery(""); setPage(1); }}>
              Clear search
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ─── Detail Sheet ─── */}
      <Sheet open={!!selectedServer} onOpenChange={(open) => !open && setSelectedServer(null)}>
        <SheetContent className="sm:max-w-lg p-0 flex flex-col">
          {selectedServer && (() => {
            const st = statusMap[selectedServer.qualifiedName];
            const isConnected = st?.status === "connected";
            const defaultCfg = selectedServer.defaultConfig;

            return (
              <>
                {/* Sheet Header */}
                <div className="p-6 pb-0">
                  <SheetHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${isConnected ? "bg-emerald-500/15" : "bg-secondary/50"}`}>
                        {selectedServer.iconUrl ? (
                          <img src={selectedServer.iconUrl} alt="" className="w-7 h-7 rounded" />
                        ) : (
                          <Wrench className={`w-7 h-7 ${isConnected ? "text-emerald-400" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <div>
                        <SheetTitle className="text-xl">{selectedServer.displayName}</SheetTitle>
                        <SheetDescription className="flex items-center gap-2 mt-1">
                          <StatusDot status={st?.status ?? "disconnected"} />
                          <span>{statusLabel(st?.status ?? "disconnected")}</span>
                          {st?.error && (
                            <span className="text-red-400 text-xs truncate max-w-48" title={st.error}>
                              — {st.error}
                            </span>
                          )}
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-4">
                  <div className="px-6">
                    <TabsList className="w-full">
                      <TabsTrigger value="overview" className="flex-1 gap-1.5">
                        <Eye className="w-3.5 h-3.5" />Overview
                      </TabsTrigger>
                      <TabsTrigger value="configure" className="flex-1 gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />Configure
                      </TabsTrigger>
                      <TabsTrigger value="tools" className="flex-1 gap-1.5" disabled={!isConnected}>
                        <Wrench className="w-3.5 h-3.5" />Tools
                        {isConnected && discoveredTools.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                            {discoveredTools.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="execute" className="flex-1 gap-1.5" disabled={!isConnected}>
                        <Play className="w-3.5 h-3.5" />Run
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                      <div>
                        <h4 className="text-sm font-medium mb-2">About</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedServer.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
                          <p className="text-muted-foreground/60 text-xs mb-1">Package</p>
                          <p className="font-mono text-xs truncate">{selectedServer.qualifiedName}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
                          <p className="text-muted-foreground/60 text-xs mb-1">Installs</p>
                          <p className="font-semibold">{selectedServer.useCount?.toLocaleString() ?? "—"}</p>
                        </div>
                      </div>

                      {selectedServer.homepage && (
                        <a
                          href={selectedServer.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Homepage
                        </a>
                      )}

                      {/* Quick connect/disconnect */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-secondary/30">
                        <div>
                          <p className="text-sm font-medium">{statusLabel(st?.status ?? "disconnected")}</p>
                          {st?.connectedAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Since {new Date(st.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        {isConnected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => disconnectMutation.mutate(selectedServer.qualifiedName)}
                            disabled={disconnectMutation.isPending}
                          >
                            <Unplug className="w-4 h-4 mr-1.5" />
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setActiveTab("configure")}
                          >
                            <Settings2 className="w-4 h-4 mr-1.5" />
                            Configure
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Configure Tab */}
                    <TabsContent value="configure" className="px-6 py-4 space-y-5 mt-0">
                      {/* Transport type */}
                      <div>
                        <Label className="text-sm font-medium">Transport</Label>
                        <Select value={transportType} onValueChange={(v) => setTransportType(v as "stdio" | "http")}>
                          <SelectTrigger className="mt-1.5 bg-black/20 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stdio">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5" />
                                Stdio (local process)
                              </div>
                            </SelectItem>
                            <SelectItem value="http">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                HTTP (remote server)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {transportType === "stdio" ? (
                        <>
                          {/* Command preview */}
                          <div>
                            <Label className="text-sm font-medium">Command</Label>
                            <div className="mt-1.5 p-3 rounded-lg bg-black/30 border border-white/5 font-mono text-xs text-muted-foreground">
                              {defaultCfg
                                ? `${defaultCfg.command} ${defaultCfg.args.join(" ")}`
                                : `npx -y ${selectedServer.qualifiedName}`}
                            </div>
                          </div>

                          {/* Env vars */}
                          {defaultCfg && defaultCfg.envKeys.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Environment Variables</Label>
                              {defaultCfg.envKeys.map((key) => (
                                <div key={key}>
                                  <Label className="text-xs text-muted-foreground font-mono">{key}</Label>
                                  <Input
                                    type="password"
                                    placeholder={`Enter ${key}`}
                                    value={configValues[key] ?? ""}
                                    onChange={(e) => setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                    className="mt-1 bg-black/20 border-white/10 font-mono text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {(!defaultCfg || defaultCfg.envKeys.length === 0) && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                              No configuration needed — ready to connect!
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-sm font-medium">Server URL</Label>
                            <Input
                              placeholder="http://localhost:8080/mcp"
                              value={httpUrl}
                              onChange={(e) => setHttpUrl(e.target.value)}
                              className="mt-1.5 bg-black/20 border-white/10 font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Authorization Header (optional)</Label>
                            <Input
                              type="password"
                              placeholder="Bearer your-token"
                              value={configValues["Authorization"] ?? ""}
                              onChange={(e) => setConfigValues((prev) => ({ ...prev, Authorization: e.target.value }))}
                              className="mt-1.5 bg-black/20 border-white/10 font-mono text-sm"
                            />
                          </div>
                        </>
                      )}

                      {/* Connect button */}
                      <Button
                        className="w-full"
                        onClick={handleConnect}
                        disabled={connectMutation.isPending || (transportType === "http" && !httpUrl)}
                      >
                        {connectMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                        ) : isConnected ? (
                          <><RefreshCw className="w-4 h-4 mr-2" />Reconnect</>
                        ) : (
                          <><Plug className="w-4 h-4 mr-2" />Save & Connect</>
                        )}
                      </Button>

                      {st?.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4 inline mr-1.5" />
                          {st.error}
                        </div>
                      )}
                    </TabsContent>

                    {/* Tools Tab */}
                    <TabsContent value="tools" className="px-6 py-4 space-y-3 mt-0">
                      {discoveredTools.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No tools discovered yet</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">
                            {discoveredTools.length} tools available from this server
                          </p>
                          {discoveredTools.map((tool) => (
                            <Card
                              key={tool.name}
                              className="bg-secondary/30 border-white/5 hover:border-primary/20 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedToolName(tool.name);
                                setToolArgs("{}");
                                setToolResult("");
                                setActiveTab("execute");
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-mono font-medium truncate">{tool.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {tool.description}
                                    </p>
                                  </div>
                                  <Button size="sm" variant="ghost" className="shrink-0 ml-2">
                                    <Play className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </TabsContent>

                    {/* Execute Tab */}
                    <TabsContent value="execute" className="px-6 py-4 space-y-4 mt-0">
                      {/* Tool selector */}
                      <div>
                        <Label className="text-sm font-medium">Tool</Label>
                        <Select value={selectedToolName} onValueChange={(v) => { setSelectedToolName(v); setToolArgs("{}"); setToolResult(""); }}>
                          <SelectTrigger className="mt-1.5 bg-black/20 border-white/10">
                            <SelectValue placeholder="Select a tool..." />
                          </SelectTrigger>
                          <SelectContent>
                            {discoveredTools.map((t) => (
                              <SelectItem key={t.name} value={t.name}>
                                <span className="font-mono text-xs">{t.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show selected tool description + schema hint */}
                      {selectedToolName && (() => {
                        const tool = discoveredTools.find((t) => t.name === selectedToolName);
                        const schemaProps = (tool?.inputSchema as any)?.properties;
                        return tool ? (
                          <div className="p-3 rounded-lg bg-secondary/30 border border-white/5 space-y-2">
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                            {schemaProps && Object.keys(schemaProps).length > 0 && (
                              <div className="text-[10px] font-mono text-muted-foreground/60">
                                Parameters: {Object.keys(schemaProps).join(", ")}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Arguments */}
                      <div>
                        <Label className="text-sm font-medium">Arguments (JSON)</Label>
                        <textarea
                          value={toolArgs}
                          onChange={(e) => setToolArgs(e.target.value)}
                          className="mt-1.5 w-full h-28 rounded-md bg-black/30 border border-white/10 p-3 font-mono text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                          spellCheck={false}
                        />
                      </div>

                      {/* Run button */}
                      <Button
                        className="w-full"
                        onClick={handleCallTool}
                        disabled={!selectedToolName || callToolMutation.isPending}
                      >
                        {callToolMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" />Run Tool</>
                        )}
                      </Button>

                      {/* Result */}
                      {toolResult && (
                        <div>
                          <Label className="text-sm font-medium">Result</Label>
                          <pre className="mt-1.5 p-3 rounded-lg bg-black/30 border border-white/10 text-xs font-mono text-foreground overflow-auto max-h-64 whitespace-pre-wrap">
                            {toolResult}
                          </pre>
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
