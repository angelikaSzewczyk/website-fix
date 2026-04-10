/**
 * tech-detector/parsers.ts
 *
 * Parses raw website data into the normalised signal maps used by the detectors.
 * All functions are pure and synchronous — no I/O here.
 */

import type { RawWebsiteData, SignalSource } from "./types";

// ─── Normalised signal access ─────────────────────────────────────────────────

/** Returns a lowercased header value, or "" if not present */
export function getHeader(data: RawWebsiteData, name: string): string {
  return data.headers[name.toLowerCase()] ?? "";
}

/** Returns a meta tag's content by its name/property key, or "" if absent */
export function getMeta(data: RawWebsiteData, name: string): string {
  return data.metaTags[name.toLowerCase()] ?? "";
}

// ─── Pattern matching ─────────────────────────────────────────────────────────

/** Tests a pattern against a string (case-insensitive for string patterns) */
export function matchesPattern(value: string, pattern: RegExp | string): boolean {
  if (!value) return false;
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }
  return value.toLowerCase().includes(pattern.toLowerCase());
}

// ─── Signal extraction by source type ────────────────────────────────────────

/**
 * Returns the string(s) to test a given signal source against.
 * For list-type sources (script-url, link-url) returns all items joined,
 * but individual matching is handled by the engine.
 */
export function getSignalValues(
  data: RawWebsiteData,
  source: SignalSource,
  key?: string,
): string[] {
  switch (source) {
    case "html":
      return [data.html.toLowerCase()];

    case "header":
      if (!key) return [];
      return [getHeader(data, key)];

    case "meta":
      if (!key) return [];
      return [getMeta(data, key).toLowerCase()];

    case "script-url":
      return data.scriptUrls.map(u => u.toLowerCase());

    case "link-url":
      return data.linkUrls.map(u => u.toLowerCase());

    case "url":
      return [data.finalUrl.toLowerCase()];

    default:
      return [];
  }
}

// ─── SSL detection ────────────────────────────────────────────────────────────

export interface SslInfo {
  isHttps:    boolean;
  hsts:       boolean;
  hstsMaxAge: number | null;
}

/**
 * Extracts SSL/HSTS information from raw data.
 * We know SSL is active if the final URL is HTTPS.
 */
export function parseSslInfo(data: RawWebsiteData): SslInfo {
  const isHttps  = data.isHttps;
  const hstsFull = getHeader(data, "strict-transport-security");
  const hsts     = hstsFull.length > 0;

  let hstsMaxAge: number | null = null;
  if (hsts) {
    const m = hstsFull.match(/max-age=(\d+)/i);
    if (m) hstsMaxAge = parseInt(m[1], 10);
  }

  return { isHttps, hsts, hstsMaxAge };
}

// ─── PHP version direct-extraction ───────────────────────────────────────────

/**
 * Tries to extract a precise PHP version string from headers.
 * Returns null if no version info is available.
 */
export function extractPhpVersion(data: RawWebsiteData): string | null {
  const powered = getHeader(data, "x-powered-by");

  // Exact version e.g. "PHP/8.2.10"
  const exact = powered.match(/php\/(\d+\.\d+(?:\.\d+)?)/i);
  if (exact) return exact[1];

  // Major.minor without patch e.g. "php/8.2"
  const approx = powered.match(/php\/(\d+\.\d+)/i);
  if (approx) return approx[1];

  return null;
}

// ─── Inline script content extraction ────────────────────────────────────────

/**
 * Returns all inline <script> block contents from the HTML.
 * Used for detecting initialisation code like gtag('config', 'G-...').
 */
export function extractInlineScripts(html: string): string {
  const scripts: string[] = [];
  const re = /<script(?:\s[^>]*)?>([^<]*(?:(?!<\/script>)<[^<]*)*)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    scripts.push(m[1]);
  }
  return scripts.join("\n").toLowerCase();
}
