import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Code2, 
  Terminal, 
  ShieldAlert, 
  GitBranch, 
  RefreshCw 
} from "lucide-react";

export default function MCPConfig() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MCP Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Manage how context flows into your AI coding assistants via Model Context Protocol.
        </p>
      </div>

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
                <Button variant="outline" size="sm">
                  Copy
                </Button>
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
    </div>
  );
}
