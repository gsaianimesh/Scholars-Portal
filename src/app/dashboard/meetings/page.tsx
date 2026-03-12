"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus, Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();
    if (!appUser) return;

    setUserRole(appUser.role);

    if (appUser.role === "scholar") {
      const { data } = await supabase
        .from("meeting_participants")
        .select("*, meeting:meetings(*)")
        .eq("user_id", appUser.id)
        .order("meeting(meeting_date)", { ascending: false });
      setMeetings(data?.map((mp: any) => mp.meeting).filter(Boolean) || []);
    } else {
      let professorId: string | null = null;

      const { data: prof } = await supabase
        .from("professors")
        .select("id")
        .eq("user_id", appUser.id)
        .single();
      professorId = prof?.id || null;

      if (!professorId) {
        const { data: coSup } = await supabase
          .from("co_supervisors")
          .select("professor_id")
          .eq("user_id", appUser.id)
          .single();
        professorId = coSup?.professor_id || null;
      }

      if (professorId) {
        const { data } = await supabase
          .from("meetings")
          .select("*")
          .eq("professor_id", professorId)
          .order("meeting_date", { ascending: false });
        setMeetings(data || []);
      }
    }
    setLoading(false);
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.meeting_date) >= now);
  const past = meetings.filter((m) => new Date(m.meeting_date) < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage research meetings</p>
        </div>
        {userRole !== "scholar" && (
          <Link href="/dashboard/meetings/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Schedule Meeting
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Past ({past.length})</h2>
              <div className="space-y-3">
                {past.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} isPast />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, isPast }: { meeting: any; isPast?: boolean }) {
  return (
    <Link href={`/dashboard/meetings/${meeting.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isPast ? "opacity-75" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{meeting.meeting_title}</p>
                {meeting.summary && <Badge variant="info">Summary available</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(meeting.meeting_date)}
                </span>
              </div>
              {meeting.agenda && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {meeting.agenda}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
