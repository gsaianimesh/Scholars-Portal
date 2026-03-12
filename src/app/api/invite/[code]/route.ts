import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// GET — validate an invite code and return professor name
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const serviceClient = createServiceRoleClient();

  const { data: prof } = await serviceClient
    .from("professors")
    .select("id, user:users!user_id(name)")
    .eq("invite_code", params.code.toUpperCase())
    .maybeSingle();

  if (!prof) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const professorName = (prof as any).user?.name || "Professor";

  return NextResponse.json({ professorId: prof.id, professorName });
}
