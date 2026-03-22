"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, Loader2, MessageSquareDashed, Zap, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([
    { role: "assistant", content: "Hi! I'm Lumi, your Researchify assistant ✨\n\nI can help you manage your workspace. What would you like to do?" }
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
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops, something went wrong on my end. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Show Meetings", icon: <Calendar className="w-3 h-3" />, prompt: "Show me my upcoming meetings" },
    { label: "Show Tasks", icon: <CheckSquare className="w-3 h-3" />, prompt: "What are my current tasks?" },
    { label: "Create a Task", icon: <CheckSquare className="w-3 h-3" />, prompt: "Create a new task" },
    { label: "Schedule Meeting", icon: <Calendar className="w-3 h-3" />, prompt: "Schedule a new meeting" }
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 animate-in fade-in zoom-in group ring-4 ring-primary/20"
        >
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-bounce" />
          <MessageSquareDashed className="h-6 w-6 group-hover:scale-0 transition-transform duration-300 absolute" />
          <Bot className="h-6 w-6 scale-0 group-hover:scale-100 transition-transform duration-300 absolute" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] bg-background border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-b">
            <div className="flex items-center gap-3">
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-full shadow-sm">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1">Lumi AI <Sparkles className="w-3 h-3 text-purple-500 fill-purple-500" /></h3>
                <p className="text-xs text-muted-foreground">Always here to help</p>
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
                       <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mb-1 shadow-sm text-white">
                          <Bot className="w-4 h-4" />
                       </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-md"
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
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 px-1"><Zap className="w-3 h-3 text-yellow-500" /> Quick Actions</p>
                      <div className="flex flex-wrap gap-2">
                          {quickActions.map((action, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleSubmit(undefined, action.prompt)}
                                className="text-xs flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full hover:bg-muted hover:border-primary/50 transition-colors shadow-sm"
                              >
                                  {action.icon} {action.label}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {isLoading && (
                 <div className="flex justify-start items-end gap-2 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mb-1 text-white">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                placeholder="Ask Lumi to schedule meeting..."
                className="flex-1 rounded-full bg-muted/50 focus-visible:ring-indigo-500/30 border-primary/10 h-10"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-full shadow-md hover:scale-105 transition-all bg-indigo-600 hover:bg-indigo-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="text-center mt-2.5">
                <p className="text-[10px] text-muted-foreground opacity-70">Lumi (Llama-3/Groq) can dynamically create tasks and meetings directly into your DB.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
