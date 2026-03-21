import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { registerFathomWebhook } from "@/lib/services/fathom";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // This is user.id from login

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=missing_code", request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_FATHOM_CLIENT_ID;
  const clientSecret = process.env.FATHOM_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("Fathom OAuth credentials not configured");
    return NextResponse.redirect(new URL("/dashboard/settings?error=config", request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/fathom/callback`;

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://fathom.video/external/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Fathom token exchange failed:", errText);
      return NextResponse.redirect(new URL("/dashboard/settings?error=exchange_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Use service client to save to DB (bypassing RLS since we need to save tokens securely)
    const serviceClient = createServiceRoleClient();
    
    // We update fathom_api_key just to keep backward compatibility with scripts that grab it,
    // AND we save the access/refresh tokens in their specific columns if added.
    const { error } = await serviceClient
      .from("professors")
      .update({ 
        fathom_api_key: accessToken,
        fathom_access_token: accessToken,
        fathom_refresh_token: refreshToken 
      })
      .eq("user_id", state);

    if (error) {
      console.error("Failed to save tokens:", error);
      return NextResponse.redirect(new URL("/dashboard/settings?error=db_error", request.url));
    }

    // Attempt to register webhook using the token we just received
    const { data: profData } = await serviceClient.from("professors").select("id").eq("user_id", state).single();
    if (profData) {
        const webhookUrl = `${appUrl}/api/webhooks/fathom?prof_id=${profData.id}`;
        try {
            const webhookResult = await registerFathomWebhook(webhookUrl, accessToken);
            if (webhookResult.secret) {
                await serviceClient.from("professors").update({ fathom_webhook_secret: webhookResult.secret }).eq("id", profData.id);
            }
        } catch (e) {
            console.error("Failed to auto-register webhook during OAuth callback", e);
            // Don't fail the login if webhook fails
        }
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(new URL("/dashboard/settings?success=fathom_connected", request.url));

  } catch (error: any) {
    console.error("Fathom OAuth error:", error);
    return NextResponse.redirect(new URL("/dashboard/settings?error=internal_error", request.url));
  }
}
