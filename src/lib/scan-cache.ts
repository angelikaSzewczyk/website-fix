/**
 * DB-backed scan cache.
 *
 * Default TTL: 24 hours (free/pro plans).
 * Agency plans (agentur, agency_core, agency_scale) use 12 h so they see
 * results of their optimisations faster.
 *
 * TTL is enforced via a JS-computed cutoff timestamp — NOT via SQL INTERVAL
 * literals — because the neon tagged-template driver parameterises template
 * expressions, which breaks `INTERVAL '${n} hours'` at runtime.
 */

import { neon } from "@neondatabase/serverless";

export type CachedScanPayload = {
  scanData: Record<string, unknown>;
  diagnose: string;
};

/** Result type — adds cache timestamp so callers can show "cached N hours ago". */
export type CachedScanResult = CachedScanPayload & { cachedAt: string };

/** Plans that get the shorter (12 h) cache window. */
const AGENCY_PLANS = new Set(["agentur", "agency_core", "agency_scale"]);

/** Returns the appropriate TTL in hours for a given plan. */
export function cacheTtlHours(plan: string): number {
  return AGENCY_PLANS.has(plan) ? 12 : 24;
}

// ── Scan cache (POST /api/scan) ───────────────────────────────────────────────

export async function getCachedScan(
  url: string,
  ttlHours = 24,
): Promise<CachedScanResult | null> {
  try {
    const sql    = neon(process.env.DATABASE_URL!);
    const cutoff = new Date(Date.now() - ttlHours * 3_600_000).toISOString();
    const rows   = await sql`
      SELECT response_json, created_at
      FROM   scan_cache
      WHERE  url = ${url}
        AND  created_at > ${cutoff}
      LIMIT  1
    `;
    if (!rows.length) return null;
    return {
      ...(rows[0].response_json as CachedScanPayload),
      cachedAt: rows[0].created_at as string,
    };
  } catch {
    return null;
  }
}

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
  } catch { /* non-critical */ }
}

/** @deprecated kept for call-site compatibility; use saveScan() */
export function saveScanAsync(url: string, payload: CachedScanPayload): Promise<void> {
  return saveScan(url, payload);
}

// ── Full-site scan cache (GET /api/full-scan SSE) ────────────────────────────
// Stores the complete crawl result so a cache hit skips the entire BFS crawl.
// Uses a "fullsite:" key prefix to avoid colliding with regular scan entries.

const FS_PREFIX = "fullsite:";

export type CachedFullScanPayload = {
  totalPages: number;
  issueCount: number;
  diagnose:   string;
  scanId:     string | null;
};
export type CachedFullScanResult = CachedFullScanPayload & { cachedAt: string };

export async function getCachedFullScan(
  url: string,
  ttlHours = 24,
): Promise<CachedFullScanResult | null> {
  try {
    const sql    = neon(process.env.DATABASE_URL!);
    const cutoff = new Date(Date.now() - ttlHours * 3_600_000).toISOString();
    const rows   = await sql`
      SELECT response_json, created_at
      FROM   scan_cache
      WHERE  url = ${FS_PREFIX + url}
        AND  created_at > ${cutoff}
      LIMIT  1
    `;
    if (!rows.length) return null;
    return {
      ...(rows[0].response_json as CachedFullScanPayload),
      cachedAt: rows[0].created_at as string,
    };
  } catch {
    return null;
  }
}

export async function saveFullScan(url: string, payload: CachedFullScanPayload): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO scan_cache (url, response_json)
      VALUES (${FS_PREFIX + url}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (url)
      DO UPDATE SET response_json = EXCLUDED.response_json,
                    created_at   = NOW()
    `;
  } catch { /* non-critical */ }
}

// ── Legacy diagnose-only helpers (kept for any external call-sites) ───────────

/** @deprecated — use getCachedFullScan / saveFullScan for full-scan routes */
export async function getCachedDiagnose(url: string, ttlHours = 24): Promise<string | null> {
  const result = await getCachedFullScan(url, ttlHours);
  return result?.diagnose ?? null;
}

/** @deprecated — use saveFullScan for full-scan routes */
export async function saveDiagnose(url: string, diagnose: string): Promise<void> {
  // no-op: full-scan now saves via saveFullScan; kept to avoid build errors
  void url; void diagnose;
}

/** @deprecated */
export function saveDiagnoseAsync(url: string, diagnose: string): Promise<void> {
  return saveDiagnose(url, diagnose);
}
