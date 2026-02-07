import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MeetingWithDecisions } from "@/lib/types";
import type { Meeting } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Plus,
  Users,
  MessageSquare,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function parseVtt(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const textLines: string[] = [];
  let lastSpeaker = "";

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip WEBVTT header, NOTE blocks, STYLE blocks, empty lines, cue IDs (numeric), and timestamp lines
    if (
      trimmed === "" ||
      trimmed === "WEBVTT" ||
      trimmed.startsWith("NOTE") ||
      trimmed.startsWith("STYLE") ||
      trimmed.startsWith("Kind:") ||
      trimmed.startsWith("Language:") ||
      /^\d+$/.test(trimmed) ||
      /^\d{2}:\d{2}[:.]\d{2}/.test(trimmed)
    ) {
      continue;
    }

    // Handle "<v Speaker>text</v>" voice tags
    const voiceMatch = trimmed.match(/^<v\s+([^>]+)>(.*)$/);
    if (voiceMatch) {
      const speaker = voiceMatch[1].trim();
      const text = voiceMatch[2].replace(/<\/v>/g, "").trim();
      if (speaker !== lastSpeaker) {
        textLines.push(`\n${speaker}:`);
        lastSpeaker = speaker;
      }
      if (text) textLines.push(text);
      continue;
    }

    // Strip any remaining HTML-like tags
    const clean = trimmed.replace(/<[^>]*>/g, "").trim();
    if (clean) textLines.push(clean);
  }

  return textLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function confidenceColor(c: string) {
  if (c === "high") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (c === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

function statusColor(s: string) {
  if (s === "decided") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s === "proposed") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (s === "revisiting") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

export default function MeetingNotesSubmit() {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MeetingWithDecisions | null>(null);

  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (file.name.endsWith(".vtt")) {
        setNotes(parseVtt(text));
        toast({ title: "VTT imported", description: `Parsed transcript from ${file.name}` });
      } else {
        // Plain text / .txt / .md files — use as-is
        setNotes(text);
        toast({ title: "File imported", description: `Loaded ${file.name}` });
      }
      // Auto-fill title from filename if empty
      if (!title.trim()) {
        const name = file.name.replace(/\.(vtt|txt|md|srt)$/i, "").replace(/[_-]/g, " ");
        setTitle(name);
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { title: string; rawNotes: string; source?: string }) => {
      // The Hono backend expects snake_case keys
      const res = await apiRequest("POST", "/api/meetings", {
        title: data.title,
        raw_notes: data.rawNotes,
        source: data.source || null,
      });
      // Backend returns { meeting, decisions } directly with extracted decisions
      return res.json() as Promise<{ meeting: Meeting; decisions: any[]; error?: string }>;
    },
    onSuccess: (data) => {
      // Normalize snake_case Hono response into camelCase MeetingWithDecisions shape
      const m = data.meeting;
      const normalized: MeetingWithDecisions = {
        id: m.id,
        title: m.title,
        rawNotes: m.raw_notes ?? m.rawNotes ?? "",
        source: m.source,
        createdAt: m.created_at ?? m.createdAt,
        decisions: (data.decisions ?? []).map((d: any) => ({
          id: d.id,
          meetingId: d.meeting_id ?? d.meetingId,
          title: d.title,
          description: d.description,
          rationale: d.rationale,
          status: d.status,
          confidence: d.confidence,
          project: d.project,
          team: d.team,
          createdAt: d.created_at ?? d.createdAt,
          updatedAt: d.updated_at ?? d.updatedAt,
          participants: (d.participants ?? []).map((p: any) => ({
            id: p.id,
            decisionId: p.decision_id ?? p.decisionId,
            name: p.name,
            role: p.role,
          })),
        })),
      };
      setResult(normalized);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Meeting submitted",
        description: `Meeting saved with ${normalized.decisions?.length ?? 0} decision(s).${data.error ? ` Note: ${data.error}` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;

    mutation.mutate({
      title: title.trim(),
      rawNotes: notes.trim(),
      source: source.trim() || undefined,
    });
  };

  const handleReset = () => {
    setTitle("");
    setSource("");
    setNotes("");
    setResult(null);
    mutation.reset();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Link href="/decisions">
          <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Decisions
          </a>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Submit Meeting Notes</h1>
        <p className="text-muted-foreground mt-1">
          Record meeting notes. Decisions can be extracted and tracked separately.
        </p>
      </div>

      {/* Error Banner */}
      {mutation.isError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Submission failed</p>
              <p className="text-sm text-muted-foreground">
                {mutation.error?.message || "Something went wrong. Please try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {mutation.isPending && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium">Saving meeting notes...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your meeting is being recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Meeting saved successfully</p>
                <p className="text-sm text-muted-foreground">
                  {result.decisions?.length
                    ? `${result.decisions.length} decision(s) linked to this meeting.`
                    : "No decisions linked yet. You can add them from the Decisions page."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Info Card */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{result.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.source && (
                <Badge variant="outline" className="text-xs">{result.source}</Badge>
              )}
              <div className="text-xs text-muted-foreground">
                Created: {new Date(result.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Extracted Decision Cards */}
          {result.decisions?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Linked Decisions ({result.decisions.length})
              </h3>
              {result.decisions.map((d) => (
                <Card key={d.id} className="bg-card/50 border-white/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{d.title}</h4>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${statusColor(d.status)}`}>
                          {d.status}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${confidenceColor(d.confidence)}`}>
                          {d.confidence}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                    {d.rationale && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rationale</p>
                        <p className="text-sm italic text-muted-foreground/80">{d.rationale}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {d.project && (
                        <Badge variant="secondary" className="text-xs">{d.project}</Badge>
                      )}
                      {d.team && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {d.team}
                        </Badge>
                      )}
                    </div>
                    {d.participants?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {d.participants.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-[10px]">
                            {p.name} ({p.role})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} className="gap-2">
              <Plus className="w-4 h-4" />
              Submit Another
            </Button>
            <Link href="/decisions">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                View All Decisions
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Form */}
      {!result && !mutation.isPending && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Sprint Planning - Jan 15"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-black/20 border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source (optional)</Label>
                <Input
                  id="source"
                  placeholder="e.g. Zoom, Google Meet, Notion, Slack"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Meeting Notes</Label>
                  <div>
                    <input
                      id="vtt-upload"
                      type="file"
                      accept=".vtt,.txt,.md,.srt"
                      onChange={handleFileUpload}
                      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }}
                    />
                    <label
                      htmlFor="vtt-upload"
                      className="inline-flex items-center gap-1.5 text-xs cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 h-8 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload .vtt / .txt
                    </label>
                  </div>
                </div>
                <Textarea
                  id="notes"
                  placeholder="Paste your meeting notes, transcript, or summary here — or upload a .vtt file"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[200px] bg-black/20 border-white/10 resize-y"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length > 0
                    ? `${notes.length} characters`
                    : "Paste the full transcript or upload a .vtt / .txt file"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/decisions">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={!title.trim() || !notes.trim()}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Meeting Notes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
