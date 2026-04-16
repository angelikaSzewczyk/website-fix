import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { checkIpRateLimit } from "@/lib/ip-rate-limit";
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

// ── Structured issue type (saved as issues_json) ────────────
export type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
  url?: string; // per-page issues carry their URL
};

function classifyIssueCategory(text: string): ScanIssue["category"] {
  const t = text.toLowerCase();
  if (/bfsg|wcag|barriere|impressum|datenschutz|cookie|dsgvo|label|aria|alt.?text/.test(t)) return "recht";
  if (/speed|lcp|cls|ladezeit|pagespeed|core web/.test(t)) return "speed";
  return "technik";
}

/**
 * Build a deterministic, structured issues array directly from raw scan data.
 * This is the ground truth — saved as issues_json so the dashboard never has
 * to re-parse the AI text (which loses fidelity).
 */
function buildIssuesJson(
  scanData: Record<string, unknown>,
  unterseiten: { url: string; erreichbar: boolean; title: string; h1: string; noindex: boolean; altMissing: number }[],
  totalAltMissing: number,
  totalImages: number,
  duplicateTitles: { title: string; seiten: string[] }[],
  duplicateMetas: { meta: string; seiten: string[] }[],
  brokenLinks: { url: string; status: number }[],
  orphanedPages: string[],
): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const fc = scanData.formCheck as { inputsWithoutLabel?: number; buttonsWithoutText?: number } | undefined;

  // ── Global issues ──
  if (!scanData.https)
    issues.push({ severity: "red", title: "Kein HTTPS", body: "Die Seite ist nicht über HTTPS erreichbar — Sicherheitsrisiko und Google-Ranking-Nachteil.", category: "technik" });
  if (!scanData.erreichbar)
    issues.push({ severity: "red", title: "Startseite nicht erreichbar", body: "Die Startseite gibt einen Fehler zurück (4xx/5xx).", category: "technik" });
  if (!scanData.title)
    issues.push({ severity: "red", title: "Title-Tag fehlt (Startseite)", body: "Fehlender Title-Tag schadet dem Google-Ranking direkt.", category: "technik" });
  if (!scanData.metaDescription)
    issues.push({ severity: "yellow", title: "Meta-Description fehlt (Startseite)", body: "Ohne Meta-Description zeigt Google einen zufälligen Seitenausschnitt in den Suchergebnissen.", category: "technik" });
  if (!scanData.h1)
    issues.push({ severity: "red", title: "H1-Tag fehlt (Startseite)", body: "Jede Seite braucht genau eine H1 — fehlt sie, verliert die Seite SEO-Gewicht.", category: "technik" });
  if (scanData.robotsBlockiertAlles)
    issues.push({ severity: "red", title: "robots.txt blockiert alle Crawler", body: "Google kann die gesamte Seite nicht indexieren.", category: "technik" });
  if (scanData.indexierungGesperrt)
    issues.push({ severity: "red", title: "Noindex auf Startseite gesetzt", body: "Die Startseite ist für Suchmaschinen unsichtbar.", category: "technik" });
  if (!scanData.sitemapVorhanden)
    issues.push({ severity: "yellow", title: "Sitemap.xml fehlt", body: "Ohne Sitemap findet Google neue Seiten langsamer.", category: "technik" });

  // ── BFSG / Accessibility ──
  if (totalAltMissing > 0)
    issues.push({ severity: "red", title: `${totalAltMissing} Bilder ohne Alt-Text (BFSG 2025 Pflicht)`, body: `${totalAltMissing} von ${totalImages} Bildern fehlt der Alt-Text — Barrierefreiheitspflicht ab 06/2025, Abmahnrisiko.`, category: "recht" });
  if ((fc?.inputsWithoutLabel ?? 0) > 0)
    issues.push({ severity: "red", title: `${fc!.inputsWithoutLabel} Formularfelder ohne Label (BFSG-Verstoß)`, body: "Screen-Reader können diese Felder nicht vorlesen. BFSG §3 Abs. 2.", category: "recht" });

  // ── SEO-Duplikate ──
  if (duplicateTitles.length > 0)
    issues.push({ severity: "red", title: `${duplicateTitles.length}× doppelter Title-Tag`, body: `Doppelte Titles verwirren Google. Betroffen: ${duplicateTitles.slice(0, 3).flatMap(d => d.seiten).slice(0, 3).map(toPath).join(", ")}`, category: "technik" });
  if (duplicateMetas.length > 0)
    issues.push({ severity: "yellow", title: `${duplicateMetas.length}× doppelte Meta-Description`, body: `Betroffen: ${duplicateMetas.slice(0, 3).flatMap(d => d.seiten).slice(0, 3).map(toPath).join(", ")}`, category: "technik" });

  // ── Broken Links / Orphans ──
  if (brokenLinks.length > 0)
    issues.push({ severity: "red", title: `${brokenLinks.length} Broken Link${brokenLinks.length > 1 ? "s" : ""} (404)`, body: `Fehlerhafte Links: ${brokenLinks.slice(0, 3).map(b => toPath(b.url)).join(", ")}`, category: "technik" });
  if (orphanedPages.length > 0)
    issues.push({ severity: "yellow", title: `${orphanedPages.length} verwaiste Unterseite${orphanedPages.length > 1 ? "n" : ""}`, body: `Keine internen Links zeigen auf: ${orphanedPages.slice(0, 3).map(toPath).join(", ")}`, category: "technik" });

  // ── Per-page issues ──
  for (const p of unterseiten) {
    const path = toPath(p.url);
    if (!p.erreichbar)
      issues.push({ severity: "red", title: `Unterseite nicht erreichbar: ${path}`, body: "Die Seite gibt einen 4xx/5xx-Fehler zurück.", category: "technik", url: p.url });
    if (!p.title || p.title === "(kein Title)")
      issues.push({ severity: "red", title: `Title-Tag fehlt: ${path}`, body: "Fehlender Title-Tag verhindert gutes Google-Ranking dieser Unterseite.", category: "technik", url: p.url });
    if (!p.h1 || p.h1 === "(kein H1)")
      issues.push({ severity: "yellow", title: `H1 fehlt: ${path}`, body: "Fehlende H1-Überschrift schwächt das SEO-Signal der Seite.", category: "technik", url: p.url });
    if (p.noindex)
      issues.push({ severity: "yellow", title: `Noindex gesetzt: ${path}`, body: "Diese Unterseite ist für Google unsichtbar — gewollt?", category: "technik", url: p.url });
    if (p.altMissing > 0)
      issues.push({ severity: "red", title: `${p.altMissing}× Alt-Text fehlt: ${path}`, body: `${p.altMissing} Bild${p.altMissing > 1 ? "er" : ""} ohne Alt-Text auf dieser Seite (BFSG 2025).`, category: "recht", url: p.url });
  }

  return issues;
}

// ── Save scan to user's history ──────────────────────────────
async function saveUserScan(params: {
  userId: string;
  url: string;
  issueCount: number;
  diagnose: string;
  issuesJson: ScanIssue[];
  techFingerprint?: unknown;
  totalPages?: number | null;
  unterseitenJson?: unknown | null;
}): Promise<string | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      INSERT INTO scans (user_id, url, type, issue_count, result, issues_json, tech_fingerprint, total_pages, unterseiten_json)
      VALUES (
        ${params.userId}, ${params.url}, 'website',
        ${params.issueCount}, ${params.diagnose},
        ${JSON.stringify(params.issuesJson)},
        ${params.techFingerprint ? JSON.stringify(params.techFingerprint) : null},
        ${params.totalPages ?? null},
        ${params.unterseitenJson ? JSON.stringify(params.unterseitenJson) : null}
      )
      RETURNING id::text
    ` as { id: string }[];
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("DB write error:", err);
    return null;
  }
}

// ── Global burst guard (in-memory, nur Serversicherheit) ────
const globalLimit = { count: 0, resetAt: 0 };

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
  // Only match <a href> — NOT <link rel>, <meta>, or other tags.
  // WordPress <head> emits dozens of <link href="/wp-json/..."> and
  // <link href="/xmlrpc.php?rsd"> entries that are API/technical endpoints,
  // not user-facing pages. Matching only <a> keeps the list clean.
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
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

// ── WordPress Detection ─────────────────────────────────────
function detectWordPress(html: string, headers: Headers): boolean {
  // HTML-Signale (zuverlässigste Methode)
  if (html.includes("/wp-content/"))          return true;
  if (html.includes("/wp-includes/"))          return true;
  if (html.includes("wp-json"))               return true;
  if (html.includes("wp-login.php"))           return true;
  if (/wp-emoji-release\.min\.js/i.test(html)) return true;
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i.test(html)) return true;

  // HTTP-Header-Signale
  if (/wordpress/i.test(headers.get("x-powered-by") ?? "")) return true;
  if (/wordpress/i.test(headers.get("x-generator")  ?? "")) return true;
  if ((headers.get("link") ?? "").includes("wp-json"))       return true;

  return false;
}

// ── URL Audit Filter ────────────────────────────────────────
// URLs im Crawl registrieren, aber NICHT analysieren:
// /feed/, WP-JSON/REST-API, xmlrpc.php, wp-admin, .xml, .txt, .json, ?replytocom
const SKIP_AUDIT_PATH = /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|^\/wp-json(\/|$)|^\/wp-admin(\/|$)/i;
const SKIP_AUDIT_EXT  = /\.(xml|txt|json)(\?|#|$)/i;
const SKIP_AUDIT_FILE = /^\/(xmlrpc\.php|wp-cron\.php|wp-login\.php|wp-activate\.php)(\/|\?|$)/i;

function shouldAudit(url: string): boolean {
  try {
    const { pathname, searchParams } = new URL(url);
    if (searchParams.has("replytocom"))   return false;
    if (SKIP_AUDIT_PATH.test(pathname))   return false;
    if (SKIP_AUDIT_EXT.test(pathname))    return false;
    if (SKIP_AUDIT_FILE.test(pathname))   return false;
    return true;
  } catch {
    return false;
  }
}

// ── Alt Text Check ──────────────────────────────────────────
function countMissingAlt(html: string): { missing: number; total: number; missingSrcs: string[] } {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  const missingSrcs: string[] = [];
  imgs.forEach((tag) => {
    if (!tag.match(/alt=["'][^"']+["']/i)) {
      const srcMatch = tag.match(/src=["']([^"'?#\s]+)/i);
      if (srcMatch) {
        const filename = srcMatch[1].split("/").pop() ?? "";
        if (filename && !filename.startsWith("data:") && filename.length > 2) {
          missingSrcs.push(filename);
        }
      }
    }
  });
  return {
    missing: imgs.filter((tag) => !tag.match(/alt=["'][^"']+["']/i)).length,
    total:   imgs.length,
    missingSrcs: missingSrcs.slice(0, 6),
  };
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
  altMissingImages: string[];
};

async function scanSubpage(url: string, baseUrl: string): Promise<PageResult> {
  const empty: PageResult = { url, erreichbar: false, status: 0, title: "", h1: "", metaDescription: "", noindex: false, canonical: "", outgoingLinks: [], altMissing: 0, altTotal: 0, altMissingImages: [] };
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
    altMissingImages: alt.missingSrcs,
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

// ── Plan-based crawl depth ──────────────────────────────────
function getMaxSubpages(plan: string): number {
  if (plan === "agency-pro")      return 10000;
  if (plan === "agency-starter")  return 2500;
  if (plan === "smart-guard")     return 500;
  return 10; // free / anonym
}

// ── Monthly scan limits per plan ────────────────────────────
const MONTHLY_LIMITS: Record<string, number> = {
  "free":            3,
  "smart-guard":    50,
  "agency-starter": 250,
  "agency-pro":    1000,
};

// ── Main Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const guard = guardRequest(req);
    if (guard.blocked) return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });

    const session = await auth();
    const userId  = session?.user?.id as string | undefined;
    const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? "free";
    const isPaid = ["smart-guard", "agency-starter", "agency-pro"].includes(userPlan);

    // ── Admin test-bypass cookie: skips IP rate limit ──────────
    const bypassCookie = req.cookies.get("wf_admin_test")?.value ?? "";
    const bypassSecret = process.env.ADMIN_BYPASS_SECRET ?? "";
    const hasAdminBypass = bypassSecret.length > 0 && bypassCookie === bypassSecret;

    // ── Anonymous users: IP-based rate limit ───────────────
    if (!userId && !hasAdminBypass) {
      const now = Date.now();
      if (now > globalLimit.resetAt) { globalLimit.count = 0; globalLimit.resetAt = now + 60_000; }
      if (globalLimit.count >= 15) {
        return NextResponse.json({ success: false, error: "Server ausgelastet. Bitte versuche es in einer Minute erneut." }, { status: 429 });
      }
      globalLimit.count++;

      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = await checkIpRateLimit(ip);
      if (!limitResult.allowed) {
        return NextResponse.json(
          { success: false, errorCode: limitResult.errorCode ?? "RATE_LIMIT", error: limitResult.reason, retryAfterMs: limitResult.retryAfterMs },
          { status: 429 },
        );
      }
    }

    // ── Registered users: monthly scan limit ───────────────
    if (userId) {
      const monthlyLimit = MONTHLY_LIMITS[userPlan] ?? 3;
      try {
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT COUNT(*)::int AS cnt FROM scans
          WHERE user_id = ${userId}
          AND created_at >= date_trunc('month', NOW())
        ` as { cnt: number }[];
        const used = rows[0]?.cnt ?? 0;
        if (used >= monthlyLimit) {
          return NextResponse.json(
            { success: false, errorCode: "MONTHLY_LIMIT", error: `Monatliches Scan-Kontingent (${monthlyLimit}) aufgebraucht. Bitte nächsten Monat oder nach einem Upgrade erneut versuchen.` },
            { status: 429 },
          );
        }
      } catch { /* DB check non-critical — allow scan if check fails */ }
    }

    const body = await req.json();
    const { url, forceRefresh } = body as { url?: string; forceRefresh?: boolean };
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });

    // ── Loopback check: eigene Domain sofort als Nicht-WP markieren ────────────
    const targetHostCheck = (() => { try { return new URL(targetUrl).hostname.toLowerCase(); } catch { return ""; } })();
    const OWN_HOSTS = ["website-fix.com", "www.website-fix.com"];
    if (OWN_HOSTS.includes(targetHostCheck)) {
      return NextResponse.json(
        { success: false, errorCode: "ERR_NOT_WORDPRESS", error: "Diese Website verwendet kein WordPress." },
        { status: 422 },
      );
    }

    const scanStart = Date.now();

    // ── Cache check — skipped when forceRefresh=true ────────
    if (!forceRefresh) {
      const ttl    = cacheTtlHours(userPlan);
      const cached = await getCachedScan(targetUrl, ttl);
      // Treat cache as stale if it's from an old version without audit data
      const cacheHasAudit = !!(cached?.scanData?.audit as { unterseiten?: unknown[] } | undefined)?.unterseiten?.length;
      if (cached && cacheHasAudit) {
        const { cachedAt, ...payload } = cached;
        let scanId: string | null = null;
        if (userId) {
          const issueCount = computeIssueCount(cached.scanData);
          const fp = cached.scanData.techFingerprint;
          type CachedAudit = {
            gescannteSeiten?: number;
            unterseiten?: { url: string; erreichbar: boolean; title: string; h1: string; noindex: boolean; altMissing: number }[];
            altTexte?: { fehlend?: number; gesamt?: number };
            duplicateTitles?: { title: string; seiten: string[] }[];
            duplicateMetas?: { meta: string; seiten: string[] }[];
            brokenLinks?: { url: string; status: number }[];
            verwaistSeiten?: string[];
          };
          const cachedAudit = cached.scanData.audit as CachedAudit | undefined;
          const cachedUnterseiten = cachedAudit?.unterseiten ?? [];
          const cachedIssuesJson = buildIssuesJson(
            cached.scanData,
            cachedUnterseiten,
            cachedAudit?.altTexte?.fehlend ?? 0,
            cachedAudit?.altTexte?.gesamt ?? 0,
            cachedAudit?.duplicateTitles ?? [],
            cachedAudit?.duplicateMetas ?? [],
            cachedAudit?.brokenLinks ?? [],
            cachedAudit?.verwaistSeiten ?? [],
          );
          scanId = await saveUserScan({
            userId,
            url: targetUrl,
            issueCount,
            diagnose: cached.diagnose,
            issuesJson: cachedIssuesJson,
            techFingerprint: fp,
            totalPages: cachedAudit?.gescannteSeiten ?? ((cachedAudit?.unterseiten?.length ?? 0) + 1),
            unterseitenJson: cachedAudit?.unterseiten ?? null,
          });
        }
        logScan({ userId, url: targetUrl, scanType: "website", status: "cached", fromCache: true });
        return NextResponse.json({ success: true, fromCache: true, cachedAt, scanId, ...payload });
      }
    }

    const maxSubpages = getMaxSubpages(userPlan);
    const maxBrokenLinkChecks = isPaid ? 50 : 15;

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ───────────────────────────────────────
    const mainRes = await fetchWithTimeout(targetUrl);

    // Früh-Abbruch: Seite nicht erreichbar (DNS-Fehler, Timeout, Connection refused)
    if (!mainRes) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Status-A: HTTP-Fehler (4xx/5xx) → SITE_UNREACHABLE ────────────────────
    if (mainRes.status >= 400) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    let mainHtml = "";
    try {
      mainHtml = await mainRes.text();
    } catch {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Antwort zu kurz → leere Seite oder reine Redirect-Shell ───────────────
    if (mainHtml.length < 500) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Tech fingerprint — runs against the already-fetched HTML ─────────────
    // buildFingerprintFromRaw is synchronous; no extra HTTP request needed.
    const techFingerprint = buildFingerprintFromRaw(
      buildRawWebsiteData({ url: targetUrl, response: mainRes, html: mainHtml }),
    );

    const host0 = (() => { try { return new URL(targetUrl).hostname; } catch { return targetUrl; } })();

    // ── Status-B: Seite antwortet, aber kein WordPress → ERR_NOT_WORDPRESS ────
    // WICHTIG: Dieser Check kommt VOR dem Parking-Page-Check,
    // damit erreichbare Nicht-WP-Seiten (Google, Shopify, Next.js) niemals
    // SITE_UNREACHABLE erhalten.
    scanData.istWordpress = detectWordPress(mainHtml, mainRes.headers);
    if (!scanData.istWordpress) {
      return NextResponse.json(
        { success: false, errorCode: "ERR_NOT_WORDPRESS", error: "Diese Website verwendet kein WordPress." },
        { status: 422 },
      );
    }

    // ── ISP-Fehlerseiten / Parking-Pages (geben HTTP 200, aber kein echter Inhalt) ─
    // Dieser Check ist nur noch für WP-Sites relevant (sehr seltener Edge-Case).
    const PARKING_PATTERNS = [
      /diese domain (ist|wird) (nicht|noch nicht) (erreichbar|konfiguriert)/i,
      /domain not (found|configured|available)/i,
      /site not found/i,
      /this domain is for sale/i,
      /domain parking/i,
      /parked (domain|page|by)/i,
      /account suspended/i,
      /default web page/i,
      /welcome to nginx/i,
      /apache2? default page/i,
      /it works!/i,
    ];
    if (PARKING_PATTERNS.some((p) => p.test(mainHtml))) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── WP version from meta generator ─────────────────────────
    const wpVersionMatch = mainHtml.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([\d.]+)/i)
      ?? mainHtml.match(/WordPress\/([\d.]+)/);
    scanData.wpVersion = wpVersionMatch?.[1] ?? null;

    // ── SEO Plugin detection ────────────────────────────────────
    scanData.hasRankMath = /rank[-_]?math/i.test(mainHtml);
    scanData.hasYoast    = /yoast|wpseo/i.test(mainHtml);

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
    scanData.formularVorhanden = mainHtml.includes("<form");
    // istWordpress wurde bereits oben gesetzt und als Guard genutzt — hier nur noch dokumentieren
    const formCheck = checkFormAccessibility(mainHtml);
    scanData.formCheck = formCheck;
    const mainAlt = countMissingAlt(mainHtml);
    scanData.startseite_altMissing = mainAlt.missing;
    scanData.startseite_altTotal = mainAlt.total;
    scanData.startseite_altMissingImages = mainAlt.missingSrcs;

    // ── 2. ROBOTS.TXT + WP-SPECIFIC CHECKS (parallel) ─────────
    const [robotsRes, xmlRpcRes, sitemapIndexRes] = await Promise.all([
      fetchWithTimeout(new URL("/robots.txt", targetUrl).href, 5000),
      fetchWithTimeout(new URL("/xmlrpc.php", targetUrl).href, 4000),
      fetchWithTimeout(new URL("/sitemap_index.xml", targetUrl).href, 4000),
    ]);
    scanData.xmlRpcOpen = xmlRpcRes !== null && (xmlRpcRes.status === 200 || xmlRpcRes.status === 405);
    scanData.sitemapIndexFound = !!(sitemapIndexRes?.ok);
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

    // Split: alle entdeckten URLs (für Statistik) vs. auditierbare URLs (für Analyse)
    // Feed-, XML-, TXT-, JSON- und replytocom-URLs werden registriert aber nicht gescannt.
    const discoveredCount = subpageUrls.length;
    const auditableUrls   = subpageUrls.filter(shouldAudit);
    const filteredCount   = discoveredCount - auditableUrls.length;

    // ── 4. UNTERSEITEN SCANNEN — in Batches von 5 ──────────
    // Batching prevents hammering the target server and avoids hitting
    // Vercel's connection limits when 30 agencies scan simultaneously.
    const unterseiten: PageResult[] = auditableUrls.length > 0
      ? await batchAsync(auditableUrls, 5, (u) => scanSubpage(u, targetUrl), 200)
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
      gescannteSeiten:   unterseiten.length + 1, // +1 für die Homepage, die immer gescannt wird
      entdeckteUrls:     discoveredCount,
      gefilterteUrls:    filteredCount,  // Feeds/XML/etc. — registriert aber nicht analysiert
      uebersprungeneUrls: subpageUrls.filter(u => !shouldAudit(u)),  // Gefilterte URLs für Tabelle
      unterseiten: unterseiten.map((p) => ({
        url: p.url, erreichbar: p.erreichbar, status: p.status,
        title: p.title || "(kein Title)", h1: p.h1 || "(kein H1)",
        noindex: p.noindex, altMissing: p.altMissing,
        altMissingImages: p.altMissingImages,
      })),
      duplicateTitles,
      duplicateMetas,
      altTexte: {
        fehlend: totalAltMissing,
        gesamt:  totalImages,
        // Up to 10 unique filenames across all pages for the "Beweis-Modus"
        missingImages: [
          ...(scanData.startseite_altMissingImages as string[] ?? []),
          ...unterseiten.flatMap(p => p.altMissingImages),
        ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
      },
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

    // Build explicit issue list from technical checks for injection into prompt
    const techIssueLines: string[] = [];
    if (!scanData.title)           techIssueLines.push("- STARTSEITE: Title-Tag fehlt");
    if (!scanData.metaDescription) techIssueLines.push("- STARTSEITE: Meta-Description fehlt");
    if (!scanData.h1)              techIssueLines.push("- STARTSEITE: H1-Tag fehlt");
    if (!scanData.https)           techIssueLines.push("- STARTSEITE: Kein HTTPS");
    if (scanData.indexierungGesperrt) techIssueLines.push("- STARTSEITE: Noindex gesetzt — Google kann Seite nicht indexieren");
    if (!scanData.sitemapVorhanden)   techIssueLines.push("- STARTSEITE: Sitemap.xml fehlt");
    if (scanData.robotsBlockiertAlles) techIssueLines.push("- STARTSEITE: robots.txt blockiert alle Crawler");
    if (totalAltMissing > 0)          techIssueLines.push(`- ${totalAltMissing} Bilder ohne Alt-Text (BFSG 2025 Pflicht!)`);
    if ((fc?.inputsWithoutLabel ?? 0) > 0) techIssueLines.push(`- ${fc!.inputsWithoutLabel} Formularfelder ohne Label (BFSG-Verstoß)`);
    if (duplicateTitles.length > 0)    techIssueLines.push(`- ${duplicateTitles.length} doppelte Title-Tags (SEO-Schaden)`);
    if (duplicateMetas.length > 0)     techIssueLines.push(`- ${duplicateMetas.length} doppelte Meta-Descriptions`);
    if (brokenLinks.length > 0)        techIssueLines.push(`- ${brokenLinks.length} Broken Links (404)`);
    unterseiten.filter(p => !p.erreichbar).forEach(p =>
      techIssueLines.push(`- UNTERSEITE DOWN: ${toPath(p.url)} (nicht erreichbar)`)
    );
    unterseiten.filter(p => !p.title || p.title === "(kein Title)").forEach(p =>
      techIssueLines.push(`- UNTERSEITE kein Title: ${toPath(p.url)}`)
    );
    unterseiten.filter(p => p.noindex).forEach(p =>
      techIssueLines.push(`- UNTERSEITE Noindex: ${toPath(p.url)}`)
    );
    unterseiten.filter(p => p.altMissing > 0).slice(0, 5).forEach(p =>
      techIssueLines.push(`- UNTERSEITE Alt-Texte fehlen (${p.altMissing}x): ${toPath(p.url)}`)
    );

    const prompt = `Du bist ein Website-Audit-Experte. Analysiere ${host0} (${audit.gescannteSeiten} Seiten gescannt).

CRAWLER-BEFUNDE (diese sind FAKTEN, nicht interpretierbar):
${techIssueLines.length > 0 ? techIssueLines.join("\n") : "- Keine kritischen technischen Probleme gefunden"}

VOLLSTÄNDIGE TECHNISCHE DATEN:
Startseite: title="${scanData.title || "FEHLT"}" | meta="${scanData.metaDescription ? "ok" : "FEHLT"}" | h1="${scanData.h1 ? "ok" : "FEHLT"}" | https=${scanData.https} | sitemap=${scanData.sitemapVorhanden}
BFSG: Alt-Texte fehlend=${totalAltMissing}/${totalImages} | Formular-Labels fehlend=${fc?.inputsWithoutLabel ?? 0}
Unterseiten (${unterseiten.length}):
${unterseiten.slice(0, 10).map((p) => `  ${toPath(p.url)}: ${p.erreichbar ? "ok" : "DOWN"} | title=${p.title ? "ok" : "FEHLT"} | h1=${p.h1 ? "ok" : "FEHLT"} | noindex=${p.noindex} | alt-missing=${p.altMissing}`).join("\n") || "  (keine)"}

PFLICHT-REGELN:
1. Jedes Crawler-Befund aus der Liste oben MUSS als eigenständige Issue erscheinen.
2. Kein Problem ignorieren — auch "kleine" Mängel sind Issues.
3. Verwende EXAKT dieses Format für jede Issue (eine pro Zeile):
   🔴 KRITISCH Titel — kurze Erklärung mit Business-Bezug
   🟡 WICHTIG Titel — kurze Erklärung mit Business-Bezug
   🟢 OK Titel — was bereits funktioniert
4. Schwellenwerte: DOWN/fehlend/BFSG → 🔴 | Optimierungsbedarf → 🟡 | Gut → 🟢

## Zusammenfassung
(2 Sätze: konkrete Business-Auswirkung der Hauptprobleme)

## Befunde
(Eine Issue pro Zeile, schlimmste zuerst — ALLE Crawler-Befunde müssen auftauchen)

## Top 3 Sofortmaßnahmen`;

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

    // Build structured issues from raw data — this is the ground truth for the dashboard
    const issuesJson = buildIssuesJson(
      scanData,
      unterseiten,
      totalAltMissing,
      totalImages,
      duplicateTitles,
      duplicateMetas,
      brokenLinks,
      orphanedPages,
    );

    // Await DB write — must complete before response so the dashboard can read it
    const savedScanId = userId
      ? await saveUserScan({
          userId, url: targetUrl, issueCount, diagnose, issuesJson, techFingerprint,
          totalPages: audit.gescannteSeiten,
          unterseitenJson: audit.unterseiten,
        })
      : null;

    // Persist to 24h cache — awaited so Vercel doesn't kill it before it completes
    await saveScanAsync(targetUrl, { scanData, diagnose });

    logScan({ userId, url: targetUrl, scanType: "website", status: "success", durationMs: Date.now() - scanStart });
    return NextResponse.json({ success: true, scanData, diagnose, issueCount, scanId: savedScanId });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json({ success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
