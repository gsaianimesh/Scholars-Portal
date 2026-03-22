"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Users,
  Video,
  Bell,
  BarChart3,
  FileText,
  ArrowRight,
  Megaphone,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Zap,
  Globe,
  Lock,
  Bot,
  BrainCircuit,
  LayoutDashboard,
  Mic,
  Activity,
  UserPlus
} from "lucide-react";

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setLoggedIn(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navbar - Glassmorphism */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Scholar Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#ai-integration" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5" /> AI Powered
            </a>
            <a href="#roles" className="text-muted-foreground hover:text-primary transition-colors">
              For Teams
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loggedIn ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="rounded-full px-6">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full px-6 gap-2 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 border-0">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-background to-background -z-10 blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Now With AI Meeting Note-Taker & Auto-Task Assignment
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            The One-Stop Solution<br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              For Your Professor Needs.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            A single platform to manage your entire lab. Share a simple code for students to join in. 
            Schedule automatically emailed meetings, assign tasks, evaluate submissions, and let our AI note-taker record and extract assignments seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {loggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full h-14 px-8 text-base gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:-translate-y-1">
                  Enter Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="rounded-full h-14 px-8 text-base gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all hover:-translate-y-1 border-0">
                    Deploy for your Lab <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-base gap-2 bg-background/50 backdrop-blur-md hover:bg-accent transition-all">
                    See how it works
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Feature Pills */}
          <div className="mt-20 flex flex-wrap justify-center gap-4 md:gap-8 opacity-70 animate-in fade-in duration-1000 delay-700">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-5 w-5 text-purple-500" /> AI Meeting Bot
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BrainCircuit className="h-5 w-5 text-blue-500" /> Smart Action Item Extraction
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-5 w-5 text-green-500" /> Automated Email Invites
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-5 w-5 text-rose-500" /> simple 1-Click Join
            </div>
          </div>
        </div>
      </section>

      {/* The AI Advantage */}
      <section id="ai-integration" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl -z-10 rounded-full" />
              <div className="rounded-2xl border bg-card/50 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-150 duration-500" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Meeting Completed</h4>
                      <p className="text-sm text-muted-foreground">Weekly Sync - Proj Alpha</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20 relative">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <p className="text-sm font-medium">Your Bot generates transcript...</p>
                    
                    <div className="absolute -left-[9px] top-1/2 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Smart AI Engine extracts tasks...</p>
                    
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Task Auto-Assigned</span>
                      </div>
                      <p className="text-sm">&quot;Alex, please review the latest submission by Friday.&quot;</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">AL</div>
                        <span className="text-xs text-muted-foreground bg-background rounded px-2 py-1 border">Due: Friday</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-500 mb-6">
                <Sparkles className="h-4 w-4" /> Your Personal AI Notetaker
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                Never lose a decision or task in translation again.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Once integrated, your own personalized bot will automatically join all your meetings. It records everything, takes meticulous notes, and organizes the details directly on your dashboard.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Automated Note-Taking: Transcripts and summaries are instantly generated and visible directly on the platform.",
                  "Smart Task Extraction: Our smart AI engine picks out clear action items and automatically assigns tasks to the relevant students.",
                  "Contextual Next Meetings: Keep continuity. When scheduling a follow-up, our AI gives you a smart summary of past discussions.",
                  "Automated Follow-ups: The AI checks if students have completed the tasks assigned in your last meeting."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-base font-medium">
                    <div className="flex-shrink-0 h-6 w-6 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Next-Gen Features Matrix */}
      <section id="features" className="py-24 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Everything you need, in one place.</h2>
            <p className="text-lg text-muted-foreground">
              A single, beautifully designed platform built entirely around making a professor&apos;s life infinitely easier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: UserPlus,
                title: "Simple Onboarding",
                desc: "Add any number of students effortlessly. Just share a simple code or link, and they join your lab securely with a single login.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Video,
                title: "Smart Meeting Scheduler",
                desc: "Schedule all your meetings here. Students instantly get email invites. Need to reschedule or cancel? Automated emails keep everyone updated.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                icon: FileText,
                title: "Complete Task Management",
                desc: "A single platform to assign all tasks. Students receive automated reminders, while you can evaluate submissions and easily keep track of progress.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: LayoutDashboard,
                title: "Unified Dashboards",
                desc: "Everyone gets exactly what they need. Dedicated views for Professors to oversee everything, and concise hubs for Scholars.",
                color: "text-pink-500",
                bg: "bg-pink-500/10",
              },
              {
                icon: Megaphone,
                title: "Lab Announcements",
                desc: "Send fast broadcast notices to the entire lab at once. Let students react with emojis so you know they saw it.",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
              {
                icon: Activity,
                title: "Complete Activity Tracking",
                desc: "Never lose track of what happened when. Every submission, calendar change, and feedback note is neatly logged for your records.",
                color: "text-red-500",
                bg: "bg-red-500/10",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border bg-background p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform group-hover:scale-150">
                  <feature.icon className="w-32 h-32" />
                </div>
                <div className={`inline-flex p-4 rounded-2xl ${feature.bg} mb-6`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Play Section */}
      <section id="roles" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              One platform. Every role.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scholar Portal adapts its UI and capabilities based on who logs in.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                role: "Professor",
                tagline: "Your Mission Control",
                desc: "Manage your entire research group seamlessly. Orchestrate meetings, review submissions, easily assign tasks, and track every student's progress effortlessly.",
                features: ["AI note-taker assistant", "Effortless task assigning", "Evaluate student submissions"],
                color: "from-blue-600 to-indigo-600",
                shadow: "shadow-blue-500/20",
                icon: GraduationCap,
              },
              {
                role: "Scholar",
                tagline: "The Focus Hub",
                desc: "Your personal research headquarters. See exactly what you need to do, get friendly reminders, view AI meeting summaries, and submit your tasks directly.",
                features: ["Automatic reminders", "1-click meeting joins", "Direct file submissions"],
                color: "from-emerald-500 to-teal-600",
                shadow: "shadow-emerald-500/20",
                icon: CheckSquare,
              },
              {
                role: "Co-Supervisor",
                tagline: "The Support Wing",
                desc: "Assist seamlessly. Access shared scholars, participate in meetings, monitor student task completion, and provide secondary review feedback effortlessly.",
                features: ["Shared visibility", "Secondary reviews", "Activity monitoring"],
                color: "from-orange-500 to-rose-500",
                shadow: "shadow-orange-500/20",
                icon: Users,
              },
            ].map((card, i) => (
              <div key={i} className={`relative rounded-3xl bg-card border shadow-xl ${card.shadow} overflow-hidden group hover:-translate-y-2 transition-transform duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} text-white mb-6 shadow-lg`}>
                    <card.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{card.role}</h3>
                  <p className={`text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${card.color} mb-4`}>{card.tagline}</p>
                  
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {card.desc}
                  </p>
                  
                  <div className="space-y-3">
                    {card.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckSquare className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Engine */}
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 -z-10 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
              <div className="relative inline-flex p-8 rounded-3xl bg-background/10 backdrop-blur-md border border-white/10">
                <Lock className="h-16 w-16 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-4">Enterprise-grade Security</h3>
              <p className="text-background/80 text-lg leading-relaxed mb-6">
                Your data is securely isolated for your lab only. Secure student login happens safely with standard trusted protocols, meaning absolutely no passwords need to be memorized or stored improperly.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm backdrop-blur-sm border border-white/5">Strict Data Isolation</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm backdrop-blur-sm border border-white/5">Simple Secure Login</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm backdrop-blur-sm border border-white/5">Verified Connectors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 -z-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Ready to simplify your research workflow?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Let the AI handle the busywork so you can focus entirely on the breakthroughs.
          </p>
          {loggedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full h-16 px-10 text-lg gap-3 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                Enter your Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-full h-16 px-10 text-lg gap-3 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                  Get Started For Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full h-16 px-10 text-lg backdrop-blur-sm">
                  Sign In to Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Scholar Portal</span>
            </Link>
            
            <div className="flex gap-8 text-sm font-medium text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#ai-integration" className="hover:text-foreground transition-colors">AI Assistants</a>
              <a href="#roles" className="hover:text-foreground transition-colors">Lab Workflow</a>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground text-center md:text-left">
            <p>© {new Date().getFullYear()} Scholar Portal. All rights reserved.</p>
            <p className="flex items-center gap-1">Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for Academic Research</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const Heart = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
