import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { registerFathomWebhook } from "@/lib/services/fathom";

export async function PATCH(request: NextRequest) {
  let webhookFailed = false;
  let manualWebhookUrl = "";
  
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, department, institution, fathomApiKey } = body;

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update user name
  if (name) {
    await serviceClient.from("users").update({ name }).eq("id", currentUser.id);
  }

  // Update professor-specific fields
  if (currentUser.role === "professor") {
    const updates: any = {};
    if (department !== undefined) updates.department = department;
    if (institution !== undefined) updates.institution = institution;
    

    if (fathomApiKey !== undefined) {
      updates.fathom_api_key = fathomApiKey;

      if (fathomApiKey.trim() !== "") {
        const { data: profData } = await serviceClient.from("professors").select("id").eq("user_id", currentUser.id).single();
        if (profData) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
          const webhookUrl = `${appUrl}/api/webhooks/fathom?prof_id=${profData.id}`;
          manualWebhookUrl = webhookUrl;
          console.log(`Registering Fathom Webhook for ${profData.id} at ${webhookUrl}`);
          
          try {
            const result = await registerFathomWebhook(webhookUrl, fathomApiKey);
            if (result.secret) {
              updates.fathom_webhook_secret = result.secret;
            }
          } catch (err: any) {
            console.error("[Profile Update] Failed to auto-register Fathom webhook:", err.message);
            webhookFailed = true;
          }
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await serviceClient
        .from("professors")
        .update(updates)
        .eq("user_id", currentUser.id);
        
      if (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, webhookFailed: webhookFailed, manualWebhookUrl: manualWebhookUrl });
}
