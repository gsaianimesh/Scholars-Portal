import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user profile exists; if not, create one (Google OAuth first login)
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const serviceClient = createServiceRoleClient();
          const { data: existingUser } = await serviceClient
            .from("users")
            .select("id")
            .eq("auth_id", authUser.id)
            .maybeSingle();

          if (!existingUser) {
            const name =
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "User";
            const email = authUser.email || "";
            const role = authUser.user_metadata?.role || "professor";

            const { data: newUser } = await serviceClient
              .from("users")
              .insert({ name, email, role, auth_id: authUser.id })
              .select()
              .single();

            if (newUser && role === "professor") {
              await serviceClient
                .from("professors")
                .insert({ user_id: newUser.id });
            }
          }
        }
      } catch {
        // Profile setup failed — user can still proceed, they'll be prompted later
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
