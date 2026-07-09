import { supabase } from "@/lib/supabaseClient";

export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { user: null, profile: null };

  const user = sessionData.session.user;

  // The profile row is created by a database trigger right after signup — on a slow
  // connection there can be a brief gap before it's queryable. Retry a few times
  // instead of assuming the account is stuck.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!error && profile) {
      return { user, profile };
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Still nothing after retrying — fall back to supervisor rather than a dead-end
  // "pending" screen, since this app has no approval step.
  return { user, profile: { id: user.id, email: user.email, role: "supervisor", full_name: "" } };
}

export const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  supervisor: "Supervisor",
  pending: "Pending Approval",
};
