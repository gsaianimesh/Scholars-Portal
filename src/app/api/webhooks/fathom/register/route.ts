import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { registerFathomWebhook } from "@/lib/services/fathom";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: prof } = await serviceClient
    .from("professors")
    .select("id, fathom_api_key")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!prof || !prof.fathom_api_key) {
    return NextResponse.json({ error: "Not a professor or no Fathom API key set." }, { status: 403 });
  }

  try {
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // Construct the destination URL for the Fathom webhook. Add prof_id as a query param so we know whose secret to look up.
    const destinationUrl = `${protocol}://${host}/api/webhooks/fathom?prof_id=${prof.id}`;

    const result = await registerFathomWebhook(destinationUrl, prof.fathom_api_key);

    if (result.secret) {
      await serviceClient
        .from("professors")
        .update({ fathom_webhook_secret: result.secret })
        .eq("id", prof.id);
    }

    return NextResponse.json({ success: true, webhookUrl: result.url });
  } catch (error: any) {
    console.error("[Webhook Register API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
