import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";

const FREE_SCAN_LIMIT = 2;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const MIN_GAP_MS = 15_000;              // 15s Mindestabstand

/** PSI-Calls (Core Web Vitals) haben ein eigenes Kontingent, damit ein
 *  fehlgeschlagener Hauptscan dem User nicht das PSI-Budget kostet. Selbe
 *  Tabelle, anderer Hash-Namespace via "psi:"-Prefix vor dem IP-Salt. */
const PSI_LIMIT = 2;

function hashIp(ip: string, ns: "scan" | "psi" = "scan"): string {
  const prefix = ns === "psi" ? "psi:" : "";
  return createHash("sha256")
    .update(prefix + ip + (process.env.IP_SALT ?? "wf-salt-2024"))
    .digest("hex");
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  errorCode?: string;
  retryAfterMs?: number;
}

/**
 * DB-basiertes Rate Limiting für anonyme (nicht-eingeloggte) Nutzer.
 * Persistiert in der `free_scan_limits` Tabelle — überlebt Serverless-Restarts.
 */
export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  const sql = neon(process.env.DATABASE_URL!);
  const ipHash = hashIp(ip, "scan");
  const now = Date.now();

  type Row = { first_scan_at: string; last_scan_at: string; scan_count: number };
  const rows = (await sql`
    SELECT first_scan_at, last_scan_at, scan_count
    FROM free_scan_limits
    WHERE ip_hash = ${ipHash}
  `) as Row[];

  // Erster Scan dieser IP — eintragen und erlauben
  if (rows.length === 0) {
    await sql`
      INSERT INTO free_scan_limits (ip_hash, first_scan_at, last_scan_at, scan_count)
      VALUES (${ipHash}, NOW(), NOW(), 1)
    `;
    return { allowed: true };
  }

  const entry = rows[0];
  const firstScanAt = new Date(entry.first_scan_at).getTime();
  const lastScanAt  = new Date(entry.last_scan_at).getTime();

  // 24h-Fenster abgelaufen → zurücksetzen und erlauben
  if (now - firstScanAt >= WINDOW_MS) {
    await sql`
      UPDATE free_scan_limits
      SET first_scan_at = NOW(), last_scan_at = NOW(), scan_count = 1
      WHERE ip_hash = ${ipHash}
    `;
    return { allowed: true };
  }

  // Zu schnell hintereinander
  if (now - lastScanAt < MIN_GAP_MS) {
    return { allowed: false, reason: "Bitte warte kurz zwischen den Scans (15 Sekunden)." };
  }

  // Kostenloses Kontingent aufgebraucht
  if (entry.scan_count >= FREE_SCAN_LIMIT) {
    const retryAfterMs = firstScanAt + WINDOW_MS - now;
    return {
      allowed: false,
      errorCode: "RATE_LIMITED",
      reason: "Kostenloses Kontingent aufgebraucht. Bitte morgen wieder versuchen oder jetzt upgraden.",
      retryAfterMs,
    };
  }

  // Erlauben und Zähler erhöhen
  await sql`
    UPDATE free_scan_limits
    SET last_scan_at = NOW(), scan_count = scan_count + 1
    WHERE ip_hash = ${ipHash}
  `;
  return { allowed: true };
}

/**
 * PSI-Rate-Limit für Anon-Calls auf /api/performance-scan.
 * Eigenes Kontingent (2/24h), getrennt vom Hauptscan — fehlgeschlagene
 * Hauptscans dürfen das PSI-Budget nicht verbrauchen. Selbe Tabelle, eigener
 * Hash-Namespace via "psi:"-Prefix.
 */
export async function checkIpRateLimitPsi(ip: string): Promise<RateLimitResult> {
  const sql = neon(process.env.DATABASE_URL!);
  const ipHash = hashIp(ip, "psi");
  const now = Date.now();

  type Row = { first_scan_at: string; last_scan_at: string; scan_count: number };
  const rows = (await sql`
    SELECT first_scan_at, last_scan_at, scan_count
    FROM free_scan_limits
    WHERE ip_hash = ${ipHash}
  `) as Row[];

  if (rows.length === 0) {
    await sql`
      INSERT INTO free_scan_limits (ip_hash, first_scan_at, last_scan_at, scan_count)
      VALUES (${ipHash}, NOW(), NOW(), 1)
    `;
    return { allowed: true };
  }

  const entry = rows[0];
  const firstScanAt = new Date(entry.first_scan_at).getTime();
  const lastScanAt  = new Date(entry.last_scan_at).getTime();

  if (now - firstScanAt >= WINDOW_MS) {
    await sql`
      UPDATE free_scan_limits
      SET first_scan_at = NOW(), last_scan_at = NOW(), scan_count = 1
      WHERE ip_hash = ${ipHash}
    `;
    return { allowed: true };
  }

  if (now - lastScanAt < MIN_GAP_MS) {
    return { allowed: false, reason: "Bitte warte kurz zwischen Performance-Abfragen (15 Sekunden)." };
  }

  if (entry.scan_count >= PSI_LIMIT) {
    const retryAfterMs = firstScanAt + WINDOW_MS - now;
    return {
      allowed: false,
      errorCode: "RATE_LIMITED",
      reason: "PSI-Kontingent für heute verbraucht. Im Dashboard sind echte Core-Web-Vitals unbegrenzt enthalten.",
      retryAfterMs,
    };
  }

  await sql`
    UPDATE free_scan_limits
    SET last_scan_at = NOW(), scan_count = scan_count + 1
    WHERE ip_hash = ${ipHash}
  `;
  return { allowed: true };
}
