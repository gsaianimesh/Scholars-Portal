"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials, formatDateTime } from "@/lib/utils";
import { LoadingState } from "@/components/loading-screen";
import {
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  FileText,
  Calendar,
  Users,
  Brain,
  Upload,
  MessageSquare,
} from "lucide-react";

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

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
  user: { name: string; email: string; role: string } | null;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadLogs();
  }, [page, typeFilter]);

  async function loadLogs() {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(page * pageSize),
    });
    if (typeFilter !== "all") {
      params.set("type", typeFilter);
    }

    const res = await fetch(`/api/admin/activity?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setActivityTypes(data.activityTypes);
    }
    setLoading(false);
  }

  const filtered = search
    ? logs.filter(
        (l) =>
          l.description.toLowerCase().includes(search.toLowerCase()) ||
          l.user?.name.toLowerCase().includes(search.toLowerCase()) ||
          l.user?.email.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          Complete system activity history — {total} total events
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {activityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Type Stats */}
      {activityTypes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {activityTypes.map((t) => {
            const count = logs.filter((l) => l.activity_type === t).length;
            const Icon = activityIcons[t] || activityIcons.default;
            return (
              <Badge
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                className="cursor-pointer text-xs gap-1 py-1"
                onClick={() => {
                  setTypeFilter(typeFilter === t ? "all" : t);
                  setPage(0);
                }}
              >
                <Icon className="h-3 w-3" />
                {t.replace(/_/g, " ")}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Logs */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState layout="list"/>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No activity logs found</div>
          ) : (
            <div className="divide-y">
              {filtered.map((log) => {
                const Icon = activityIcons[log.activity_type] || activityIcons.default;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-accent transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                            <span className="text-xs text-muted-foreground">
                              ({log.user.email})
                            </span>
                          </div>
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
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="text-[10px] text-muted-foreground mt-1 bg-muted p-1.5 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
