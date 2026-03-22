"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

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
      // Load scholars linked to this professor
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
      // Load professor linked to this scholar
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMessage.trim() || !activeContact) return;
    
    // Optimistic Mock Add
    const msg = {
      id: Date.now(),
      sender_id: currentUser.id,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    setNewMessage("");

    // Simulate response for the demo
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender_id: activeContact.id,
            text: "Message received. I'll get back to you shortly.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, 1500);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Chat...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4 p-4 lg:p-8">
      {/* Contacts Sidebar */}
      <Card className="w-1/3 flex flex-col hidden sm:flex">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-lg">Messages</CardTitle>
          <CardDescription>Select a user to begin chatting</CardDescription>
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
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeContact?.id === contact.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                >
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-semibold truncate">{contact.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-sm">
        {activeContact ? (
          <>
            <CardHeader className="py-4 border-b flex-row space-y-0 items-center gap-4 bg-muted/20">
               <Avatar className="h-10 w-10 border shadow-sm bg-background">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {activeContact.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{activeContact.name}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Active Now
                  </CardDescription>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4 bg-background/50">
              <div className="space-y-4 pb-4">
                 <div className="text-center text-xs text-muted-foreground py-2 relative">
                    <span className="bg-background px-2 relative z-10">Chat started today</span>
                    <hr className="absolute top-1/2 w-full -z-0 border-muted" />
                 </div>
                 {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/80 text-foreground border rounded-bl-sm'}`}>
                              <p className="text-sm">{msg.text}</p>
                              <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp}
                              </span>
                           </div>
                        </div>
                    )
                 })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/10">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <Input 
                  placeholder="Type your message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-full shadow-md transition-transform hover:scale-105">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
             <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-primary/40"><Send className="h-8 w-8" /></div>
             <p>Select a contact to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}
