"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getInitials, formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";

export default function TaskDetailPage() {
  const params = useParams();
  const [task, setTask] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("");
  const [myAssignment, setMyAssignment] = useState<any>(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadTask() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (!appUser) return;

    setUserRole(appUser.role);

    const { data: taskData } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    setTask(taskData);

    const { data: assignData } = await supabase
      .from("task_assignments")
      .select("*, scholar:scholars(*, user:users(*))")
      .eq("task_id", params.id);
    setAssignments(assignData || []);

    if (appUser.role === "scholar") {
      const { data: scholar } = await supabase
        .from("scholars")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();
      if (scholar) {
        // We set the state but don't strictly need to read it elsewhere
        // Leaving it or ignoring it makes sense, or we can just remove the variable completely:
        // Removing `setScholar` since we don't use it.
        const mine = assignData?.find((a: any) => a.scholar_id === scholar.id);
        setMyAssignment(mine || null);
        if (mine) {
          setSubmissionLink(mine.submission_link || "");
          setSubmissionNotes(mine.notes || "");
        }
      }
    }

    setLoading(false);
  }

  async function updateMyStatus(status: string) {
    if (!myAssignment) return;
    await fetch(`/api/tasks/${params.id}/assignments/${myAssignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTask();
  }

  async function submitWork() {
    if (!myAssignment) return;
    if (!submissionLink.trim()) return;
    await fetch(`/api/tasks/${params.id}/assignments/${myAssignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "submitted",
        submissionLink,
        notes: submissionNotes,
      }),
    });
    loadTask();
  }

  async function reviewSubmission(assignmentId: string, submissionStatus: string, reviewNotes: string) {
    await fetch(`/api/tasks/${params.id}/assignments/${assignmentId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionStatus, reviewNotes }),
    });
    loadTask();
  }

  const getTaskStatus = () => {
    if (!assignments || assignments.length === 0) return task?.status || 'not_started';
    const allCompleted = assignments.every(a => a.status === 'completed');
    const allNotStarted = assignments.every(a => a.status === 'not_started');
    const allSubmittedOrCompleted = assignments.every(a => a.status === 'submitted' || a.status === 'completed');
    
    if (allNotStarted) return 'not_started';
    if (allCompleted) return 'completed';
    if (allSubmittedOrCompleted) return 'submitted';
    return 'in_progress';
  };

  const computedStatus = getTaskStatus();

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!task) {
    return <div className="text-center py-12 text-muted-foreground">Task not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge
              variant={
                computedStatus === "completed" || computedStatus === "submitted"
                  ? "success"
                  : computedStatus === "in_progress"
                  ? "info"
                  : "secondary"
              }
            >
              {computedStatus.replace("_", " ")}
            </Badge>
            {task.deadline && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Due {formatDate(task.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          {task.expected_output_format && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Expected Output</p>
              <p className="text-sm mt-1">{task.expected_output_format}</p>
            </div>
          )}
          {task.reference_links?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Reference Links</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {task.reference_links.map((link: string, i: number) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.length > 50 ? link.slice(0, 50) + "..." : link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scholar: My submission */}
      {userRole === "scholar" && myAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {myAssignment.status === "not_started" && (
                <Button size="sm" onClick={() => updateMyStatus("in_progress")}>
                  Start Working
                </Button>
              )}
              {myAssignment.status === "in_progress" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Submit Work
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Work</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Submission Link (Google Drive / GitHub)</Label>
                        <Input
                          type="url"
                          placeholder="https://drive.google.com/... or https://github.com/..."
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                        />
                        {submissionLink.trim() && !isValidUrl(submissionLink) && (
                          <p className="text-[10px] text-destructive">Please enter a valid URL including http:// or https://</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Any notes about your submission..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      {!submissionLink.trim() ? (
                        <div title="Please provide a submission link to submit">
                          <Button disabled>Submit</Button>
                        </div>
                      ) : !isValidUrl(submissionLink) ? (
                        <div title="Please provide a valid URL (e.g. https://...)">
                          <Button disabled>Submit</Button>
                        </div>
                      ) : (
                        <DialogClose asChild>
                          <Button onClick={submitWork}>Submit</Button>
                        </DialogClose>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {myAssignment.submission_link && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Submission Link</p>
                <a
                  href={myAssignment.submission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {myAssignment.submission_link}
                </a>
              </div>
            )}

            {myAssignment.submission_status && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Review Status</p>
                <Badge
                  variant={
                    myAssignment.submission_status === "approved"
                      ? "success"
                      : myAssignment.submission_status === "rejected"
                      ? "destructive"
                      : "warning"
                  }
                  className="mt-1"
                >
                  {myAssignment.submission_status.replace("_", " ")}
                </Badge>
                {myAssignment.review_notes && (
                  <p className="text-sm mt-2">{myAssignment.review_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professor: Assignments overview */}
      {userRole !== "scholar" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Assignments ({assignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    _taskId={task.id}
                    onReview={reviewSubmission}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AssignmentRow({
  assignment,
  _taskId,
  onReview,
}: {
  assignment: any;
  _taskId: string;
  onReview: (assignmentId: string, status: string, notes: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState("");

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(assignment.scholar?.user?.name || "?")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{assignment.scholar?.user?.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={
              assignment.status === "submitted"
                ? "warning"
                : assignment.status === "completed"
                ? "success"
                : assignment.status === "in_progress"
                ? "info"
                : "secondary"
            }
          >
            {assignment.status.replace("_", " ")}
          </Badge>
          {assignment.submission_status && (
            <Badge
              variant={
                assignment.submission_status === "approved"
                  ? "success"
                  : assignment.submission_status === "rejected"
                  ? "destructive"
                  : "warning"
              }
            >
              {assignment.submission_status.replace("_", " ")}
            </Badge>
          )}
        </div>
        {assignment.submission_link && (
          <a
            href={assignment.submission_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            View submission
          </a>
        )}
      </div>
      {(assignment.status === "submitted" && (!assignment.submission_status || assignment.submission_status === "pending")) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {assignment.submission_link && (
                <a
                  href={assignment.submission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {assignment.submission_link}
                </a>
              )}
              {assignment.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Scholar&apos;s Notes</p>
                  <p className="text-sm mt-1">{assignment.notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Feedback for the scholar..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button
                  variant="destructive"
                  onClick={() => onReview(assignment.id, "rejected", reviewNotes)}
                >
                  Reject
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => onReview(assignment.id, "revision_required", reviewNotes)}
                >
                  Request Revision
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  onClick={() => onReview(assignment.id, "approved", reviewNotes)}
                >
                  Approve
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
