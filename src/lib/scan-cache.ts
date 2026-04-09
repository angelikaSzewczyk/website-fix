/**
 * 24-hour DB-backed scan cache.
 *
 * Keeps the full /api/scan response in Postgres so the same URL scanned
 * within 24 h returns instantly without paying for an AI call or refetching
 * all subpages.  Works across all serverless instances.
 */

import { neon } from "@neondatabase/serverless";

export type CachedScanPayload = {
  scanData: Record<string, unknown>;
  diagnose: string;
};

const CACHE_TTL_HOURS = 24;

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCachedScan(url: string): Promise<CachedScanPayload | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    // BUG FIX: INTERVAL must be a plain literal — neon tagged template would
    // parameterise ${CACHE_TTL_HOURS} as $1, producing `INTERVAL '$1 hours'`
    // which is invalid PostgreSQL and threw silently (caught → cache miss always).
    const rows = await sql`
      SELECT response_json
      FROM   scan_cache
      WHERE  url = ${url}
        AND  created_at > NOW() - INTERVAL '24 hours'
      LIMIT  1
    `;
    if (!rows.length) return null;
    return rows[0].response_json as CachedScanPayload;
  } catch {
    return null;
  }
}

// ── Write (awaitable) ────────────────────────────────────────────────────────
// BUG FIX: fire-and-forget Promises are killed by Vercel's serverless runtime
// the moment NextResponse is returned.  Both save functions are now awaitable
// so callers can decide: await for reliability, or omit await for speed.

export async function saveScan(url: string, payload: CachedScanPayload): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO scan_cache (url, response_json)
      VALUES (${url}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (url)
      DO UPDATE SET response_json = EXCLUDED.response_json,
                    created_at   = NOW()
    `;
  } catch { /* non-critical — never break the scan */ }
}

/** @deprecated kept for call-site compatibility; use saveScan() */
export function saveScanAsync(url: string, payload: CachedScanPayload): Promise<void> {
  return saveScan(url, payload);
}

// ── Diagnose-only cache (for SSE full-scan) ───────────────────────────────────

export async function getCachedDiagnose(url: string): Promise<string | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT response_json->>'diagnose' AS diagnose
      FROM   scan_cache
      WHERE  url = ${url}
        AND  created_at > NOW() - INTERVAL '24 hours'
      LIMIT  1
    `;
    if (!rows.length) return null;
    return (rows[0].diagnose as string | null) ?? null;
  } catch {
    return null;
  }
}

export async function saveDiagnose(url: string, diagnose: string): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO scan_cache (url, response_json)
      VALUES (${url}, ${JSON.stringify({ diagnose })}::jsonb)
      ON CONFLICT (url)
      DO UPDATE SET response_json = scan_cache.response_json || ${JSON.stringify({ diagnose })}::jsonb,
                    created_at   = NOW()
    `;
  } catch { /* non-critical */ }
}

/** @deprecated use saveDiagnose() */
export function saveDiagnoseAsync(url: string, diagnose: string): Promise<void> {
  return saveDiagnose(url, diagnose);
}
