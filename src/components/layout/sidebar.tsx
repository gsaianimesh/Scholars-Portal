"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const links =
    role === "professor"
      ? professorLinks
      : role === "scholar"
      ? scholarLinks
      : coSupervisorLinks;

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-white">
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
                      : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
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
