/**
 * scan-gate.ts — clientseitige Anti-Abuse-Gate für den Free-Scan.
 *
 * Ersetzt den ursprünglichen globalen Block (ein Timestamp ohne URL-Kontext,
 * der den User 24h sperrte sobald er EINE Seite gescannt hatte). Jetzt
 * URL-spezifisch: Nutzer dürfen weiter neue Domains scannen, nur derselbe
 * URL-Match in <24h zeigt den Block-Hinweis.
 *
 * Kompatibilität: alte localStorage-Einträge (pure numerische Timestamps)
 * werden als "legacy/global block" gelesen — laufen innerhalb von 24h aus
 * und werden dann durch das neue Format überschrieben.
 *
 * Server-side Rate-Limiting (api/scan: data.errorCode === "RATE_LIMITED")
 * bleibt UNVERÄNDERT — das ist die echte Anti-Abuse-Schicht. Diese hier
 * ist nur UX-Komfort + Stripe/Cache-Kostenkontrolle.
 */

export const FREE_SCAN_KEY      = "wf_free_scan_ts";
export const FREE_SCAN_LIMIT_MS = 24 * 60 * 60 * 1000;

/** Normalize URL to a comparable key — strip protocol, www, trailing slash, lowercase. */
export function normalizeScanUrl(input: string): string {
  if (!input) return "";
  try {
    const u = new URL(input.startsWith("http") ? input : `https://${input}`);
    const host = u.host.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return host + path;
  } catch {
    return input.trim().toLowerCase();
  }
}

type GateRecord = {
  /** Normalized URL that was scanned, or "*" für legacy/global blocks. */
  url: string;
  ts:  number;
};

function readGate(): GateRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FREE_SCAN_KEY);
    if (!raw) return null;
    // Legacy: pure numeric string (vor URL-Awareness) → als globaler Block lesen,
    // läuft innerhalb 24h aus.
    if (/^\d+$/.test(raw)) {
      return { url: "*", ts: parseInt(raw, 10) };
    }
    const parsed = JSON.parse(raw) as Partial<GateRecord>;
    if (typeof parsed?.ts !== "number" || typeof parsed?.url !== "string") return null;
    return { url: parsed.url, ts: parsed.ts };
  } catch {
    return null;
  }
}

/**
 * Hat der User innerhalb der letzten 24h eine bestimmte URL gescannt?
 * URL-Argument optional — ohne wird "any active gate" geprüft (für Mount-Hinweise).
 */
export function isScanBlocked(url?: string): { blocked: boolean; nextMs: number; sameUrl: boolean } {
  const rec = readGate();
  if (!rec) return { blocked: false, nextMs: 0, sameUrl: false };
  const elapsed = Date.now() - rec.ts;
  if (elapsed >= FREE_SCAN_LIMIT_MS) return { blocked: false, nextMs: 0, sameUrl: false };

  const nextMs = rec.ts + FREE_SCAN_LIMIT_MS;

  // Legacy global block — bis Ablauf weiter sperren.
  if (rec.url === "*") return { blocked: true, nextMs, sameUrl: false };

  // URL-spezifisch: nur blocken wenn die Eingabe-URL exakt dem Block-Eintrag entspricht.
  // Ohne URL-Argument → kein Block (Page-Mount darf den User nicht abschrecken).
  if (!url) return { blocked: false, nextMs, sameUrl: false };
  const same = normalizeScanUrl(url) === rec.url;
  return { blocked: same, nextMs, sameUrl: same };
}

/** Schreibt den Gate-Eintrag mit URL-Kontext. */
export function recordScan(url: string, ts: number = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    const record: GateRecord = { url: normalizeScanUrl(url), ts };
    localStorage.setItem(FREE_SCAN_KEY, JSON.stringify(record));
  } catch { /* localStorage unavailable */ }
}

/**
 * Wird bei Server-Rate-Limit gerufen — wir wissen die URL und den nextMs-Zeitpunkt.
 * Schreibt den Gate-Eintrag so, dass das Ablaufen mit dem Server-Cooldown synchron läuft.
 */
export function recordRateLimit(url: string, nextMs: number): void {
  recordScan(url, nextMs - FREE_SCAN_LIMIT_MS);
}

export function formatTimeRemaining(nextMs: number): string {
  const remaining = nextMs - Date.now();
  if (remaining <= 0) return "0h 0m";
  const hours   = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  if (hours > 0)   return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
