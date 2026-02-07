import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppNodeData } from "@/lib/mockData";
import { 
  FileText, 
  Clock, 
  Users, 
  CheckSquare, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ListChecks,
  MessageSquare,
  Target
} from "lucide-react";

interface MeetingNotesPanelProps {
  node: AppNodeData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingNotesPanel({ node, isOpen, onClose }: MeetingNotesPanelProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  if (!node) return null;

  const structuredNotes = {
    aiSummary: node.summary || node.description,
    keyTopics: [
      "Current ingestion pipeline performance (5k events/sec bottleneck)",
      "Database connection pool locking issues",
      "Event bus architecture proposal",
      "Rate limits on legacy API provider"
    ],
    decisions: [
      { text: "Migrate to Apache Kafka for event streaming", owner: "Platform Team", status: "approved" },
      { text: "Decouple worker service from main API", owner: "Backend Team", status: "approved" }
    ],
    nextSteps: [
      "Schedule follow-up with DevOps for Kafka setup",
      "Review RFC-023 with security team",
      "Update architecture diagrams"
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 bg-card/95 backdrop-blur-xl border-white/10 flex flex-col">
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
                  Meeting Notes
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {node.timestamp}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold">{node.label}</DialogTitle>
              {node.participants && node.participants.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {node.participants.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="bg-white/10" />

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/20 rounded-md">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</h4>
              </div>
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {structuredNotes.aiSummary}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-md">
                  <ListChecks className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key Topics Discussed</h4>
              </div>
              <ul className="space-y-2">
                {structuredNotes.keyTopics.map((topic, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/90">
                    <span className="text-primary mt-1">&bull;</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded-md">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Decisions Made</h4>
              </div>
              <div className="grid gap-2">
                {structuredNotes.decisions.map((decision, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{decision.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Owner: {decision.owner}</span>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] h-4">
                          {decision.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {node.actionItems && (node.actionItems as any[]).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 rounded-md">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Action Items</h4>
                </div>
                <div className="grid gap-2">
                  {(node.actionItems as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${item.status === 'completed' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {item.status === 'completed' && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                          {item.text}
                        </p>
                        {item.assignee && (
                          <span className="text-xs text-muted-foreground">Assigned to: {item.assignee}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.openQuestions && node.openQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-500/20 rounded-md">
                    <HelpCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</h4>
                </div>
                <ul className="space-y-2">
                  {node.openQuestions.map((q, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground/90 bg-orange-500/5 p-3 rounded-lg border border-orange-500/10">
                      <HelpCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-md">
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Next Steps</h4>
              </div>
              <ul className="space-y-2">
                {structuredNotes.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/90">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {node.transcript && (
              <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-auto p-3 bg-secondary/30 hover:bg-secondary/50 border border-white/5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Raw Transcript</span>
                    </div>
                    {isTranscriptOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 bg-black/30 rounded-lg border border-white/5 font-mono text-xs text-muted-foreground space-y-2">
                    {node.transcript.split('\n').map((line, i) => {
                      const [speaker, ...rest] = line.split(':');
                      const text = rest.join(':');
                      return (
                        <p key={i}>
                          <span className="text-primary font-semibold">{speaker}:</span>
                          <span>{text}</span>
                        </p>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 bg-card/50 shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Export Notes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
