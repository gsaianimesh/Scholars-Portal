import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ids } = await request.json();
    if (!ids || !ids.length) return NextResponse.json({ success: true });

    const { data: users } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single();
    if (!users) return NextResponse.json({ error: "No user found" }, { status: 400 });

    const admin = createServiceRoleClient();
    const { error } = await admin.from('activity_logs')
      .update({ metadata: { receiver_id: users.id, read: true } })
      .in('id', ids);

    if (error) {
      console.error("Mark read error:", error);
      return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
