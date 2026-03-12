"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
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
      const { data: scholar } = await supabase
        .from("scholars")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();
      if (scholar) {
        const { data } = await supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .eq("scholar_id", scholar.id)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false });
        setSubmissions(data || []);
      }
    } else {
      let professorId: string | null = null;
      const { data: prof } = await supabase
        .from("professors")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();
      professorId = prof?.id || null;

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
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .in("status", ["submitted"])
          .order("submitted_at", { ascending: false });
        setSubmissions(data || []);
      }
    }
    setLoading(false);
  }

  const pending = submissions.filter((s) => !s.submission_status || s.submission_status === "pending");
  const reviewed = submissions.filter((s) => s.submission_status && s.submission_status !== "pending");

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {userRole === "scholar" ? "My Submissions" : "Submissions"}
        </h1>
        <p className="text-muted-foreground">Review and manage task submissions</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pending.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-sm text-muted-foreground">No pending submissions</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((sub) => <SubmissionCard key={sub.id} submission={sub} />)
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-3 mt-4">
          {reviewed.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-sm text-muted-foreground">No reviewed submissions</p>
              </CardContent>
            </Card>
          ) : (
            reviewed.map((sub) => <SubmissionCard key={sub.id} submission={sub} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: any }) {
  return (
    <Link href={`/dashboard/tasks/${submission.task_id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(submission.scholar?.user?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{submission.task?.title}</p>
                {submission.submission_status && (
                  <Badge
                    variant={
                      submission.submission_status === "approved"
                        ? "success"
                        : submission.submission_status === "rejected"
                        ? "destructive"
                        : submission.submission_status === "revision_required"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {submission.submission_status.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {submission.scholar?.user?.name} · Submitted {formatDate(submission.submitted_at)}
              </p>
              {submission.submission_link && (
                <span className="flex items-center gap-1 text-xs text-primary mt-1">
                  <ExternalLink className="h-3 w-3" />
                  {submission.submission_link.slice(0, 50)}...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
