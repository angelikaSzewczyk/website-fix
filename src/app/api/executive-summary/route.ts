import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAtLeastProfessional } from "@/lib/plans";
import { MODELS } from "@/lib/ai-models";
import { callWithRetry } from "@/lib/ai-retry";

export const runtime = "nodejs";

/**
 * /api/executive-summary
 *
 *   GET    — bestehende manuelle Summary aus meta_json laden
 *   PUT    — manuelle Summary speichern (vom User editiert)
 *   POST   — Auto-Generate via Anthropic Sonnet auf Basis der Scan-Issues.
 *            Speichert NICHT direkt — der User reviewt/editiert in der UI
 *            und schickt dann PUT.
 *
 * Auth: alle Endpoints sind Pro+-only.
 *
 * 08.05.2026: POST-Endpoint hinzugefügt — Pricing-Card-Versprechen
 * "Executive Summary für Endkunden-Reports" wurde vorher nur als
 * manueller Texteingabefeld erfüllt, jetzt auch KI-gestützt generierbar.
 */

type IssueRow = {
  severity: "red" | "yellow" | "green";
  title:    string;
  body?:    string;
  category: string;
  count?:   number;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT meta_json->>'executive_summary' AS executive_summary
    FROM scans
    WHERE id = ${scanId} AND user_id = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json({ executive_summary: rows[0]?.executive_summary ?? "" });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const body = await req.json();
  const text = String(body.executive_summary ?? "").slice(0, 2000);

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE scans
    SET meta_json = COALESCE(meta_json, '{}'::jsonb) || jsonb_build_object('executive_summary', ${text}::text)
    WHERE id = ${scanId} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht konfiguriert" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  // Optionaler Tone-Param vom Frontend: "professional" | "urgent" | "compact"
  const body = await req.json().catch(() => ({}));
  const tone: "professional" | "urgent" | "compact" =
    body.tone === "urgent" || body.tone === "compact" ? body.tone : "professional";

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT url, issues_json, issue_count, total_pages
    FROM scans
    WHERE id = ${scanId} AND user_id = ${session.user.id}
    LIMIT 1
  ` as Array<{ url: string; issues_json: IssueRow[] | null; issue_count: number | null; total_pages: number | null }>;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Scan nicht gefunden" }, { status: 404 });
  }

  const scan = rows[0];
  const issues = Array.isArray(scan.issues_json) ? scan.issues_json : [];
  const reds   = issues.filter(i => i.severity === "red");
  const yellows = issues.filter(i => i.severity === "yellow");

  // Issue-Liste für den Prompt: nur Title + Severity + Count, kein Body.
  // Halten den Prompt kurz; Sonnet braucht keine Romane um zu fazitieren.
  const issueLines = [
    ...reds.slice(0, 12).map(i => `- 🔴 ${i.title}${i.count && i.count > 1 ? ` (${i.count}×)` : ""}`),
    ...yellows.slice(0, 8).map(i => `- 🟡 ${i.title}${i.count && i.count > 1 ? ` (${i.count}×)` : ""}`),
  ].join("\n");

  const toneInstruction = {
    professional: "sachlich-beratend, agentur-gerecht für einen Endkunden-Report",
    urgent:       "dringlich aber professionell — der Kunde muss verstehen dass kritische Punkte zeitnah angegangen werden müssen",
    compact:      "knapp und auf den Punkt, maximal 4-5 Sätze",
  }[tone];

  const prompt = `Du schreibst die Executive Summary für einen Website-Audit-Report (PDF-Seite 1, Endkunde liest sie).

Kontext:
- Website: ${scan.url}
- ${reds.length} kritische Befunde (Handlungsbedarf), ${yellows.length} Optimierungshinweise
- Geprüfte Seiten: ${scan.total_pages ?? "1"}

Befunde (Top 20):
${issueLines || "Keine Issues erfasst."}

Aufgabe:
Schreibe eine deutsche Executive Summary, ${toneInstruction}.
- 4-6 Sätze
- Beginne mit dem Gesamteindruck der Site (positiv WO POSITIV, kritisch WO KRITISCH)
- Nenne 2-3 konkrete Themen aus den Befunden mit Business-Impact (SEO, Conversion, Compliance, UX)
- Schließe mit einer Handlungs-Empfehlung (nächster Schritt für den Kunden)
- KEINE Floskeln wie "wir freuen uns" oder "vielen Dank"
- KEINE Anrede ("Sehr geehrte/r…"), KEINE Grußformel
- Schreib direkt den Fazit-Text. Kein Markdown. Kein Listen-Format.
- Maximal 280 Wörter.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const response = await callWithRetry(() => client.messages.create({
      model:      MODELS.EXPERT,
      max_tokens: 800,
      messages:   [{ role: "user", content: prompt }],
    }));

    const textBlock = response.content.find(b => b.type === "text");
    const generated = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!generated) {
      return NextResponse.json({ error: "Anthropic lieferte leeren Text" }, { status: 502 });
    }

    return NextResponse.json({
      ok:                true,
      executive_summary: generated,
      tone,
      tokens: {
        input:  response.usage?.input_tokens ?? null,
        output: response.usage?.output_tokens ?? null,
      },
    });
  } catch (err) {
    console.error("[executive-summary POST] Anthropic-Fehler:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Unbekannter Anthropic-Fehler",
    }, { status: 502 });
  }
}
