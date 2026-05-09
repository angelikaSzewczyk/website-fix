import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { checkIpRateLimit } from "@/lib/ip-rate-limit";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { MODELS } from "@/lib/ai-models";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Chromium download URL — aus Env-Var oder GitHub Releases.
// 09.05.2026: Version muss zu @sparticuz/chromium-min (^143.0.4 in package.json)
// passen. Vorher v131.0.0 → 'browserType.launch: Target page closed' weil
// Wrapper- und Pack-Version inkompatibel waren.
const CHROMIUM_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

// Globale Bremse: max 3 WCAG-Scans pro Minute (Playwright + Claude = teuer)
const globalLimit = { count: 0, resetAt: 0 };

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

    const now = Date.now();
    if (now > globalLimit.resetAt) { globalLimit.count = 0; globalLimit.resetAt = now + 60_000; }
    if (globalLimit.count >= 3) {
      return NextResponse.json({ success: false, error: "Server ausgelastet. Bitte versuche es in einer Minute erneut." }, { status: 429 });
    }
    globalLimit.count++;

    // 09.05.2026: IP-Rate-Limit (2 Scans / 24h) ist nur für ANONYME User —
    // eingeloggte Starter+ haben ihre eigenen Plan-Quotas (siehe getPlanQuota).
    // Vorher wurde checkIpRateLimit ohne Auth-Check aufgerufen → eingeloggte
    // User mit gleicher IP wurden mitgeblockt, obwohl sie zahlen.
    const session = await auth();
    if (!session?.user?.id) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = await checkIpRateLimit(ip);
      if (!limitResult.allowed) {
        return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
      }
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
    // CDN-URL ist zuverlässiger als bundled source — setzt window.axe korrekt.
    await page.addScriptTag({
      url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js",
    });
    // Warten bis axe auf window verfügbar ist
    await page.waitForFunction(() => typeof (window as unknown as { axe?: unknown }).axe !== "undefined", { timeout: 10000 });

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
      model: MODELS.SCAN,
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    // Scan für eingeloggte User speichern
    try {
      const session = await auth();
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`
          INSERT INTO scans (user_id, url, type, issue_count, result)
          VALUES (${session.user.id}, ${targetUrl}, 'wcag', ${violations.length}, ${diagnose})
        `;
      }
    } catch { /* optional */ }

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

    // Fehler kategorisieren — vorher (09.05.2026) wurde IMMER 'Scan fehlgeschlagen.
    // Bitte versuche es erneut.' zurückgegeben, was bei wirklichen Issues wie
    // Chromium-Download-Timeout oder axe-Injection-Block dazu führte, dass User
    // immer wieder denselben kaputten Scan versuchen.
    const rawMsg = err instanceof Error ? err.message : String(err);
    const lower = rawMsg.toLowerCase();
    let userMsg: string;
    if (lower.includes("timeout") && (lower.includes("goto") || lower.includes("page"))) {
      userMsg = "Die Website hat in 25s nicht geladen. Bei sehr großen WP-Setups oder Cold-Cache reicht das oft nicht — versuche einen erneuten Scan in 1-2 Min.";
    } else if (lower.includes("chromium") || lower.includes("executablepath") || lower.includes("downloading")) {
      userMsg = "Headless-Chromium konnte nicht heruntergeladen werden — Server-Setup-Problem. Bitte melde dich beim Support, wenn das wiederholt auftritt.";
    } else if (lower.includes("axe") || lower.includes("scripttag")) {
      userMsg = "axe-core konnte nicht in die Seite injiziert werden. Möglicherweise blockt eine strenge Content-Security-Policy externe Scripts.";
    } else if (lower.includes("anthropic") || lower.includes("api_key") || lower.includes("claude")) {
      userMsg = "KI-Diagnose nicht erreichbar — der reine axe-core-Scan hat aber funktioniert. Versuche es in 1 Min nochmal.";
    } else if (lower.includes("function timeout") || lower.includes("504") || lower.includes("max_duration")) {
      userMsg = "Scan hat das 60s-Zeitlimit überschritten. Sehr langsame Sites schaffen das im Headless-Audit nicht — die Heuristik im Dashboard ist hier robuster.";
    } else {
      userMsg = `Scan fehlgeschlagen: ${rawMsg.slice(0, 180)}`;
    }

    // Zur DB loggen, damit wir wiederkehrende Probleme später diagnostizieren können.
    try {
      const session = await auth();
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`
          INSERT INTO scan_log (user_id, url, scan_type, status, error_msg, from_cache)
          VALUES (${session.user.id}, ${"unknown"}, 'wcag', 'error', ${rawMsg.slice(0, 500)}, FALSE)
        `;
      }
    } catch { /* optional */ }

    return NextResponse.json(
      { success: false, error: userMsg },
      { status: 500 }
    );
  }
}
