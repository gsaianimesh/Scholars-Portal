import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { authId, name, email, role } = body;

  if (!authId || !name || !email || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validRoles = ["professor", "scholar", "co_supervisor"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Create user record
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ name, email, role, auth_id: authId })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Create role-specific record
  if (role === "professor") {
    const { error } = await supabase
      .from("professors")
      .insert({ user_id: user.id });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ user });
}
