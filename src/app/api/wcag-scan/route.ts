import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { JSDOM } from "jsdom";
import path from "path";
import { readFileSync } from "fs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limiting — gleiche Logik wie /api/scan
const rateLimit = new Map<string, { count: number; resetAt: number; lastScan: number }>();
const globalLimit = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  if (now > globalLimit.resetAt) {
    globalLimit.count = 0;
    globalLimit.resetAt = now + 60 * 1000;
  }
  if (globalLimit.count >= 20) {
    return { allowed: false, reason: "Server ausgelastet. Bitte versuche es in einer Minute erneut." };
  }
  globalLimit.count++;

  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000, lastScan: now });
    return { allowed: true };
  }
  if (now - entry.lastScan < 15 * 1000) {
    return { allowed: false, reason: "Bitte warte kurz zwischen den Scans (15 Sekunden)." };
  }
  if (entry.count >= 3) {
    return { allowed: false, reason: "Zu viele Scans. Bitte warte eine Stunde und versuche es erneut." };
  }
  entry.count++;
  entry.lastScan = now;
  return { allowed: true };
}

function isUrlAllowed(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const blocked = [
      /^localhost$/, /^127\./, /^10\./, /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^0\.0\.0\.0$/, /^169\.254\./, /\.local$/,
    ];
    return !blocked.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
    });
    clearTimeout(timeout);
    return res;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

interface AxeViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  help: string;
  description: string;
  helpUrl: string;
  nodes: Array<{ html: string; failureSummary: string }>;
}

interface AxeResults {
  violations: AxeViolation[];
}

const PRIORITY: Record<string, string> = {
  critical: "🔴 KRITISCH",
  serious: "🔴 KRITISCH",
  moderate: "🟡 WICHTIG",
  minor: "🔵 INFO",
};

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const limitResult = checkRateLimit(ip);
    if (!limitResult.allowed) {
      return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    if (!isUrlAllowed(targetUrl)) {
      return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });
    }

    // ── 1. HTML ABRUFEN ───────────────────────────────────────────
    const res = await fetchWithTimeout(targetUrl);
    if (!res) {
      return NextResponse.json({ success: false, error: "Website nicht erreichbar (Timeout)." }, { status: 400 });
    }
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Website antwortet mit Fehler ${res.status}.` }, { status: 400 });
    }
    const html = await res.text();

    // ── 2. AXE-CORE MIT JSDOM AUSFÜHREN ───────────────────────────
    const dom = new JSDOM(html, {
      url: targetUrl,
      pretendToBeVisual: true,
      resources: "usable",
    });
    const { window } = dom;

    const axeSource = readFileSync(
      path.join(process.cwd(), "node_modules/axe-core/axe.min.js"),
      "utf8"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).eval(axeSource);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axeResults: AxeResults = await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).axe.run(
        window.document,
        {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        },
        (err: Error, results: AxeResults) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    dom.window.close();

    // Top 8 Verstöße, nach Impact sortiert
    const impactOrder = ["critical", "serious", "moderate", "minor"];
    const violations = axeResults.violations
      .sort((a, b) => impactOrder.indexOf(a.impact) - impactOrder.indexOf(b.impact))
      .slice(0, 8);

    if (violations.length === 0) {
      return NextResponse.json({
        success: true,
        url: targetUrl,
        violationCount: 0,
        violations: [],
        diagnose: "## Ergebnis\n\nKeine automatisch erkennbaren WCAG-Verstöße gefunden. Die Website besteht die geprüften Barrierefreiheits-Kriterien.\n\n🟢 Hinweis: Ein automatischer Scan prüft ~40% aller WCAG-Kriterien. Farb­kontraste und Tastatur-Navigation sollten manuell geprüft werden.",
      });
    }

    // ── 3. CLAUDE: ERKLÄRUNGEN + CODE-FIXES ──────────────────────
    const violationList = violations
      .map((v, i) =>
        `${i + 1}. ID: ${v.id} | Impact: ${v.impact}
   Problem: ${v.help}
   Element: ${(v.nodes[0]?.html ?? "").slice(0, 250)}
   Details: ${(v.nodes[0]?.failureSummary ?? "").slice(0, 200)}`
      )
      .join("\n\n");

    const prompt = `Du bist ein Barrierefreiheits-Experte. Eine Website wurde automatisch auf WCAG 2.1 geprüft.

URL: ${targetUrl}
Gefundene Verstöße: ${violations.length}

${violationList}

Erstelle eine strukturierte Diagnose auf Deutsch. Format:

## Zusammenfassung
1–2 Sätze: wie barrierefrei ist die Website, was sind die größten Probleme?

## Verstöße

Für jeden Verstoß (in der gegebenen Reihenfolge):
**${PRIORITY["critical"]} / 🟡 WICHTIG / 🔵 INFO** Kurzer Titel
Erklärung: 1–2 Sätze in einfachem Deutsch ohne Fachbegriffe. Was bedeutet das für Nutzer?
Fix: Konkreter Code-Fix oder kurze Anleitung (max. 3 Zeilen).

## Wichtigste nächste Schritte
1. ...
2. ...
3. ...

Hinweis am Ende: "Automatische Scans erkennen ~40% aller WCAG-Kriterien. Farbkontrast und Tastatur-Navigation bitte zusätzlich manuell prüfen."

Schreib ohne Einleitung, direkt mit ## Zusammenfassung.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      url: targetUrl,
      violationCount: violations.length,
      violations: violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        priority: PRIORITY[v.impact] ?? "🔵 INFO",
        help: v.help,
        nodeHtml: (v.nodes[0]?.html ?? "").slice(0, 300),
      })),
      diagnose,
    });
  } catch (err) {
    console.error("WCAG-Scan-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
