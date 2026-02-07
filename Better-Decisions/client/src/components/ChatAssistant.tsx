import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  MessageSquare, 
  Send, 
  X, 
  Bot, 
  Sparkles,
  Maximize2,
  Minimize2,
  Paperclip
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I have context on all 6 recent meetings and decisions. Ask me anything about the architecture review or Kafka migration.",
      timestamp: new Date()
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");

    // Mock AI response
    setTimeout(() => {
      const responses = [
        "Based on the Q4 Architecture Review, the team decided to decouple the worker service to handle the 5k events/sec load.",
        "Sarah assigned the Kafka dev environment setup to DevOps during Sprint Planning.",
        "The legacy API rate limit is 1000 req/min, which is a key constraint for the new worker design.",
        "I found a relevant code snippet in `service/ingestion-worker` that needs refactoring to support the new event bus."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMsg]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`
              pointer-events-auto bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4
              ${isExpanded ? 'w-[400px] h-[600px] md:w-[500px] md:h-[700px]' : 'w-[350px] h-[500px]'}
            `}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-primary/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Una Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
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
                  </div>
                ))}
                {messages.length === 1 && (
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    <p className="text-xs text-muted-foreground ml-1 mb-1">Suggested questions:</p>
                    {["Summarize the Kafka decision", "Who attended the architecture review?", "Any open action items?"].map(q => (
                      <button 
                        key={q}
                        onClick={() => { setInputValue(q); }}
                        className="text-left text-xs p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors border border-white/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-card/50 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2"
              >
                <div className="flex-1 relative">
                  <Input 
                    placeholder="Ask about meetings, decisions..." 
                    className="pr-10 bg-black/20 border-white/10 focus-visible:ring-primary/20 min-h-[44px]"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputValue.trim()}
                  className="h-11 w-11 shrink-0 bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          ${isOpen 
            ? 'bg-secondary text-foreground border border-white/10' 
            : 'bg-primary text-primary-foreground border border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]'
          }
        `}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
