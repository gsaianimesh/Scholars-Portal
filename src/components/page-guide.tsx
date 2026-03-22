"use client";

import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const PAGE_GUIDES: Record<string, { title: string; steps: string[] }> = {
  "/dashboard": {
    title: "How to use your Dashboard",
    steps: [
      "Welcome to your main hub! Here you can see a high-level overview of your lab's activity.",
      "View your upcoming schedule on the right sidebar and quick links to recent tasks.",
      "Use the left navigation menu to explore specific sections like Meetings, Tasks, or Chats."
    ]
  },
  "/dashboard/scholars": {
    title: "Managing Scholars",
    steps: [
      "Here you can see a list of all your assigned scholars or students.",
      "Add new scholars by sharing your unique invite link with them.",
      "Click on any scholar's row to view their individual progress, tasks, and meeting history."
    ]
  },
  "/dashboard/tasks": {
    title: "Tracking Tasks",
    steps: [
      "This is your task management board.",
      "You can manually create new tracking action items using the 'New Task' button.",
      "Tasks are automatically generated here by Lumi AI after meetings.",
      "Mark items as 'In Progress' or 'Done' to keep everyone synced."
    ]
  },
  "/dashboard/meetings": {
    title: "Meetings & AI Transcripts",
    steps: [
      "Schedule new meetings by clicking the 'New Meeting' button.",
      "Lumi AI will automatically join your scheduled call to record it.",
      "After the meeting finishes, click on the meeting row to view the full auto-generated transcript, summary, and action items."
    ]
  },
  "/dashboard/chat": {
    title: "Chatting with Lumi AI",
    steps: [
      "This is your direct conversational interface with Lumi.",
      "Lumi has full context of your lab—you can ask it things like 'What is Alex working on?' or 'Summarize our last Sync'.",
      "Use this to quickly draft emails or retrieve information from past documents."
    ]
  },
  "/dashboard/announcements": {
    title: "Broadcasting Announcements",
    steps: [
      "Use this page to broadcast important updates to your entire lab.",
      "Click 'New Announcement' to write a message.",
      "Scholars can react to announcements to confirm they have read them."
    ]
  },
  "/dashboard/submissions": {
    title: "Reviewing Submissions",
    steps: [
      "This is where scholars upload thesis drafts, documents, or data for your review.",
      "Click on any submission to download it.",
      "You can approve, reject, or leave detailed feedback directly on the submission."
    ]
  },
  "/dashboard/activity": {
    title: "Activity Logs",
    steps: [
      "This page tracks the entire audit log of your lab.",
      "Every time a task is completed, a meeting is held, or a document is submitted, it is logged here.",
      "Use the filters to find specific events."
    ]
  },
  "/dashboard/settings": {
    title: "Settings & AI Automation",
    steps: [
      "Configure your personal profile and lab preferences here.",
      "Toggle AI automation features such as Auto-Task Generation and AI Meeting Summaries on or off.",
      "Manage your active integrations like Google Calendar."
    ]
  }
};

export function PageGuide() {
  const pathname = usePathname();
  
  // Try to find an exact match, or fall back to a dynamic matched route (like /dashboard/meetings/123)
  const guide = PAGE_GUIDES[pathname] || 
    (pathname.startsWith("/dashboard/meetings/") ? {
      title: "Meeting Details",
      steps: [
        "This is a detailed view of a specific meeting.",
        "You can read the AI-generated summary, review the raw transcript, and see tasks extracted from this call.",
        "Generate a 'Briefing' if you need a pre-meeting context file."
      ]
    } : null);

  if (!guide) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-muted-foreground hover:text-primary">
          <Info className="h-4 w-4" />
          How this works
        </Button>
      </DialogTrigger>
      {/* Mobile exact icon */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden flex text-muted-foreground hover:text-primary">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {guide.title}
          </DialogTitle>
          <DialogDescription>
            Step-by-step instructions on how to use this page.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-4">
            {guide.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {index + 1}
                </span>
                <span className="leading-relaxed text-muted-foreground pt-0.5">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
