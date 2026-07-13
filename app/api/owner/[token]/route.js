import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req, { params }) {
  const { token } = params;
  const admin = getSupabaseAdmin();

  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id, name, client, location")
    .eq("share_token", token)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: reports } = await admin
    .from("reports")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ project, reports: reports || [] });
}
