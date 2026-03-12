import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// GET — list announcements for this user's professor group
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find the professor_id this user belongs to
  let professorId: string | null = null;

  if (currentUser.role === "professor") {
    const { data: prof } = await serviceClient
      .from("professors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    professorId = prof?.id || null;
  } else if (currentUser.role === "scholar") {
    const { data: scholar } = await serviceClient
      .from("scholars")
      .select("professor_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    professorId = scholar?.professor_id || null;
  } else if (currentUser.role === "co_supervisor") {
    const { data: coSup } = await serviceClient
      .from("co_supervisors")
      .select("professor_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    professorId = coSup?.professor_id || null;
  }

  if (!professorId) {
    return NextResponse.json({ announcements: [] });
  }

  const { data: announcements } = await serviceClient
    .from("announcements")
    .select("*, author:users!author_id(id, name, email)")
    .eq("professor_id", professorId)
    .order("created_at", { ascending: false });

  // Fetch reactions for all announcements
  const announcementIds = (announcements || []).map((a: any) => a.id);
  let reactions: any[] = [];
  if (announcementIds.length > 0) {
    const { data } = await serviceClient
      .from("announcement_reactions")
      .select("*, user:users(id, name)")
      .in("announcement_id", announcementIds);
    reactions = data || [];
  }

  // Group reactions by announcement
  const reactionsMap: Record<string, any[]> = {};
  for (const r of reactions) {
    if (!reactionsMap[r.announcement_id]) reactionsMap[r.announcement_id] = [];
    reactionsMap[r.announcement_id].push(r);
  }

  const result = (announcements || []).map((a: any) => ({
    ...a,
    reactions: reactionsMap[a.id] || [],
  }));

  return NextResponse.json({ announcements: result, currentUserId: currentUser.id });
}

// POST — create a new announcement (professors and co-supervisors only)
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let professorId: string | null = null;

  if (currentUser.role === "professor") {
    const { data: prof } = await serviceClient
      .from("professors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    professorId = prof?.id || null;
  } else if (currentUser.role === "co_supervisor") {
    const { data: coSup } = await serviceClient
      .from("co_supervisors")
      .select("professor_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    professorId = coSup?.professor_id || null;
  }

  if (!professorId) {
    return NextResponse.json({ error: "Only professors and co-supervisors can post announcements" }, { status: 403 });
  }

  const { data: announcement, error: insertError } = await serviceClient
    .from("announcements")
    .insert({
      professor_id: professorId,
      author_id: currentUser.id,
      title,
      content,
    })
    .select("*, author:users!author_id(id, name, email)")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Notify all scholars and co-supervisors under this professor
  const { data: scholars } = await serviceClient
    .from("scholars")
    .select("user_id")
    .eq("professor_id", professorId);

  const { data: coSups } = await serviceClient
    .from("co_supervisors")
    .select("user_id")
    .eq("professor_id", professorId);

  const notifyIds = [
    ...(scholars || []).map((s: any) => s.user_id),
    ...(coSups || []).map((c: any) => c.user_id),
  ].filter((id) => id !== currentUser.id);

  for (const userId of notifyIds) {
    await serviceClient.rpc("create_notification", {
      p_user_id: userId,
      p_title: "New Announcement",
      p_message: `"${title}"`,
      p_type: "announcement",
    });
  }

  return NextResponse.json({ announcement: { ...announcement, reactions: [] } });
}
