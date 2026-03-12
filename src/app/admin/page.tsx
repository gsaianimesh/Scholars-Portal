"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDateTime } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  Calendar,
  CheckSquare,
  Activity,
  UserCheck,
  TrendingUp,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProfessors: number;
  totalScholars: number;
  totalMeetings: number;
  totalTasks: number;
  totalActivities: number;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user: { name: string; email: string; role: string } | null;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRoleCounts(data.roleCounts);
        setRecentActivity(data.recentActivity);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading admin dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-destructive">Failed to load admin data</div>;
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Professors", value: stats.totalProfessors, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Scholars", value: stats.totalScholars, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50" },
    { label: "Meetings", value: stats.totalMeetings, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Tasks", value: stats.totalTasks, icon: CheckSquare, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Activity Logs", value: stats.totalActivities, icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">
          System-wide analytics and monitoring
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            User Distribution by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  role === 'professor' ? 'bg-purple-500' :
                  role === 'scholar' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-medium capitalize">{role.replace("_", " ")}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {log.user ? getInitials(log.user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {log.user && (
                        <span className="text-xs text-muted-foreground">
                          {log.user.name} ({log.user.email})
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {log.activity_type.replace(/_/g, " ")}
                      </Badge>
                      {log.user && (
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {log.user.role.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
