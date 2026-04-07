import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate Limiting: max 3 Scans pro IP pro Stunde, min. 15 Sekunden Abstand
const rateLimit = new Map<string, { count: number; resetAt: number; lastScan: number }>();

// Globale Bremse: max 15 Scans pro Minute über alle IPs (pro Instanz)
const globalLimit = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Globale Bremse prüfen
  if (now > globalLimit.resetAt) {
    globalLimit.count = 0;
    globalLimit.resetAt = now + 60 * 1000;
  }
  if (globalLimit.count >= 15) {
    return { allowed: false, reason: "Server ausgelastet. Bitte versuche es in einer Minute erneut." };
  }
  globalLimit.count++;

  // IP-basiertes Limit
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000, lastScan: now });
    return { allowed: true };
  }

  // Mindestabstand: 15 Sekunden zwischen Scans
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

// Hilfsfunktion: Website abrufen mit Timeout
async function fetchWithTimeout(url: string, timeoutMs = 10000) {
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

// Hilfsfunktion: Text zwischen zwei Strings extrahieren
function extractBetween(html: string, start: string, end: string): string {
  const s = html.toLowerCase().indexOf(start.toLowerCase());
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.slice(s + start.length, e).trim();
}

// Hilfsfunktion: Meta-Tag-Inhalt extrahieren
function extractMeta(html: string, name: string): string {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(regex) ||
    html.match(new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
      "i"
    ));
  return match ? match[1] : "";
}

export async function POST(req: NextRequest) {
  try {
    // Origin + User-Agent prüfen
    const guard = guardRequest(req);
    if (guard.blocked) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });
    }

    // Pro/Agentur-User überspringen Rate Limit
    const session = await auth();
    const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? "free";
    const isPaid = userPlan === "pro" || userPlan === "agentur";

    if (!isPaid) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = checkRateLimit(ip);
      if (!limitResult.allowed) {
        return NextResponse.json(
          { success: false, error: limitResult.reason },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Bitte gib eine gültige URL ein." },
        { status: 400 }
      );
    }

    // URL normalisieren
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    // SSRF-Schutz
    if (!isUrlAllowed(targetUrl)) {
      return NextResponse.json(
        { success: false, error: "Diese URL kann nicht gescannt werden." },
        { status: 400 }
      );
    }

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ABRUFEN ──────────────────────────────────
    const mainRes = await fetchWithTimeout(targetUrl);

    if (!mainRes) {
      scanData.erreichbar = false;
      scanData.fehler = "Website nicht erreichbar (Timeout oder DNS-Fehler)";
    } else {
      scanData.erreichbar = true;
      scanData.statusCode = mainRes.status;
      scanData.https = targetUrl.startsWith("https://");

      const html = await mainRes.text();
      scanData.htmlLaenge = html.length;

      // WordPress-Fehler erkennen
      scanData.wordpressFehler =
        html.includes("Es gab einen kritischen Fehler") ||
        html.includes("There has been a critical error") ||
        html.includes("critical error on your website");

      scanData.weisseSeite = html.length < 500;

      // SEO-Grunddaten
      scanData.title = extractBetween(html, "<title>", "</title>") || "(kein Title gefunden)";
      scanData.metaDescription = extractMeta(html, "description") || "(keine Meta-Description)";
      scanData.h1 = extractBetween(html, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim() || "(kein H1)";

      // robots meta
      const robotsMeta = extractMeta(html, "robots");
      scanData.indexierungGesperrt = robotsMeta.includes("noindex");

      // Canonical
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      scanData.canonical = canonicalMatch ? canonicalMatch[1] : "(kein Canonical)";

      // WordPress erkannt
      scanData.istWordpress =
        html.includes("/wp-content/") ||
        html.includes("/wp-includes/") ||
        html.includes("wp-json");

      // Formular vorhanden
      scanData.formularVorhanden = html.includes("<form");
    }

    // ── 2. ROBOTS.TXT ──────────────────────────────────────────
    const robotsUrl = new URL("/robots.txt", targetUrl).href;
    const robotsRes = await fetchWithTimeout(robotsUrl, 5000);
    if (robotsRes && robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      scanData.robotsTxt = robotsTxt.slice(0, 500);
      scanData.robotsBlockiertAlles =
        robotsTxt.includes("Disallow: /") && !robotsTxt.includes("Disallow: /wp-admin");
    } else {
      scanData.robotsTxt = "(nicht gefunden)";
      scanData.robotsBlockiertAlles = false;
    }

    // ── 3. SITEMAP ─────────────────────────────────────────────
    const sitemapUrl = new URL("/sitemap.xml", targetUrl).href;
    const sitemapRes = await fetchWithTimeout(sitemapUrl, 5000);
    scanData.sitemapVorhanden = !!(sitemapRes && sitemapRes.ok);

    // ── 4. CLAUDE DIAGNOSE ─────────────────────────────────────
    const prompt = `Du bist ein freundlicher Website-Experte der Menschen ohne Technik-Kenntnisse hilft.

Du hast folgende Website gescannt: ${scanData.url}

SCAN-ERGEBNISSE:
${JSON.stringify(scanData, null, 2)}

Erstelle eine klare Diagnose auf Deutsch in diesem Format:

## Zusammenfassung
Ein oder zwei Sätze: was ist der allgemeine Zustand der Website?

## Befunde

Für jeden Befund:
**[🔴 KRITISCH / 🟡 WICHTIG / 🟢 OK]** Titel des Problems
Erklärung in einfachem Deutsch (max 2-3 Sätze, keine Fachbegriffe)

## Wichtigste nächste Schritte
1. ...
2. ...
3. ...

Schreib freundlich, klar und ohne Fachjargon. Erkläre als würdest du mit jemandem sprechen der keine IT-Kenntnisse hat.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const diagnose =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Scan für eingeloggte User speichern
    try {
      const session = await auth();
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        // Probleme zählen: false-Werte bei Boolean-Checks = Problem
        const booleanIssues = [
          !scanData.httpsAktiv,
          !scanData.erreichbar,
          !scanData.titleVorhanden,
          !scanData.metaDescriptionVorhanden,
          !scanData.h1Vorhanden,
          scanData.robotsBlockiertAlles,
          !scanData.sitemapVorhanden,
        ].filter(Boolean).length;
        await sql`
          INSERT INTO scans (user_id, url, type, issue_count)
          VALUES (${session.user.id}, ${scanData.url}, 'website', ${booleanIssues})
        `;
      }
    } catch { /* Scan-Speicherung ist optional — kein Fehler wenn nicht eingeloggt */ }

    return NextResponse.json({ success: true, scanData, diagnose });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
