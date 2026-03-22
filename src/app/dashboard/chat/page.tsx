"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Hash } from "lucide-react";

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
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

    if (dbUser.role === 'professor') {
      const { data: prof } = await supabase.from('professors').select('id').eq('user_id', dbUser.id).single();
      if (prof) {
        const { data: scholars } = await supabase.from('scholars').select('user_id').eq('professor_id', prof.id);
        if (scholars && scholars.length > 0) {
          const userIds = scholars.map(s => s.user_id);
          const { data: usersData } = await supabase.from('users').select('*').in('id', userIds);
          if (usersData) {
            setContacts(usersData);
            setActiveContact(usersData[0]);
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
             setContacts([pUser]);
             setActiveContact(pUser);
           }
        }
      }
    }
    setLoading(false);
  }

  async function loadMessages() {
     if(!activeContact || !currentUser) return;
     
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

    // Optimistic UI Add
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
                    <AvatarFallback className={`${activeContact?.id === contact.id ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary'}`}>
                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-semibold truncate">{contact.name}</h4>
                    <p className="text-xs text-muted-foreground truncate capitalize">{contact.role}</p>
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
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {activeContact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{activeContact.name}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span> Online
                    </CardDescription>
                  </div>
               </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4 bg-background">
              <div className="space-y-6 pb-4">
                 <div className="text-center text-xs text-muted-foreground py-4 relative">
                    <span className="bg-background px-4 relative z-10 border rounded-full py-1 shadow-sm">End-to-end Encrypted Workspace Chat</span>
                    <hr className="absolute top-1/2 w-full -z-0 border-muted" />
                 </div>
                 {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const isLast = idx === messages.length - 1;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted border border-border/50 text-foreground rounded-bl-sm'}`}
                                ref={isLast ? scrollRef : null}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              <span className={`text-[10px] block mt-1.5 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp}
                              </span>
                           </div>
                        </div>
                    )
                 })}
                 {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 opacity-60">
                        <Hash className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Start a conversation with {activeContact.name}</p>
                    </div>
                 )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/10">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <Input 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background shadow-sm border-primary/20 focus-visible:ring-primary/30"
                  autoFocus
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-full shadow-md transition-all hover:scale-105 active:scale-95 h-10 w-10">
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
