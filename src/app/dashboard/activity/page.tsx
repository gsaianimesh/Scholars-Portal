"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDateTime } from "@/lib/utils";
import {
  CheckSquare,
  FileText,
  Calendar,
  Users,
  Brain,
  Upload,
  MessageSquare,
} from "lucide-react";
import { LoadingState } from "@/components/loading-screen";

const activityIcons: Record<string, any> = {
  task_created: CheckSquare,
  task_submitted: Upload,
  task_completed: CheckSquare,
  submission_reviewed: FileText,
  meeting_scheduled: Calendar,
  meeting_summary_generated: Brain,
  scholar_added: Users,
  default: MessageSquare,
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get the current user profile from users table
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role, is_admin')
      .eq('auth_id', user.id)
      .single();

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("activity_logs")
      .select("*, user:users(*)")
      .eq('user_id', currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setLogs(data || []);
    setLoading(false);
  }

  if (loading) {
    return <LoadingState layout="list" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">Track all system events and actions</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity recorded yet
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {logs.map((log) => {
                  const Icon = activityIcons[log.activity_type] || activityIcons.default;
                  return (
                    <div key={log.id} className="flex gap-4 relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted z-10">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {log.user && (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(log.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {log.user.name}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(log.created_at)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {log.activity_type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
