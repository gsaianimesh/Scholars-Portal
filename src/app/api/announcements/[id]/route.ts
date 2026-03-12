import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// DELETE — delete an announcement (author only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: announcement } = await serviceClient
    .from("announcements")
    .select("id, author_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!announcement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (announcement.author_id !== currentUser.id) {
    return NextResponse.json({ error: "Only the author can delete this announcement" }, { status: 403 });
  }

  await serviceClient.from("announcements").delete().eq("id", params.id);

  return NextResponse.json({ success: true });
}
