"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus, Calendar, Clock, Video, List, ChevronLeft, ChevronRight, Brain } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fathomConnected, setFathomConnected] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date());
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
      .maybeSingle();
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
        .select("id, fathom_api_key, fathom_access_token")
        .eq("user_id", appUser.id)
        .maybeSingle();
      professorId = prof?.id || null;
      if (prof) {
        setFathomConnected(!!prof.fathom_api_key || !!prof.fathom_access_token);
      }

      if (!professorId) {
        const { data: coSup } = await supabase
          .from("co_supervisors")
          .select("professor_id")
          .eq("user_id", appUser.id)
          .maybeSingle();
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
  
  const isPastMeeting = (m: any) => {
    if (m.status === "completed") return true;
    const startTime = new Date(m.meeting_date).getTime();
    const duration = m.duration_minutes || 60;
    const endTime = startTime + duration * 60 * 1000;
    return now.getTime() >= endTime;
  };

  const upcoming = meetings.filter((m) => !isPastMeeting(m));
  const past = meetings.filter((m) => isPastMeeting(m));

  return (
    <div className="space-y-6">
      {!fathomConnected && userRole === "professor" && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
               <Brain className="w-4 h-4" /> Connect Fathom AI
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Automate your workflow. Connect Fathom to get your meeting transcripts, summaries, and action assignments tracked here automatically.
            </p>
          </div>
          <Button 
            size="sm" 
            className="shrink-0 whitespace-nowrap"
            onClick={() => { window.location.href = '/api/auth/fathom/login?returnTo=/dashboard/meetings' }}
          >
            Connect Fathom
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage research meetings</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
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
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : view === "list" ? (
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
      ) : (
        <CalendarView
          meetings={meetings}
          month={calMonth}
          onMonthChange={setCalMonth}
        />
      )}
    </div>
  );
}

/* ---------- Calendar View ---------- */

function CalendarView({
  meetings,
  month,
  onMonthChange,
}: {
  meetings: any[];
  month: Date;
  onMonthChange: (d: Date) => void;
}) {
  const year = month.getFullYear();
  const mo = month.getMonth();

  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, mo, 1).getDay(); // 0=Sun

  // Build map: day number => meetings
  const meetingsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const m of meetings) {
      const d = new Date(m.meeting_date);
      if (d.getFullYear() === year && d.getMonth() === mo) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(m);
      }
    }
    return map;
  }, [meetings, year, mo]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === mo;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function prevMonth() {
    onMonthChange(new Date(year, mo - 1, 1));
  }
  function nextMonth() {
    onMonthChange(new Date(year, mo + 1, 1));
  }
  function goToday() {
    onMonthChange(new Date());
  }

  // Cells: leading blanks + day cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {monthNames[mo]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 bg-muted">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium py-2 text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday = isCurrentMonth && day === today.getDate();
            const dayMeetings = day ? meetingsByDay[day] || [] : [];

            return (
              <div
                key={i}
                className={`min-h-[100px] border-t border-l p-1.5 ${
                  day ? "bg-background" : "bg-muted/30"
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`inline-flex items-center justify-center text-xs w-6 h-6 rounded-full ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayMeetings.slice(0, 3).map((m: any) => (
                        <Link
                          key={m.id}
                          href={`/dashboard/meetings/${m.id}`}
                          className="block text-[11px] leading-tight truncate rounded px-1 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {new Date(m.meeting_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {m.meeting_title}
                        </Link>
                      ))}
                      {dayMeetings.length > 3 && (
                        <span className="block text-[10px] text-muted-foreground px-1">
                          +{dayMeetings.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Meeting Card ---------- */

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
                {meeting.meeting_link && (
                  <Badge variant="secondary" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    {meeting.meeting_link.includes("meet.google") ? "Google Meet" : "Video"}
                  </Badge>
                )}
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
