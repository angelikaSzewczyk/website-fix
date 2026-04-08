import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate Limiting: max 3 Scans pro IP pro Stunde, min. 15 Sekunden Abstand
const rateLimit = new Map<string, { count: number; resetAt: number; lastScan: number }>();

// Globale Bremse: max 15 Scans pro Minute über alle IPs (pro Instanz)
const globalLimit = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  if (now > globalLimit.resetAt) {
    globalLimit.count = 0;
    globalLimit.resetAt = now + 60 * 1000;
  }
  if (globalLimit.count >= 15) {
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

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
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

function extractBetween(html: string, start: string, end: string): string {
  const s = html.toLowerCase().indexOf(start.toLowerCase());
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.slice(s + start.length, e).trim();
}

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

// Interne Links aus HTML extrahieren
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  const links = new Set<string>();
  const skipExt = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf)(\?|$)/i;
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (skipExt.test(href)) continue;
    try {
      const absolute = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
      const u = new URL(absolute);
      // Nur gleiche Domain, kein Fragment, keine Query-Params für saubere URLs
      if (u.host === urlObj.host) {
        const clean = `${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || base;
        links.add(clean);
      }
    } catch { /* ungültige URL überspringen */ }
  }
  return [...links];
}

// URLs aus sitemap.xml extrahieren
function extractSitemapUrls(xml: string): string[] {
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) ?? [];
  return matches
    .map((m) => m.replace(/<\/?loc>/g, "").trim())
    .filter((u) => !u.endsWith(".xml")); // sitemap-index-Einträge überspringen
}

// Einzelne Unterseite scannen
async function scanSubpage(url: string) {
  const res = await fetchWithTimeout(url, 6000);
  if (!res) return { url, erreichbar: false, status: 0 };
  const html = await res.text();
  return {
    url,
    erreichbar: res.ok,
    status: res.status,
    title: extractBetween(html, "<title>", "</title>").replace(/\s+/g, " ").trim() || "(kein Title)",
    h1: extractBetween(html, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim() || "(kein H1)",
    metaDescription: extractMeta(html, "description") || "(keine Meta-Description)",
    noindex: extractMeta(html, "robots").includes("noindex"),
    canonical: (() => {
      const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      return m ? m[1] : "";
    })(),
    formularVorhanden: html.includes("<form"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const guard = guardRequest(req);
    if (guard.blocked) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });
    }

    const session = await auth();
    const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? "free";
    const isPaid = userPlan === "pro" || userPlan === "agentur";

    if (!isPaid) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = checkRateLimit(ip);
      if (!limitResult.allowed) {
        return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
      }
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

    // Maximale Unterseiten je nach Plan
    const maxSubpages = isPaid ? 10 : 5;

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ABRUFEN ──────────────────────────────────
    const mainRes = await fetchWithTimeout(targetUrl);
    let mainHtml = "";

    if (!mainRes) {
      scanData.erreichbar = false;
      scanData.fehler = "Website nicht erreichbar (Timeout oder DNS-Fehler)";
    } else {
      scanData.erreichbar = true;
      scanData.statusCode = mainRes.status;
      scanData.https = targetUrl.startsWith("https://");

      mainHtml = await mainRes.text();
      scanData.htmlLaenge = mainHtml.length;

      scanData.wordpressFehler =
        mainHtml.includes("Es gab einen kritischen Fehler") ||
        mainHtml.includes("There has been a critical error") ||
        mainHtml.includes("critical error on your website");

      scanData.weisseSeite = mainHtml.length < 500;

      scanData.title = extractBetween(mainHtml, "<title>", "</title>") || "(kein Title gefunden)";
      scanData.metaDescription = extractMeta(mainHtml, "description") || "(keine Meta-Description)";
      scanData.h1 = extractBetween(mainHtml, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim() || "(kein H1)";

      const robotsMeta = extractMeta(mainHtml, "robots");
      scanData.indexierungGesperrt = robotsMeta.includes("noindex");

      const canonicalMatch = mainHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      scanData.canonical = canonicalMatch ? canonicalMatch[1] : "(kein Canonical)";

      scanData.istWordpress =
        mainHtml.includes("/wp-content/") ||
        mainHtml.includes("/wp-includes/") ||
        mainHtml.includes("wp-json");

      scanData.formularVorhanden = mainHtml.includes("<form");
    }

    // ── 2. ROBOTS.TXT ──────────────────────────────────────────
    const robotsUrl = new URL("/robots.txt", targetUrl).href;
    const robotsRes = await fetchWithTimeout(robotsUrl, 5000);
    if (robotsRes && robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      scanData.robotsTxt = robotsTxt.slice(0, 500);
      const robotsLines = robotsTxt.split("\n").map((l: string) => l.trim());
      let currentAgent = "";
      let blockedForAll = false;
      for (const line of robotsLines) {
        if (line.toLowerCase().startsWith("user-agent:")) {
          currentAgent = line.split(":")[1].trim();
        } else if (line.toLowerCase().startsWith("disallow:")) {
          const path = line.split(":")[1]?.trim();
          if (currentAgent === "*" && (path === "/" || path === "/*")) {
            blockedForAll = true;
          }
        }
      }
      scanData.robotsBlockiertAlles = blockedForAll;
    } else {
      scanData.robotsTxt = "(nicht gefunden)";
      scanData.robotsBlockiertAlles = false;
    }

    // ── 3. SITEMAP + UNTERSEITEN ENTDECKEN ─────────────────────
    const sitemapUrl = new URL("/sitemap.xml", targetUrl).href;
    const sitemapRes = await fetchWithTimeout(sitemapUrl, 5000);
    scanData.sitemapVorhanden = !!(sitemapRes && sitemapRes.ok);

    let subpageUrls: string[] = [];

    // Sitemap parsen
    if (sitemapRes && sitemapRes.ok) {
      const sitemapXml = await sitemapRes.text();
      const sitemapUrls = extractSitemapUrls(sitemapXml)
        .filter((u) => u !== targetUrl && u !== targetUrl + "/");
      subpageUrls = [...subpageUrls, ...sitemapUrls];
    }

    // Interne Links aus Homepage extrahieren (ergänzend / Fallback)
    if (mainHtml && subpageUrls.length < maxSubpages) {
      const internalLinks = extractInternalLinks(mainHtml, targetUrl)
        .filter((u) => u !== targetUrl && u !== targetUrl.replace(/\/$/, ""));
      subpageUrls = [...new Set([...subpageUrls, ...internalLinks])];
    }

    // Auf maxSubpages begrenzen
    subpageUrls = subpageUrls.slice(0, maxSubpages);

    // ── 4. UNTERSEITEN PARALLEL SCANNEN ────────────────────────
    let unterseiten: Awaited<ReturnType<typeof scanSubpage>>[] = [];
    if (subpageUrls.length > 0) {
      unterseiten = await Promise.all(subpageUrls.map((u) => scanSubpage(u)));
    }
    scanData.unterseiten = unterseiten;
    scanData.gescannteSeiten = unterseiten.length + 1;

    // Aggregierte Probleme
    const nichtErreichbar = unterseiten.filter((p) => !p.erreichbar).length;
    const ohneTitle = unterseiten.filter((p) => p.erreichbar && p.title === "(kein Title)").length;
    const noindexSeiten = unterseiten.filter((p) => p.noindex).length;
    scanData.unterseiten_nichtErreichbar = nichtErreichbar;
    scanData.unterseiten_ohneTitle = ohneTitle;
    scanData.unterseiten_noindex = noindexSeiten;

    // ── 5. CLAUDE DIAGNOSE ─────────────────────────────────────
    const unterseitenText = unterseiten.length > 0
      ? `\n\nGESCANNTE UNTERSEITEN (${unterseiten.length} Seiten zusätzlich zur Startseite):\n` +
        unterseiten.map((p) =>
          `- ${p.url}: ${p.erreichbar ? `Status ${p.status}` : "NICHT ERREICHBAR"} | Title: "${p.title}" | H1: "${p.erreichbar && "h1" in p ? p.h1 : "—"}" | noindex: ${p.noindex ?? false}`
        ).join("\n") +
        `\n\nZusammenfassung Unterseiten: ${nichtErreichbar} nicht erreichbar, ${ohneTitle} ohne Title-Tag, ${noindexSeiten} mit noindex.`
      : "\n\nKeine Unterseiten gefunden (keine Sitemap, keine internen Links erkennbar).";

    const prompt = `Du bist ein freundlicher Website-Experte der Menschen ohne Technik-Kenntnisse hilft.

Du hast folgende Website gescannt: ${scanData.url}
Insgesamt gescannte Seiten: ${scanData.gescannteSeiten} (Startseite + ${unterseiten.length} Unterseiten)

SCAN-ERGEBNISSE STARTSEITE:
${JSON.stringify({ ...scanData, unterseiten: undefined }, null, 2)}
${unterseitenText}

Erstelle eine klare Diagnose auf Deutsch in diesem Format:

## Zusammenfassung
Ein oder zwei Sätze: was ist der allgemeine Zustand der Website? Erwähne wie viele Seiten gescannt wurden.

## Befunde

Für jeden Befund (Startseite UND Unterseiten, priorisiert nach Schwere):
**[🔴 KRITISCH / 🟡 WICHTIG / 🟢 OK]** Titel des Problems
Erklärung in einfachem Deutsch (max 2-3 Sätze, keine Fachbegriffe). Wenn Unterseiten betroffen sind, nenne konkret welche.

## Wichtigste nächste Schritte
1. ...
2. ...
3. ...

Schreib freundlich, klar und ohne Fachjargon. Erkläre als würdest du mit jemandem sprechen der keine IT-Kenntnisse hat.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const diagnose =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Scan für eingeloggte User speichern
    try {
      const session = await auth();
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        const booleanIssues = [
          !scanData.httpsAktiv,
          !scanData.erreichbar,
          !scanData.titleVorhanden,
          !scanData.metaDescriptionVorhanden,
          !scanData.h1Vorhanden,
          scanData.robotsBlockiertAlles,
          !scanData.sitemapVorhanden,
          nichtErreichbar > 0,
          ohneTitle > 0,
          noindexSeiten > 0,
        ].filter(Boolean).length;
        await sql`
          INSERT INTO scans (user_id, url, type, issue_count, result)
          VALUES (${session.user.id}, ${scanData.url}, 'website', ${booleanIssues}, ${diagnose})
        `;
      }
    } catch { /* Scan-Speicherung ist optional */ }

    return NextResponse.json({ success: true, scanData, diagnose });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
