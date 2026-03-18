"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  FileText,
  Activity,
  Settings,
  GraduationCap,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  role: UserRole;
}

const professorLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scholars", label: "Scholars", icon: Users },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/submissions", label: "Submissions", icon: FileText },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const scholarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/submissions", label: "My Submissions", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const coSupervisorLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scholars", label: "Scholars", icon: Users },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/meetings", label: "Meetings", icon: Calendar },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/submissions", label: "Submissions", icon: FileText },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [meetingCount, setMeetingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: appUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", authUser.id)
          .maybeSingle();
          
        if (!appUser) return;

        // Fetch announcements logic
        const annRes = await fetch("/api/announcements");
        if (annRes.ok) {
          const data = await annRes.json();
          // Filter out announcements made by the current user
          const relevantAnnouncements = (data.announcements || []).filter(
            (a: any) => a.author_id !== data.currentUserId
          );
          
          if (relevantAnnouncements.length > 0) {
            const latestTime = new Date(relevantAnnouncements[0].created_at).getTime();
            if (pathname === "/dashboard/announcements") {
              localStorage.setItem("last_seen_announcement_time", latestTime.toString());
              setAnnouncementCount(0);
            } else {
              const lastSeenTime = parseInt(localStorage.getItem("last_seen_announcement_time") || "0");
              const unreadCount = relevantAnnouncements.filter((a: any) => new Date(a.created_at).getTime() > lastSeenTime).length;
              setAnnouncementCount(unreadCount);
            }
          } else {
            setAnnouncementCount(0);
          }
        }

        // Use unread notifications as a reliable way to add dots to Tasks/Meetings
        const { data: tasksNotifs } = await supabase
          .from("notifications")
          .select("id, created_at")
          .eq("user_id", appUser.id)
          .in("type", ["task_assigned", "task_submitted", "submission_reviewed"])
          .eq("read", false);

        if (pathname === "/dashboard/tasks" || pathname.startsWith("/dashboard/tasks/")) {
          // If on tasks page, assume they see tasks
          if (tasksNotifs && tasksNotifs.length > 0) {
            await supabase.from("notifications").update({ read: true }).in("id", tasksNotifs.map(n => n.id));
          }
          setTaskCount(0);
        } else {
          setTaskCount(tasksNotifs?.length || 0);
        }

        const { data: meetingNotifs } = await supabase
          .from("notifications")
          .select("id, created_at")
          .eq("user_id", appUser.id)
          .eq("type", "meeting_scheduled")
          .eq("read", false);

        if (pathname === "/dashboard/meetings" || pathname.startsWith("/dashboard/meetings/")) {
          // If on meetings page
          if (meetingNotifs && meetingNotifs.length > 0) {
            await supabase.from("notifications").update({ read: true }).in("id", meetingNotifs.map(n => n.id));
          }
          setMeetingCount(0);
        } else {
          setMeetingCount(meetingNotifs?.length || 0);
        }

      } catch (e) {
        console.error(e);
      }
    }
    fetchData();

    let channel: any = null;

    // Setup realtime subscription
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      
      const { data: appUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .maybeSingle();
        
      if (!appUser) return;
      
      channel = supabase
        .channel('sidebar-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${appUser.id}`,
          },
          (payload) => {
            const type = payload.new.type;
            if (['task_assigned', 'task_submitted', 'submission_reviewed'].includes(type) && !pathname.startsWith('/dashboard/tasks')) {
              setTaskCount(prev => prev + 1);
            }
            if (type === 'meeting_scheduled' && !pathname.startsWith('/dashboard/meetings')) {
              setMeetingCount(prev => prev + 1);
            }
            // For announcements, we just re-fetch to get the list and update if it's not authored by us
            if (type === 'announcement' && !pathname.startsWith('/dashboard/announcements')) {
              fetchData(); 
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [pathname, supabase]);

  const links =
    role === "professor"
      ? professorLinks
      : role === "scholar"
      ? scholarLinks
      : coSupervisorLinks;

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Scholar Portal</span>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  
                  {link.label === "Announcements" && announcementCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {announcementCount}
                    </span>
                  )}

                  {(link.label === "Tasks" || link.label === "My Tasks") && taskCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {taskCount}
                    </span>
                  )}

                  {link.label === "Meetings" && meetingCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {meetingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Role badge */}
        <div className="border-t px-6 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground capitalize">
              {role.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
