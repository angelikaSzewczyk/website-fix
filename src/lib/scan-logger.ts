/**
 * Fire-and-forget scan logging utility.
 * Writes to scan_log without blocking the scan response.
 */
import { neon } from "@neondatabase/serverless";

export type ScanStatus = "success" | "cached" | "error";

export interface ScanLogEntry {
  userId?:    number | string | null;
  url:        string;
  scanType?:  string;
  status:     ScanStatus;
  errorMsg?:  string;
  fromCache?: boolean;
  durationMs?: number;
}

export function logScan(entry: ScanLogEntry): void {
  const sql = neon(process.env.DATABASE_URL!);
  sql`
    INSERT INTO scan_log (user_id, url, scan_type, status, error_msg, from_cache, duration_ms)
    VALUES (
      ${entry.userId ?? null},
      ${entry.url},
      ${entry.scanType ?? "website"},
      ${entry.status},
      ${entry.errorMsg ?? null},
      ${entry.fromCache ?? false},
      ${entry.durationMs ?? null}
    )
  `.catch(() => null);
}
