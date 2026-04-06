import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const { url } = await req.json();

    // URL normalisieren
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

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

    return NextResponse.json({ success: true, scanData, diagnose });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
