"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, Users } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState<"role" | "invite">("role");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function chooseProfessor() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "professor" }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Scholar Portal</CardTitle>
          <CardDescription>
            {step === "role"
              ? "How would you like to use the platform?"
              : "Enter the invite code from your professor"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === "role" ? (
            <>
              <button
                onClick={chooseProfessor}
                disabled={loading}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">I&apos;m a Professor</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Supervise scholars, assign tasks, schedule meetings
                  </p>
                </div>
              </button>

              <button
                onClick={() => setStep("invite")}
                disabled={loading}
                className="w-full flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">I&apos;m a Scholar</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Join your professor&apos;s group with an invite code
                  </p>
                </div>
              </button>
            </>
          ) : (
            <form onSubmit={submitInviteCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Invite Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. A1B2C3D4"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="text-center text-lg tracking-widest uppercase"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ask your professor for the invite code or use the invite link they shared.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setStep("role"); setError(""); }}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Joining..." : "Join Group"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
