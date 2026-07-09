import { supabase } from "@/lib/supabaseClient";

export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { user: null, profile: null };

  const user = sessionData.session.user;
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) {
    // Profile row may not exist yet (trigger delay) — treat as pending.
    return { user, profile: { id: user.id, email: user.email, role: "pending", full_name: "" } };
  }
  return { user, profile };
}

export const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  supervisor: "Supervisor",
  pending: "Pending Approval",
};
