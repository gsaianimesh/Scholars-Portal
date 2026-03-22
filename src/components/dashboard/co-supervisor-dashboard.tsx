"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import {
  Users,
  CheckSquare,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface CoSupervisorDashboardProps {
  userId: string;
}

export function CoSupervisorDashboard({ userId }: CoSupervisorDashboardProps) {
  const [data, setData] = useState<any>({
    scholars: [],
    tasks: [],
    meetings: [],
    activity: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    const { data: coSup } = await supabase
      .from("co_supervisors")
      .select("professor_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!coSup) {
      setLoading(false);
      return;
    }

        // Fetch scholars first to filter activity
    const scholarsRes = await supabase
      .from("scholars")
      .select("*, user:users(*)")
      .eq("professor_id", coSup.professor_id)
      .eq("status", "active");

    const profRes = await supabase
      .from("professors")
      .select("user_id")
      .eq("id", coSup.professor_id)
      .maybeSingle();

    const scholarUserIds = (scholarsRes.data || []).map((s: any) => s.user_id).filter(Boolean);
    const [tasksRes, meetingsRes, activityRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("professor_id", coSup.professor_id)
        .in("status", ["not_started", "in_progress"])
        .limit(10),
      supabase
        .from("meetings")
        .select("*")
        .eq("professor_id", coSup.professor_id)
        .gte("meeting_date", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
        .order("meeting_date", { ascending: true })
        .limit(10),
      supabase
        .from("activity_logs")
        .select("*, user:users(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const nowTime = new Date().getTime();
    const activeMeetings = (meetingsRes.data || []).filter((m: any) => {
      if (m.status === "completed") return false;
      const startTime = new Date(m.meeting_date).getTime();
      const duration = m.duration_minutes || 60;
      return nowTime < (startTime + duration * 60 * 1000);
    }).slice(0, 5);

    setData({
      scholars: scholarsRes.data || [],
      tasks: tasksRes.data || [],
      meetings: activeMeetings,
      activity: activityRes.data || [],
    });
    setLoading(false);
  }

  if (loading) {
    return <LoadingState layout="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Co-Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Monitor scholars and assist supervision</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scholars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.scholars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.meetings.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scholars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Scholars</CardTitle>
              <Link href="/dashboard/scholars">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.scholars.map((scholar: any) => (
                <Link
                  key={scholar.id}
                  href={`/dashboard/scholars/${scholar.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(scholar.user?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{scholar.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{scholar.research_topic}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">{a.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.user?.name} · {formatDate(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
