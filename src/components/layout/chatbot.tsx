"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([
    { role: "assistant", content: "Hi! I'm Lumi, your personal Researchify assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send chat history (excluding the first mock greeting to save tokens if desired, but we can include it)
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

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 animate-in fade-in zoom-in group"
        >
          <Sparkles className="absolute top-1 right-1 w-3 h-3 text-yellow-300 animate-pulse" />
          <MessageCircle className="h-6 w-6 group-hover:hidden" />
          <Bot className="h-6 w-6 hidden group-hover:block" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-background border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-primary/10 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Lumi</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4 bg-muted/10">
            <div className="space-y-4 pb-2">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
                    {!isUser && (
                       <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                       </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                          : "bg-muted border border-border/50 text-foreground rounded-bl-sm shadow-sm prose prose-sm prose-p:leading-snug prose-p:my-1 prose-a:text-primary"
                      }`}
                    >
                      {isUser ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                 <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                       <Loader2 className="w-4 h-4 animate-spin text-primary opacity-50" />
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
                className="flex-1 rounded-full bg-muted/30 focus-visible:ring-primary/20 border-primary/10"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-full shadow-sm hover:scale-105 transition-all">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="text-center mt-2">
                <p className="text-[9px] text-muted-foreground opacity-60">Lumi (Groq AI) can make mistakes. Verify info.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
