import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    // Default redirect — may be overridden below
    const redirectTo = `${origin}${next}`;
    const response = NextResponse.redirect(redirectTo);

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
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const serviceClient = createServiceRoleClient();
          const { data: existingUser } = await serviceClient
            .from("users")
            .select("id, role")
            .eq("auth_id", authUser.id)
            .maybeSingle();

          // Check for invite code in cookies
          const inviteCode = request.cookies.get("invite_code")?.value;
          // Clear the invite cookie
          response.cookies.set({ name: "invite_code", value: "", path: "/", maxAge: 0 });

          if (!existingUser) {
            // New user
            const name =
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "User";
            const email = authUser.email || "";

            if (inviteCode) {
              // Scholar via invite link — auto-enroll
              const { data: prof } = await serviceClient
                .from("professors")
                .select("id")
                .eq("invite_code", inviteCode.toUpperCase())
                .maybeSingle();

              if (prof) {
                const { data: newUser } = await serviceClient
                  .from("users")
                  .insert({ name, email, role: "scholar", auth_id: authUser.id })
                  .select()
                  .single();

                if (newUser) {
                  await serviceClient
                    .from("scholars")
                    .insert({ user_id: newUser.id, professor_id: prof.id });
                }
                // Redirect to dashboard — they're fully set up
                return NextResponse.redirect(`${origin}/dashboard`, { headers: response.headers });
              }
            }

            // No invite code or invalid code — create a bare user record and send to onboarding
            await serviceClient
              .from("users")
              .insert({ name, email, role: "professor", auth_id: authUser.id })
              .select()
              .single();

            // Redirect to onboarding to pick role
            return NextResponse.redirect(`${origin}/onboarding`, { headers: response.headers });

          } else {
            // Existing user — check if they have a proper role record
            if (inviteCode && existingUser.role !== "scholar") {
              // Existing user using an invite link — convert to scholar
              const { data: prof } = await serviceClient
                .from("professors")
                .select("id")
                .eq("invite_code", inviteCode.toUpperCase())
                .maybeSingle();

              if (prof) {
                // Check they're not already a scholar
                const { data: existingScholar } = await serviceClient
                  .from("scholars")
                  .select("id")
                  .eq("user_id", existingUser.id)
                  .maybeSingle();

                if (!existingScholar) {
                  await serviceClient
                    .from("users")
                    .update({ role: "scholar" })
                    .eq("id", existingUser.id);

                  await serviceClient
                    .from("scholars")
                    .insert({ user_id: existingUser.id, professor_id: prof.id });
                }
              }
            }

            // Check if user has a professor/scholar/co_supervisor record
            const hasRole = await checkHasRoleRecord(serviceClient, existingUser);
            if (!hasRole) {
              return NextResponse.redirect(`${origin}/onboarding`, { headers: response.headers });
            }
          }
        }
      } catch {
        // Profile setup failed — user can still proceed
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

async function checkHasRoleRecord(serviceClient: any, user: { id: string; role: string }) {
  if (user.role === "professor") {
    const { data } = await serviceClient
      .from("professors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return !!data;
  }
  if (user.role === "scholar") {
    const { data } = await serviceClient
      .from("scholars")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return !!data;
  }
  if (user.role === "co_supervisor") {
    const { data } = await serviceClient
      .from("co_supervisors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return !!data;
  }
  return false;
}
