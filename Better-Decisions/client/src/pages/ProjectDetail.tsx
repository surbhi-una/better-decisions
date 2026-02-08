import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import type { Decision } from "@shared/schema";
import type { DecisionDetail } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Users,
  Target,
  MessageSquare,
  FileText,
  GitPullRequest,
  GitCommit as GitCommitIcon,
  CircleDot,
  Link2,
  Plus,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

function statusColor(status: string) {
  switch (status) {
    case "decided":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "proposed":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "revisiting":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "superseded":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function confidenceColor(confidence: string) {
  switch (confidence) {
    case "high":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "low":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function linkTypeIcon(type: string) {
  switch (type) {
    case "pr":
      return GitPullRequest;
    case "commit":
      return GitCommitIcon;
    case "issue":
      return CircleDot;
    default:
      return Link2;
  }
}

function mapDecision(d: any): Decision {
  return {
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
  };
}

function mapDecisionDetail(d: any): DecisionDetail {
  return {
    ...mapDecision(d),
    participants: (d.participants ?? []).map((p: any) => ({
      id: p.id,
      decisionId: p.decision_id ?? p.decisionId,
      name: p.name,
      role: p.role,
    })),
    githubLinks: (d.github_links ?? d.githubLinks ?? []).map((l: any) => ({
      id: l.id,
      decisionId: l.decision_id ?? l.decisionId,
      url: l.url,
      linkType: l.link_type ?? l.linkType,
      repo: l.repo,
      ref: l.ref,
      title: l.title,
      createdAt: l.created_at ?? l.createdAt,
    })),
    meeting: d.meeting
      ? {
          id: d.meeting.id,
          title: d.meeting.title,
          rawNotes: d.meeting.raw_notes ?? d.meeting.rawNotes ?? "",
          source: d.meeting.source,
          createdAt: d.meeting.created_at ?? d.meeting.createdAt,
        }
      : null,
  };
}

// Group decisions by date
function groupByDate(decisions: Decision[]): { date: string; items: Decision[] }[] {
  const groups = new Map<string, Decision[]>();
  for (const d of decisions) {
    const date = new Date(d.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(d);
  }
  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: decisionsResult, isLoading: decisionsLoading } = useQuery<{
    data: Decision[];
    total: number;
  }>({
    queryKey: ["/api/decisions", "project", project?.name],
    queryFn: async () => {
      const res = await fetch(
        `/api/decisions?project=${encodeURIComponent(project!.name)}&per_page=100`
      );
      if (!res.ok) throw new Error("Failed to fetch decisions");
      const json = await res.json();
      return {
        data: (json.data ?? []).map(mapDecision),
        total: json.total ?? 0,
      };
    },
    enabled: !!project?.name,
  });

  const { data: selectedDetail } = useQuery<DecisionDetail>({
    queryKey: ["/api/decisions", selectedDecisionId],
    queryFn: async () => {
      const res = await fetch(`/api/decisions/${selectedDecisionId}`);
      if (!res.ok) throw new Error("Failed to fetch decision");
      const json = await res.json();
      return mapDecisionDetail(json);
    },
    enabled: !!selectedDecisionId,
  });

  const decisions = decisionsResult?.data ?? [];
  const totalDecisions = decisionsResult?.total ?? 0;
  const dateGroups = groupByDate(decisions);

  const statusCounts = {
    decided: decisions.filter((d) => d.status === "decided").length,
    proposed: decisions.filter((d) => d.status === "proposed").length,
    revisiting: decisions.filter((d) => d.status === "revisiting").length,
  };

  if (projectLoading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="h-8 w-48 bg-secondary/50 rounded animate-pulse" />
        <div className="h-32 bg-secondary/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Link href="/">
          <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            All Projects
          </a>
        </Link>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Project not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back link + Header */}
      <div>
        <Link href="/">
          <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            All Projects
          </a>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-4 h-4 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    project.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : project.status === "completed"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {project.status}
                </Badge>
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/stream?project=${project.id}`}>
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Event Stream
              </Button>
            </Link>
            <Link href="/meetings/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Submit Meeting
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDecisions}</p>
              <p className="text-xs text-muted-foreground">Total Decisions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.decided}</p>
              <p className="text-xs text-muted-foreground">Decided</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.proposed}</p>
              <p className="text-xs text-muted-foreground">Proposed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.revisiting}</p>
              <p className="text-xs text-muted-foreground">Revisiting</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress */}
      {project.progress > 0 && (
        <Card className="p-4 bg-card/50 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Project Progress</span>
            <span className="text-sm text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </Card>
      )}

      {/* Team */}
      {project.team.length > 0 && (
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {project.team.map((member) => (
              <div
                key={member}
                className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium"
                title={member}
              >
                {member
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {project.team.length} team member{project.team.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Decision Timeline Map */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Decision Map</h2>

        {decisionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-secondary/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : decisions.length === 0 ? (
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
              <Target className="w-10 h-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">No decisions yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Submit meeting notes mentioning "{project.name}" to auto-extract decisions.
                </p>
              </div>
              <Link href="/meetings/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Submit Meeting Notes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Central timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            <div className="space-y-8">
              {dateGroups.map((group, gi) => (
                <motion.div
                  key={group.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 }}
                >
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center z-10 relative">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{group.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length} decision{group.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Decisions for this date */}
                  <div className="ml-6 pl-6 border-l border-white/5 space-y-3">
                    {group.items.map((decision, di) => (
                      <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: gi * 0.08 + di * 0.04 }}
                      >
                        <Card
                          onClick={() => setSelectedDecisionId(decision.id)}
                          className="bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer group relative"
                        >
                          {/* Connector dot */}
                          <div className="absolute -left-[30px] top-5 w-3 h-3 rounded-full bg-background border-2 border-primary/50 group-hover:border-primary group-hover:shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all" />

                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <CheckCircle2
                                    className={`w-4 h-4 shrink-0 ${
                                      decision.status === "decided"
                                        ? "text-emerald-400"
                                        : decision.status === "proposed"
                                        ? "text-blue-400"
                                        : decision.status === "revisiting"
                                        ? "text-amber-400"
                                        : "text-zinc-400"
                                    }`}
                                  />
                                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                    {decision.title}
                                  </h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {decision.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${statusColor(decision.status)}`}
                                  >
                                    {decision.status}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${confidenceColor(decision.confidence)}`}
                                  >
                                    {decision.confidence}
                                  </Badge>
                                  {decision.team && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      <Users className="w-3 h-3 mr-1" />
                                      {decision.team}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground font-mono">
                                  {new Date(decision.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* End of timeline */}
              <div className="flex items-center gap-3 ml-1.5">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">
                  End of Decision Map
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decision Detail Sheet */}
      <Sheet
        open={!!selectedDecisionId}
        onOpenChange={(open) => !open && setSelectedDecisionId(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedDetail && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusColor(selectedDetail.status)}`}
                  >
                    {selectedDetail.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${confidenceColor(selectedDetail.confidence)}`}
                  >
                    {selectedDetail.confidence} confidence
                  </Badge>
                </div>
                <SheetTitle className="text-xl">{selectedDetail.title}</SheetTitle>
                <SheetDescription>
                  <span className="flex items-center gap-3 flex-wrap">
                    {selectedDetail.project && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {selectedDetail.project}
                      </span>
                    )}
                    {selectedDetail.team && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {selectedDetail.team}
                      </span>
                    )}
                  </span>
                </SheetDescription>
              </SheetHeader>

              {/* Description */}
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Description
                </h4>
                <p className="text-sm leading-relaxed">{selectedDetail.description}</p>
              </div>

              {/* Rationale */}
              {selectedDetail.rationale && (
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Rationale
                  </h4>
                  <p className="text-sm leading-relaxed italic text-muted-foreground">
                    {selectedDetail.rationale}
                  </p>
                </div>
              )}

              {/* Meeting Context */}
              {selectedDetail.meeting && (
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Meeting Context
                  </h4>
                  <Card className="bg-black/20 border-white/10">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          {selectedDetail.meeting.title}
                        </span>
                      </div>
                      {selectedDetail.meeting.source && (
                        <Badge variant="outline" className="text-[10px]">
                          {selectedDetail.meeting.source}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                        {selectedDetail.meeting.rawNotes.slice(0, 500)}
                        {selectedDetail.meeting.rawNotes.length > 500 ? "..." : ""}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Participants */}
              {selectedDetail.participants?.length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Participants
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetail.participants.map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {p.name}
                        <span className="ml-1 text-muted-foreground">({p.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub Links */}
              {selectedDetail.githubLinks?.length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    GitHub Links
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetail.githubLinks.map((link) => {
                      const Icon = linkTypeIcon(link.linkType);
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {link.title || link.url}
                          {link.repo && (
                            <Badge variant="outline" className="text-[10px] ml-1">
                              {link.repo}
                            </Badge>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Created: {new Date(selectedDetail.createdAt).toLocaleString()}
                </div>
                {selectedDetail.updatedAt &&
                  selectedDetail.updatedAt !== selectedDetail.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Updated: {new Date(selectedDetail.updatedAt).toLocaleString()}
                    </div>
                  )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
