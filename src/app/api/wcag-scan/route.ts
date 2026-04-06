import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Chromium download URL — aus Env-Var oder GitHub Releases
const CHROMIUM_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

// Rate limiting — WCAG-Scan ist teurer als normaler Scan → strengere Limits
const rateLimit = new Map<string, { count: number; resetAt: number; lastScan: number }>();
// Globale Bremse: max 3 WCAG-Scans pro Minute (Playwright + Claude = teuer)
const globalLimit = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  if (now > globalLimit.resetAt) {
    globalLimit.count = 0;
    globalLimit.resetAt = now + 60 * 1000;
  }
  if (globalLimit.count >= 3) {
    return { allowed: false, reason: "Server ausgelastet. Bitte versuche es in einer Minute erneut." };
  }
  globalLimit.count++;

  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000, lastScan: now });
    return { allowed: true };
  }
  if (now - entry.lastScan < 30 * 1000) {
    return { allowed: false, reason: "Bitte warte kurz zwischen den Scans (30 Sekunden)." };
  }
  if (entry.count >= 3) {
    return { allowed: false, reason: "Zu viele Scans. Bitte warte eine Stunde." };
  }
  entry.count++;
  entry.lastScan = now;
  return { allowed: true };
}

const PRIORITY: Record<string, string> = {
  critical: "🔴 KRITISCH",
  serious: "🔴 KRITISCH",
  moderate: "🟡 WICHTIG",
  minor: "🔵 INFO",
};

interface AxeViolation {
  id: string;
  impact: string;
  help: string;
  nodes: Array<{ html: string; failureSummary: string }>;
}

export async function POST(req: NextRequest) {
  let browser = null;

  try {
    // Origin + User-Agent prüfen
    const guard = guardRequest(req);
    if (guard.blocked) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const limitResult = checkRateLimit(ip);
    if (!limitResult.allowed) {
      return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) {
      return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });
    }

    // ── 1. PLAYWRIGHT + CHROMIUM STARTEN ─────────────────────────
    // Dynamischer Import damit Next.js die Module nicht beim Build verarbeitet
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const { chromium: playwrightChromium } = await import("playwright-core");

    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_URL),
      headless: true,
    });

    const page = await browser.newPage();

    // Unnötige Ressourcen blockieren (schneller)
    await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}", (route) =>
      route.abort()
    );

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Kurz warten damit JS-gerenderte Inhalte erscheinen
    await page.waitForTimeout(2000);

    // ── 2. AXE-CORE IM ECHTEN BROWSER AUSFÜHREN ──────────────────
    // axe.source ist die serialisierte axe-core Quelle als String —
    // von webpack korrekt gebündelt, kein Dateisystem-Zugriff nötig.
    const axe = (await import("axe-core")).default;
    await page.addScriptTag({ content: axe.source });

    const axeResults = await page.evaluate(() => {
      return new Promise<{ violations: AxeViolation[] }>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).axe.run(
          document,
          { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } },
          (err: Error, results: { violations: AxeViolation[] }) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });
    });

    await browser.close();
    browser = null;

    // ── 3. VERSTÖSSE AUFBEREITEN ──────────────────────────────────
    const impactOrder = ["critical", "serious", "moderate", "minor"];
    const violations: AxeViolation[] = (axeResults.violations as AxeViolation[])
      .sort((a, b) => impactOrder.indexOf(a.impact) - impactOrder.indexOf(b.impact))
      .slice(0, 8);

    if (violations.length === 0) {
      return NextResponse.json({
        success: true,
        url: targetUrl,
        violationCount: 0,
        violations: [],
        diagnose:
          "## Ergebnis\n\nKeine WCAG-Verstöße gefunden. Die Website besteht die geprüften Barrierefreiheits-Kriterien.\n\n🟢 Hinweis: Automatische Scans erkennen ~40% aller WCAG-Kriterien. Komplexe Nutzerinteraktionen sollten zusätzlich manuell geprüft werden.",
      });
    }

    // ── 4. CLAUDE: ERKLÄRUNGEN + CODE-FIXES ──────────────────────
    const violationList = violations
      .map(
        (v, i) =>
          `${i + 1}. ID: ${v.id} | Impact: ${v.impact}
   Problem: ${v.help}
   Element: ${(v.nodes[0]?.html ?? "").slice(0, 250)}
   Details: ${(v.nodes[0]?.failureSummary ?? "").slice(0, 200)}`
      )
      .join("\n\n");

    const prompt = `Du bist ein Barrierefreiheits-Experte. Eine Website wurde mit axe-core im echten Browser auf WCAG 2.1 geprüft.

URL: ${targetUrl}
Gefundene Verstöße: ${violations.length}

${violationList}

Erstelle eine strukturierte Diagnose auf Deutsch:

## Zusammenfassung
1–2 Sätze: wie barrierefrei ist die Website, was sind die größten Probleme?

## Verstöße

Für jeden Verstoß (in der gegebenen Reihenfolge):
**[🔴 KRITISCH / 🟡 WICHTIG / 🔵 INFO]** Kurzer Titel
Erklärung: 1–2 Sätze in einfachem Deutsch ohne Fachjargon. Was bedeutet das konkret für Nutzer?
Fix: Konkreter Code-Fix oder kurze Anleitung (max. 3 Zeilen Code).

## Nächste Schritte
1. ...
2. ...
3. ...

Hinweis: "Automatische Scans erkennen ~40% aller WCAG-Kriterien. Komplexe Nutzerinteraktionen bitte manuell prüfen."

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
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    console.error("WCAG-Scan-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
