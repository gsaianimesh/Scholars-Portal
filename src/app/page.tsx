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
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Scholar Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Teams
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {loggedIn ? (
              <Link href="/dashboard">
                <Button className="gap-2">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gap-1.5">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 pt-20 pb-28 md:pt-32 md:pb-40">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground mb-8 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Research supervision, simplified
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Manage Your Research Lab{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for professors, scholars, and co-supervisors.
              Schedule meetings, assign tasks, track progress, and collaborate — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {loggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-base gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="text-base gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                      Start for Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="text-base h-12 px-8 rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 pt-8 border-t">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Free & Open Source</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold">Google</p>
                <p className="text-sm text-muted-foreground">Calendar & Meet</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold">Real-time</p>
                <p className="text-sm text-muted-foreground">Collaboration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to manage research
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From scheduling meetings to tracking submissions, Scholar Portal has you covered.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Meeting Scheduler",
                desc: "Schedule meetings with Google Calendar integration. Auto-generate Google Meet links and send email invites to all participants.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Video,
                title: "Google Meet Integration",
                desc: "One-click Google Meet creation. All participants receive calendar invites with meeting links — no manual sharing needed.",
                color: "text-green-500",
                bg: "bg-green-500/10",
              },
              {
                icon: CheckSquare,
                title: "Task Management",
                desc: "Create, assign, and track research tasks with deadlines. Monitor submissions and provide structured feedback.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: Users,
                title: "Scholar Onboarding",
                desc: "Invite scholars with a unique code or link. They sign up with Google and are automatically added to your group.",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
              {
                icon: Megaphone,
                title: "Announcements",
                desc: "Post announcements to your entire lab. React with emojis — keep the team informed and engaged.",
                color: "text-pink-500",
                bg: "bg-pink-500/10",
              },
              {
                icon: BarChart3,
                title: "Activity Tracking",
                desc: "Complete audit trail of all actions — task submissions, meeting schedules, reviews, and more.",
                color: "text-cyan-500",
                bg: "bg-cyan-500/10",
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                desc: "Stay on top of deadlines, new tasks, and meeting invites with in-app notifications.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: FileText,
                title: "Submission Reviews",
                desc: "Scholars submit work, professors review. Approve, request revisions, or reject — all tracked with notes.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Admin Dashboard",
                desc: "Full system oversight with detailed analytics — all professors, scholars, meetings, tasks, and activity logs.",
                color: "text-red-500",
                bg: "bg-red-500/10",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No complicated setup. Sign in with Google and you&apos;re ready to go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign in with Google",
                desc: "One-click Google authentication. Your calendar and meet are automatically connected.",
                icon: Globe,
              },
              {
                step: "02",
                title: "Set up your lab",
                desc: "Share your unique invite link or code with your scholars. They join your group instantly.",
                icon: Users,
              },
              {
                step: "03",
                title: "Start collaborating",
                desc: "Schedule meetings, assign tasks, share announcements, and track everything in one dashboard.",
                icon: Zap,
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute top-8 left-[60%] right-0 h-px bg-border hidden md:block last:hidden" />
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                  Step {item.step}
                </p>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section id="roles" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for every role in the lab
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored dashboards and workflows for professors, scholars, and co-supervisors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                role: "Professor",
                desc: "Manage your entire research group. Schedule meetings, create tasks, review submissions, and monitor progress across all your scholars.",
                features: ["Create & assign tasks", "Schedule Google Meet meetings", "Review submissions", "Invite scholars with unique codes", "Full activity overview"],
                color: "from-violet-500 to-purple-600",
                icon: GraduationCap,
              },
              {
                role: "Scholar",
                desc: "Stay on top of your research tasks. View upcoming meetings, submit your work, and receive feedback — all from a personalized dashboard.",
                features: ["View assigned tasks & deadlines", "Join meetings with one click", "Submit work for review", "Track your progress", "Real-time notifications"],
                color: "from-blue-500 to-cyan-500",
                icon: FileText,
              },
              {
                role: "Co-Supervisor",
                desc: "Support the professor in managing scholars. Access the same tools with visibility into tasks, meetings, and submissions.",
                features: ["View all scholars", "Assist with task management", "Attend & schedule meetings", "Review submissions", "Activity monitoring"],
                color: "from-amber-500 to-orange-500",
                icon: Users,
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className={`bg-gradient-to-r ${card.color} px-6 py-8 text-white`}>
                  <card.icon className="h-10 w-10 mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold">{card.role}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {card.desc}
                  </p>
                  <ul className="space-y-2.5">
                    {card.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto rounded-2xl border bg-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="inline-flex p-5 rounded-2xl bg-primary/10">
                <Lock className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Secure by design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on Supabase with row-level security. Google OAuth for authentication — no passwords stored.
                Your data stays protected with enterprise-grade security policies and role-based access control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to transform your lab?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join Scholar Portal today and bring structure, clarity, and efficiency to your research supervision.
          </p>
          {loggedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-base gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/25">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" className="text-base gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/25">
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">Scholar Portal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Research Supervision Management System
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
