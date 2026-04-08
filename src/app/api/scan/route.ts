import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Rate Limiting ───────────────────────────────────────────
const rateLimit = new Map<string, { count: number; resetAt: number; lastScan: number }>();
const globalLimit = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  if (now > globalLimit.resetAt) { globalLimit.count = 0; globalLimit.resetAt = now + 60_000; }
  if (globalLimit.count >= 15) return { allowed: false, reason: "Server ausgelastet. Bitte versuche es in einer Minute erneut." };
  globalLimit.count++;

  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000, lastScan: now }); return { allowed: true }; }
  if (now - entry.lastScan < 15_000) return { allowed: false, reason: "Bitte warte kurz zwischen den Scans (15 Sekunden)." };
  if (entry.count >= 3) return { allowed: false, reason: "Zu viele Scans. Bitte warte eine Stunde und versuche es erneut." };
  entry.count++;
  entry.lastScan = now;
  return { allowed: true };
}

// ── Fetch Helpers ───────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "WebsiteFix-Scanner/1.0" } });
    clearTimeout(timeout);
    return res;
  } catch { clearTimeout(timeout); return null; }
}

function extractBetween(html: string, start: string, end: string): string {
  const s = html.toLowerCase().indexOf(start.toLowerCase());
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.slice(s + start.length, e).trim();
}

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m ? m[1] : "";
}

// ── URL Discovery ───────────────────────────────────────────
const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf)(\?|$)/i;

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  const links = new Set<string>();
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (SKIP_EXT.test(href)) continue;
    try {
      const absolute = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
      const u = new URL(absolute);
      if (u.host === urlObj.host) {
        links.add(`${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || base);
      }
    } catch { /* ignore */ }
  }
  return [...links];
}

function extractSitemapUrls(xml: string): string[] {
  return (xml.match(/<loc>([^<]+)<\/loc>/g) ?? [])
    .map((m) => m.replace(/<\/?loc>/g, "").trim())
    .filter((u) => !u.endsWith(".xml"));
}

// ── Alt Text Check ──────────────────────────────────────────
function countMissingAlt(html: string): { missing: number; total: number } {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  const missing = imgs.filter((tag) => !tag.match(/alt=["'][^"']+["']/i)).length;
  return { missing, total: imgs.length };
}

// ── Subpage Scan ────────────────────────────────────────────
type PageResult = {
  url: string;
  erreichbar: boolean;
  status: number;
  title: string;
  h1: string;
  metaDescription: string;
  noindex: boolean;
  canonical: string;
  outgoingLinks: string[];
  altMissing: number;
  altTotal: number;
};

async function scanSubpage(url: string, baseUrl: string): Promise<PageResult> {
  const empty: PageResult = { url, erreichbar: false, status: 0, title: "", h1: "", metaDescription: "", noindex: false, canonical: "", outgoingLinks: [], altMissing: 0, altTotal: 0 };
  const res = await fetchWithTimeout(url, 6000);
  if (!res) return empty;
  const html = await res.text();
  const alt = countMissingAlt(html);
  return {
    url,
    erreichbar: res.ok,
    status: res.status,
    title: extractBetween(html, "<title>", "</title>").replace(/\s+/g, " ").trim(),
    h1: extractBetween(html, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim(),
    metaDescription: extractMeta(html, "description"),
    noindex: extractMeta(html, "robots").includes("noindex"),
    canonical: (() => { const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i); return m ? m[1] : ""; })(),
    outgoingLinks: extractInternalLinks(html, baseUrl),
    altMissing: alt.missing,
    altTotal: alt.total,
  };
}

// ── Grouping Helper ─────────────────────────────────────────
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Main Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const guard = guardRequest(req);
    if (guard.blocked) return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });

    const session = await auth();
    const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? "free";
    const isPaid = userPlan === "pro" || userPlan === "agentur";

    if (!isPaid) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = checkRateLimit(ip);
      if (!limitResult.allowed) return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });

    const maxSubpages = isPaid ? 10 : 5;
    const maxBrokenLinkChecks = isPaid ? 30 : 15;

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ───────────────────────────────────────
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
      scanData.wordpressFehler = mainHtml.includes("Es gab einen kritischen Fehler") || mainHtml.includes("There has been a critical error");
      scanData.weisseSeite = mainHtml.length < 500;
      scanData.title = extractBetween(mainHtml, "<title>", "</title>") || "";
      scanData.metaDescription = extractMeta(mainHtml, "description") || "";
      scanData.h1 = extractBetween(mainHtml, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim() || "";
      scanData.indexierungGesperrt = extractMeta(mainHtml, "robots").includes("noindex");
      const canonicalMatch = mainHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      scanData.canonical = canonicalMatch ? canonicalMatch[1] : "";
      scanData.istWordpress = mainHtml.includes("/wp-content/") || mainHtml.includes("/wp-includes/");
      scanData.formularVorhanden = mainHtml.includes("<form");
      const mainAlt = countMissingAlt(mainHtml);
      scanData.startseite_altMissing = mainAlt.missing;
      scanData.startseite_altTotal = mainAlt.total;
    }

    // ── 2. ROBOTS.TXT ───────────────────────────────────────
    const robotsRes = await fetchWithTimeout(new URL("/robots.txt", targetUrl).href, 5000);
    if (robotsRes?.ok) {
      const robotsTxt = await robotsRes.text();
      scanData.robotsTxt = robotsTxt.slice(0, 500);
      let currentAgent = "", blockedForAll = false;
      for (const line of robotsTxt.split("\n").map((l) => l.trim())) {
        if (line.toLowerCase().startsWith("user-agent:")) currentAgent = line.split(":")[1].trim();
        else if (line.toLowerCase().startsWith("disallow:")) {
          const path = line.split(":")[1]?.trim();
          if (currentAgent === "*" && (path === "/" || path === "/*")) blockedForAll = true;
        }
      }
      scanData.robotsBlockiertAlles = blockedForAll;
    } else {
      scanData.robotsTxt = "(nicht gefunden)";
      scanData.robotsBlockiertAlles = false;
    }

    // ── 3. SITEMAP + URL-DISCOVERY ──────────────────────────
    const sitemapRes = await fetchWithTimeout(new URL("/sitemap.xml", targetUrl).href, 5000);
    scanData.sitemapVorhanden = !!(sitemapRes?.ok);

    let subpageUrls: string[] = [];
    if (sitemapRes?.ok) {
      const xml = await sitemapRes.text();
      subpageUrls = extractSitemapUrls(xml).filter((u) => u !== targetUrl && u !== targetUrl + "/");
    }
    if (mainHtml && subpageUrls.length < maxSubpages) {
      const links = extractInternalLinks(mainHtml, targetUrl).filter((u) => u !== targetUrl && u !== targetUrl.replace(/\/$/, ""));
      subpageUrls = [...new Set([...subpageUrls, ...links])];
    }
    subpageUrls = subpageUrls.slice(0, maxSubpages);

    // ── 4. UNTERSEITEN PARALLEL SCANNEN ────────────────────
    const unterseiten: PageResult[] = subpageUrls.length > 0
      ? await Promise.all(subpageUrls.map((u) => scanSubpage(u, targetUrl)))
      : [];

    // ── 5. CHECK 1: DUPLICATE TITLES ───────────────────────
    const allPages = [
      { url: targetUrl, title: scanData.title as string, metaDescription: scanData.metaDescription as string },
      ...unterseiten.filter((p) => p.erreichbar).map((p) => ({ url: p.url, title: p.title, metaDescription: p.metaDescription })),
    ];

    const titleGroups = groupBy(allPages.filter((p) => p.title), (p) => p.title.toLowerCase().trim());
    const duplicateTitles = Object.entries(titleGroups)
      .filter(([, pages]) => pages.length > 1)
      .map(([title, pages]) => ({ title: title.slice(0, 80), seiten: pages.map((p) => p.url) }));

    // ── 6. CHECK 2: DUPLICATE META DESCRIPTIONS ────────────
    const metaGroups = groupBy(allPages.filter((p) => p.metaDescription), (p) => p.metaDescription.toLowerCase().trim());
    const duplicateMetas = Object.entries(metaGroups)
      .filter(([, pages]) => pages.length > 1)
      .map(([meta, pages]) => ({ meta: meta.slice(0, 80) + "…", seiten: pages.map((p) => p.url) }));

    // ── 7. CHECK 3: MISSING ALT TEXTS ──────────────────────
    const totalAltMissing = (scanData.startseite_altMissing as number) + unterseiten.reduce((s, p) => s + p.altMissing, 0);
    const totalImages = (scanData.startseite_altTotal as number) + unterseiten.reduce((s, p) => s + p.altTotal, 0);

    // ── 8. CHECK 4: BROKEN LINKS ───────────────────────────
    // Alle ausgehenden internen Links sammeln die noch nicht gescannt wurden
    const scannedUrls = new Set([targetUrl, targetUrl.replace(/\/$/, ""), ...unterseiten.map((p) => p.url)]);
    const allOutgoing = new Set<string>();
    if (mainHtml) extractInternalLinks(mainHtml, targetUrl).forEach((l) => allOutgoing.add(l));
    unterseiten.forEach((p) => p.outgoingLinks.forEach((l) => allOutgoing.add(l)));

    const linksToCheck = [...allOutgoing].filter((l) => !scannedUrls.has(l)).slice(0, maxBrokenLinkChecks);
    const brokenLinkResults = await Promise.all(
      linksToCheck.map(async (linkUrl) => {
        const res = await fetchWithTimeout(linkUrl, 4000);
        return { url: linkUrl, status: res?.status ?? 0, broken: !res?.ok };
      })
    );
    const brokenLinks = brokenLinkResults.filter((r) => r.broken);

    // ── 9. CHECK 5: VERWAISTE SEITEN ───────────────────────
    // Seiten aus Sitemap/Discovery die kein eingehender interner Link von gescannten Seiten hat
    const orphanedPages = subpageUrls.filter((u) => {
      const uNorm = u.replace(/\/$/, "");
      return !allOutgoing.has(u) && !allOutgoing.has(uNorm) && !allOutgoing.has(u + "/");
    });

    // ── Audit-Ergebnisse zusammenführen ────────────────────
    const audit = {
      gescannteSeiten: unterseiten.length + 1,
      unterseiten: unterseiten.map((p) => ({
        url: p.url, erreichbar: p.erreichbar, status: p.status,
        title: p.title || "(kein Title)", h1: p.h1 || "(kein H1)",
        noindex: p.noindex, altMissing: p.altMissing,
      })),
      duplicateTitles,
      duplicateMetas,
      altTexte: { fehlend: totalAltMissing, gesamt: totalImages },
      brokenLinks: brokenLinks.map((b) => ({ url: b.url, status: b.status })),
      verwaistSeiten: orphanedPages,
    };

    scanData.audit = audit;

    // ── 10. CLAUDE DIAGNOSE ─────────────────────────────────
    const prompt = `Du bist ein freundlicher Website-Experte der Menschen ohne Technik-Kenntnisse hilft.

Website: ${targetUrl}
Gescannte Seiten: ${audit.gescannteSeiten} (Startseite + ${unterseiten.length} Unterseiten)

STARTSEITE:
- Title: "${scanData.title || "(fehlt)"}"
- Meta Description: "${scanData.metaDescription || "(fehlt)"}"
- H1: "${scanData.h1 || "(fehlt)"}"
- HTTPS: ${scanData.https}
- Noindex: ${scanData.indexierungGesperrt}
- Sitemap vorhanden: ${scanData.sitemapVorhanden}
- Robots.txt blockiert alles: ${scanData.robotsBlockiertAlles}
- WordPress Fehler: ${scanData.wordpressFehler}

UNTERSEITEN (${unterseiten.length}):
${unterseiten.map((p) => `  ${p.url}: ${p.erreichbar ? `OK (${p.status})` : "NICHT ERREICHBAR"} | Title: "${p.title || "fehlt"}" | noindex: ${p.noindex} | Alt-Texte fehlend: ${p.altMissing}`).join("\n") || "  (keine)"}

AUDIT-ERGEBNISSE:

1. Doppelte Title-Tags (${duplicateTitles.length} gefunden):
${duplicateTitles.map((d) => `   "${d.title}" → ${d.seiten.join(", ")}`).join("\n") || "   Keine Duplikate — gut!"}

2. Doppelte Meta Descriptions (${duplicateMetas.length} gefunden):
${duplicateMetas.map((d) => `   "${d.meta}" → ${d.seiten.join(", ")}`).join("\n") || "   Keine Duplikate — gut!"}

3. Fehlende Alt-Texte: ${totalAltMissing} von ${totalImages} Bildern ohne Alt-Text

4. Broken Links (${brokenLinks.length} gefunden):
${brokenLinks.map((b) => `   ${b.url} → Status ${b.status}`).join("\n") || "   Keine defekten Links — gut!"}

5. Verwaiste Seiten ohne internen Link (${orphanedPages.length} gefunden):
${orphanedPages.map((u) => `   ${u}`).join("\n") || "   Keine verwaisten Seiten — gut!"}

Erstelle eine klare Diagnose auf Deutsch:

## Zusammenfassung
2-3 Sätze: Gesamtzustand der Website. Wie viele Seiten gescannt, was sind die wichtigsten Befunde?

## Befunde
Für jeden relevanten Befund (schwerwiegendste zuerst):
**[🔴 KRITISCH / 🟡 WICHTIG / 🟢 OK]** Kurzer Titel
Erklärung in einfachem Deutsch (max 2 Sätze). Nenne konkrete URLs wenn relevant.

## Wichtigste nächste Schritte
1. ...
2. ...
3. ...

Schreib freundlich, klar und ohne Fachjargon. Wenn alles gut ist, sag das deutlich.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    // Scan speichern
    try {
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        const issueCount = [
          !scanData.https,
          !scanData.erreichbar,
          !scanData.title,
          !scanData.metaDescription,
          !scanData.h1,
          scanData.robotsBlockiertAlles,
          !scanData.sitemapVorhanden,
          unterseiten.some((p) => !p.erreichbar),
          duplicateTitles.length > 0,
          duplicateMetas.length > 0,
          totalAltMissing > 0,
          brokenLinks.length > 0,
          orphanedPages.length > 0,
        ].filter(Boolean).length;
        await sql`INSERT INTO scans (user_id, url, type, issue_count, result)
          VALUES (${session.user.id}, ${targetUrl}, 'website', ${issueCount}, ${diagnose})`;
      }
    } catch { /* optional */ }

    return NextResponse.json({ success: true, scanData, diagnose });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json({ success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
