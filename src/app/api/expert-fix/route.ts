/**
 * POST /api/expert-fix
 *
 * Generates a before/after code fix for a single scan finding using Sonnet.
 * Called on demand from the /scan/results page for paid users.
 *
 * Input:  { url: string; issue: string; desc: string }
 * Output: { before: string; after: string; explanation: string }
 *
 * Cost estimate per call:
 *   Input ~400 tokens × $3.00/MTok  = $0.0012
 *   Output ~500 tokens × $15.00/MTok = $0.0075
 *   Total: ~$0.009 per expert fix
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { callWithRetry } from "@/lib/ai-retry";
import { MODELS } from "@/lib/ai-models";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Require session — expert fixes are a paid feature
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { url, issue, desc } = await req.json() as {
    url: string;
    issue: string;
    desc?: string;
  };

  if (!url || !issue) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  const domain = (() => { try { return new URL(url).host; } catch { return url; } })();

  const prompt = `Du bist Senior Web-Entwickler. Erstelle für das folgende Problem auf ${domain} einen konkreten Code-Fix.

Problem: ${issue}
${desc ? `Kontext: ${desc}` : ""}

Antworte NUR im folgenden JSON-Format (kein Markdown drum herum):
{
  "explanation": "Ein Satz: Warum dieser Fix wichtig ist.",
  "before": "fehlerhafter HTML/CSS-Code (max 6 Zeilen)",
  "after": "korrigierter Code (max 6 Zeilen)"
}`;

  const message = await callWithRetry(() =>
    client.messages.create({
      model: MODELS.EXPERT,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })
  );

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

  // Parse JSON — Claude sometimes wraps it in ```json blocks
  let parsed: { explanation?: string; before?: string; after?: string } = {};
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: return raw text as explanation
    parsed = { explanation: raw.slice(0, 300), before: "", after: "" };
  }

  return NextResponse.json({
    explanation: parsed.explanation ?? "",
    before:      parsed.before      ?? "",
    after:       parsed.after       ?? "",
  });
}
