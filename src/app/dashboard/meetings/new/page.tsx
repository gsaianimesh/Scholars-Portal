"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";

export default function NewMeetingPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [link, setLink] = useState("");
  const [agenda, setAgenda] = useState("");
  const [scholars, setScholars] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadScholars();
    checkGoogleAuth();
  }, []);

  async function checkGoogleAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setHasGoogleAuth(!!session?.provider_token);
  }

  async function loadScholars() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .maybeSingle();
    if (!appUser) return;

    const { data: prof } = await supabase
      .from("professors")
      .select("id")
      .eq("user_id", appUser.id)
      .maybeSingle();
    if (!prof) return;

    const { data } = await supabase
      .from("scholars")
      .select("*, user:users(*)")
      .eq("professor_id", prof.id)
      .eq("status", "active");

    setScholars(data || []);
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate meeting link requirement
    if (!hasGoogleAuth && !useCustomLink) {
      setError("Please connect your Google Calendar to auto-generate a meeting link, or select 'Meeting Link' and provide a manual URL.");
      setLoading(false);
      return;
    }

    if (useCustomLink && !link.trim()) {
      setError("Please provide a valid manual meeting link.");
      setLoading(false);
      return;
    }

    try {
      // Create date object explicitly from local parts
      const [y, m, d, h, min] = date.split(/[-T:]/).map(Number);
      // NOTE: new Date(y, m, ...) uses the browser's local timezone
      const localDate = new Date(y, m - 1, d, h, min);
      // toISOString always returns UTC (Z)
      const isoDate = localDate.toISOString();

      console.log("[New Meeting] Form debugging:", {
        inputDate: date,
        parsedParts: [y, m, d, h, min],
        localDateString: localDate.toString(),
        isoDateToSend: isoDate
      });

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: isoDate, // Sending properly formatted UTC ISO string
          duration: parseInt(duration) || 60,
          link: useCustomLink ? link || null : null,
          agenda: agenda || null,
          participantUserIds: selectedParticipants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule meeting");
      }

      router.push("/dashboard/meetings");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reconnectGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/meetings/new`,
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/meetings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule Meeting</h1>
          <p className="text-muted-foreground">Set up a new research meeting</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Weekly research sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            {/* Meeting Link Options */}
            <div className="space-y-3">
              <Label>Meeting Platform</Label>
              {hasGoogleAuth && (
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="linkOption"
                    checked={!useCustomLink}
                    onChange={() => { setUseCustomLink(false); setLink(""); }}
                  />
                  <Video className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Auto-create Google Meet</p>
                    <p className="text-xs text-muted-foreground">
                      A Meet link will be generated and added to your Google Calendar
                    </p>
                  </div>
                </label>
              )}
              {/* Option to reconnect Google if session expired */}
              {!hasGoogleAuth && (
                 <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                  <input
                    type="radio"
                    name="linkOption"
                    value="google-reconnect"
                    onChange={reconnectGoogle}
                  />
                  <Video className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">Connect Google Calendar</p>
                    <p className="text-xs text-muted-foreground">
                      Sign in again to enable Google Meet & Calendar sync
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={reconnectGoogle}>
                    Sign In
                  </Button>
                </label>
              )}

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <input
                  type="radio"
                  name="linkOption"
                  checked={useCustomLink}
                  onChange={() => setUseCustomLink(true)}
                />
                <div>
                  <p className="text-sm font-medium">
                    {hasGoogleAuth ? "Use custom meeting link" : "Meeting Link (Zoom, Teams, etc.)"}
                  </p>
                  <p className="text-xs text-muted-foreground">Manually enter a meeting URL</p>
                </div>
              </label>
              {useCustomLink && (
                <Input
                  placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              )}
              {!hasGoogleAuth && !useCustomLink && (
                <p className="text-xs text-muted-foreground">
                  Sign in with Google to auto-create Google Meet links and Calendar events.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Meeting agenda..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
            <CardDescription>Select scholars to invite</CardDescription>
          </CardHeader>
          <CardContent>
            {scholars.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scholars available</p>
            ) : (
              <div className="space-y-2">
                {scholars.map((scholar) => (
                  <label
                    key={scholar.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(scholar.user_id)}
                      onChange={() => toggleParticipant(scholar.user_id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{scholar.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{scholar.user?.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
          <Link href="/dashboard/meetings">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
