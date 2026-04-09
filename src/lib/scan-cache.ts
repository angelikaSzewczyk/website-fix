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
    const rows = await sql`
      SELECT response_json
      FROM   scan_cache
      WHERE  url = ${url}
        AND  created_at > NOW() - INTERVAL '${CACHE_TTL_HOURS} hours'
      LIMIT  1
    `;
    if (!rows.length) return null;
    return rows[0].response_json as CachedScanPayload;
  } catch {
    return null; // never block on cache miss
  }
}

// ── Write (fire-and-forget) ───────────────────────────────────────────────────

export function saveScanAsync(url: string, payload: CachedScanPayload): void {
  // Intentionally NOT awaited — DB write must never delay the HTTP response.
  const sql = neon(process.env.DATABASE_URL!);
  sql`
    INSERT INTO scan_cache (url, response_json)
    VALUES (${url}, ${JSON.stringify(payload)})
    ON CONFLICT (url)
    DO UPDATE SET response_json = EXCLUDED.response_json,
                  created_at   = NOW()
  `.catch(() => null);
}

// ── Diagnose-only cache (for SSE full-scan) ───────────────────────────────────

export async function getCachedDiagnose(url: string): Promise<string | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT response_json->>'diagnose' AS diagnose
      FROM   scan_cache
      WHERE  url = ${url}
        AND  created_at > NOW() - INTERVAL '${CACHE_TTL_HOURS} hours'
      LIMIT  1
    `;
    if (!rows.length) return null;
    return (rows[0].diagnose as string | null) ?? null;
  } catch {
    return null;
  }
}

export function saveDiagnoseAsync(url: string, diagnose: string): void {
  const sql = neon(process.env.DATABASE_URL!);
  sql`
    INSERT INTO scan_cache (url, response_json)
    VALUES (${url}, ${JSON.stringify({ diagnose })})
    ON CONFLICT (url)
    DO UPDATE SET response_json = scan_cache.response_json || ${JSON.stringify({ diagnose })}::jsonb,
                  created_at   = NOW()
  `.catch(() => null);
}
