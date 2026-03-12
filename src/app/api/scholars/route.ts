import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, researchTopic } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  // Get current user
  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get professor record
  const { data: prof } = await serviceClient
    .from("professors")
    .select("id")
    .eq("user_id", currentUser.id)
    .single();

  if (!prof) {
    return NextResponse.json({ error: "Not a professor" }, { status: 403 });
  }

  // Create auth user for the scholar with a random password
  const tempPassword = crypto.randomUUID().slice(0, 16);
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role: "scholar" },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create user record
  const { data: scholarUser, error: userError } = await serviceClient
    .from("users")
    .insert({ name, email, role: "scholar", auth_id: authData.user.id })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Create scholar record
  const { data: scholar, error: scholarError } = await serviceClient
    .from("scholars")
    .insert({
      user_id: scholarUser.id,
      professor_id: prof.id,
      research_topic: researchTopic || "",
    })
    .select()
    .single();

  if (scholarError) {
    return NextResponse.json({ error: scholarError.message }, { status: 500 });
  }

  // Log activity
  await serviceClient.rpc("log_activity", {
    p_user_id: currentUser.id,
    p_activity_type: "scholar_added",
    p_description: `Added scholar ${name}`,
  });

  // Create notification for the scholar
  await serviceClient.rpc("create_notification", {
    p_user_id: scholarUser.id,
    p_title: "Welcome to Scholar Portal",
    p_message: "You've been added as a research scholar. Please update your password in settings.",
    p_type: "scholar_added",
  });

  return NextResponse.json({ scholar });
}
