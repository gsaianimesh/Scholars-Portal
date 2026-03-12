"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate, formatDateTime } from "@/lib/utils";
import {
  Users,
  CheckSquare,
  FileText,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface ProfessorDashboardProps {
  userId: string;
}

interface DashboardData {
  scholarCount: number;
  pendingTasks: number;
  pendingSubmissions: number;
  upcomingMeetings: any[];
  recentActivity: any[];
  scholars: any[];
}

export function ProfessorDashboard({ userId }: ProfessorDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    scholarCount: 0,
    pendingTasks: 0,
    pendingSubmissions: 0,
    upcomingMeetings: [],
    recentActivity: [],
    scholars: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    // Get professor record
    const { data: prof } = await supabase
      .from("professors")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!prof) {
      setLoading(false);
      return;
    }

    // Parallel data fetches
    const [scholarsRes, tasksRes, assignmentsRes, meetingsRes, activityRes] =
      await Promise.all([
        supabase
          .from("scholars")
          .select("*, user:users(*)")
          .eq("professor_id", prof.id)
          .eq("status", "active"),
        supabase
          .from("tasks")
          .select("*")
          .eq("professor_id", prof.id)
          .in("status", ["not_started", "in_progress"]),
        supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .eq("submission_status", "pending"),
        supabase
          .from("meetings")
          .select("*")
          .eq("professor_id", prof.id)
          .gte("meeting_date", new Date().toISOString())
          .order("meeting_date", { ascending: true })
          .limit(5),
        supabase
          .from("activity_logs")
          .select("*, user:users(*)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    setData({
      scholarCount: scholarsRes.data?.length || 0,
      pendingTasks: tasksRes.data?.length || 0,
      pendingSubmissions: assignmentsRes.data?.length || 0,
      upcomingMeetings: meetingsRes.data || [],
      recentActivity: activityRes.data || [],
      scholars: scholarsRes.data || [],
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your research supervision
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/tasks/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </Link>
          <Link href="/dashboard/meetings/new">
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scholars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.scholarCount}</div>
            <p className="text-xs text-muted-foreground">Active scholars</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingMeetings.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            {data.upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {meeting.meeting_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(meeting.meeting_date)}
                      </p>
                    </div>
                    <Link href={`/dashboard/meetings/${meeting.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scholar Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Scholar Progress</CardTitle>
              <Link href="/dashboard/scholars">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.scholars.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  No scholars added yet
                </p>
                <Link href="/dashboard/scholars/add">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Scholar
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.scholars.slice(0, 5).map((scholar: any) => (
                  <Link
                    key={scholar.id}
                    href={`/dashboard/scholars/${scholar.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(scholar.user?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {scholar.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {scholar.research_topic || "No topic set"}
                      </p>
                    </div>
                    <Badge variant="success" className="text-xs">
                      Active
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 mt-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user?.name} · {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
