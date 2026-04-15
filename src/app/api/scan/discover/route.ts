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

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const { protocol, host } = new URL(baseUrl);
  const base = `${protocol}//${host}`;
  const links = new Set<string>();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (SKIP_EXT.test(href)) continue;
    try {
      const abs = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
      const u = new URL(abs);
      if (u.host === host && !SKIP_AUDIT.test(u.pathname)) {
        links.add(`${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || base);
      }
    } catch { /* skip */ }
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

    const collected = new Set<string>();
    const base = (() => { try { const u = new URL(targetUrl); return `${u.protocol}//${u.host}`; } catch { return targetUrl; } })();

    // Parallel: homepage + sitemap
    const [homeRes, sitemapRes] = await Promise.all([
      fetchWithTimeout(targetUrl, 5000),
      fetchWithTimeout(`${base}/sitemap.xml`, 4000),
    ]);

    if (homeRes?.ok) {
      try {
        const html = await homeRes.text();
        for (const u of extractInternalLinks(html, targetUrl)) {
          if (u !== targetUrl && u !== base) collected.add(u);
        }
      } catch { /* ignore */ }
    }

    if (sitemapRes?.ok) {
      try {
        const xml = await sitemapRes.text();
        for (const u of extractSitemapUrls(xml)) {
          if (u !== targetUrl && u !== base && !u.endsWith("/")) collected.add(u);
          else if (u !== targetUrl && u !== base) collected.add(u.replace(/\/$/, "") || base);
        }
      } catch { /* ignore */ }
    }

    const urls = [...collected].slice(0, 10);
    return NextResponse.json({ urls, count: urls.length });
  } catch {
    return NextResponse.json({ urls: [], count: 0 });
  }
}
