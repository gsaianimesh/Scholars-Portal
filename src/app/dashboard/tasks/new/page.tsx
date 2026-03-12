"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";

export default function NewTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [expectedFormat, setExpectedFormat] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [scholars, setScholars] = useState<any[]>([]);
  const [selectedScholars, setSelectedScholars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadScholars();
  }, []);

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

  function addReferenceLink() {
    if (referenceLink.trim()) {
      setReferenceLinks([...referenceLinks, referenceLink.trim()]);
      setReferenceLink("");
    }
  }

  function toggleScholar(scholarId: string) {
    setSelectedScholars((prev) =>
      prev.includes(scholarId)
        ? prev.filter((id) => id !== scholarId)
        : [...prev, scholarId]
    );
  }

  function selectAll() {
    setSelectedScholars(scholars.map((s) => s.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedScholars.length === 0) {
      setError("Please select at least one scholar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline: deadline || null,
          expectedOutputFormat: expectedFormat || null,
          referenceLinks: referenceLinks.length > 0 ? referenceLinks : null,
          scholarIds: selectedScholars,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      router.push("/dashboard/tasks");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Task</h1>
          <p className="text-muted-foreground">
            Assign a new task to your scholars
          </p>
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
            <CardTitle className="text-base">Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Expected Output Format</Label>
                <Input
                  id="format"
                  placeholder="e.g. PDF report, code repo"
                  value={expectedFormat}
                  onChange={(e) => setExpectedFormat(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference Links</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={referenceLink}
                  onChange={(e) => setReferenceLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addReferenceLink();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addReferenceLink}>
                  Add
                </Button>
              </div>
              {referenceLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {referenceLinks.map((link, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {link.length > 40 ? link.slice(0, 40) + "..." : link}
                      <button
                        type="button"
                        onClick={() =>
                          setReferenceLinks(referenceLinks.filter((_, j) => j !== i))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assign To</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
            </div>
            <CardDescription>Choose scholars to assign this task to</CardDescription>
          </CardHeader>
          <CardContent>
            {scholars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active scholars. Add scholars first.
              </p>
            ) : (
              <div className="space-y-2">
                {scholars.map((scholar) => (
                  <label
                    key={scholar.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScholars.includes(scholar.id)}
                      onChange={() => toggleScholar(scholar.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{scholar.user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {scholar.research_topic || scholar.user?.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
          <Link href="/dashboard/tasks">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
