"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface ScholarDashboardProps {
  userId: string;
}

const statusColors: Record<string, string> = {
  not_started: "secondary",
  in_progress: "info",
  completed: "success",
  submitted: "warning",
};

export function ScholarDashboard({ userId }: ScholarDashboardProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    // Get scholar record
    const { data: scholar } = await supabase
      .from("scholars")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!scholar) {
      setLoading(false);
      return;
    }

    const [tasksRes, meetingsRes, submissionsRes] = await Promise.all([
      supabase
        .from("task_assignments")
        .select("*, task:tasks(*)")
        .eq("scholar_id", scholar.id)
        .order("task(deadline)", { ascending: true }),
      supabase
        .from("meeting_participants")
        .select("*, meeting:meetings(*)")
        .eq("user_id", userId)
        .gte("meeting.meeting_date", new Date().toISOString())
        .order("meeting(meeting_date)", { ascending: true })
        .limit(5),
      supabase
        .from("task_assignments")
        .select("*, task:tasks(*)")
        .eq("scholar_id", scholar.id)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(5),
    ]);

    setTasks(tasksRes.data || []);
    setMeetings(meetingsRes.data?.filter((m: any) => m.meeting) || []);
    setSubmissions(submissionsRes.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const activeTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "submitted"
  );
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "submitted"
  );
  const completionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Track your tasks, meetings, and submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks to complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Tasks</CardTitle>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tasks</p>
            ) : (
              <div className="space-y-3">
                {activeTasks.slice(0, 5).map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {assignment.task?.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {assignment.task?.deadline
                            ? `Due ${formatDate(assignment.task.deadline)}`
                            : "No deadline"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        (statusColors[assignment.status] as any) || "secondary"
                      }
                    >
                      {assignment.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Meetings</CardTitle>
              <Link href="/dashboard/meetings">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((mp: any) => (
                  <div
                    key={mp.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {mp.meeting?.meeting_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(mp.meeting?.meeting_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Submissions</CardTitle>
            <Link href="/dashboard/submissions">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {sub.task?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(sub.submitted_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      sub.submission_status === "approved"
                        ? "success"
                        : sub.submission_status === "rejected"
                        ? "destructive"
                        : sub.submission_status === "revision_required"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {(sub.submission_status || "pending").replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
