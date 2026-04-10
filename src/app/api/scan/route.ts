import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed, isRealWebsiteContent } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { callWithRetry } from "@/lib/ai-retry";
import { getCachedScan, saveScanAsync, cacheTtlHours } from "@/lib/scan-cache";
import { logScan } from "@/lib/scan-logger";
import { batchAsync } from "@/lib/batch-async";
import { MODELS } from "@/lib/ai-models";
import { buildFingerprintFromRaw } from "@/lib/tech-detector";
import { buildRawWebsiteData } from "@/lib/tech-detector/fetcher";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Compute issue count from scanData ───────────────────────
function computeIssueCount(sd: Record<string, unknown>): number {
  const audit = sd.audit as {
    unterseiten?: { erreichbar: boolean }[];
    duplicateTitles?: unknown[];
    duplicateMetas?: unknown[];
    altTexte?: { fehlend: number };
    brokenLinks?: unknown[];
    verwaistSeiten?: unknown[];
  } | undefined;
  return [
    !sd.https,
    !sd.erreichbar,
    !sd.title,
    !sd.metaDescription,
    !sd.h1,
    sd.robotsBlockiertAlles,
    !sd.sitemapVorhanden,
    audit?.unterseiten?.some(p => !p.erreichbar),
    (audit?.duplicateTitles?.length ?? 0) > 0,
    (audit?.duplicateMetas?.length ?? 0) > 0,
    (audit?.altTexte?.fehlend ?? 0) > 0,
    (audit?.brokenLinks?.length ?? 0) > 0,
    (audit?.verwaistSeiten?.length ?? 0) > 0,
  ].filter(Boolean).length;
}

// ── Save scan to user's history ──────────────────────────────
async function saveUserScan(params: {
  userId: string;
  url: string;
  issueCount: number;
  diagnose: string;
  techFingerprint?: unknown;
}): Promise<string | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      INSERT INTO scans (user_id, url, type, issue_count, result, tech_fingerprint)
      VALUES (
        ${params.userId}, ${params.url}, 'website',
        ${params.issueCount}, ${params.diagnose},
        ${params.techFingerprint ? JSON.stringify(params.techFingerprint) : null}
      )
      RETURNING id::text
    ` as { id: string }[];
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("DB write error:", err);
    return null;
  }
}

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

// ── Form Accessibility Check ────────────────────────────────
function checkFormAccessibility(html: string): { formsCount: number; inputsWithoutLabel: number; buttonsWithoutText: number } {
  const formsCount = (html.match(/<form[^>]*>/gi) ?? []).length;
  // Inputs of interactive types that need a label
  const inputs = html.match(/<input[^>]*type=["']?(?:text|email|tel|number|search|password|url)[^>]*>/gi) ?? [];
  const inputsWithoutLabel = inputs.filter(tag => {
    if (/aria-label=["'][^"']+["']/i.test(tag)) return false;
    if (/aria-labelledby=["'][^"']+["']/i.test(tag)) return false;
    const idMatch = tag.match(/\sid=["']([^"']+)["']/i);
    if (idMatch) {
      const id = idMatch[1];
      if (html.includes(`for="${id}"`) || html.includes(`for='${id}'`)) return false;
    }
    return true;
  }).length;
  // Buttons without visible text or aria-label
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) ?? [];
  const buttonsWithoutText = buttons.filter(btn => {
    if (/aria-label=["'][^"']+["']/i.test(btn)) return false;
    const inner = btn.replace(/<[^>]+>/g, "").trim();
    return inner.length === 0;
  }).length;
  return { formsCount, inputsWithoutLabel, buttonsWithoutText };
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
    const isPaid = ["pro", "freelancer", "agentur", "agency_core", "agency_scale"].includes(userPlan);

    if (!isPaid) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = checkRateLimit(ip);
      if (!limitResult.allowed) return NextResponse.json({ success: false, error: limitResult.reason }, { status: 429 });
    }

    const body = await req.json();
    const { url, forceRefresh } = body as { url?: string; forceRefresh?: boolean };
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });

    const scanStart = Date.now();

    // ── Cache check — skipped when forceRefresh=true ────────
    if (!forceRefresh) {
      const ttl    = cacheTtlHours(userPlan);
      const cached = await getCachedScan(targetUrl, ttl);
      if (cached) {
        const { cachedAt, ...payload } = cached;
        // Still save to this user's scan history even on cache hit
        let scanId: string | null = null;
        if (session?.user?.id) {
          const issueCount = computeIssueCount(cached.scanData);
          const fp = cached.scanData.techFingerprint;
          scanId = await saveUserScan({
            userId: session.user.id,
            url: targetUrl,
            issueCount,
            diagnose: cached.diagnose,
            techFingerprint: fp,
          });
        }
        logScan({ userId: session?.user?.id, url: targetUrl, scanType: "website", status: "cached", fromCache: true });
        return NextResponse.json({ success: true, fromCache: true, cachedAt, scanId, ...payload });
      }
    }

    const maxSubpages = isPaid ? 50 : 25;
    const maxBrokenLinkChecks = isPaid ? 30 : 15;

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ───────────────────────────────────────
    const mainRes = await fetchWithTimeout(targetUrl);

    // Früh-Abbruch: Seite nicht erreichbar oder kein echter Inhalt
    if (!mainRes) {
      return NextResponse.json(
        { success: false, error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    let mainHtml = "";
    try {
      mainHtml = await mainRes.text();
    } catch {
      return NextResponse.json(
        { success: false, error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Tech fingerprint — runs against the already-fetched HTML ─────────────
    // buildFingerprintFromRaw is synchronous; no extra HTTP request needed.
    const techFingerprint = buildFingerprintFromRaw(
      buildRawWebsiteData({ url: targetUrl, response: mainRes, html: mainHtml }),
    );

    const host0 = (() => { try { return new URL(targetUrl).hostname; } catch { return targetUrl; } })();
    if (!isRealWebsiteContent(mainRes, mainHtml, host0)) {
      return NextResponse.json(
        { success: false, error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    scanData.erreichbar = true;
    scanData.statusCode = mainRes.status;
    scanData.https = targetUrl.startsWith("https://");
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
    const formCheck = checkFormAccessibility(mainHtml);
    scanData.formCheck = formCheck;
    const mainAlt = countMissingAlt(mainHtml);
    scanData.startseite_altMissing = mainAlt.missing;
    scanData.startseite_altTotal = mainAlt.total;

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

    // ── 4. UNTERSEITEN SCANNEN — in Batches von 5 ──────────
    // Batching prevents hammering the target server and avoids hitting
    // Vercel's connection limits when 30 agencies scan simultaneously.
    const unterseiten: PageResult[] = subpageUrls.length > 0
      ? await batchAsync(subpageUrls, 5, (u) => scanSubpage(u, targetUrl), 200)
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
    // Batch broken-link checks 10 at a time — avoids 30-connection bursts
    const brokenLinkResults = await batchAsync(
      linksToCheck,
      10,
      async (linkUrl) => {
        const res = await fetchWithTimeout(linkUrl, 4000);
        return { url: linkUrl, status: res?.status ?? 0, broken: !res?.ok };
      },
      100,
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
    scanData.techFingerprint = techFingerprint;

    // ── 10. CLAUDE DIAGNOSE ─────────────────────────────────
    // Token-optimised prompt: paths only (not full URLs), counts over lists,
    // compact issue format. Target: ~900 input tokens instead of ~1800.
    const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };

    const fc = scanData.formCheck as { formsCount: number; inputsWithoutLabel: number; buttonsWithoutText: number } | undefined;

    const prompt = `360° Business Health Check: ${host0} | ${audit.gescannteSeiten} Seiten gescannt

TECHNISCH: title="${scanData.title || "fehlt"}" | meta="${scanData.metaDescription ? "ok" : "fehlt"}" | h1="${scanData.h1 ? "ok" : "fehlt"}" | https=${scanData.https} | noindex=${scanData.indexierungGesperrt} | sitemap=${scanData.sitemapVorhanden} | robots-block=${scanData.robotsBlockiertAlles}${scanData.wordpressFehler ? " | WP-FEHLER!" : ""}

BFSG / BARRIEREFREIHEIT: Formulare=${fc?.formsCount ?? 0} | Eingaben ohne Label=${fc?.inputsWithoutLabel ?? 0} | Buttons ohne Text=${fc?.buttonsWithoutText ?? 0} | Alt-Texte fehlend=${totalAltMissing}/${totalImages}

UNTERSEITEN:
${unterseiten.map((p) => `${toPath(p.url)}: ${p.erreichbar ? "ok" : "DOWN"} | title=${p.title ? "ok" : "fehlt"} | h1=${p.h1 ? "ok" : "fehlt"} | noindex=${p.noindex} | alt-missing=${p.altMissing}`).join("\n") || "(keine)"}

BEFUNDE:
- Doppelte Titles: ${duplicateTitles.length}
- Doppelte Metas: ${duplicateMetas.length}
- Broken Links: ${brokenLinks.length} (${brokenLinks.slice(0,3).map(b => `${toPath(b.url)} ${b.status}`).join(", ") || "keine"})
- Verwaiste Seiten: ${orphanedPages.length}

Erstelle einen 360° Business Health Check Bericht auf Deutsch. Fokus: Umsatzverluste, Rechtspflichten, Nutzererlebnis.

## Zusammenfassung (2-3 Sätze — konkrete Business-Auswirkung)
## Befunde (schwerwiegendste zuerst)
**[🔴 KRITISCH / 🟡 WICHTIG / 🟢 OK]** Titel — Erklärung mit Business-Bezug (max 2 Sätze, kein Fachjargon)${fc && fc.inputsWithoutLabel > 0 ? `\nHINWEIS: ${fc.inputsWithoutLabel} Formularfeld(er) ohne Label gefunden — als KRITISCH BFSG-Befund ausgeben.` : ""}
## 🚦 Dringlichkeits-Ampel
🔴 Kritisch (sofort handeln): Liste der kritischen Punkte
🟡 Optimierung (binnen 30 Tagen): Liste der wichtigen Punkte
🟢 Gut (bereits erfüllt): Was bereits funktioniert
## Top 3 nächste Schritte`;

    // ── 10. CLAUDE DIAGNOSE — with exponential backoff ─────
    const message = await callWithRetry(() =>
      client.messages.create({
        model: MODELS.SCAN,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })
    );
    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    // ── Async DB write + cache — never blocks the response ─
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

    // Await DB write — must complete before response so the dashboard can read it
    const savedScanId = session?.user?.id
      ? await saveUserScan({ userId: session.user.id, url: targetUrl, issueCount, diagnose, techFingerprint })
      : null;

    // Persist to 24h cache — awaited so Vercel doesn't kill it before it completes
    await saveScanAsync(targetUrl, { scanData, diagnose });

    logScan({ userId: session?.user?.id, url: targetUrl, scanType: "website", status: "success", durationMs: Date.now() - scanStart });
    return NextResponse.json({ success: true, scanData, diagnose, scanId: savedScanId });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json({ success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
