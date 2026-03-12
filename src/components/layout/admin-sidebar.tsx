"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/professors", label: "All Professors", icon: Users },
  { href: "/admin/meetings", label: "All Meetings", icon: Calendar },
  { href: "/admin/activity", label: "Activity Logs", icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-slate-900 text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
          <ShieldCheck className="h-6 w-6 text-amber-400" />
          <span className="font-semibold text-lg">Admin Panel</span>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Back to dashboard */}
        <div className="border-t border-slate-700 px-3 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
