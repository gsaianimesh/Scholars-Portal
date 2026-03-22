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
  ArrowRight,
  Sparkles,
  Lock,
  Bot,
  BrainCircuit,
  Mic,
  UserPlus,
  Link as LinkIcon,
  Mail,
  History,
  CheckCircle2,
  Copy,
  ShieldCheck
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
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Researchify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Platform Features
            </a>
            <a href="#ai-assistant" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5" /> AI Assistant
            </a>
            <a href="#roles" className="text-muted-foreground hover:text-primary transition-colors">
              For Labs
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
                  <Button className="rounded-full px-6 gap-2 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 border-0 text-white">
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
      <section className="relative pt-32 pb-10 lg:pt-48 lg:pb-16 overflow-hidden">
        {/* Clean, subtle background */}
        <div className="absolute top-0 left-0 w-full h-full bg-background -z-20"></div>
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl z-10 relative">
          <div className="group inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/40 px-5 py-2 text-sm font-medium mb-10 backdrop-blur-md transition-colors cursor-default shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Meet Your Personal AI Lab Assistant
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8">
            Research Management. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-primary bg-clip-text text-transparent pb-2">On Autopilot.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Stop juggling emails, calendars, and spreadsheets. Schedule automatically emailed meetings, track tasks seamlessly, and let our smart AI bot precisely take notes for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            {loggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all hover:scale-105 border-0">
                    Set Up Your Free Lab <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-background/50 backdrop-blur-md hover:bg-accent transition-all hover:scale-105 border-2">
                    See How It Works
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Platform Overview Video */}
        <div className="container mx-auto px-4 max-w-6xl relative z-20 mt-16 pb-12">
          <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden ring-1 ring-white/10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-primary/20 blur-[120px] -z-10 rounded-full animate-pulse duration-[5000ms]"></div>
            
            <div className="relative w-full overflow-hidden rounded-xl bg-muted aspect-video shadow-inner">
              <iframe
                src="https://www.loom.com/embed/9e589b374568469d9c1395a2882500d6?sid=5ef57ba2-7db5-4e78-bad6-8b3684bcbefb&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
                frameBorder="0"
                allowFullScreen={true}
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: The AI Notetaker */}
      <section id="ai-assistant" className="py-24 relative border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400">
                <Bot className="h-4 w-4" /> AI Meeting Bot
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Your Personal AI Notetaker.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect once, and our bot will automatically join all your scheduled meetings. It reliably records the meeting, types out all the notes, and meticulously documents the full transcript.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <History className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <strong className="block text-lg mb-1">Instant Transcripts & Summaries</strong>
                    <span className="text-muted-foreground text-sm">Review full meeting transcripts and beautifully formatted summaries directly on your platform immediately after the meeting ends.</span>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                    <BrainCircuit className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <strong className="block text-lg mb-1">Smart Action Item Extraction</strong>
                    <span className="text-muted-foreground text-sm">The best part: our smart AI engine listens for action items and directly assigns clear tasks to the relevant students automatically!</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-blue-500/10 to-transparent blur-3xl -z-10 rounded-full" />
              <div className="rounded-3xl border bg-card/80 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-150 duration-500" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Meeting Ended</h4>
                      <p className="text-sm text-muted-foreground">Weekly Project Alpha Sync</p>
                    </div>
                  </div>
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20 relative">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <p className="text-sm font-medium">Bot generates transcript...</p>
                    <div className="absolute -left-[9px] top-1/2 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Smart AI Engine evaluates dialogue...</p>
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 mt-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-primary" />
                          <span className="font-bold text-sm text-primary">Task Auto-Assigned</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 font-medium">&quot;Alex, please do a literature update by Friday.&quot;</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">AL</div>
                        <span className="text-xs text-muted-foreground bg-background rounded-md px-2 py-1 border border-border/50 font-medium">To: Alex</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Smart Meeting Scheduler */}
      <section className="py-24 relative bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-emerald-500/10 blur-3xl -z-10 rounded-full" />
                <div className="rounded-3xl border bg-card p-6 shadow-xl space-y-6">
                  <div className="bg-background rounded-2xl p-5 border border-border shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                           <Video className="text-emerald-600 dark:text-emerald-400 h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-bold">Thesis Review Sync</p>
                           <p className="text-xs text-muted-foreground mt-0.5">Tomorrow, 10:00 AM</p>
                         </div>
                       </div>
                       <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">Active</span>
                     </div>
                  </div>

                  <div className="ml-8 border-l-2 border-dashed border-border pl-8 space-y-5 py-2">
                     <div className="flex items-center gap-4 bg-background p-3 rounded-xl border shadow-sm">
                        <Mail className="h-5 w-5 text-muted-foreground"/>
                        <div>
                          <p className="text-sm font-semibold">Automated Emails Sent</p>
                          <p className="text-xs text-muted-foreground">All students received invitations</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 bg-background p-3 rounded-xl border shadow-sm">
                        <Calendar className="h-5 w-5 text-muted-foreground"/> 
                        <div>
                          <p className="text-sm font-semibold">Google Calendar Synced</p>
                          <p className="text-xs text-muted-foreground">Links attached securely</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full text-foreground/70">Reschedule</Button>
                    <Button variant="outline" className="w-full text-red-500 hover:text-red-600">Cancel Meet</Button>
                  </div>
                </div>
             </div>

             <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-4 w-4" /> Full Integration
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Flawless Meeting Management.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                All your meetings are effortlessly scheduled exactly here. Once you create a meet, all assigned students immediately receive direct emails with all the necessary details and calendar invites.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-lg text-foreground/90 font-medium">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Automatically emails invites.
                </li>
                <li className="flex gap-3 text-lg text-foreground/90 font-medium">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Seamless reschedules? Everyone gets updated.
                </li>
                <li className="flex gap-3 text-lg text-foreground/90 font-medium">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Cancellation notices handled instantly.
                </li>
              </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Smart Follow Up / Tasks */}
      <section id="features" className="py-24 relative border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                <CheckSquare className="h-4 w-4" /> Task & Follow-ups
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Unmatched Task Continuity.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A single platform to assign all tasks. Your students get consistent automated reminders to complete their work, while you get an easy interface to evaluate or comment on their progress.
              </p>
              <div className="bg-card border shadow-sm rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500"/> Context Generation</h4>
                <p className="text-foreground/80">
                  When you schedule the *next* meeting, our platform provides a smart summary of what you discussed with that student last time, plus an instant readout of the tasks they were given and whether they finished them.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl -z-10 rounded-full" />
              <div className="rounded-3xl border bg-card p-8 shadow-2xl relative overflow-hidden">
                 <h3 className="font-bold mb-6 text-lg border-b pb-4 flex items-center gap-2">
                   <History className="h-5 w-5 text-primary" /> Previous Student Context
                 </h3>
                 <div className="space-y-4">
                   <div className="bg-muted/50 rounded-xl p-4 border border-border/50 text-sm leading-relaxed">
                     <strong className="text-foreground">AI Insight:</strong> &quot;In the last meeting on Oct 14th, the focus was optimizing the dataset. You assigned Alex the data-cleaning phase and asked for an update next week.&quot;
                   </div>
                   
                   <div className="pt-2">
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Previous Tasks Status</p>
                     <div className="bg-background rounded-xl p-4 border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
                          <span className="font-semibold text-sm">Data Cleaning Script</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Completed</span>
                     </div>
                     <div className="bg-background rounded-xl p-4 border shadow-sm flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-500/10 p-2 rounded-lg text-orange-600"><Bot className="h-4 w-4" /></div>
                          <span className="font-semibold text-sm">Submit Draft Chapter</span>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Pending Evaluation</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Simple Onboarding */}
      <section className="py-24 relative bg-muted/30 border-t border-border/40">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="order-2 lg:order-1 relative flex justify-center">
                 <div className="absolute inset-0 bg-rose-500/10 blur-3xl -z-10 rounded-full" />
                 <div className="w-full max-w-sm bg-card border rounded-3xl p-8 shadow-2xl text-center">
                    <div className="inline-flex p-4 rounded-full bg-blue-500/10 text-blue-600 mb-6 shadow-inner border border-blue-500/20">
                      <LinkIcon className="h-8 w-8"/>
                    </div>
                    <h4 className="font-bold text-2xl mb-3">Invite Your Lab</h4>
                    <p className="text-muted-foreground text-sm mb-6">Share this secure code with your students</p>
                    
                    <div className="bg-background p-4 rounded-xl flex justify-between items-center border shadow-sm font-mono text-base font-bold text-foreground mb-6">
                      <span className="tracking-wider">LAB-2026-XQ</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4"/></Button>
                    </div>
                    
                    <div className="flex flex-col items-center border-t pt-6">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Students Joined</p>
                      <div className="flex justify-center flex-wrap gap-2">
                         <div className="bg-blue-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-background">AL</div>
                         <div className="bg-emerald-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-background">MJ</div>
                         <div className="bg-orange-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-background">DK</div>
                         <div className="bg-muted text-muted-foreground h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-background border-dashed">+12</div>
                      </div>
                    </div>
                 </div>
               </div>

               <div className="order-1 lg:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
                  <UserPlus className="h-4 w-4" /> Infinite Growth
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  Add Students in Seconds.
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  We built our onboarding to be entirely frictionless. You can safely add any number of students to your lab group just by sharing a simple automated code or link.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-card border rounded-2xl p-4 shadow-sm">
                    <div className="bg-primary/10 p-3 rounded-full"><Users className="text-primary h-5 w-5"/></div>
                    <div><h4 className="font-bold text-lg">Unlimited Scholars</h4><p className="text-muted-foreground text-sm">No restrictions on lab sizes.</p></div>
                  </div>
                  <div className="flex items-center gap-4 bg-card border rounded-2xl p-4 shadow-sm">
                    <div className="bg-blue-500/10 p-3 rounded-full"><Lock className="text-blue-500 h-5 w-5"/></div>
                    <div><h4 className="font-bold text-lg">Simple Safe Login</h4><p className="text-muted-foreground text-sm">Students join simply using standard trusted logins.</p></div>
                  </div>
                </div>
               </div>
            </div>
         </div>
      </section>

      {/* Role Play Section */}
      <section id="roles" className="py-24 relative overflow-hidden border-t border-border/40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              One Platform. Every Role.
            </h2>
            <p className="text-lg text-muted-foreground">
              A unified hub that seamlessly adapts its layout and capabilities based natively on who logs in.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                role: "Professor",
                tagline: "Your Mission Control",
                desc: "Manage your entire research group seamlessly. Orchestrate meetings, review submissions, effortlessly assign tasks, and evaluate student progress entirely in one place.",
                features: ["AI bot & Smart Extraction", "Unified Task Management", "Follow-up Context Overviews"],
                color: "from-blue-600 to-indigo-600 text-blue-600",
                shadow: "shadow-blue-500/10",
                icon: GraduationCap,
              },
              {
                role: "Scholar",
                tagline: "The Focus Hub",
                desc: "Your personal headquarters. You see exactly what you need to do, receive automatic email schedules, read AI meeting sumaries, and submit your evaluation tasks directly.",
                features: ["Simple Code Join Base", "Automatic Due Reminders", "Direct Direct File Attachments"],
                color: "from-emerald-500 to-teal-600 text-emerald-600",
                shadow: "shadow-emerald-500/10",
                icon: CheckSquare,
              },
              {
                role: "Co-Supervisor",
                tagline: "The Support Wing",
                desc: "Assist your lab seamlessly. Access all shared scholars implicitly, observe assignments, and securely provide secondary evaluation feedback right alongside the professor.",
                features: ["Shared Lab Visibility", "Secondary Reviews", "Complete Tracker Logs"],
                color: "from-orange-500 to-rose-500 text-orange-600",
                shadow: "shadow-orange-500/10",
                icon: Users,
              },
            ].map((card, i) => (
              <div key={i} className={`relative bg-card rounded-3xl border shadow-xl ${card.shadow} overflow-hidden group hover:-translate-y-2 transition-transform duration-300 p-8`}>
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color.split(' ')[0]} text-white mb-6 shadow-lg`}>
                    <card.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{card.role}</h3>
                  <p className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${card.color.split(' ')[0]} mb-4`}>{card.tagline}</p>
                  
                  <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
                    {card.desc}
                  </p>
                  
                  <div className="space-y-4 border-t pt-6">
                    {card.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckSquare className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">{f}</span>
                      </div>
                    ))}
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Engine - Sleek Redesign */}
      <section className="py-24 bg-muted/30 border-t border-border/40 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card w-full border border-border/50 shadow-2xl rounded-[3rem] p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                <div className="relative inline-flex p-8 rounded-full bg-background border shadow-xl">
                  <ShieldCheck className="h-16 w-16 text-primary" />
                </div>
              </div>
              
              <div className="relative z-10 text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Enterprise-grade Security</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl">
                  Your data is securely isolated specifically for your lab. Student login happens safely with standard trusted 1-click protocols, ensuring absolutely no passwords to manage, forget, or store improperly.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="px-4 py-2 rounded-full bg-background text-foreground font-semibold text-sm border shadow-sm flex items-center gap-2"><Lock className="h-4 w-4 text-blue-500"/> Strict Data Isolation</span>
                  <span className="px-4 py-2 rounded-full bg-background text-foreground font-semibold text-sm border shadow-sm flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-500"/> Simple 1-Click Login</span>
                  <span className="px-4 py-2 rounded-full bg-background text-foreground font-semibold text-sm border shadow-sm flex items-center gap-2"><Lock className="h-4 w-4 text-purple-500"/> Verified Meeting Integrations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-32 relative overflow-hidden border-t border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 -z-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Ready to upgrade your lab?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Automate the busywork. Focus entirely on the breakthroughs.
          </p>
          {loggedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full h-16 px-10 text-lg gap-3 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                Enter your Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-full h-16 px-10 text-lg gap-3 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all">
                  Set Up Your Free Lab
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full h-16 px-10 text-lg bg-background/50 backdrop-blur-sm">
                  Sign In to Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-md">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Researchify</span>
            </Link>
            
            <div className="flex gap-8 text-sm font-semibold text-muted-foreground">
              <a href="#features" className="hover:text-primary transition-colors">Features</a>
              <a href="#ai-assistant" className="hover:text-primary transition-colors">AI Assistants</a>
              <a href="#roles" className="hover:text-primary transition-colors">Lab Workflow</a>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-muted-foreground text-center md:text-left">
            <p>© {new Date().getFullYear()} Researchify. All rights reserved.</p>
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
