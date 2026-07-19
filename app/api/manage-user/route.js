import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// SERVER-SIDE ONLY — uses the service role key to create/delete real auth
// accounts. Every request is verified against the caller's own session to
// confirm they are actually a Manager before anything happens; the service
// role key itself never reaches the browser.
async function requireManager(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return { error: "Not signed in.", status: 401 };

  const admin = getSupabaseAdmin();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return { error: "Invalid session.", status: 401 };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
  if (profile?.role !== "manager") return { error: "Only Managers can do this.", status: 403 };

  return { admin, callerId: userData.user.id };
}

export async function POST(req) {
  const check = await requireManager(req);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });
  const { admin } = check;

  try {
    const { email, password, fullName, phone, role } = await req.json();
    if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
    }
    if (!["admin", "manager", "supervisor", "sales_manager", "account_executive", "finance", "pending"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim(), phone: phone?.trim() || "" },
    });
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

    // The signup trigger inserts a profile row (usually 'pending'); overwrite
    // it with the role the Manager actually chose.
    await admin.from("profiles").update({ role }).eq("id", created.user.id);

    return NextResponse.json({ ok: true, userId: created.user.id });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const check = await requireManager(req);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });
  const { admin, callerId } = check;

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    if (userId === callerId) return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
