"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Calendar, CheckSquare, Bot, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";

const HELP_MESSAGES = [
  "This is Lumi, I can help figure out things! 👋",
  "I'm Lumi, your AI assistant. Need help with anything? 🌟",
  "It's Lumi! Let me help you stay organized and productive. ✨",
  "Lumi here! Got questions about your tasks or meetings? 🚀",
  "This is Lumi! I can assist you with scheduling and task management. 💡",
];

export function Chatbot({ requireAuth = false, disabledClick = false }: { requireAuth?: boolean, disabledClick?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([
    { role: "assistant", content: "Hi! I'm Lumi, your Researchify assistant.\n\nI can help you view your meetings and tasks. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user info
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data: dbUser } = await supabase
          .from("users")
          .select("name")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (dbUser?.name) {
          setUserName(dbUser.name.split(' ')[0]); // First name only
        }
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Auto-popup bubble every 3 minutes with rotating messages
  useEffect(() => {
    if (!isOpen) {
      const showBubbleTimer = setTimeout(() => {
        setShowBubble(true);
        // Auto-hide bubble after 5 seconds
        setTimeout(() => setShowBubble(false), 5000);
      }, 3000); // Show first bubble after 3 seconds

      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % HELP_MESSAGES.length);
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 5000);
      }, 180000); // Every 3 minutes

      return () => {
        clearTimeout(showBubbleTimer);
        clearInterval(interval);
      };
    }
  }, [isOpen]);

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

  const handleChatClick = () => {
    if (disabledClick && !isAuthenticated) {
      setCurrentMessageIndex(0);
      setShowBubble(true);
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button with Hover Effect & Blinking Indicator */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Help Bubble */}
          {showBubble && (
            <div className="relative animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-background border shadow-lg rounded-2xl px-4 py-2.5 max-w-[200px]">
                <button
                  onClick={() => setShowBubble(false)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-muted hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center text-muted-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs font-medium text-foreground text-center">
                  {requireAuth && !isAuthenticated ? (
                    "Please login to use Lumi! 🔒"
                  ) : userName ? (
                    `Hey ${userName}! ${HELP_MESSAGES[currentMessageIndex]}`
                  ) : (
                    `Hey! ${HELP_MESSAGES[currentMessageIndex]}`
                  )}
                </p>
              </div>
              {/* Pointer - pointing down at the bot */}
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-background border-r border-b rotate-45 transform"></div>
            </div>
          )}

          {/* Floating Bot Button */}
          <button
            onClick={handleChatClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative h-14 w-14 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all hover:shadow-xl group"
            title="Chat with Lumi"
          >
            {/* Icon transitions */}
            <MessageCircle
              className={`h-6 w-6 absolute transition-all duration-300 ${
                isHovered ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
              }`}
            />

            {/* Bot with blinking eyes on hover */}
            <div className={`absolute transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              <Bot className="h-6 w-6" />
              {/* Blinking eyes animation */}
              {isHovered && (
                <>
                  <span className="absolute top-[9px] left-[11px] w-[3px] h-[3px] bg-white rounded-full animate-pulse"></span>
                  <span className="absolute top-[9px] right-[11px] w-[3px] h-[3px] bg-white rounded-full animate-pulse"></span>
                </>
              )}
            </div>

            {/* Blinking online indicator */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-ping"></span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[360px] h-[500px] max-h-[80vh] bg-background border shadow-xl rounded-xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-sm flex items-center gap-1.5">
                  Lumi
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-normal">BETA</span>
                </h3>
                <p className="text-[11px] text-white/70">AI Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3 pb-2">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
                    {!isUser && (
                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mb-1">
                          <Bot className="w-3.5 h-3.5 text-white" />
                       </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        isUser
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm prose prose-sm prose-p:leading-relaxed prose-p:my-1"
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
                        <Sparkles className="w-3 h-3 text-violet-500" /> Quick Actions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                          {quickActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSubmit(undefined, action.prompt)}
                                className="text-xs flex items-center gap-1 bg-muted px-2.5 py-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                              >
                                  {action.icon} {action.label}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {isLoading && (
                 <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2 flex gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                       <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                 </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Lumi anything..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Lumi may make mistakes. Always verify important info.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
