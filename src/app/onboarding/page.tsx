"use client";

import { useState } from "react";
import { useRouter} from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, Users, Building, Building2, UserCircle, CheckCircle2, ChevronRight, Video, FileCheck, BrainCircuit } from "lucide-react";

type WizardStep = 
  | "role_selection" 
  | "scholar_invite" 
  | "prof_profile" 
  | "prof_tour_1" 
  | "prof_tour_2" 
  | "prof_tour_3" 
  | "prof_fathom";

import React from 'react';

export default function OnboardingPage(): React.ReactElement | null {
  const router = useRouter();
  
  const [step, setStep] = useState<WizardStep>("role_selection");
  
  // Data
  const [inviteCode, setInviteCode] = useState("");
  const [profile, setProfile] = useState({ name: "", department: "", institution: "" });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStep = (next: WizardStep) => {
    setError("");
    setStep(next);
  };
  const prevStep = (prev: WizardStep) => {
    setError("");
    setStep(prev);
  };

  async function chooseRole(role: "professor" | "scholar") {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      setLoading(false);
      nextStep(role === "professor" ? "prof_profile" : "scholar_invite");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
    }
  }

  async function submitInviteCode(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "scholar", inviteCode: inviteCode.trim().toUpperCase() }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Invalid invite code");
      setLoading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      setLoading(false);
      nextStep("prof_tour_1");
    } else {
      const data = await res.json();
      setError(data.error || "Could not save profile");
      setLoading(false);
    }
  }

  function handleFathomConnect() {
    window.location.href = '/api/auth/fathom/login?returnTo=/dashboard';
  }

  function finishOnboarding() {
    router.push("/dashboard");
    router.refresh();
  }

  // Common UI Wrapper
  const renderStep = () => {
    switch (step) {
      case "role_selection":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Scholar Portal</CardTitle>
              <CardDescription>How would you like to use the platform?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => chooseRole("professor")}
                disabled={loading}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">I&apos;m a Professor</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Supervise scholars, manage tasks, automate meetings</p>
                </div>
              </button>

              <button
                onClick={() => chooseRole("scholar")}
                disabled={loading}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">I&apos;m a Scholar</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Join a group via invite code to track your progress</p>
                </div>
              </button>
            </CardContent>
          </div>
        );
      default:
        return null;

      case "scholar_invite":
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="text-center">
              <CardTitle className="text-2xl">Enter Invite Code</CardTitle>
              <CardDescription>Join your professor&apos;s group</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitInviteCode} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    id="code"
                    placeholder="e.g. A1B2C3D4"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="text-center text-2xl tracking-widest uppercase h-14"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => prevStep("role_selection")}>Back</Button>
                  <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Joining..." : "Join Group"}</Button>
                </div>
              </form>
            </CardContent>
          </div>
        );

      case "prof_profile":
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Profile</CardTitle>
              <CardDescription>Let&apos;s set up your academic details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2"><UserCircle className="h-4 w-4"/> Full Name</Label>
                  <Input id="name" required placeholder="Dr. Jane Doe" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2"><Building2 className="h-4 w-4"/> Department</Label>
                  <Input id="department" required placeholder="Computer Science" value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inst" className="flex items-center gap-2"><Building className="h-4 w-4"/> Institution</Label>
                  <Input id="inst" required placeholder="Stanford University" value={profile.institution} onChange={e => setProfile({...profile, institution: e.target.value})} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => prevStep("role_selection")}>Back</Button>
                  <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Saving..." : "Continue"} <ChevronRight className="w-4 h-4 ml-1"/></Button>
                </div>
              </form>
            </CardContent>
          </div>
        );

      case "prof_tour_1":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
             <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Plan and Track Tasks</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-2">
              <p>Easily create tasks, assign them to scholars, and track their lifecycle from &quot;Not Started&quot; to &quot;Completed&quot;. Say goodbye to scattered emails.</p>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
               {/* Progress dots */}
               <div className="flex gap-2 items-center">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <div className="h-2 w-2 rounded-full bg-muted" />
                 <div className="h-2 w-2 rounded-full bg-muted" />
               </div>
               <Button onClick={() => nextStep("prof_tour_2")}>Next <ChevronRight className="w-4 h-4 ml-1"/></Button>
            </CardFooter>
          </div>
        );

      case "prof_tour_2":
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 shadow-inner">
                <FileCheck className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">Review Submissions</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-2">
              <p>Scholars can upload documents and links alongside their assignments. You can review them in a unified space and leave immediate feedback.</p>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
               <div className="flex gap-2 items-center">
                 <div className="h-2 w-2 rounded-full bg-muted" />
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <div className="h-2 w-2 rounded-full bg-muted" />
               </div>
               <div className="space-x-2">
                 <Button variant="ghost" onClick={() => prevStep("prof_tour_1")}>Back</Button>
                 <Button onClick={() => nextStep("prof_tour_3")}>Next <ChevronRight className="w-4 h-4 ml-1"/></Button>
               </div>
            </CardFooter>
          </div>
        );

      case "prof_tour_3":
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 shadow-inner">
                <BrainCircuit className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Automate Your Meetings</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-2">
              <p>Link your Fathom AI account to automatically sync your Zoom/Meet recordings! The portal leverages AI to generate meeting minutes, summaries, and action items effortlessly.</p>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
               <div className="flex gap-2 items-center">
                 <div className="h-2 w-2 rounded-full bg-muted" />
                 <div className="h-2 w-2 rounded-full bg-muted" />
                 <div className="h-2 w-2 rounded-full bg-primary" />
               </div>
               <div className="space-x-2">
                 <Button variant="ghost" onClick={() => prevStep("prof_tour_2")}>Back</Button>
                 <Button onClick={() => nextStep("prof_fathom")}>Next <ChevronRight className="w-4 h-4 ml-1"/></Button>
               </div>
            </CardFooter>
          </div>
        );

      case "prof_fathom":
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 shadow-lg text-white">
                <Video className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Connect Fathom AI</CardTitle>
              <CardDescription>Almost done! Complete the setup to enable automated transcripts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="bg-muted p-4 rounded-lg text-sm text-left space-y-2 mb-4">
                <p><strong>Step 1:</strong> Click &apos;Connect Fathom&apos; below.</p>
                <p><strong>Step 2:</strong> Authorize access in the external popup.</p>
                <p><strong>Step 3:</strong> You&apos;ll be securely redirected to your new dashboard!</p>
              </div>
              
              <Button onClick={handleFathomConnect} className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700 text-white font-medium">
                Connect Fathom <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={finishOnboarding}>
                Skip for now, I&apos;ll do this later
              </Button>
            </CardContent>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl overflow-hidden border-border/50 bg-background relative">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-sm text-center font-medium z-10 animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}
        <div className={error ? "pt-12" : "pt-4"}>
          {renderStep()}
        </div>
      </Card>
    </div>
  );
}
