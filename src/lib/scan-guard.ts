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

// ── ECHTE-SEITE-PRÜFUNG ──────────────────────────────────────────────────────
// Erkennt ISP-Fehlerseiten, Parking-Pages und leere Provider-Seiten die mit
// HTTP 200 antworten obwohl die echte Website nicht existiert.
const FAKE_PAGE_PATTERNS = [
  /diese domain (ist|wird) (nicht|noch nicht) (erreichbar|konfiguriert)/i,
  /domain not (found|configured|available)/i,
  /site not found/i,
  /this domain is for sale/i,
  /domain parking/i,
  /parked (domain|page|by)/i,
  /account suspended/i,
  /under construction/i,
  /coming soon/i,
  /default web page/i,
  /welcome to nginx/i,
  /apache2? default page/i,
  /it works!/i,          // default Apache page
  /fehler 404/i,
  /page not found/i,
  /404 not found/i,
  /diese webseite (ist|wird) (gerade )?nicht (mehr )?verfügbar/i,
  /diese seite existiert nicht/i,
];

/**
 * Prüft ob eine HTTP-Antwort echten Website-Inhalt enthält.
 * Gibt `false` zurück wenn:
 *  - HTTP-Status ≥ 400
 *  - HTML zu kurz für echten Inhalt (< 500 Zeichen)
 *  - Bekannte ISP/Provider/Parking-Muster im HTML
 *  - Weiterleitung auf andere Domain (Provider-Fehlerseite)
 */
export function isRealWebsiteContent(
  res: Response,
  html: string,
  originalHost: string,
): boolean {
  // Harter HTTP-Fehler
  if (res.status >= 400) return false;

  // Zu wenig Inhalt
  if (html.length < 500) return false;

  // Weiterleitung auf FREMDE Domain (typisch für ISP-Fehlerseiten).
  // www <-> non-www auf der gleichen Domain ist erlaubt:
  // google.com → www.google.com ✓   website-fix.com → www.website-fix.com ✓
  // google.com → parking-provider.net ✗
  try {
    const finalHost    = new URL(res.url).hostname.toLowerCase();
    const normFinal    = finalHost.replace(/^www\./, "");
    const normOriginal = originalHost.toLowerCase().replace(/^www\./, "");
    if (finalHost && normFinal !== normOriginal) return false;
  } catch { /* ignore */ }

  // Bekannte Fehler-/Parking-Muster
  if (FAKE_PAGE_PATTERNS.some((p) => p.test(html))) return false;

  return true;
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
