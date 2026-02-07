import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppNodeData } from "@/lib/mockData";
import { MeetingNotesPanel } from "@/components/MeetingNotesPanel";
import { 
  GitBranch, 
  ExternalLink, 
  Clock, 
  Users, 
  FileText, 
  Play, 
  Code2,
  Terminal,
  CheckSquare,
  HelpCircle,
  Circle
} from "lucide-react";

interface DetailPanelProps {
  node: AppNodeData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailPanel({ node, isOpen, onClose }: DetailPanelProps) {
  const [isMeetingNotesOpen, setIsMeetingNotesOpen] = useState(false);

  if (!node) return null;

  const Icon = node.icon || GitBranch;

  const handleLinkClick = (label: string) => {
    if (label === "Meeting Notes") {
      setIsMeetingNotesOpen(true);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px] border-l border-white/10 bg-card/95 backdrop-blur-xl p-0 flex flex-col h-full shadow-2xl">
          <div className="p-6 pb-2 shrink-0">
            <div className="flex items-start gap-4 mb-6">
              <div className={`
                p-3 rounded-xl border border-white/10 shadow-inner
                ${node.isDecision ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}
              `}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
                    {node.type}
                  </Badge>
                  {node.impact === 'high' && (
                    <Badge variant="destructive" className="text-[10px]">High Impact</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {node.timestamp}
                  </span>
                </div>
                <SheetTitle className="text-2xl font-bold leading-tight">{node.label}</SheetTitle>
              </div>
            </div>
            <Separator className="bg-white/10" />
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-8 pb-8">
              
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Context Summary</h4>
                <p className="text-base leading-relaxed text-foreground/90">
                  {node.summary || node.description}
                </p>
              </div>

              {node.actionItems && (node.actionItems as any[]).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Action Items
                  </h4>
                  <div className="grid gap-2">
                    {(node.actionItems as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${item.status === 'completed' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                          {item.status === 'completed' && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm ${item.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.text}
                          </p>
                          {item.assignee && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{item.assignee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {node.openQuestions && node.openQuestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Open Questions
                  </h4>
                  <ul className="space-y-2">
                    {node.openQuestions.map((q, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground/90 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.participants && node.participants.length > 0 && (
                <div className="space-y-3">
                   <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                     <Users className="w-4 h-4" /> Participants
                   </h4>
                   <div className="flex flex-wrap gap-2">
                     {node.participants.map((p) => (
                       <Badge key={p} variant="secondary" className="px-3 py-1 font-normal">
                         {p}
                       </Badge>
                     ))}
                   </div>
                </div>
              )}

              {node.codeSnippet && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Relevant Snippet
                  </h4>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs overflow-x-auto">
                    <pre>{node.codeSnippet}</pre>
                  </div>
                </div>
              )}

              {node.transcript && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Transcript Excerpt
                  </h4>
                  <div className="pl-4 border-l-2 border-primary/20 italic text-muted-foreground text-sm space-y-2">
                    {node.transcript.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {node.tags && node.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {node.tags.map(tag => (
                    <span key={tag} className="text-xs text-primary/60 font-mono">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-white/10 bg-card/95 backdrop-blur-xl shrink-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {node.relatedLinks?.map((link, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-10 border-white/10 hover:bg-white/5"
                  onClick={() => handleLinkClick(link.label)}
                  data-testid={`button-link-${i}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}
              
              {!node.relatedLinks && (
                <>
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/10 hover:bg-white/5">
                    <Terminal className="w-4 h-4" />
                    Open in IDE
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/10 hover:bg-white/5">
                    <ExternalLink className="w-4 h-4" />
                    View Source
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MeetingNotesPanel 
        node={node}
        isOpen={isMeetingNotesOpen}
        onClose={() => setIsMeetingNotesOpen(false)}
      />
    </>
  );
}
