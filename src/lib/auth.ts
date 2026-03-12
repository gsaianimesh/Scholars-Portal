import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const serviceClient = createServiceRoleClient();
  const { data } = await serviceClient
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  return data as User | null;
}

export async function getProfessorProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("professors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getScholarProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("scholars")
    .select("*, professor:professors(*, user:users(*))")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getCoSupervisorProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("co_supervisors")
    .select("*, professor:professors(*, user:users(*))")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}
