"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatDate, formatDateTime } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Building,
  BookOpen,
  Clock,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

interface Professor {
  id: string;
  department: string;
  institution: string;
  invite_code: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
  };
  scholars: Array<{
    id: string;
    research_topic: string;
    joining_date: string;
    status: string;
    user: { name: string; email: string };
  }>;
  meetings: Array<{
    id: string;
    meeting_title: string;
    meeting_date: string;
    meeting_link: string | null;
    agenda: string | null;
    summary: string | null;
    participants: Array<{
      user: { name: string; email: string };
      role: string;
    }>;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    status: string;
    created_at: string;
    assignments: Array<{
      status: string;
      submission_status: string | null;
      submitted_at: string | null;
      scholar: { user: { name: string; email: string } };
    }>;
  }>;
}

export default function AdminProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/professors");
      if (res.ok) {
        const data = await res.json();
        setProfessors(data.professors);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading professors...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Professors</h1>
        <p className="text-muted-foreground">
          Detailed view of all professors, their scholars, meetings, and tasks
        </p>
      </div>

      {professors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No professors found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {professors.map((prof) => (
            <Card key={prof.id} className="overflow-hidden">
              {/* Professor Header */}
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggle(prof.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-semibold">
                        {getInitials(prof.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{prof.user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {prof.user.email}
                        </span>
                        {prof.department && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {prof.department}
                          </span>
                        )}
                        {prof.institution && (
                          <span>• {prof.institution}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {prof.scholars.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {prof.meetings.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        {prof.tasks.length}
                      </span>
                    </div>
                    {expanded[prof.id] ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Details */}
              {expanded[prof.id] && (
                <CardContent className="border-t bg-gray-50/50 space-y-6">
                  {/* Professor Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">{formatDate(prof.user.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invite Code</p>
                      <p className="font-mono font-medium tracking-widest">{prof.invite_code}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs">{prof.user.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Professor ID</p>
                      <p className="font-mono text-xs">{prof.id}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Scholars */}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <GraduationCap className="h-4 w-4" />
                      Scholars ({prof.scholars.length})
                    </h3>
                    {prof.scholars.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No scholars enrolled</p>
                    ) : (
                      <div className="grid gap-2">
                        {prof.scholars.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                  {getInitials(s.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{s.user.name}</p>
                                <p className="text-xs text-muted-foreground">{s.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {s.research_topic && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {s.research_topic}
                                </span>
                              )}
                              <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-xs">
                                {s.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Joined {formatDate(s.joining_date)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Meetings */}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4" />
                      Meetings ({prof.meetings.length})
                    </h3>
                    {prof.meetings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No meetings scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {prof.meetings.slice(0, 10).map((m) => (
                          <div key={m.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{m.meeting_title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(m.meeting_date)}
                                  </span>
                                  {m.meeting_link && (
                                    <a
                                      href={m.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Meeting Link
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {m.participants.length} participants
                                </span>
                              </div>
                            </div>
                            {m.agenda && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                Agenda: {m.agenda}
                              </p>
                            )}
                            {m.participants.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {m.participants.map((p, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">
                                    {p.user.name}
                                    {p.role === "organizer" && " (org)"}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {m.summary && (
                              <p className="text-xs mt-2 bg-blue-50 p-2 rounded text-blue-800 line-clamp-3">
                                Summary: {m.summary}
                              </p>
                            )}
                          </div>
                        ))}
                        {prof.meetings.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{prof.meetings.length - 10} more meetings
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tasks */}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <CheckSquare className="h-4 w-4" />
                      Tasks ({prof.tasks.length})
                    </h3>
                    {prof.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tasks created</p>
                    ) : (
                      <div className="space-y-2">
                        {prof.tasks.slice(0, 10).map((t) => (
                          <div key={t.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{t.title}</p>
                              <Badge
                                variant={
                                  t.status === "completed" ? "default" :
                                  t.status === "in_progress" ? "secondary" : "outline"
                                }
                                className="text-xs"
                              >
                                {t.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            {t.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {t.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {t.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due {formatDate(t.deadline)}
                                </span>
                              )}
                              <span>Created {formatDate(t.created_at)}</span>
                            </div>
                            {t.assignments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {t.assignments.map((a, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                    <span>{a.scholar.user.name} ({a.scholar.user.email})</span>
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className="text-[10px]">
                                        {a.status.replace(/_/g, " ")}
                                      </Badge>
                                      {a.submission_status && (
                                        <Badge
                                          variant={a.submission_status === "approved" ? "default" : "secondary"}
                                          className="text-[10px]"
                                        >
                                          {a.submission_status}
                                        </Badge>
                                      )}
                                      {a.submitted_at && (
                                        <span className="text-muted-foreground">
                                          Submitted {formatDate(a.submitted_at)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {prof.tasks.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{prof.tasks.length - 10} more tasks
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
