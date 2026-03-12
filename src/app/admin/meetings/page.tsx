"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getInitials, formatDateTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Search,
  Video,
  FileText,
} from "lucide-react";

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_link: string | null;
  agenda: string | null;
  transcript: string | null;
  summary: string | null;
  calendar_event_id: string | null;
  created_at: string;
  professor: {
    department: string;
    user: { name: string; email: string };
  };
  participants: Array<{
    role: string;
    user: { name: string; email: string; role: string };
  }>;
  action_items: Array<{
    description: string;
    status: string;
    deadline: string | null;
    assigned_user: { name: string; email: string };
  }>;
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = meetings.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.meeting_title.toLowerCase().includes(q) ||
      m.professor.user.name.toLowerCase().includes(q) ||
      m.participants.some((p) => p.user.name.toLowerCase().includes(q))
    );
  });

  const now = new Date();
  const upcoming = filtered.filter((m) => new Date(m.meeting_date) >= now);
  const past = filtered.filter((m) => new Date(m.meeting_date) < now);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading meetings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Meetings</h1>
          <p className="text-muted-foreground">
            {meetings.length} total meetings across all professors
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, professor, participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{meetings.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{past.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {meetings.filter((m) => m.meeting_link?.includes("meet.google")).length}
            </p>
            <p className="text-xs text-muted-foreground">Google Meet</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Past Meetings ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "No meetings match your search" : "No meetings found"}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m }: { meeting: Meeting }) {
  const isPast = new Date(m.meeting_date) < new Date();

  return (
    <Card className={isPast ? "opacity-80" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{m.meeting_title}</h3>
              {m.meeting_link?.includes("meet.google") && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Video className="h-3 w-3" />
                  Google Meet
                </Badge>
              )}
              {m.summary && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <FileText className="h-3 w-3" />
                  Has Summary
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(m.meeting_date)}
              </span>
              <span className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                    {getInitials(m.professor.user.name)}
                  </AvatarFallback>
                </Avatar>
                Prof. {m.professor.user.name}
              </span>
              {m.meeting_link && (
                <a
                  href={m.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Join
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{m.participants.length}</span>
          </div>
        </div>

        {m.agenda && (
          <p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded line-clamp-2">
            {m.agenda}
          </p>
        )}

        {/* Participants */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {m.participants.map((p, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {p.user.name}
              <span className="text-muted-foreground ml-1 capitalize">
                ({p.user.role.replace("_", " ")})
              </span>
            </Badge>
          ))}
        </div>

        {/* Action Items */}
        {m.action_items.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Action Items ({m.action_items.length})
            </p>
            {m.action_items.map((ai, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded">
                <span>{ai.description}</span>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">{ai.assigned_user.name}</span>
                  <Badge
                    variant={ai.status === "completed" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {ai.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary preview */}
        {m.summary && (
          <p className="text-xs mt-2 bg-blue-50 p-2 rounded text-blue-800 line-clamp-3">
            {m.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
