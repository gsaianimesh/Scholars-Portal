"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Clock } from "lucide-react";
import { LoadingState } from "@/components/loading-screen";
import Link from "next/link";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTasks() {
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
      // Scholar sees their assignments
      const { data: scholar } = await supabase
        .from("scholars")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();

      if (scholar) {
        const { data } = await supabase
          .from("task_assignments")
          .select("*, task:tasks(*)")
          .eq("scholar_id", scholar.id)
          .order("task(created_at)", { ascending: false });
        setAssignments(data || []);
      }
    } else {
      // Professor/co-supervisor sees all tasks
      const { data: prof } = await supabase
        .from("professors")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();

      let professorId = prof?.id;

      if (!professorId) {
        const { data: coSup } = await supabase
          .from("co_supervisors")
          .select("professor_id")
          .eq("user_id", appUser.id)
          .maybeSingle();
        professorId = coSup?.professor_id;
      }

      if (professorId) {
        const { data } = await supabase
          .from("tasks")
          .select("*, assignments:task_assignments(*, scholar:scholars(*, user:users(*)))")
          .eq("professor_id", professorId)
          .order("created_at", { ascending: false });
        setTasks(data || []);
      }
    }
    setLoading(false);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": case "submitted": return "success" as const;
      case "in_progress": return "info" as const;
      case "not_started": return "secondary" as const;
      default: return "secondary" as const;
    }
  };

  const getTaskStatus = (task: any) => {
    if (!task.assignments || task.assignments.length === 0) return task.status;
    const allCompleted = task.assignments.every((a: any) => a.status === 'completed');
    const allNotStarted = task.assignments.every((a: any) => a.status === 'not_started');
    const allSubmittedOrCompleted = task.assignments.every((a: any) => a.status === 'submitted' || a.status === 'completed');
    
    if (allNotStarted) return 'not_started';
    if (allCompleted) return 'completed';
    if (allSubmittedOrCompleted) return 'submitted';
    return 'in_progress';
  };

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAssignments = assignments.filter((a) =>
    a.task?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingState layout="list" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {userRole === "scholar" ? "My Tasks" : "Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {userRole === "scholar"
              ? "View and manage your assigned tasks"
              : "Create and manage research tasks"}
          </p>
        </div>
        {userRole !== "scholar" && (
          <Link href="/dashboard/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Task
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {userRole === "scholar" ? (
        // Scholar view
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3 mt-4">
            {filteredAssignments
              .filter((a) => a.status !== "completed" && a.status !== "submitted")
              .map((assignment) => (
                <Link key={assignment.id} href={`/dashboard/tasks/${assignment.task_id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium truncate">{assignment.task?.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {assignment.task?.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {assignment.task?.deadline
                                ? `Due ${formatDate(assignment.task.deadline)}`
                                : "No deadline"}
                            </span>
                          </div>
                        </div>
                        <Badge variant={statusVariant(assignment.status)}>
                          {assignment.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3 mt-4">
            {filteredAssignments
              .filter((a) => a.status === "completed" || a.status === "submitted")
              .map((assignment) => (
                <Link key={assignment.id} href={`/dashboard/tasks/${assignment.task_id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.task?.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {assignment.submitted_at && `Submitted ${formatDate(assignment.submitted_at)}`}
                          </p>
                        </div>
                        <Badge variant="success">
                          {assignment.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredAssignments.map((assignment) => (
              <Link key={assignment.id} href={`/dashboard/tasks/${assignment.task_id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{assignment.task?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assignment.task?.deadline
                            ? `Due ${formatDate(assignment.task.deadline)}`
                            : "No deadline"}
                        </p>
                      </div>
                      <Badge variant={statusVariant(assignment.status)}>
                        {assignment.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        // Professor/Co-supervisor view
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No tasks created yet</p>
                <Link href="/dashboard/tasks/new">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Create your first task
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{task.title}</p>
                          <Badge variant={statusVariant(getTaskStatus(task))}>
                            {getTaskStatus(task).replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {task.assignments?.length || 0} assigned
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Due {formatDate(task.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
