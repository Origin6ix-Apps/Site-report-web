import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE ONLY. Never import this file from a "use client" component —
// it holds the service role key, which bypasses Row Level Security.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
