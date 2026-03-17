"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Link as LinkIcon } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [fathomApiKey, setFathomApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (appUser) {
      setName(appUser.name);
      setEmail(appUser.email);
      setRole(appUser.role);

      if (appUser.role === "professor") {
        const { data: prof } = await supabase
          .from("professors")
          .select("*")
          .eq("user_id", appUser.id)
          .maybeSingle();
        if (prof) {
          setDepartment(prof.department || "");
          setInstitution(prof.institution || "");
          setInviteCode(prof.invite_code || "");
          setFathomApiKey(prof.fathom_api_key || "");
        }
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, institution, fathomApiKey }),
      });

      if (res.ok) {
        setMessage("Settings saved successfully");
      } else {
        setMessage("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string, type: "code" | "link") {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  const inviteLink = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`
    : "";

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {message && (
        <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
          {message}
        </div>
      )}

      {/* Invite Section for Professors */}
      {role === "professor" && inviteCode && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Scholar Invite
            </CardTitle>
            <CardDescription>
              Share this link or code with scholars to add them to your group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono text-lg tracking-widest"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(inviteCode, "code")}
                >
                  {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(inviteLink, "link")}
                >
                  {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Scholars who open this link will be automatically registered under your group.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={role.replace("_", " ")} disabled className="capitalize" />
          </div>

          {role === "professor" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  placeholder="University of Example"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium">Fathom AI Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect Fathom to automatically transcribe and summarize your meetings.
                  </p>
                </div>

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-100">
                  <p className="font-semibold mb-2">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a free account at <a href="https://fathom.video" target="_blank" rel="noreferrer" className="underline hover:text-blue-900">fathom.video</a>.</li>
                    <li>Go to <a href="https://fathom.video/customize/api" target="_blank" rel="noreferrer" className="underline font-medium hover:text-blue-900">Developer Settings</a> to generate an API Key.</li>
                    <li>Copy the secret token and paste it below.</li> 
                  </ol>
                  <p className="mt-2 text-xs">
                    * Ensure you use the Fathom desktop app or Zoom integration during meetings.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fathomKey">Fathom API Key</Label>
                  <Input
                    id="fathomKey"
                    type="password"
                    placeholder="sk_..."
                    value={fathomApiKey}
                    onChange={(e) => setFathomApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                   Your key is encrypted and stored securely.
                  </p>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
