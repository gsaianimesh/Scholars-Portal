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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'fathom_connected') {
        setMessage('Fathom account successfully connected!');
      } else if (urlParams.get('error')) {
        setMessage('Failed to connect Fathom: ' + urlParams.get('error'));
      }
    }
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
        const data = await res.json();
        if (data.webhookFailed && data.manualWebhookUrl) {
          setMessage(`Key Saved! But auto-configuring webhook failed (Fathom Team plan is required for APIs). To fix: In Fathom settings, go to Webhooks and manually add this URL to sync recordings: ${data.manualWebhookUrl}`);
        } else {
          setMessage("Settings saved successfully");
        }
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
                    Connect your Fathom account to automatically sync meeting transcripts. Provide your API key below and we&apos;ll handle the rest!
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div>
                      <h4 className="font-semibold select-none">Connect with Fathom</h4>
                      <p className="text-sm text-muted-foreground">Authorize Scholars Portal to access your recordings automatically.</p>
                    </div>
                    <Button variant="default" onClick={() => window.location.href = '/api/auth/fathom/login'} className="shrink-0 group">
                       <svg className="w-5 h-5 mr-2 group-hover:drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#00BEFF"/><path d="M11 17L15.3333 10.5H12.0833L13.1667 7L8.83333 13.5H12.0833L11 17Z" fill="white"/></svg>
                      {fathomApiKey && fathomApiKey.length > 30 ? "Reconnect Fathom" : "Connect Fathom"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">OR ENTER API KEY MANUALLY</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fathomApiKey">Fathom API Key</Label>
                    <Input
                      id="fathomApiKey"
                      type="password"
                      placeholder="Enter your Fathom API key..."
                      value={fathomApiKey}
                      onChange={(e) => setFathomApiKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-100">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Provide your API key above.</li>
                    <li>We automatically register a webhook on your account.</li>
                    <li>Meetings are matched automatically when Fathom processes them.</li>
                    <li>Transcripts and summaries are fetched using your key.</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    * Ensure you use the Fathom desktop app or Zoom integration during meetings.
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
