import { NextRequest } from "next/server";

// ── ORIGIN CHECK ────────────────────────────────────────────────────────────
// API darf nur von website-fix.com oder lokalem Dev aufgerufen werden.
// Direkter API-Zugriff (z.B. curl, Postman, Bots) hat keinen gültigen Origin.
const ALLOWED_ORIGINS = [
  "https://website-fix.com",
  "https://www.website-fix.com",
  "http://localhost:3000",
  "http://localhost",
];

export function isOriginAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";

  // In Production muss Origin oder Referer von unserer Domain kommen
  if (process.env.NODE_ENV === "development") return true;

  return ALLOWED_ORIGINS.some(
    (allowed) => origin.startsWith(allowed) || referer.startsWith(allowed)
  );
}

// ── USER-AGENT CHECK ─────────────────────────────────────────────────────────
// Blockiert leere UAs und bekannte CLI-/Skript-Tools.
// Echte Browser haben immer einen User-Agent.
const BLOCKED_UA_PATTERNS = [
  /^$/,                     // leer
  /^-$/,                    // dash (typisch für curl ohne UA)
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /go-http-client/i,
  /java\/\d/i,
  /httpie/i,
  /scrapy/i,
  /libwww-perl/i,
];

export function isUserAgentAllowed(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.length < 8) return false;
  return !BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

// ── SSRF-SCHUTZ ──────────────────────────────────────────────────────────────
// Blockiert private/interne IPs und Nicht-HTTP-Protokolle.
const BLOCKED_HOSTS = [
  /^localhost$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^169\.254\./,
  /\.local$/,
];

export function isUrlAllowed(urlString: string): boolean {
  if (urlString.length > 2000) return false; // prevent resource-waste on absurd URLs
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return !BLOCKED_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

// ── KOMBINIERTER EINGANGS-CHECK ──────────────────────────────────────────────
export function guardRequest(req: NextRequest): { blocked: boolean; reason?: string } {
  if (!isUserAgentAllowed(req)) {
    return { blocked: true, reason: "Ungültige Anfrage." };
  }
  if (!isOriginAllowed(req)) {
    return { blocked: true, reason: "Ungültige Anfrage." };
  }
  return { blocked: false };
}
