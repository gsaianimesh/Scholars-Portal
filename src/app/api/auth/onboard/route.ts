import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// POST — complete onboarding: set role and create records
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { role, inviteCode } = body;

  if (!role || !["professor", "scholar"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  // Check if user already has a record
  const { data: existingUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (existingUser) {
    // User already exists — check if they need to be updated from a pending state
    // If they already have a proper role set up, redirect them
    if (role === "professor") {
      const { data: existingProf } = await serviceClient
        .from("professors")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();
      if (existingProf) {
        return NextResponse.json({ success: true });
      }
    }

    if (role === "scholar") {
      const { data: existingScholar } = await serviceClient
        .from("scholars")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();
      if (existingScholar) {
        return NextResponse.json({ success: true });
      }
    }

    // Update role
    await serviceClient
      .from("users")
      .update({ role })
      .eq("id", existingUser.id);

    if (role === "professor") {
      await serviceClient
        .from("professors")
        .insert({ user_id: existingUser.id });
      return NextResponse.json({ success: true });
    }

    if (role === "scholar") {
      if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required for scholars" }, { status: 400 });
      }

      const { data: prof } = await serviceClient
        .from("professors")
        .select("id")
        .eq("invite_code", inviteCode.toUpperCase())
        .maybeSingle();

      if (!prof) {
        return NextResponse.json({ error: "Invalid invite code. Please check with your professor." }, { status: 404 });
      }

      await serviceClient
        .from("scholars")
        .insert({
          user_id: existingUser.id,
          professor_id: prof.id,
        });

      return NextResponse.json({ success: true });
    }
  }

  // New user — shouldn't normally reach here since callback creates the user,
  // but handle it for safety
  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";
  const email = authUser.email || "";

  const { data: newUser, error: userError } = await serviceClient
    .from("users")
    .insert({ name, email, role, auth_id: authUser.id })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (role === "professor") {
    await serviceClient
      .from("professors")
      .insert({ user_id: newUser.id });
  } else if (role === "scholar") {
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required for scholars" }, { status: 400 });
    }

    const { data: prof } = await serviceClient
      .from("professors")
      .select("id")
      .eq("invite_code", inviteCode.toUpperCase())
      .maybeSingle();

    if (!prof) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    await serviceClient
      .from("scholars")
      .insert({
        user_id: newUser.id,
        professor_id: prof.id,
      });
  }

  return NextResponse.json({ success: true });
}
