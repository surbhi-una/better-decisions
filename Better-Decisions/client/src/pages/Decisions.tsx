import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DecisionListResponse, DecisionDetail } from "@/lib/types";
import type { Decision } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  ExternalLink,
  MessageSquare,
  Target,
  GitPullRequest,
  GitCommit as GitCommitIcon,
  CircleDot,
  Link2,
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

// Map snake_case DB rows from Hono API to camelCase expected by frontend
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

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Decisions() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);
  const debouncedProject = useDebounce(projectFilter, 300);
  const debouncedTeam = useDebounce(teamFilter, 300);

  const queryParams = new URLSearchParams();
  if (debouncedSearch.trim()) queryParams.set("search", debouncedSearch.trim());
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (debouncedProject.trim()) queryParams.set("project", debouncedProject.trim());
  if (debouncedTeam.trim()) queryParams.set("team", debouncedTeam.trim());
  queryParams.set("page", String(page));
  queryParams.set("per_page", "10");

  const { data: listResult, isLoading } = useQuery<DecisionListResponse>({
    queryKey: ["/api/decisions", debouncedSearch, statusFilter, debouncedProject, debouncedTeam, page],
    queryFn: async () => {
      const res = await fetch(`/api/decisions?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch decisions");
      const json = await res.json();
      return {
        data: (json.data ?? []).map(mapDecision),
        total: json.total ?? 0,
        page: json.page ?? 1,
        pageSize: json.per_page ?? json.pageSize ?? 10,
      };
    },
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

  const decisionsList = listResult?.data ?? [];
  const total = listResult?.total ?? 0;
  const pageSize = listResult?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasFilters =
    searchInput.trim() !== "" || statusFilter !== "all" || projectFilter.trim() !== "" || teamFilter.trim() !== "";

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setProjectFilter("");
    setTeamFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decisions</h1>
          <p className="text-muted-foreground mt-1">
            All extracted decisions across your meetings.
            {total > 0 && (
              <span className="ml-1">
                {total} decision{total !== 1 ? "s" : ""} total
              </span>
            )}
          </p>
        </div>
        <Link href="/meetings/new">
          <Button className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Submit Meeting Notes
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card/50 border-white/10">
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search decisions by title, description, project, or team..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-black/20 border-white/10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] bg-black/20 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="decided">Decided</SelectItem>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="revisiting">Revisiting</SelectItem>
                <SelectItem value="superseded">Superseded</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Project..."
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
              className="w-[150px] bg-black/20 border-white/10"
            />

            <Input
              placeholder="Team..."
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
              className="w-[150px] bg-black/20 border-white/10"
            />

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Decision Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : decisionsList.length === 0 ? (
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
            <Target className="w-10 h-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">
                {hasFilters ? "No decisions match your filters" : "No decisions yet"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {hasFilters
                  ? "Try adjusting your filters."
                  : "Submit meeting notes to start extracting decisions."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/meetings/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Submit Meeting Notes
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {decisionsList.map((decision, i) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                onClick={() => setSelectedDecisionId(decision.id)}
                className="bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                        {decision.project && (
                          <Badge variant="secondary" className="text-[10px]">
                            {decision.project}
                          </Badge>
                        )}
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
                        {new Date(decision.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedDecisionId}
        onOpenChange={(open) => !open && setSelectedDecisionId(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedDetail && (
            <DecisionDetailPanel detail={selectedDetail} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DecisionDetailPanel({ detail }: { detail: DecisionDetail }) {
  return (
    <div className="space-y-6 pt-2">
      <SheetHeader>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <Badge
            variant="outline"
            className={`text-xs ${statusColor(detail.status)}`}
          >
            {detail.status}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${confidenceColor(detail.confidence)}`}
          >
            {detail.confidence} confidence
          </Badge>
        </div>
        <SheetTitle className="text-xl">{detail.title}</SheetTitle>
        <SheetDescription>
          <span className="flex items-center gap-3 flex-wrap">
            {detail.project && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {detail.project}
              </span>
            )}
            {detail.team && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {detail.team}
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
        <p className="text-sm leading-relaxed">{detail.description}</p>
      </div>

      {/* Rationale */}
      {detail.rationale && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Rationale
          </h4>
          <p className="text-sm leading-relaxed italic text-muted-foreground">
            {detail.rationale}
          </p>
        </div>
      )}

      {/* Meeting Context */}
      {detail.meeting && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Meeting Context
          </h4>
          <Card className="bg-black/20 border-white/10">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{detail.meeting.title}</span>
              </div>
              {detail.meeting.source && (
                <Badge variant="outline" className="text-[10px]">
                  {detail.meeting.source}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {detail.meeting.rawNotes.slice(0, 500)}
                {detail.meeting.rawNotes.length > 500 ? "..." : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participants */}
      {detail.participants?.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Participants
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {detail.participants.map((p) => (
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
      {detail.githubLinks?.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            GitHub Links
          </h4>
          <div className="space-y-1.5">
            {detail.githubLinks.map((link) => {
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
          Created: {new Date(detail.createdAt).toLocaleString()}
        </div>
        {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Updated: {new Date(detail.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
