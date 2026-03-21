import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_FATHOM_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Fathom Client ID not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/fathom/callback`;
  
  // Create state to prevent CSRF, could also embed user details if we want
  const state = user.id;

  const authUrl = `https://api.fathom.ai/external/v1/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public_api&state=${state}`;

  return NextResponse.redirect(authUrl);
}
