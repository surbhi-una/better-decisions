import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { EventType } from "@/lib/types";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create-project' | 'log-event';
  projectId?: string;
}

export function AgentModal({ isOpen, onClose, mode, projectId }: AgentModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Accumulated event data through conversation steps
  const [eventData, setEventData] = useState<{
    type: EventType;
    label: string;
    description: string;
    isDecision: boolean;
  }>({
    type: "note",
    label: "",
    description: "",
    isDecision: false,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      type: EventType;
      label: string;
      description: string;
      isDecision: boolean;
    }) => {
      const payload = {
        projectId: projectId || "default",
        type: data.type,
        isDecision: data.isDecision,
        label: data.label,
        description: data.description,
        timestamp: new Date().toISOString(),
        status: "active" as const,
        impact: "medium" as const,
        sortOrder: Date.now(),
      };
      const res = await apiRequest("POST", "/api/events", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Event logged",
        description: "The event has been added to the timeline.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize chat based on mode
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setEventData({ type: "note", label: "", description: "", isDecision: false });
      const initialMessage = mode === 'create-project'
        ? "Hi! I can help you set up a new project tracking stream. What's the name of the initiative?"
        : "I'm ready to log a new event. Is this a **meeting**, a **note**, or a **code** change?";

      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addAssistantMessage = (content: string) => {
    const msg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");

    setTimeout(() => {
      if (mode === 'create-project') {
        handleCreateProjectStep(userText);
      } else {
        handleLogEventStep(userText);
      }
    }, 600);
  };

  const handleCreateProjectStep = (userText: string) => {
    // Keep create-project mode unchanged (still mocked)
    switch(step) {
      case 0:
        addAssistantMessage(`Great, "${userText}" sounds important. Who are the key team members involved?`);
        setStep(1);
        break;
      case 1:
        addAssistantMessage("Got it. And what's the primary goal or description for this project?");
        setStep(2);
        break;
      case 2:
        addAssistantMessage("Understood. I've set up the project dashboard. You can now start tracking decision streams.");
        setStep(3);
        setTimeout(onClose, 2500);
        break;
      default:
        addAssistantMessage("Project created!");
    }
  };

  const handleLogEventStep = (userText: string) => {
    const lower = userText.toLowerCase();

    switch(step) {
      case 0: {
        // Step 0: Parse event type
        let type: EventType = "note";
        if (lower.includes("meeting") || lower.includes("standup") || lower.includes("sync")) {
          type = "meeting";
        } else if (lower.includes("code") || lower.includes("commit") || lower.includes("pr") || lower.includes("deploy")) {
          type = "code";
        }
        setEventData(prev => ({ ...prev, type }));
        addAssistantMessage(`Got it — logging a **${type}** event. Please provide a brief title and description for this event.`);
        setStep(1);
        break;
      }
      case 1: {
        // Step 1: Capture content as label + description
        const label = userText.length > 80 ? userText.slice(0, 80) + "..." : userText;
        setEventData(prev => ({ ...prev, label, description: userText }));
        addAssistantMessage("Should I mark this as a **key decision**? (yes/no)");
        setStep(2);
        break;
      }
      case 2: {
        // Step 2: Parse decision flag, fire mutation
        const isDecision = lower.includes("yes") || lower.includes("y");
        const finalData = { ...eventData, isDecision };
        setEventData(finalData);

        createEventMutation.mutate(finalData);

        const badge = isDecision ? ' with the **Decision** badge' : '';
        addAssistantMessage(`Done! The event has been added to the timeline${badge}. This dialog will close shortly.`);
        setStep(3);
        setTimeout(onClose, 2500);
        break;
      }
      default:
        addAssistantMessage("Event logged.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-card/95 backdrop-blur-xl border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {mode === 'create-project' ? 'New Project Agent' : 'Event Logger Agent'}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {createEventMutation.isPending ? 'Saving...' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Area */}
        <div className="h-[400px] flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-secondary/80 border border-white/5 rounded-tl-sm'
                      }
                    `}
                  >
                    <p>{msg.content}</p>
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing / Loading Indicator */}
              {(messages.length % 2 !== 0 && step < 3) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary/40 rounded-2xl rounded-tl-sm p-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-card/50">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative">
                <Input
                  placeholder={step >= 3 ? "Process complete..." : "Type your response..."}
                  className="pr-10 bg-black/20 border-white/10 focus-visible:ring-primary/20 min-h-[44px]"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={step >= 3 || createEventMutation.isPending}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || step >= 3 || createEventMutation.isPending}
                className="h-11 w-11 shrink-0 bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
              >
                {step >= 3 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : createEventMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
