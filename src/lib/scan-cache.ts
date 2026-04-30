/**
 * DB-backed scan cache — Phase 3 Sprint 11 Refactor.
 *
 * ╭─────────────────────────────────────────────────────────────╮
 * │ Cache-Key = url : plan_tier : depth                         │
 * ╰─────────────────────────────────────────────────────────────╯
 *
 * Vorher war der Cache plan-agnostisch (key = url). Effekt: ein Starter-User
 * scannt eine Site mit max 50 Seiten — das Ergebnis (z.B. 9 Issues) landet
 * im Cache. Eine Stunde später triggert ein Agency-User für dieselbe URL
 * einen Scan mit 10000 Seiten und bekommt den Starter-Cache mit 9 Issues
 * zurück. UI sieht den Starter-Scan als "letzten Scan" — nächster Refresh
 * findet 197 echte Issues. Genau die "197 → 9"-Schwingung aus dem Audit.
 *
 * Lösung: composite key. Für jeden Plan-Tier (starter / professional /
 * agency / anon) existiert eine eigene Cache-Zeile. Ein Starter-Scan
 * kann einen Agency-Cache NICHT mehr überschreiben — er hat einen anderen
 * Schlüssel. Die UNIQUE-Constraint (url, plan_tier, max_depth) wird in
 * der Migration erzwungen.
 *
 * Default TTL: 24 h (starter / professional). Agency: 12 h (sehen Optim-
 * ierungs-Erfolge schneller).
 *
 * TTL wird via JS-Cutoff geprüft, nicht via INTERVAL — die neon-Driver-
 * Tagged-Templates parameterisieren `${n}` zu $1, was `INTERVAL '$1 hours'`
 * zur Laufzeit kaputt macht.
 */

import { neon } from "@neondatabase/serverless";
import { isAgency, planTierKey, getMaxSubpages } from "./plans";

export type CachedScanPayload = {
  scanData: Record<string, unknown>;
  diagnose: string;
};

/** Result-Type — ergänzt Cache-Timestamp für "cached vor N h"-Anzeigen. */
export type CachedScanResult = CachedScanPayload & { cachedAt: string };

/** Agency-Plans bekommen 12 h Cache-Window, alle anderen 24 h. */
export function cacheTtlHours(plan: string | null | undefined): number {
  return isAgency(plan) ? 12 : 24;
}

// ── Scan cache (POST /api/scan) ───────────────────────────────────────────────

/**
 * Lädt einen gecachten Single-Page-Scan.
 *
 * @param url     Ziel-URL (rohe Eingabe, nicht der composite key)
 * @param plan    User-Plan-String (kanonisch oder Legacy — normalizePlan intern)
 * @param ttlHours TTL-Override; default = cacheTtlHours(plan)
 *
 * Liefert NULL bei: kein Treffer, abgelaufen, DB-Fehler, oder wenn die
 * gespeicherte plan_tier/max_depth nicht zu plan passt.
 */
export async function getCachedScan(
  url: string,
  plan: string | null | undefined,
  ttlHours?: number,
): Promise<CachedScanResult | null> {
  try {
    const sql      = neon(process.env.DATABASE_URL!);
    const tier     = planTierKey(plan);
    const depth    = getMaxSubpages(plan);
    const ttl      = ttlHours ?? cacheTtlHours(plan);
    const cutoff   = new Date(Date.now() - ttl * 3_600_000).toISOString();
    const rows     = await sql`
      SELECT response_json, created_at
      FROM   scan_cache
      WHERE  url        = ${url}
        AND  plan_tier  = ${tier}
        AND  max_depth  = ${depth}
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

/**
 * Speichert einen Single-Page-Scan-Cache.
 * Composite UNIQUE-Constraint = (url, plan_tier, max_depth).
 */
export async function saveScan(
  url: string,
  plan: string | null | undefined,
  payload: CachedScanPayload,
): Promise<void> {
  try {
    const sql   = neon(process.env.DATABASE_URL!);
    const tier  = planTierKey(plan);
    const depth = getMaxSubpages(plan);
    await sql`
      INSERT INTO scan_cache (url, plan_tier, max_depth, response_json)
      VALUES (${url}, ${tier}, ${depth}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (url, plan_tier, max_depth)
      DO UPDATE SET response_json = EXCLUDED.response_json,
                    created_at    = NOW()
    `;
  } catch { /* non-critical */ }
}

/** @deprecated Compat-Alias für die Pre-Refactor-Signatur — verwendet saveScan. */
export function saveScanAsync(
  url: string,
  plan: string | null | undefined,
  payload: CachedScanPayload,
): Promise<void> {
  return saveScan(url, plan, payload);
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

/** Liest cached Full-Scan unter (url, plan_tier, max_depth).
 *  Gibt NULL bei: kein Treffer, TTL abgelaufen, DB-Fehler, Schema-Mismatch. */
export async function getCachedFullScan(
  url: string,
  plan: string | null | undefined,
  ttlHours?: number,
): Promise<CachedFullScanResult | null> {
  try {
    const sql      = neon(process.env.DATABASE_URL!);
    const tier     = planTierKey(plan);
    const depth    = getMaxSubpages(plan);
    const ttl      = ttlHours ?? cacheTtlHours(plan);
    const cutoff   = new Date(Date.now() - ttl * 3_600_000).toISOString();
    const rows     = await sql`
      SELECT response_json, created_at
      FROM   scan_cache
      WHERE  url        = ${FS_PREFIX + url}
        AND  plan_tier  = ${tier}
        AND  max_depth  = ${depth}
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
  plan: string | null | undefined,
  scanResult: ScanResult,
  scanId: string | null,
): Promise<void> {
  try {
    const sql   = neon(process.env.DATABASE_URL!);
    const tier  = planTierKey(plan);
    const depth = getMaxSubpages(plan);
    const payload: CachedFullScanV2 = {
      version:    FS_CACHE_VERSION,
      scanResult,
      scanId,
    };
    await sql`
      INSERT INTO scan_cache (url, plan_tier, max_depth, response_json)
      VALUES (${FS_PREFIX + url}, ${tier}, ${depth}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (url, plan_tier, max_depth)
      DO UPDATE SET response_json = EXCLUDED.response_json,
                    created_at    = NOW()
    `;
  } catch { /* non-critical */ }
}

// ── Legacy diagnose-only helpers (kept for any external call-sites) ───────────

/** @deprecated — use getCachedFullScan / saveFullScan for full-scan routes.
 *  Schema-Bump v2: diagnose lebt jetzt unter result.scanResult.diagnose.
 *  Bei alten v1-Caches gibt getCachedFullScan ohnehin null zurück. */
export async function getCachedDiagnose(
  url: string,
  plan: string | null | undefined,
  ttlHours?: number,
): Promise<string | null> {
  const result = await getCachedFullScan(url, plan, ttlHours);
  return result?.scanResult.diagnose ?? null;
}

/** @deprecated — use saveFullScan for full-scan routes */
export async function saveDiagnose(url: string, diagnose: string): Promise<void> {
  void url; void diagnose;
}

/** @deprecated */
export function saveDiagnoseAsync(url: string, diagnose: string): Promise<void> {
  return saveDiagnose(url, diagnose);
}
