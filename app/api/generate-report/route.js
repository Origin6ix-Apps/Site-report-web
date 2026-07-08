import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

export async function POST(req) {
  try {
    const { projectId, projectName, client, location, date, transcript, photoUrls } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }
    if ((!photoUrls || photoUrls.length === 0) && !transcript?.trim()) {
      return NextResponse.json({ error: "Add at least one photo or a voice note." }, { status: 400 });
    }

    const promptText = `You are a construction site superintendent's assistant. Write a professional daily construction report for the project "${projectName}" (client: ${client || "n/a"}, site: ${location || "n/a"}), dated ${date}.

Use the attached site photos and the field notes transcript below. Return ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "summary": "2-3 sentence overview of the day",
  "workCompleted": ["short bullet", "..."],
  "materialsEquipment": ["short bullet", "..."],
  "crewOnSite": "short description of crew/trades present, inferred if not stated",
  "safetyNotes": ["short bullet", "..."],
  "issuesDelays": ["short bullet", "..."],
  "planForTomorrow": ["short bullet", "..."]
}
If the notes don't mention a category, make a reasonable minimal inference from the photos, or use an empty array. Do not invent specific numbers, names, or measurements that aren't supported by the notes or photos.

Field notes transcript: """${transcript || "(no voice note recorded — rely on photos only)"}"""`;

    const content = [{ type: "text", text: promptText }];

    for (const url of photoUrls || []) {
      const base64 = await urlToBase64(url);
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      return NextResponse.json({ error: "AI report generation failed." }, { status: 502 });
    }

    const claudeData = await claudeRes.json();
    const rawText = (claudeData.content || []).map((b) => b.text || "").join("\n");
    const clean = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("Failed to parse Claude response:", rawText);
      return NextResponse.json({ error: "AI returned an unexpected format. Please try again." }, { status: 502 });
    }

    const admin = getSupabaseAdmin();
    const { data: inserted, error: insertErr } = await admin
      .from("reports")
      .insert({
        project_id: projectId,
        report_date: date,
        transcript: transcript || "",
        summary: parsed.summary || "",
        work_completed: parsed.workCompleted || [],
        materials_equipment: parsed.materialsEquipment || [],
        crew_on_site: parsed.crewOnSite || "",
        safety_notes: parsed.safetyNotes || [],
        issues_delays: parsed.issuesDelays || [],
        plan_for_tomorrow: parsed.planForTomorrow || [],
        photo_urls: photoUrls || [],
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return NextResponse.json({ error: "Report generated but failed to save." }, { status: 500 });
    }

    return NextResponse.json({ reportId: inserted.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
