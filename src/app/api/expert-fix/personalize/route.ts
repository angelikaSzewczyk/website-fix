/**
 * POST /api/expert-fix/personalize
 *
 * Hoster-Personalisierung für Smart-Fix-Anleitungen via Anthropic Sonnet.
 *
 * Pro-Pricing-Card-Versprechen: "KI-Auto-Fix — Copy-Paste-Code direkt im
 * Drawer". Vor 08.05.2026 waren das nur statische Templates aus
 * lib/expert-guidance.ts. Mit diesem Endpoint kann der Pro-User die
 * Lösung auf seinen konkreten Hoster (Strato / Ionos / All-Inkl /
 * Hostinger / Anderer) anpassen lassen — Click-Pfade, Backend-Menü-Namen
 * und Login-URLs werden konkret.
 *
 * Auth: Pro+ only.
 *
 * Cost-Indikation: ~600 input + 500 output Sonnet-Tokens =
 * ca. $0.0093 pro Personalisierung. Pro-Cap im UI (1×/Issue) verhindert
 * Endlos-Schleifen.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { isAtLeastProfessional } from "@/lib/plans";
import { MODELS } from "@/lib/ai-models";
import { callWithRetry } from "@/lib/ai-retry";

export const runtime = "nodejs";

type PersonalizeBody = {
  issueTitle:   string;
  issueBody?:   string;
  baseSteps:    string[];
  hoster:       string;        // "strato" | "ionos" | "all-inkl" | "hostinger" | "default"
  builder?:     string | null; // "Elementor" | "Divi" | "WPForms" | etc
  websiteUrl?:  string;
};

const HOSTER_HINTS: Record<string, string> = {
  strato:    "Strato — Login auf strato.de/apps/CustomerService, Hosting-Verwaltung über 'Mein Strato'-Panel, MySQL via 'Datenbanken' im Sub-Menü, FTP-Daten unter 'Paketverwaltung → Zugangsdaten'",
  ionos:     "IONOS / 1&1 — Login auf my.ionos.de, Hosting unter 'Hosting' im Hauptmenü, MySQL über 'Datenbanken & Webspace', Upload via 'WebFTP' oder SFTP-Daten im 'Zugang'-Bereich",
  "all-inkl":"All-Inkl — Login auf all-inkl.com/login.php → KAS (Kunden-Administrations-System), MySQL unter 'Datenbanken', PHP-Version unter 'Tools → PHP-Version', FTP via 'FTP-Account-Verwaltung'",
  hostinger: "Hostinger — Login auf hpanel.hostinger.com, hPanel-Dashboard mit 'Files'/'Databases'/'PHP Configuration' Kacheln, FTP-Zugang im 'FTP Accounts'-Bereich",
  default:   "Generischer Hoster — keine spezifischen Backend-Pfade verfügbar, schreibe daher allgemein 'im Hosting-Backend' / 'in der Hosting-Verwaltung' und biete Hinweise für die häufigsten Panel-Typen (cPanel, Plesk)",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ error: "Personalisierung ist ein Pro-Feature" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht konfiguriert" }, { status: 500 });
  }

  let body: PersonalizeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.issueTitle || !Array.isArray(body.baseSteps) || body.baseSteps.length === 0) {
    return NextResponse.json({ error: "issueTitle + baseSteps required" }, { status: 400 });
  }

  // Sicherheits-Caps gegen Prompt-Injection / Token-Bomb
  const issueTitle = String(body.issueTitle).slice(0, 300);
  const issueBody  = String(body.issueBody ?? "").slice(0, 800);
  const baseSteps  = body.baseSteps.slice(0, 12).map(s => String(s).slice(0, 500));
  const builder    = body.builder ? String(body.builder).slice(0, 40) : null;
  const websiteUrl = body.websiteUrl ? String(body.websiteUrl).slice(0, 200) : null;

  const hosterKey  = String(body.hoster ?? "default").toLowerCase();
  const hosterHint = HOSTER_HINTS[hosterKey] ?? HOSTER_HINTS.default;

  const prompt = `Du bist ein WordPress-Sachkundiger und schreibst eine Smart-Fix-Anleitung um — speziell für einen bestimmten Hoster.

KONTEXT:
- Issue: ${issueTitle}
${issueBody ? `- Beschreibung: ${issueBody}` : ""}
${websiteUrl ? `- Website: ${websiteUrl}` : ""}
${builder ? `- Page-Builder: ${builder}` : ""}
- Ziel-Hoster: ${hosterKey}
- Hoster-Hinweise: ${hosterHint}

URSPRÜNGLICHE GENERISCHE SCHRITTE:
${baseSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

AUFGABE:
Schreibe die Schritte um, sodass sie konkret für den ${hosterKey}-User sind.
- Nutze die hoster-spezifischen Backend-Pfade aus den Hoster-Hinweisen
- Code-Snippets sollen Copy-Paste-fertig sein (echte Zeilen, keine Platzhalter)
- Wenn der ursprüngliche Schritt hoster-unabhängig ist (z.B. ein WordPress-Backend-Klick), lass ihn drin aber prüfe ob er für diesen Hoster Variationen hat
- Behalte die Reihenfolge bei
- Kein Marketing-Text
- Kein Markdown-Formatting in den Schritten — nur Plain-Text mit eventuellen \`code\`-Markierungen
- Antworte NUR mit JSON, keine Vor-/Nachrede

JSON-Format:
{"steps": ["Schritt 1 Text...", "Schritt 2 Text...", ...], "summary": "Eine Zeile: was ${hosterKey}-spezifisch anders ist"}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const response = await callWithRetry(() => client.messages.create({
      model:      MODELS.EXPERT,
      max_tokens: 1500,
      messages:   [{ role: "user", content: prompt }],
    }));

    const textBlock = response.content.find(b => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    // Sonnet wrappt JSON manchmal in Markdown-Codefences. Strip these.
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { steps?: unknown; summary?: unknown };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({
        error: "Anthropic-Antwort war kein gültiges JSON",
        raw:   jsonText.slice(0, 400),
      }, { status: 502 });
    }

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: "Keine Schritte in Anthropic-Antwort" }, { status: 502 });
    }

    const steps = parsed.steps
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map(s => s.trim().slice(0, 800));

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 200) : null;

    return NextResponse.json({
      ok:      true,
      hoster:  hosterKey,
      steps,
      summary,
      tokens: {
        input:  response.usage?.input_tokens ?? null,
        output: response.usage?.output_tokens ?? null,
      },
    });
  } catch (err) {
    console.error("[expert-fix/personalize] Anthropic-Fehler:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Unbekannter Anthropic-Fehler",
    }, { status: 502 });
  }
}
