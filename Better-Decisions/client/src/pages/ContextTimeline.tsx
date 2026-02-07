import { useState } from "react";
import { useSearch, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AppNodeData } from "@/lib/mockData";
import { DetailPanel } from "@/components/DetailPanel";
import { AgentModal } from "@/components/AgentModal";
import { GitHubSync } from "@/components/GitHubSync";
import { useQuery } from "@tanstack/react-query";
import type { Project, Event } from "@shared/schema";
import { 
  Filter, 
  Share2, 
  Plus, 
  GitCommit,
  GitBranch,
  ArrowRight,
  Search,
  X,
  ChevronLeft,
  MessageSquare,
  FileText,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

function getIconForEvent(event: Event) {
  if (event.type === "meeting") return MessageSquare;
  if (event.type === "code") return FileCode;
  if (event.isDecision) return CheckCircle2;
  if (event.impact === "high") return AlertTriangle;
  return FileText;
}

function eventToNodeData(event: Event): AppNodeData {
  return {
    ...event,
    id: event.id,
    projectId: event.projectId,
    type: event.type,
    isDecision: event.isDecision,
    label: event.label,
    description: event.description,
    timestamp: event.timestamp,
    status: event.status,
    impact: event.impact,
    summary: event.summary,
    participants: event.participants,
    transcript: event.transcript,
    codeSnippet: event.codeSnippet,
    actionItems: event.actionItems as AppNodeData["actionItems"],
    openQuestions: event.openQuestions,
    relatedLinks: event.relatedLinks as AppNodeData["relatedLinks"],
    tags: event.tags,
    sortOrder: event.sortOrder,
    icon: getIconForEvent(event),
  };
}

export default function ContextTimeline() {
  const [selectedNode, setSelectedNode] = useState<AppNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const projectId = params.get('project');

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: eventsList = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", ...(projectId ? [`?projectId=${projectId}`] : [])],
    queryFn: async () => {
      const url = projectId ? `/api/events?projectId=${projectId}` : "/api/events";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const projectName = project?.name || null;

  const nodes = eventsList
    .map(eventToNodeData)
    .filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between shrink-0 gap-4">
        <div>
          {projectName && (
            <Link href="/">
              <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                All Projects
              </a>
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {projectName || "Decision Stream"}
          </h1>
          <p className="text-muted-foreground">
            {projectName 
              ? `${nodes.length} events in this project stream`
              : "The winding path of context leading to architectural decisions."
            }
          </p>
        </div>
        
        <div className="flex-1 max-w-md hidden md:block relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter by project, team, or keyword..." 
            className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" data-testid="button-share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {projectId && <GitHubSync projectId={projectId} />}
          <Button size="sm" onClick={() => setIsAgentOpen(true)} data-testid="button-log-event">
            <Plus className="w-4 h-4 mr-2" />
            Log Event
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-black/20 border-white/5 backdrop-blur-sm overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading events...</div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="relative min-h-full py-20 px-4 md:px-0">
              
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent -translate-x-1/2" />
              
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-4 md:left-1/2 top-0 w-[2px] bg-gradient-to-b from-primary via-blue-400 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] -translate-x-1/2"
              />

              <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                {nodes.map((node, index) => {
                  const Icon = node.icon || GitCommit;
                  const isEven = index % 2 === 0;
                  const isDecision = node.isDecision === true;
                  
                  return (
                    <motion.div 
                      key={node.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex flex-col md:flex-row items-center gap-4 ${isEven ? '' : 'md:flex-row-reverse'}`}
                    >
                      
                      <div className={`flex-1 w-full md:w-auto ${isEven ? 'md:text-right' : 'md:text-left'} pl-12 md:pl-0`}>
                         <div className={`flex flex-col gap-1 ${isEven ? 'md:items-end' : 'md:items-start'}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] text-primary/80">{node.timestamp}</span>
                              <Badge variant="outline" className="uppercase tracking-widest text-[9px] h-4 px-1 border-primary/20 text-primary">
                                {node.type}
                              </Badge>
                              {isDecision && (
                                <Badge className="uppercase tracking-widest text-[9px] h-4 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Decision
                                </Badge>
                              )}
                            </div>
                            
                            <Card
                              onClick={() => setSelectedNode(node)}
                              className={`
                              relative p-4 backdrop-blur-md transition-all duration-300 group hover:scale-[1.01] cursor-pointer w-full
                              ${isDecision
                                ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                                : 'bg-card/40 border-white/5 hover:bg-card/60 hover:border-white/10'
                              }
                            `}
                            data-testid={`card-event-${node.id}`}
                            >
                              <div className={`
                                absolute top-1/2 -translate-y-1/2 w-4 h-[1px] bg-border
                                ${isEven
                                  ? '-right-4 group-hover:bg-gradient-to-l'
                                  : '-left-4 group-hover:bg-gradient-to-r'
                                }
                                from-primary/50 to-transparent transition-all hidden md:block
                              `} />

                              <div className={`flex flex-col gap-2 ${isEven ? 'md:items-end' : 'md:items-start'}`}>
                                <h3 className={`text-base font-bold ${isDecision ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                                  {node.label}
                                </h3>
                                <p className={`text-sm leading-relaxed max-w-2xl ${isEven ? 'md:text-right' : 'md:text-left'} ${isDecision ? 'text-foreground/90' : 'text-muted-foreground/90'}`}>
                                  {node.description}
                                </p>
                                {node.type === 'code' && (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {node.tags?.slice(0, 5).map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                         </div>
                      </div>

                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className={`
                          relative rounded-full flex items-center justify-center transition-all duration-500
                          ${isDecision 
                            ? 'w-8 h-8 bg-background border border-primary shadow-[0_0_10px_rgba(37,99,235,0.4)] z-20' 
                            : 'w-5 h-5 bg-background border border-border z-10'
                          }
                        `}>
                          <Icon className={`
                            ${isDecision ? 'w-3 h-3 text-primary' : 'w-2.5 h-2.5 text-muted-foreground'}
                          `} />
                          
                          {isDecision && (
                            <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 hidden md:block" />

                    </motion.div>
                  );
                })}

                 <div className="flex flex-col items-center gap-2 pt-12 pb-8">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">End of Stream</span>
                 </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </Card>

      <DetailPanel 
        node={selectedNode} 
        isOpen={!!selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

      <AgentModal 
        isOpen={isAgentOpen} 
        onClose={() => setIsAgentOpen(false)} 
        mode="log-event" 
      />
    </div>
  );
}
