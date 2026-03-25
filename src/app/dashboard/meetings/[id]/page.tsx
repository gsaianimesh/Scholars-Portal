"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getInitials, formatDateTime, formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, Video, FileText, Users, Brain, CheckCircle, XCircle, CalendarClock, Clock } from "lucide-react";
import { LoadingState } from "@/components/loading-screen";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function MeetingDetailPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [preMeetingContext, setPreMeetingContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [fathomError, setFathomError] = useState("");
  const [fathomConnected, setFathomConnected] = useState(true);
  const [autoTasks, setAutoTasks] = useState<any[]>([]);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [actionItemsGenerated, setActionItemsGenerated] = useState(false);
  
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [manualText, setManualText] = useState("");
  const [processingManual, setProcessingManual] = useState(false);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  // Confirmation dialog states
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showRemoveTaskConfirm, setShowRemoveTaskConfirm] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadMeeting();

    // Auto-refresh if we're waiting for Fathom transcript (polling every 10 seconds)
    const intervalId = setInterval(() => {
      // Only poll if we don't already have the transcript in the frontend state
      setMeeting((current: any) => {
        if (!current?.transcript && new Date(current?.meeting_date || Date.now()) < new Date()) {
          // It's a past meeting missing a transcript, poll for it
          supabase.from("meetings").select("transcript, summary").eq("id", params.id).maybeSingle()
            .then(({ data }) => {
              if (data && data.transcript) {
                loadMeeting(false); // Reload full data in background
              }
            });
        }
        return current;
      });
    }, 10000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadMeeting(showLoading = true) {
    if (showLoading) setLoading(true);

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
        .from("tasks")
        .select("*, task_assignments(scholar:scholars(user:users(name)))")
        .eq("meeting_id", params.id),
    ]);

    setMeeting(meetingRes.data);
    setParticipants(participantsRes.data || []);
    setActionItems(actionItemsRes.data || []);

    if (appUser && appUser.role === 'professor') {
       const { data: profData } = await supabase.from('professors').select('fathom_api_key, fathom_access_token').eq('user_id', appUser.id).maybeSingle();
       if (profData) {
          const hasFathom = !!profData.fathom_api_key || !!profData.fathom_access_token;
          setFathomConnected(hasFathom);
       }
    }

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
    setActionItemsGenerated(false);
    try {
      const res = await fetch(`/api/meetings/${params.id}/summarize`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
          setActionItemsGenerated(true);
        }
        loadMeeting();
      }
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function fetchTranscript() {
    setFathomError("");
    setFetchingTranscript(true);
    setActionItemsGenerated(false);
    try {
      const res = await fetch(`/api/meetings/${params.id}/transcript`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
          setActionItemsGenerated(true);
        }
        loadMeeting();
      } else {
        const data = await res.json();
        setFathomError(data.error || "Failed to fetch transcript");
      }
    } catch (err: any) {
      setFathomError(err.message || "Failed to fetch transcript");
    } finally {
      setFetchingTranscript(false);
    }
  }

  async function deleteAutoTask(taskId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) {
      setAutoTasks(autoTasks.filter(t => t.id !== taskId));
    }
  }

  async function submitManualTranscript() {
    if (!manualText.trim()) return;
    setProcessingManual(true);
    setFathomError("");
    setActionItemsGenerated(false);
    try {
      const res = await fetch(`/api/meetings/${params.id}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualTranscript: manualText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
          setActionItemsGenerated(true);
        }
        setShowManualUpload(false);
        setManualText("");
        loadMeeting();
      } else {
        const data = await res.json();
        setFathomError(data.error || "Failed to process manual transcript");
      }
    } catch (err: any) {
      setFathomError(err.message || "Failed to process transcript");
    } finally {
      setProcessingManual(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskAssignee) return;
    
    const { data: scholar } = await supabase.from("scholars").select("id").eq("user_id", newTaskAssignee).maybeSingle();
    const scholarIds: string[] = [];
    if (scholar) {
      scholarIds.push(scholar.id);
    }
    
    if (scholarIds.length === 0) {
      alert("Invalid assignee");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          scholarIds,
          meetingId: params.id,
          deadline: newTaskDeadline || undefined,
        }),
      });
      if (res.ok) {
        setIsAddingTask(false);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskAssignee("");
        setNewTaskDeadline("");
        loadMeeting();
      } else {
         const errData = await res.json();
         alert("Failed to create task: " + errData.error);
      }
    } catch (e) {
      alert("Error adding task");
    }
  }

  async function toggleActionItem(itemId: string, currentStatus: string) {
    const newStatus = currentStatus !== "completed" ? "completed" : "not_started";
    await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", itemId);
    loadMeeting();
  }

  async function removeActionItem(itemId: string) {
    try {
      const res = await fetch(`/api/tasks/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        setActionItems(actionItems.filter(t => t.id !== itemId));
      } else {
        const data = await res.json();
        alert("Failed to delete task: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to delete task");
    }
    setTaskToRemove(null);
    setShowRemoveTaskConfirm(false);
  }

  async function cancelMeeting() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/meetings/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/meetings");
        router.refresh();
      }
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  async function markCompleted() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setMeeting({ ...meeting, status: "completed" });
        router.refresh();
      }
    } finally {
      setCompleting(false);
      setShowCompleteConfirm(false);
    }
  }

  async function rescheduleMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    setRescheduling(true);
    try {
      // Create date object explicitly from local parts to avoid browser parsing ambiguity
      // "2024-03-14T21:18" -> [2024, 03, 14, 21, 18]
      const [y, m, d, h, min] = newDate.split(/[-T:]/).map(Number);
      const localDate = new Date(y, m - 1, d, h, min);
      
      const isoDate = localDate.toISOString();
      console.log("Rescheduling to:", { input: newDate, local: localDate.toString(), iso: isoDate });
      
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: isoDate }),
      });
      if (res.ok) {
        setShowReschedule(false);
        setNewDate("");
        loadMeeting();
      }
    } finally {
      setRescheduling(false);
    }
  }

  function getParsedSummary(rawSummary: string): string {
    if (!rawSummary) return "";
    
    // First, check if it's strictly a JSON string (like Fathom webhook sometimes returns directly)
    if (rawSummary.startsWith("{") && rawSummary.endsWith("}")) {
      try {
        const parsed = JSON.parse(rawSummary);
        if (parsed.markdown_formatted) return parsed.markdown_formatted;
        if (parsed.summary) return parsed.summary;
        if (parsed.text) return parsed.text;
      } catch (e) {
        // If JSON.parse fails, just fall back to raw
      }
    }
    
    return rawSummary;
  }

  if (loading) {
    return <LoadingState layout="dashboard" />;
  }

  if (!meeting) {
    return <div className="text-center py-12 text-muted-foreground">Meeting not found</div>;
  }

  const now = new Date().getTime();
  const startTime = new Date(meeting.meeting_date).getTime();
  const duration = meeting.duration_minutes || 60;
  const isPast = meeting.status === "completed" || now >= (startTime + duration * 60 * 1000);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/meetings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Meetings
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{meeting.meeting_title}</h1>
              {isPast ? (
                <Badge variant="secondary">Past</Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none">Upcoming</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(meeting.meeting_date)}</span>
              <span className="text-muted-foreground/30">•</span>
              <Clock className="h-4 w-4" />
              <span>{meeting.duration_minutes || 60} min</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {meeting.meeting_link ? (
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Video className="h-4 w-4 mr-1" />
                  Join Meeting
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline">
                <Video className="h-4 w-4 mr-1" />
                Join (No Link Added)
              </Button>
            )}
            {!isPast && userRole !== "scholar" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowCompleteConfirm(true)} disabled={completing}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {completing ? "Completing..." : "Mark Done"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowReschedule(true)}>
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {cancelling ? "Cancelling..." : "Cancel"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
            <DialogDescription>Pick a new date and time for this meeting.</DialogDescription>
          </DialogHeader>
          <form onSubmit={rescheduleMeeting} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newDate">New Date & Time</Label>
              <Input
                id="newDate"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowReschedule(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={rescheduling}>
                {rescheduling ? "Rescheduling..." : "Reschedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this meeting? This action cannot be undone and all participants will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={cancelMeeting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelling ? "Cancelling..." : "Yes, cancel meeting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Complete Confirmation */}
      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Meeting as Complete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this meeting as completed? This will move it to your past meetings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markCompleted}>
              {completing ? "Completing..." : "Yes, mark complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Task Confirmation */}
      <AlertDialog open={showRemoveTaskConfirm} onOpenChange={setShowRemoveTaskConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToRemove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToRemove && removeActionItem(taskToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, remove task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-Created Tasks Dialog */}
      <Dialog open={autoTasks.length > 0} onOpenChange={(open) => { if (!open) setAutoTasks([]); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Lumi Generated Action Items!
            </DialogTitle>
            <DialogDescription>
              Based on the transcript, Lumi AI has created the following tasks and assigned them. You can delete any that aren&apos;t needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {autoTasks.map((t) => (
              <div key={t.id} className="p-3 border rounded-md relative group flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">{t.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p><strong>Deadline:</strong> {t.deadline ? formatDate(t.deadline) : "Not estimated"}</p>
                    <p><strong>Assigned to:</strong> {t.assignees || "Unassigned"}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive h-8 w-8 p-0"
                  onClick={() => deleteAutoTask(t.id)}
                  title="Delete Task"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setAutoTasks([])}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-meeting context (for upcoming meetings) */}
      {!isPast && preMeetingContext && (
        <Card className="border-primary/20 bg-primary/5 shadow-md">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Pre-Meeting Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {preMeetingContext.insights && (
              <div className="pb-5 border-b border-primary/10">
                <div className="flex items-center gap-2 text-primary font-semibold mb-3">
                  <span>Suggested Meeting Agenda</span>
                </div>
                {preMeetingContext.insights.briefSummary && (
                  <p className="text-sm mb-4 text-muted-foreground leading-relaxed">
                    {preMeetingContext.insights.briefSummary}
                  </p>
                )}
                {preMeetingContext.insights.talkingPoints?.length > 0 && (
                  <div className="bg-background/50 rounded-lg p-4 border border-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Discussion Topics</p>
                    <ul className="space-y-3">
                      {preMeetingContext.insights.talkingPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-foreground/90 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {preMeetingContext.lastMeetingSummary ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Last Meeting Summary</p>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-background/50 border border-primary/5">
                  <ReactMarkdown>
                    {getParsedSummary(preMeetingContext.lastMeetingSummary)}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Last Meeting Summary</p>
                <p className="text-sm text-muted-foreground italic p-4 rounded-lg bg-background/50 border border-primary/5">
                  No chronological previous meeting summary found.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preMeetingContext.pendingTasks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pending Tasks</p>
                  <ul className="space-y-2">
                    {preMeetingContext.pendingTasks.map((task: any) => (
                      <li key={task.id} className="text-sm flex items-center p-2 rounded-md bg-background/50 border border-primary/5 gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {preMeetingContext.recentSubmissions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Submissions</p>
                  <ul className="space-y-2">
                    {preMeetingContext.recentSubmissions.map((sub: any) => (
                      <li key={sub.id} className="text-sm flex items-center p-2 rounded-md bg-background/50 border border-primary/5 gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="truncate">{sub.scholar_name} submitted &quot;{sub.task_title}&quot;</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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

              {isPast && userRole !== "scholar" && !meeting.transcript && !fathomConnected && (
                <div className="mt-2 mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                     <Brain className="w-4 h-4" /> Connect Fathom for AI Transcripts
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Connect Fathom so Lumi can automatically process your meeting summaries, action items, and task assignments.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-1" 
                    onClick={() => { window.location.href = '/api/auth/fathom/login?returnTo=/dashboard/meetings/' + params.id }}
                  >
                    Connect Fathom
                  </Button>
                </div>
              )}
              {isPast && userRole !== "scholar" && (
                <div className="flex flex-col gap-2">
                  {/* Loading Overlay for Fetching Transcript */}
                  {fetchingTranscript && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-primary">Fetching data from Fathom...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment. We&apos;ll generate action items automatically.</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {actionItemsGenerated && !fetchingTranscript && !generatingSummary && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Action items generated successfully!</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Check the &quot;Action Items&quot; tab to review and manage them.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActionItemsGenerated(false)} className="ml-auto">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center flex-wrap">
                    {!meeting.transcript && !fetchingTranscript && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          Waiting for Fathom...
                        </div>
                        <Button size="sm" variant="outline" onClick={fetchTranscript} disabled={fetchingTranscript}>
                          Fetch Manually
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setShowManualUpload(!showManualUpload)}>
                          Manual Transcript
                        </Button>
                      </>
                    )}
                  {showManualUpload && !meeting.transcript && (
                    <div className="mt-4 flex flex-col gap-2">
                       <p className="text-sm text-muted-foreground font-medium">Paste Meeting Transcript</p>
                       <textarea 
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          className="w-full h-40 p-3 text-sm border rounded-md"
                          placeholder="Paste transcript or minutes here to generate summary & tasks..."
                       />
                       <Button size="sm" onClick={submitManualTranscript} disabled={processingManual}>
                          {processingManual ? "Processing..." : "Generate AI Summary & Tasks"}
                       </Button>
                    </div>
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
                  {fathomError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex flex-col gap-1">
                      <p>{fathomError}</p>
                      {fathomError.includes("API Key") && (
                        <Link href="/dashboard/settings" className="underline font-medium hover:text-destructive/80">
                          Go to Settings to configure Fathom API Key
                        </Link>
                      )}
                    </div>
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
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {getParsedSummary(meeting.summary)}
                  </ReactMarkdown>
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
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Meeting Tasks</h3>
                {userRole !== "scholar" && (
                  <Button size="sm" onClick={() => setIsAddingTask(!isAddingTask)}>
                    {isAddingTask ? "Cancel" : "Add Task"}
                  </Button>
                )}
              </div>

              {isAddingTask && (
                <form onSubmit={handleAddTask} className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <div className="space-y-1">
                    <Label htmlFor="taskTitle">Task Title</Label>
                    <Input id="taskTitle" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required placeholder="Quick description..." />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="taskDesc">Details (Optional)</Label>
                    <textarea id="taskDesc" className="w-full text-sm p-2 border rounded-md" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="taskAssignee">Assign To</Label>
                      <select id="taskAssignee" className="w-full text-sm p-2 border rounded-md" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} required>
                        <option value="" disabled>Select scholar...</option>
                        {participants.filter(p => p.user?.role === "scholar").map(p => (
                           <option key={p.user_id} value={p.user_id}>{p.user?.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taskDeadline">Due Date (Optional)</Label>
                      <Input id="taskDeadline" type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" size="sm">Create Task</Button>
                </form>
              )}

              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks have been created yet.</p>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => {
                    const assigneeName = item.task_assignments?.[0]?.scholar?.user?.name || "Unknown";
                    return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border group"
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
                        <div className="flex items-center gap-2">
                           <p className={`text-sm font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                             {item.title}
                           </p>
                           {item.is_auto_generated && (
                             <span className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 px-2 py-0.5 rounded-full">Lumi-generated</span>
                           )}
                        </div>
                        {item.description && (
                           <p className={`text-xs mt-1 ${item.status === "completed" ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                              {item.description}
                           </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              Assigned to: {assigneeName}
                            </span>
                            {item.deadline && (
                              <span className="text-xs text-muted-foreground">
                                · Due {formatDate(item.deadline)}
                              </span>
                            )}
                          </div>
                          {userRole !== "scholar" && (
                            <button
                              onClick={() => {
                                setTaskToRemove(item.id);
                                setShowRemoveTaskConfirm(true);
                              }}
                              className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
