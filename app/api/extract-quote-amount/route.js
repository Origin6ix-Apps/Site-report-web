import { NextResponse } from "next/server";

// SERVER-SIDE ONLY — reads an uploaded quote document (image or PDF) and
// extracts the total quoted amount automatically, so the Account Executive
// never has to type it in by hand. Uses the same Claude API pattern as the
// existing AI daily-report feature.
export async function POST(req) {
  try {
    const { base64, mediaType } = await req.json();
    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Missing file data." }, { status: 400 });
    }

    const isPdf = mediaType === "application/pdf";
    const fileBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const promptText = `This is a sales quotation document. Find the final total quoted amount (the grand total the client would actually pay — not a subtotal, not a per-unit price, not a tax line by itself). Return ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{ "amount": <number, no currency symbols or commas, or null if you genuinely cannot find a total> }`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content: [fileBlock, { type: "text", text: promptText }] }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      return NextResponse.json({ error: "Couldn't read the quote document." }, { status: 502 });
    }

    const claudeData = await claudeRes.json();
    const rawText = (claudeData.content || []).map((b) => b.text || "").join("\n");
    const clean = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return NextResponse.json({ error: "Couldn't read an amount from that document." }, { status: 502 });
    }

    if (parsed.amount === null || parsed.amount === undefined) {
      return NextResponse.json({ error: "Couldn't find a total amount in that document — please check the file." }, { status: 422 });
    }

    return NextResponse.json({ amount: Number(parsed.amount) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
