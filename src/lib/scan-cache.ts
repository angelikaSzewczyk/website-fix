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
import { isAgency } from "./plans";

export type CachedScanPayload = {
  scanData: Record<string, unknown>;
  diagnose: string;
};

/** Result type — adds cache timestamp so callers can show "cached N hours ago". */
export type CachedScanResult = CachedScanPayload & { cachedAt: string };

/** Agency plans get a shorter (12 h) cache window so they see optimisation results faster. */
export function cacheTtlHours(plan: string): number {
  return isAgency(plan) ? 12 : 24;
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
//
// SCHEMA-BUMP (Phase B / Operation Unified Core):
//   v1 (legacy): { totalPages, issueCount, diagnose, scanId }
//   v2 (current): { version: 2, scanResult: ScanResult, scanId }
//
// v1-Cache-Einträge werden absichtlich IGNORIERT (return null), weil sie
// kein issues_json haben und damit "Keine Probleme" suggerieren würden —
// genau der Trust-Bug aus dem Screenshot. Alte Einträge laufen über ihr
// 24h-TTL aus und werden nie wieder gelesen.

import type { ScanResult } from "./scan-engine/types";

const FS_PREFIX = "fullsite:";
const FS_CACHE_VERSION = 2 as const;

export type CachedFullScanV2 = {
  version:     2;
  scanResult:  ScanResult;
  scanId:      string | null;
};
export type CachedFullScanResult = CachedFullScanV2 & { cachedAt: string };

/** Liest cached Full-Scan. Gibt NULL zurück bei:
 *   - kein Cache-Eintrag
 *   - TTL abgelaufen
 *   - DB-Fehler
 *   - Schema-Mismatch (version !== 2 → alter v1-Eintrag, ignored)
 *
 *  Damit ist sichergestellt, dass kein alter Cache-Eintrag den neuen
 *  Engine-basierten Scan überdecken kann. */
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

    const data = rows[0].response_json as { version?: number } | null;
    // Schema-Check: alle Einträge ohne version === 2 sind v1 oder kaputt.
    // Im DB-Layer NICHT löschen — nur ignorieren. Sie laufen über TTL aus.
    if (!data || data.version !== FS_CACHE_VERSION) return null;

    return {
      ...(data as CachedFullScanV2),
      cachedAt: rows[0].created_at as string,
    };
  } catch {
    return null;
  }
}

/** Speichert einen vollständigen Full-Scan im neuen v2-Format. */
export async function saveFullScan(
  url: string,
  scanResult: ScanResult,
  scanId: string | null,
): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const payload: CachedFullScanV2 = {
      version:    FS_CACHE_VERSION,
      scanResult,
      scanId,
    };
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

/** @deprecated — use getCachedFullScan / saveFullScan for full-scan routes.
 *  Schema-Bump v2: diagnose lebt jetzt unter result.scanResult.diagnose.
 *  Bei alten v1-Caches gibt getCachedFullScan ohnehin null zurück. */
export async function getCachedDiagnose(url: string, ttlHours = 24): Promise<string | null> {
  const result = await getCachedFullScan(url, ttlHours);
  return result?.scanResult.diagnose ?? null;
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
