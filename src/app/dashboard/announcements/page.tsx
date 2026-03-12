"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import { Megaphone, Plus, Trash2 } from "lucide-react";

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "👀", "💡"];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Get role
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: appUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (appUser) {
      setUserRole(appUser.role);
    }

    // Fetch announcements
    const res = await fetch("/api/announcements");
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setCurrentUserId(data.currentUserId || "");
    }
    setLoading(false);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError("");

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to post announcement");
      setPosting(false);
      return;
    }

    const data = await res.json();
    setAnnouncements((prev) => [data.announcement, ...prev]);
    setTitle("");
    setContent("");
    setShowNew(false);
    setPosting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleReaction(announcementId: string, emoji: string) {
    const res = await fetch(`/api/announcements/${announcementId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });

    if (res.ok) {
      const { action } = await res.json();
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.id !== announcementId) return a;
          let reactions = [...(a.reactions || [])];
          if (action === "removed") {
            reactions = reactions.filter(
              (r: any) => !(r.user_id === currentUserId && r.emoji === emoji)
            );
          } else {
            reactions.push({ user_id: currentUserId, emoji, user: { id: currentUserId, name: "You" } });
          }
          return { ...a, reactions };
        })
      );
    }
  }

  const canPost = userRole === "professor" || userRole === "co_supervisor";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Updates and notices from your research group</p>
        </div>
        {canPost && (
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Announcement
          </Button>
        )}
      </div>

      {/* New Announcement Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Post an update visible to everyone in your research group.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePost} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="e.g. Lab meeting moved to Friday"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-content">Content</Label>
              <Textarea
                id="ann-content"
                placeholder="Details of the announcement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={posting}>
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onReact={handleReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  announcement,
  currentUserId,
  onDelete,
  onReact,
}: {
  announcement: any;
  currentUserId: string;
  onDelete: (id: string) => void;
  onReact: (announcementId: string, emoji: string) => void;
}) {
  const author = announcement.author;
  const reactions: any[] = announcement.reactions || [];
  const isAuthor = announcement.author_id === currentUserId;
  const timeAgo = getTimeAgo(new Date(announcement.created_at));

  // Group reactions by emoji
  const grouped: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { count: 0, userReacted: false, users: [] };
    }
    grouped[r.emoji].count++;
    if (r.user_id === currentUserId) grouped[r.emoji].userReacted = true;
    grouped[r.emoji].users.push(r.user?.name || "Someone");
  }

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 mt-0.5">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(author?.name || "?")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{author?.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{timeAgo}</span>
              </div>
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(announcement.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <h3 className="font-semibold mt-1">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1.5 mt-4 ml-12 flex-wrap">
          {/* Existing reactions */}
          {Object.entries(grouped).map(([emoji, data]) => (
            <button
              key={emoji}
              onClick={() => onReact(announcement.id, emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                data.userReacted
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-transparent hover:bg-muted"
              }`}
              title={data.users.join(", ")}
            >
              <span>{emoji}</span>
              <span>{data.count}</span>
            </button>
          ))}

          {/* Add reaction picker */}
          <ReactionPicker
            existingEmojis={Object.keys(grouped)}
            onSelect={(emoji) => onReact(announcement.id, emoji)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ReactionPicker({
  existingEmojis,
  onSelect,
}: {
  existingEmojis: string[];
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-dashed text-muted-foreground hover:bg-muted transition-colors text-xs"
      >
        +
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 bg-card border rounded-lg shadow-lg p-1.5 flex gap-1 z-50">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
