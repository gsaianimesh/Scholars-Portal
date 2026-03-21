"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check, Share2 } from "lucide-react";
import Link from "next/link";

export default function AddScholarPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadInviteCode() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: appUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (appUser?.role === "professor") {
        const { data: prof } = await supabase
          .from("professors")
          .select("invite_code")
          .eq("user_id", appUser.id)
          .maybeSingle();
        if (prof?.invite_code) {
          setInviteCode(prof.invite_code);
        }
      }
      setLoading(false);
    }
    loadInviteCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/scholars">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Scholar</h1>
          <p className="text-muted-foreground">
            Share the invite link or code with scholars to add them to your lab
          </p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Invite a Scholar
          </CardTitle>
          <CardDescription>
            Share the link or code below. Scholars will sign in with Google and automatically join your group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or share the code</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Invite Code</Label>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="font-mono text-lg tracking-widest text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(inviteCode, "code")}
              >
                {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Scholars can enter this code during sign-up to join your group.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href="/dashboard/scholars">
          <Button variant="outline">Back to Scholars</Button>
        </Link>
      </div>
    </div>
  );
}
