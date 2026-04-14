import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";

const FREE_SCAN_LIMIT = 1;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const MIN_GAP_MS = 15_000;              // 15s Mindestabstand

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "wf-salt-2024"))
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
  const ipHash = hashIp(ip);
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
