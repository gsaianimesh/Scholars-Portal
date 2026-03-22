"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

// Cute Lumi face icon component
function LumiIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Face */}
      <circle cx="50" cy="50" r="45" fill="url(#lumiGradient)" />
      {/* Left eye */}
      <ellipse cx="35" cy="42" rx="8" ry="10" fill="white" />
      <circle cx="37" cy="44" r="5" fill="#1e1b4b" />
      <circle cx="39" cy="42" r="2" fill="white" />
      {/* Right eye */}
      <ellipse cx="65" cy="42" rx="8" ry="10" fill="white" />
      <circle cx="67" cy="44" r="5" fill="#1e1b4b" />
      <circle cx="69" cy="42" r="2" fill="white" />
      {/* Smile */}
      <path d="M 35 62 Q 50 75 65 62" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <circle cx="25" cy="55" r="6" fill="#ff9999" opacity="0.5" />
      <circle cx="75" cy="55" r="6" fill="#ff9999" opacity="0.5" />
      {/* Sparkle */}
      <path d="M 78 20 L 80 25 L 85 27 L 80 29 L 78 34 L 76 29 L 71 27 L 76 25 Z" fill="#ffd700" />
      <defs>
        <linearGradient id="lumiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([
    { role: "assistant", content: "Hi! I'm Lumi, your Researchify assistant.\n\nI can help you view your meetings and tasks. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const userMessage = customInput || input.trim();
    if (!userMessage || isLoading) return;

    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({role: m.role, content: m.content})) })
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops, something went wrong on my end. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "My Meetings", icon: <Calendar className="w-3 h-3" />, prompt: "Show me my upcoming meetings" },
    { label: "My Tasks", icon: <CheckSquare className="w-3 h-3" />, prompt: "What are my current tasks?" },
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 h-16 w-16 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-400 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 animate-in fade-in zoom-in group ring-4 ring-white/30 hover:ring-white/50"
          title="Chat with Lumi"
        >
          <LumiIcon className="h-12 w-12 drop-shadow-lg" />
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 left-6 w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] bg-background border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b">
            <div className="flex items-center gap-3">
              <div className="relative">
                <LumiIcon className="h-10 w-10 drop-shadow-md" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Lumi
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-medium">BETA</span>
                </h3>
                <p className="text-xs text-muted-foreground">Your AI assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-muted/30 to-background">
            <div className="space-y-4 pb-2">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2 group`}>
                    {!isUser && (
                       <div className="w-7 h-7 rounded-full shrink-0 mb-1">
                          <LumiIcon className="w-7 h-7" />
                       </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all ${
                        isUser
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-md"
                          : "bg-card border shadow-sm text-foreground rounded-bl-sm prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-strong:text-indigo-600 prose-a:text-indigo-500"
                      }`}
                    >
                      {isUser ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                    </div>
                  </div>
                );
              })}

              {messages.length === 1 && (
                  <div className="pt-2 flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 px-1">
                        <Sparkles className="w-3 h-3 text-purple-500" /> Quick Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                          {quickActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSubmit(undefined, action.prompt)}
                                className="text-xs flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors shadow-sm"
                              >
                                  {action.icon} {action.label}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {isLoading && (
                 <div className="flex justify-start items-end gap-2 animate-pulse">
                    <div className="w-7 h-7 rounded-full shrink-0 mb-1">
                        <LumiIcon className="w-7 h-7" />
                    </div>
                    <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                 </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t bg-background">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Lumi anything..."
                className="flex-1 rounded-full bg-muted/50 focus-visible:ring-purple-500/30 border-primary/10 h-10"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-full shadow-md hover:scale-105 transition-all bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-60">
              Lumi may make mistakes. Always verify important info.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
