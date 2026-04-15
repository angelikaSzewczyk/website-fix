/**
 * /api/scan/discover
 * POST { url: string }
 * Returns the list of real internal URLs found on the page (sitemap + HTML links).
 * Intentionally lightweight — no AI, no full analysis. Used by the scan animation
 * so it can display real URLs instead of fake placeholders.
 */
import { NextRequest, NextResponse } from "next/server";
import { isUrlAllowed } from "@/lib/scan-guard";

export const maxDuration = 15;

const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf)(\?|$)/i;
const SKIP_AUDIT = /\/(feed|rss|wp-json|wp-admin|xmlrpc\.php|wp-cron\.php|wp-login\.php)(\/|$)/i;

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
    });
    clearTimeout(t);
    return res;
  } catch {
    clearTimeout(t);
    return null;
  }
}

/** Normalize a URL to "protocol//host/pathname" without trailing slash */
function normalizeUrl(url: URL): string {
  return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, "") || `${url.protocol}//${url.host}`;
}

/**
 * Checks if a hostname is "same site" as the base, ignoring www prefix.
 * e.g. www.example.com == example.com
 */
function isSameHost(a: string, b: string): boolean {
  const strip = (h: string) => h.replace(/^www\./, "").toLowerCase();
  return strip(a) === strip(b);
}

/**
 * Extract all internal links from HTML.
 * Pass 1: strict <a href> parsing
 * Pass 2 (deep): broader regex over all href/src/action attributes
 */
function extractInternalLinks(html: string, pageUrl: string, deep = false): string[] {
  const base = new URL(pageUrl);
  const links = new Set<string>();

  // Regex patterns — cover quoted and unquoted hrefs, and optional whitespace
  const patterns = deep
    ? [
        // Broad: any href/src/action value in any tag
        /href\s*=\s*["']([^"']+)["']/gi,
        /href\s*=\s*([^\s>]+)/gi,
        // Also catch data-href, canonical, etc.
        /data-href\s*=\s*["']([^"']+)["']/gi,
        /<link[^>]+href\s*=\s*["']([^"']+)["']/gi,
      ]
    : [
        /<a[^>]+href\s*=\s*["']([^"']+)["']/gi,
        /<a[^>]+href\s*=\s*([^\s>"']+)/gi,
      ];

  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(html)) !== null) {
      const raw = m[1].trim();
      if (!raw) continue;

      // Fast-skip obviously non-page values
      if (
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        raw.startsWith("javascript:") ||
        raw.startsWith("data:")
      ) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (protocol): ${raw}`);
        }
        continue;
      }

      if (SKIP_EXT.test(raw)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (static ext): ${raw}`);
        }
        continue;
      }

      let resolved: URL;
      try {
        // new URL(href, base) correctly handles:
        // - absolute URLs (https://...)
        // - root-relative (/path)
        // - relative paths (ueber-uns)
        // - protocol-relative (//example.com/...)
        resolved = new URL(raw, pageUrl);
      } catch {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (parse error): ${raw}`);
        }
        continue;
      }

      // Only http/https
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (bad protocol): ${resolved.href}`);
        }
        continue;
      }

      // Same domain check (www-insensitive)
      if (!isSameHost(resolved.host, base.host)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (external domain ${resolved.host} vs ${base.host}): ${resolved.href}`);
        }
        continue;
      }

      if (SKIP_AUDIT.test(resolved.pathname)) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[discover] Ignored (skip-audit path): ${resolved.pathname}`);
        }
        continue;
      }

      links.add(normalizeUrl(resolved));
    }
  }

  return [...links];
}

function extractSitemapUrls(xml: string): string[] {
  return (xml.match(/<loc>([^<]+)<\/loc>/g) ?? [])
    .map(m => m.replace(/<\/?loc>/g, "").trim())
    .filter(u => !u.endsWith(".xml") && !SKIP_AUDIT.test(u));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string };
    let targetUrl = (body.url ?? "").trim();
    if (!targetUrl) return NextResponse.json({ urls: [], count: 0 });
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) return NextResponse.json({ urls: [], count: 0 });

    const base = (() => { try { const u = new URL(targetUrl); return `${u.protocol}//${u.host}`; } catch { return targetUrl; } })();
    const baseNorm = (() => { try { return normalizeUrl(new URL(targetUrl)); } catch { return targetUrl; } })();

    const collected = new Set<string>();

    // Parallel: homepage + sitemap
    const [homeRes, sitemapRes] = await Promise.all([
      fetchWithTimeout(targetUrl, 6000),
      fetchWithTimeout(`${base}/sitemap.xml`, 5000),
    ]);

    let homeHtml = "";

    if (homeRes?.ok) {
      try {
        homeHtml = await homeRes.text();
        const found = extractInternalLinks(homeHtml, targetUrl, false);
        // eslint-disable-next-line no-console
        console.log(`[discover] Pass-1 found ${found.length} candidates for ${targetUrl}`);
        for (const u of found) {
          if (u !== baseNorm) collected.add(u);
        }
      } catch { /* ignore */ }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[discover] Homepage fetch failed: ${homeRes?.status ?? "timeout"}`);
    }

    if (sitemapRes?.ok) {
      try {
        const xml = await sitemapRes.text();
        const sitemapUrls = extractSitemapUrls(xml);
        // eslint-disable-next-line no-console
        console.log(`[discover] Sitemap found ${sitemapUrls.length} URLs`);
        for (const u of sitemapUrls) {
          try {
            const norm = normalizeUrl(new URL(u));
            if (norm !== baseNorm) collected.add(norm);
          } catch { /* skip malformed sitemap entry */ }
        }
      } catch { /* ignore */ }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[discover] Sitemap not found or error: ${sitemapRes?.status ?? "timeout"}`);
    }

    // ── Double-check: if we found fewer than 2 pages, do a deep regex pass ──
    if (collected.size < 2 && homeHtml) {
      // eslint-disable-next-line no-console
      console.log(`[discover] Only ${collected.size} pages found after Pass-1, running deep Pass-2…`);
      const deepFound = extractInternalLinks(homeHtml, targetUrl, true);
      // eslint-disable-next-line no-console
      console.log(`[discover] Pass-2 found ${deepFound.length} candidates`);
      for (const u of deepFound) {
        if (u !== baseNorm) collected.add(u);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[discover] Final: ${collected.size} unique internal URLs for ${targetUrl}`);

    const urls = [...collected].slice(0, 10);
    return NextResponse.json({ urls, count: urls.length });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[discover] Unexpected error:", err);
    return NextResponse.json({ urls: [], count: 0 });
  }
}
