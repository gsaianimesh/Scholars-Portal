import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// POST — toggle a reaction on an announcement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { emoji } = body;

  if (!emoji) {
    return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
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

  // Check if reaction exists already — toggle
  const { data: existing } = await serviceClient
    .from("announcement_reactions")
    .select("id")
    .eq("announcement_id", params.id)
    .eq("user_id", currentUser.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    await serviceClient
      .from("announcement_reactions")
      .delete()
      .eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  } else {
    // Add reaction
    const { error: insertError } = await serviceClient
      .from("announcement_reactions")
      .insert({
        announcement_id: params.id,
        user_id: currentUser.id,
        emoji,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ action: "added" });
  }
}
