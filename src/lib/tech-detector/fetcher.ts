/**
 * tech-detector/fetcher.ts
 *
 * HTTP layer for the tech detection engine.
 * Fetches a website, extracts HTML, headers, script/link URLs and meta tags.
 * All parsing errors are caught — this function always returns a result.
 */

import type { RawWebsiteData } from "./types";

/** Maximum HTML body size we process (prevents memory exhaustion) */
const MAX_HTML_BYTES = 512 * 1024; // 512 KB

/** Request timeout in milliseconds */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Browser-like User-Agent so most servers return the real page,
 * not a bot-detection wall.
 */
const USER_AGENT =
  "Mozilla/5.0 (compatible; WebsiteFix-Scanner/1.0; +https://website-fix.com)";

// ─── Regex helpers for server-side HTML parsing ───────────────────────────────

/** Extract all <script src="..."> values */
function extractScriptUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    urls.push(resolveUrl(m[1], base));
  }
  return urls;
}

/** Extract all <link href="..."> values */
function extractLinkUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const re = /<link[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    urls.push(resolveUrl(m[1], base));
  }
  return urls;
}

/** Extract <meta name/property + content> pairs */
function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  // Match both name= and property= meta tags
  const re = /<meta\s+(?:[^>]*?\s+)?(?:name|property)=["']([^"']+)["'][^>]*?\s+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    tags[m[1].toLowerCase()] = m[2];
  }
  // Also handle content= before name= ordering
  const re2 = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["'][^>]*?\s+(?:name|property)=["']([^"']+)["']/gi;
  while ((m = re2.exec(html)) !== null) {
    tags[m[2].toLowerCase()] = m[1];
  }
  return tags;
}

/** Safely resolve a potentially relative URL against a base */
function resolveUrl(href: string, base: string): string {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return href;
  }
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

/** Flatten Headers object to plain Record<string, string> */
function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value.toLowerCase();
  });
  return out;
}

// ─── Build from existing fetch result ────────────────────────────────────────

/**
 * Constructs RawWebsiteData from an already-completed fetch.
 * Use this when the HTTP response was fetched elsewhere (avoids a duplicate
 * round-trip to the same URL).
 */
export function buildRawWebsiteData(params: {
  url:      string;
  response: Response;
  html:     string;
}): RawWebsiteData {
  const html     = params.html.slice(0, MAX_HTML_BYTES);
  const finalUrl = params.response.url || params.url;
  const headers  = headersToRecord(params.response.headers);
  return {
    url:        params.url,
    finalUrl,
    isHttps:    finalUrl.startsWith("https://"),
    statusCode: params.response.status,
    html,
    headers,
    scriptUrls: extractScriptUrls(html, finalUrl),
    linkUrls:   extractLinkUrls(html, finalUrl),
    metaTags:   extractMetaTags(html),
    fetchedAt:  new Date().toISOString(),
  };
}

// ─── Main fetch function ──────────────────────────────────────────────────────

/**
 * Fetches the target website and returns all raw signals needed for detection.
 * Never throws — returns an error field if something fails.
 */
export async function fetchWebsiteData(url: string): Promise<RawWebsiteData> {
  const fetchedAt = new Date().toISOString();

  // Normalise URL — add https:// if missing
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml" },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    // Read body (capped at MAX_HTML_BYTES)
    const buffer = await response.arrayBuffer();
    const slice  = buffer.slice(0, MAX_HTML_BYTES);
    const html   = new TextDecoder("utf-8", { fatal: false }).decode(slice);

    const finalUrl = response.url || targetUrl;
    const headers  = headersToRecord(response.headers);

    return {
      url:        targetUrl,
      finalUrl,
      isHttps:    finalUrl.startsWith("https://"),
      statusCode: response.status,
      html,
      headers,
      scriptUrls: extractScriptUrls(html, finalUrl),
      linkUrls:   extractLinkUrls(html, finalUrl),
      metaTags:   extractMetaTags(html),
      fetchedAt,
    };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      url:        targetUrl,
      finalUrl:   targetUrl,
      isHttps:    targetUrl.startsWith("https://"),
      statusCode: 0,
      html:       "",
      headers:    {},
      scriptUrls: [],
      linkUrls:   [],
      metaTags:   {},
      fetchedAt,
      error:      `Fetch fehlgeschlagen: ${message}`,
    };
  }
}
