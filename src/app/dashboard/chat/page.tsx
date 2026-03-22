"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Hash, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Lumi AI Contact
const LUMI_CONTACT = {
  id: 'lumi-ai',
  name: 'Lumi AI',
  role: 'ai_assistant',
  isAI: true
};

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeContact && currentUser) {
      loadMessages();
      
      // Auto-poll for new messages every 3 seconds
      const poll = setInterval(loadMessages, 3000);
      return () => clearInterval(poll);
    }
  }, [activeContact, currentUser]);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (!dbUser) return;
    setCurrentUser(dbUser);

    let userContacts: any[] = [];

    if (dbUser.role === 'professor') {
      const { data: prof } = await supabase.from('professors').select('id').eq('user_id', dbUser.id).single();
      if (prof) {
        const { data: scholars } = await supabase.from('scholars').select('user_id').eq('professor_id', prof.id);
        if (scholars && scholars.length > 0) {
          const userIds = scholars.map(s => s.user_id);
          const { data: usersData } = await supabase.from('users').select('*').in('id', userIds);
          if (usersData) {
            userContacts = usersData;
          }
        }
      }
    } else if (dbUser.role === 'scholar') {
      const { data: scholar } = await supabase.from('scholars').select('professor_id').eq('user_id', dbUser.id).single();
      if (scholar) {
        const { data: prof } = await supabase.from('professors').select('user_id').eq('id', scholar.professor_id).single();
        if (prof) {
           const { data: pUser } = await supabase.from('users').select('*').eq('id', prof.user_id).single();
           if(pUser) {
             userContacts = [pUser];
           }
        }
      }
    }

    // Add Lumi AI as the first contact
    const allContacts = [LUMI_CONTACT, ...userContacts];
    setContacts(allContacts);
    setActiveContact(allContacts[0]);

    setLoading(false);
  }

  async function loadMessages() {
     if(!activeContact || !currentUser) return;

     // Handle Lumi AI chat differently
     if (activeContact.id === 'lumi-ai') {
       // Load AI messages from localStorage
       const savedMessages = localStorage.getItem('lumi-ai-messages');
       if (savedMessages) {
         const parsed = JSON.parse(savedMessages);
         setMessages(parsed);
       } else {
         // Set initial AI greeting
         const initialMsg = [{
           id: 'initial',
           sender_id: 'lumi-ai',
           text: "Hi! I'm Lumi, your Researchify assistant.\n\nI can help you view your meetings and tasks. What would you like to know?",
           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         }];
         setMessages(initialMsg);
       }
       return;
     }

     // Fetch direct_message activity logs associated with these two users
     const { data: msgs } = await supabase.from('activity_logs')
        .select('*')
        .eq('activity_type', 'direct_message')
        .order('created_at', { ascending: true });

     if (msgs) {
         const filteredMsgs = msgs.filter(m => {
            const isMeToThem = m.user_id === currentUser.id && m.metadata?.receiver_id === activeContact.id;
            const isThemToMe = m.user_id === activeContact.id && m.metadata?.receiver_id === currentUser.id;
            return isMeToThem || isThemToMe;
         }).map(m => ({
            id: m.id,
            sender_id: m.user_id,
            text: m.description,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         }));
         setMessages(filteredMsgs);
     }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMessage.trim() || !activeContact || !currentUser) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    // Handle Lumi AI Chat
    if (activeContact.id === 'lumi-ai') {
      const tempMsg = {
        id: Date.now().toString(),
        sender_id: currentUser.id,
        text: msgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedMessages = [...messages, tempMsg];
      setMessages(updatedMessages);
      setIsAILoading(true);

      try {
        // Send to AI API
        const apiMessages = updatedMessages.map(m => ({
          role: m.sender_id === 'lumi-ai' ? 'assistant' : 'user',
          content: m.text
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages })
        });

        if (!response.ok) throw new Error("AI request failed");

        const data = await response.json();
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender_id: 'lumi-ai',
          text: data.text || "Sorry, I couldn't process that request.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        // Save to localStorage
        localStorage.setItem('lumi-ai-messages', JSON.stringify(finalMessages));
      } catch (error) {
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          sender_id: 'lumi-ai',
          text: "Oops, something went wrong. Please try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsAILoading(false);
      }
      return;
    }

    // Regular user-to-user chat
    const tempMsg = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempMsg]);

    // Send to Supabase acting as 'activity_logs' for our backend
    await supabase.from('activity_logs').insert({
       user_id: currentUser.id,
       activity_type: 'direct_message',
       description: msgText,
       metadata: { receiver_id: activeContact.id }
    });

    // Hard refresh to ensure consistency
    loadMessages();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse flex items-center justify-center h-full"><Hash className="w-5 h-5 mr-2 animate-spin"/> Loading Workspace...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4 p-4 lg:p-8">
      {/* Contacts Sidebar */}
      <Card className="w-1/3 flex flex-col hidden sm:flex border-primary/10">
        <CardHeader className="py-4 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Workspace Directory</CardTitle>
          <CardDescription>Select a team member to begin chatting</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No contacts found.</p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => { setActiveContact(contact); setMessages([]); }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${activeContact?.id === contact.id ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-muted/50 border border-transparent'}`}
                >
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarFallback className={`${activeContact?.id === contact.id ? 'bg-primary text-primary-foreground' : contact.isAI ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-primary/5 text-primary'}`}>
                      {contact.isAI ? <Bot className="h-5 w-5" /> : contact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-semibold truncate flex items-center gap-2">
                      {contact.name}
                      {contact.isAI && (
                        <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-normal">AI</span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {contact.isAI ? 'AI Assistant' : contact.role}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-sm border-primary/10">
        {activeContact ? (
          <>
            <CardHeader className="py-4 border-b flex-row space-y-0 items-center justify-between gap-4 bg-muted/20">
               <div className="flex items-center gap-4">
                 <Avatar className="h-10 w-10 border shadow-sm bg-background">
                    <AvatarFallback className={`${activeContact.isAI ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-primary/10 text-primary'} font-bold`}>
                      {activeContact.isAI ? <Bot className="h-5 w-5" /> : activeContact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {activeContact.name}
                      {activeContact.isAI && (
                        <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-normal">AI</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${activeContact.isAI ? 'bg-violet-500' : 'bg-green-500'} animate-pulse inline-block`}></span>
                      {activeContact.isAI ? 'Always Online' : 'Online'}
                    </CardDescription>
                  </div>
               </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4 bg-background">
              <div className="space-y-6 pb-4">
                 <div className="text-center text-xs text-muted-foreground py-4 relative">
                    <span className="bg-background px-4 relative z-10 border rounded-full py-1 shadow-sm">
                      {activeContact.isAI ? 'AI-Powered Assistant' : 'End-to-end Encrypted Workspace Chat'}
                    </span>
                    <hr className="absolute top-1/2 w-full -z-0 border-muted" />
                 </div>
                 {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const isAI = msg.sender_id === 'lumi-ai';
                    const isLast = idx === messages.length - 1;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                             isMe
                               ? 'bg-primary text-primary-foreground rounded-br-sm'
                               : isAI
                               ? 'bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 border border-violet-200 dark:border-violet-800 text-foreground rounded-bl-sm'
                               : 'bg-muted border border-border/50 text-foreground rounded-bl-sm'
                           }`}
                                ref={isLast ? scrollRef : null}>
                              {isAI ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1">
                                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                              )}
                              <span className={`text-[10px] block mt-1.5 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp}
                              </span>
                           </div>
                        </div>
                    )
                 })}
                 {isAILoading && (
                   <div className="flex justify-start">
                     <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 border border-violet-200 dark:border-violet-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                       <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                       <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                       <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                   </div>
                 )}
                 {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 opacity-60">
                        {activeContact.isAI ? (
                          <>
                            <Sparkles className="w-10 h-10 mx-auto mb-3 text-violet-500 opacity-50" />
                            <p className="text-sm">Ask Lumi anything about your tasks and meetings!</p>
                          </>
                        ) : (
                          <>
                            <Hash className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Start a conversation with {activeContact.name}</p>
                          </>
                        )}
                    </div>
                 )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/10">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <Input
                  placeholder={activeContact.isAI ? "Ask Lumi anything..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background shadow-sm border-primary/20 focus-visible:ring-primary/30"
                  autoFocus
                  disabled={isAILoading}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || isAILoading} className="rounded-full shadow-md transition-all hover:scale-105 active:scale-95 h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/5">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Hash className="h-8 w-8" /></div>
             <p className="font-medium">Select a team member to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}
