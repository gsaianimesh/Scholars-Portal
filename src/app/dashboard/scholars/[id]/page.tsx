"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default function ScholarProfilePage() {
  const params = useParams();
  const [scholar, setScholar] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadScholar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadScholar() {
    const { data: scholarData } = await supabase
      .from("scholars")
      .select("*, user:users(*)")
      .eq("id", params.id)
      .maybeSingle();

    if (scholarData) {
      setScholar(scholarData);

      const [tasksRes, meetingsRes] = await Promise.all([
        supabase
          .from("task_assignments")
          .select("*, task:tasks(*)")
          .eq("scholar_id", scholarData.id)
          .order("task(created_at)", { ascending: false }),
        supabase
          .from("meeting_participants")
          .select("*, meeting:meetings(*)")
          .eq("user_id", scholarData.user_id)
          .order("meeting(meeting_date)", { ascending: false })
          .limit(10),
      ]);

      setTasks(tasksRes.data || []);
      setMeetings(meetingsRes.data?.filter((m: any) => m.meeting) || []);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!scholar) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Scholar not found</p>
      </div>
    );
  }

  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "submitted"
  );
  const completionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/scholars">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Scholar Profile</h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(scholar.user?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{scholar.user?.name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {scholar.user?.email}
                  </div>
                </div>
                <Badge
                  variant={scholar.status === "active" ? "success" : "secondary"}
                >
                  {scholar.status}
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Research Topic</p>
                  <p className="text-sm font-medium mt-1">
                    {scholar.research_topic || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joining Date</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(scholar.joining_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Task Completion</p>
                  <div className="mt-1">
                    <p className="text-sm font-medium">{completionRate}%</p>
                    <Progress value={completionRate} className="h-2 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({meetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No tasks assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((assignment: any) => (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{assignment.task?.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.task?.deadline
                          ? `Due ${formatDate(assignment.task.deadline)}`
                          : "No deadline"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        assignment.status === "completed" || assignment.status === "submitted"
                          ? "success"
                          : assignment.status === "in_progress"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {assignment.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No meetings attended yet</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((mp: any) => (
              <Link key={mp.id} href={`/dashboard/meetings/${mp.meeting?.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mp.meeting?.meeting_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(mp.meeting?.meeting_date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
