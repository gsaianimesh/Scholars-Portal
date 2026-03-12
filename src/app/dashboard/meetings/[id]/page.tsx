"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatDateTime, formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, Video, FileText, Users, Brain, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MeetingDetailPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [preMeetingContext, setPreMeetingContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadMeeting();
  }, [params.id]);

  async function loadMeeting() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (appUser) setUserRole(appUser.role);

    const [meetingRes, participantsRes, actionItemsRes] = await Promise.all([
      supabase.from("meetings").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("meeting_participants")
        .select("*, user:users(*)")
        .eq("meeting_id", params.id),
      supabase
        .from("action_items")
        .select("*, assigned_user:users(*)")
        .eq("meeting_id", params.id),
    ]);

    setMeeting(meetingRes.data);
    setParticipants(participantsRes.data || []);
    setActionItems(actionItemsRes.data || []);

    // Load pre-meeting context
    if (meetingRes.data) {
      const res = await fetch(`/api/meetings/${params.id}/context`);
      if (res.ok) {
        const context = await res.json();
        setPreMeetingContext(context);
      }
    }

    setLoading(false);
  }

  async function generateSummary() {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`/api/meetings/${params.id}/summarize`, {
        method: "POST",
      });
      if (res.ok) {
        loadMeeting();
      }
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function fetchTranscript() {
    const res = await fetch(`/api/meetings/${params.id}/transcript`, {
      method: "POST",
    });
    if (res.ok) {
      loadMeeting();
    }
  }

  async function toggleActionItem(itemId: string, currentStatus: string) {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    await supabase
      .from("action_items")
      .update({ status: newStatus })
      .eq("id", itemId);
    loadMeeting();
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!meeting) {
    return <div className="text-center py-12 text-muted-foreground">Meeting not found</div>;
  }

  const isPast = new Date(meeting.meeting_date) < new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/meetings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{meeting.meeting_title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(meeting.meeting_date)}
            </span>
            {isPast ? (
              <Badge variant="secondary">Past</Badge>
            ) : (
              <Badge variant="info">Upcoming</Badge>
            )}
          </div>
        </div>
        {meeting.meeting_link && (
          <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Video className="h-4 w-4 mr-1" />
              Join Meeting
            </Button>
          </a>
        )}
      </div>

      {/* Pre-meeting context (for upcoming meetings) */}
      {!isPast && preMeetingContext && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Pre-Meeting Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preMeetingContext.lastMeetingSummary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Last Meeting Summary</p>
                <p className="text-sm mt-1">{preMeetingContext.lastMeetingSummary}</p>
              </div>
            )}
            {preMeetingContext.pendingTasks?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Tasks</p>
                <ul className="mt-1 space-y-1">
                  {preMeetingContext.pendingTasks.map((task: any) => (
                    <li key={task.id} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {task.title} — due {task.deadline ? formatDate(task.deadline) : "no deadline"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {preMeetingContext.recentSubmissions?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Recent Submissions</p>
                <ul className="mt-1 space-y-1">
                  {preMeetingContext.recentSubmissions.map((sub: any) => (
                    <li key={sub.id} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {sub.scholar_name} submitted &quot;{sub.task_title}&quot;
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
          {meeting.summary && <TabsTrigger value="summary">Summary</TabsTrigger>}
          {meeting.transcript && <TabsTrigger value="transcript">Transcript</TabsTrigger>}
          <TabsTrigger value="actions">Action Items ({actionItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              {meeting.agenda && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Agenda</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{meeting.agenda}</p>
                </div>
              )}

              {isPast && userRole !== "scholar" && (
                <Separator />
              )}

              {isPast && userRole !== "scholar" && (
                <div className="flex gap-2">
                  {!meeting.transcript && meeting.fathom_meeting_id && (
                    <Button variant="outline" size="sm" onClick={fetchTranscript}>
                      <FileText className="h-4 w-4 mr-1" />
                      Fetch Transcript
                    </Button>
                  )}
                  {meeting.transcript && !meeting.summary && (
                    <Button
                      size="sm"
                      onClick={generateSummary}
                      disabled={generatingSummary}
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      {generatingSummary ? "Generating..." : "Generate AI Summary"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(p.user?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.user?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {meeting.summary && (
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {meeting.summary}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {meeting.transcript && (
          <TabsContent value="transcript" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                  {meeting.transcript}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No action items yet</p>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <button
                        onClick={() => toggleActionItem(item.id, item.status)}
                        className="mt-0.5"
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${
                            item.status === "completed"
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Assigned to: {item.assigned_user?.name || "Unknown"}
                          </span>
                          {item.deadline && (
                            <span className="text-xs text-muted-foreground">
                              · Due {formatDate(item.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
