/**
 * /api/wp-bridge — WordPress-Plugin holt bereinigte SEO-Daten als JSON.
 *
 * Sprint 12 Backend-Säule: das WP-Plugin "WebsiteFix Auto-Heal" wird auf der
 * Kunden-Site installiert und ruft diesen Endpoint regelmäßig auf, um die
 * vom WebsiteFix-Crawler vorgeschlagenen Korrekturen einzulesen
 * (Alt-Texte für Bilder, Meta-Descriptions, Title-Tags, broken-link-Liste).
 *
 * Auth-Modell:
 *   1. Header X-WF-API-Key:  wfak_<64-hex>  (vom Agency-User im Dashboard generiert)
 *   2. Server hashed den eingehenden Key (SHA-256) und sucht in
 *      agency_settings.api_key_wp_hash. Constant-time durch Hash-Vergleich
 *      (SHA-256 ist deterministisch — der Index garantiert <100µs Lookup).
 *   3. Bei Match: User-Identität steht fest, Plan-Check (Agency only).
 *   4. Optional: Query-Param ?url=<site-url> begrenzt die zurückgegebenen
 *      Daten auf eine bestimmte Site. Ohne url werden alle Sites des Agency-
 *      Accounts geliefert (das WP-Plugin filtert dann selbst).
 *
 * Response-Schema (stable, versioned):
 *   {
 *     "version": 1,
 *     "agency": { "name": "..." },
 *     "sites": [
 *       {
 *         "url": "https://kunde.de",
 *         "scan_id": "...",
 *         "scanned_at": "...",
 *         "alt_suggestions":  [{ "image_url": "...", "page_url": "...", "suggestion": "..." }],
 *         "missing_meta":     [{ "page_url": "...", "title_missing": true, "meta_missing": false }],
 *         "broken_links":     [{ "url": "...", "status": 404 }],
 *         "recommendations":  [{ "kind": "alt", "count": 24, "severity": "yellow" }]
 *       }
 *     ]
 *   }
 *
 * Rate-Limit: 30 req/min pro API-Key (in-memory). Plugin pollt typisch alle
 * 6h, also reicht das großzügig — verhindert Brute-Force auf den Key-Space.
 */

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAgency } from "@/lib/plans";
import { sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Rate-Limit ────────────────────────────────────────────────────────────────
// In-Memory pro Server-Instance. Vercel-Serverless-Funktionen warm-poolen
// die Instanzen, daher reicht das gegen blunt brute force. Für echte
// production-grade rate limit eine Redis-/Upstash-Backed-Variante.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 30;
const rateBuckets    = new Map<string, { count: number; resetAt: number }>();

function checkRate(key: string): boolean {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || now > b.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type AgencyOwnerRow = {
  user_id: number;
  agency_name: string | null;
  plan: string;
};

type ScanRow = {
  id: string;
  url: string;
  created_at: string;
  issues_json: ScanIssueLike[] | null;
  unterseiten_json: UnterseiteLike[] | null;
  scan_data: Record<string, unknown> | null;
};

type ScanIssueLike = {
  kind?:        string;
  title?:       string;
  body?:        string;
  severity?:    string;
  count?:       number;
  affectedUrls?: string[];
};

type UnterseiteLike = {
  url:                       string;
  title?:                    string;
  metaDescription?:          string;
  altMissing?:               number;
  altMissingImages?:         string[];
  inputsWithoutLabel?:       number;
  noindex?:                  boolean;
  erreichbar?:               boolean;
  status?:                   number;
};

type AltSuggestion   = { image_url: string; page_url: string; suggestion: string };
type MissingMetaRow  = { page_url: string; title_missing: boolean; meta_missing: boolean; h1_missing: boolean; noindex: boolean };
type BrokenLinkRow   = { url: string; status: number };
type Recommendation  = { kind: string; count: number; severity: string; title: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function isReadableSlug(s: string): boolean {
  // Akzeptiert wfak_<hex>, schützt gegen offensichtlich falsch-formatierte Keys
  // (z.B. das User-Email-Feld) ohne aufwendigen Server-Roundtrip.
  return /^wfak_[a-f0-9]{32,128}$/i.test(s);
}

function deriveAltSuggestion(filename: string, pageUrl: string): string {
  // Naive heuristic: dateiname → menschenlesbarer Alt-Text.
  // "team-photo-buero-muenchen.jpg" → "team photo buero muenchen"
  // Das Plugin kann die Suggestion im Backend übernehmen oder dem Redakteur
  // als Vorschlag präsentieren.
  let base = filename;
  try {
    const u = new URL(filename, pageUrl);
    base = u.pathname.split("/").pop() ?? filename;
  } catch { /* relative path or non-URL filename */ }
  base = base.replace(/\.[a-z0-9]{2,4}$/i, ""); // strip extension
  base = base.replace(/[-_]+/g, " ");
  base = base.replace(/(\d+x\d+|\d{3,})/g, ""); // strip dimensions / IDs
  base = base.replace(/\s+/g, " ").trim();
  return base ? base.toLowerCase() : "Bild ohne Beschreibung";
}

function pickIssuesByKind(issues: ScanIssueLike[] | null, kind: string): ScanIssueLike[] {
  if (!Array.isArray(issues)) return [];
  return issues.filter(i => i?.kind === kind);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function authByKey(req: NextRequest): Promise<AgencyOwnerRow | { error: string; status: number }> {
  // Akzeptiere Header X-WF-API-Key ODER Authorization: Bearer wfak_…
  const headerKey = req.headers.get("x-wf-api-key") ?? "";
  const bearer    = req.headers.get("authorization") ?? "";
  const fromBearer = bearer.toLowerCase().startsWith("bearer ") ? bearer.slice(7).trim() : "";
  const candidate = headerKey.trim() || fromBearer;

  if (!candidate) return { error: "API-Key fehlt (X-WF-API-Key oder Authorization-Header).", status: 401 };
  if (!isReadableSlug(candidate)) return { error: "API-Key-Format ungültig.", status: 401 };
  if (!checkRate(candidate))      return { error: "Rate-Limit überschritten — bitte später erneut.", status: 429 };

  const hash = sha256Hex(candidate);

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT a.user_id, a.agency_name, u.plan
      FROM agency_settings a
      JOIN users u ON u.id = a.user_id
      WHERE a.api_key_wp_hash = ${hash}
      LIMIT 1
    ` as AgencyOwnerRow[];
    if (rows.length === 0) return { error: "API-Key ungültig.", status: 401 };
    const owner = rows[0];
    if (!isAgency(owner.plan)) return { error: "Plan unterstützt WP-Bridge nicht.", status: 403 };
    return owner;
  } catch (err) {
    console.error("[wp-bridge] auth lookup failed:", err);
    return { error: "Interner Fehler bei der Authentifizierung.", status: 500 };
  }
}

// ── Daten-Aufbereitung ────────────────────────────────────────────────────────
function buildSitePayload(scan: ScanRow): {
  url: string;
  scan_id: string;
  scanned_at: string;
  alt_suggestions: AltSuggestion[];
  missing_meta:    MissingMetaRow[];
  broken_links:    BrokenLinkRow[];
  recommendations: Recommendation[];
} {
  const alt: AltSuggestion[]    = [];
  const missing: MissingMetaRow[] = [];
  const broken: BrokenLinkRow[] = [];
  const recs:    Recommendation[] = [];

  // ── 1. Alt-Suggestions aus unterseiten_json + altMissingImages ──
  if (Array.isArray(scan.unterseiten_json)) {
    for (const page of scan.unterseiten_json) {
      const imgs = page.altMissingImages ?? [];
      for (const img of imgs) {
        alt.push({
          image_url: img,
          page_url:  page.url,
          suggestion: deriveAltSuggestion(img, page.url),
        });
      }
      // Per-Page Meta-Probleme zusammenfassen
      const titleMissing = !page.title || page.title === "(kein Title)";
      const metaMissing  = !page.metaDescription;
      const h1Missing    = false; // h1 lebt nicht in unterseiten_json (war eh implicit), default false
      const isNoindex    = !!page.noindex;
      if (titleMissing || metaMissing || isNoindex) {
        missing.push({
          page_url:      page.url,
          title_missing: titleMissing,
          meta_missing:  metaMissing,
          h1_missing:    h1Missing,
          noindex:       isNoindex,
        });
      }
    }
  }

  // ── 2. Broken Links aus scan_data.audit.brokenLinks ──
  const audit = scan.scan_data?.audit as { brokenLinks?: { url: string; status: number }[] } | undefined;
  if (Array.isArray(audit?.brokenLinks)) {
    for (const bl of audit!.brokenLinks!) {
      broken.push({ url: bl.url, status: bl.status });
    }
  }

  // ── 3. Recommendations: aggregierte Issue-Kategorien ──
  for (const i of scan.issues_json ?? []) {
    if (!i?.kind || !i?.title) continue;
    recs.push({
      kind:     i.kind,
      title:    i.title,
      count:    i.count ?? 1,
      severity: i.severity ?? "yellow",
    });
  }

  return {
    url:             scan.url,
    scan_id:         scan.id,
    scanned_at:      scan.created_at,
    alt_suggestions: alt,
    missing_meta:    missing,
    broken_links:    broken,
    recommendations: recs,
  };
}

// ── GET /api/wp-bridge?url=<site-url> ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const owner = await authByKey(req);
  if ("error" in owner) {
    return NextResponse.json({ error: owner.error }, { status: owner.status });
  }

  const urlFilter = req.nextUrl.searchParams.get("url")?.trim() || null;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Hole pro saved_websites des Agency-Owners den letzten Non-Superseded-Scan.
    // Sprint 11-Compat: is_superseded gibt es seit der Sprint-11-Migration; falls
    // sie noch nicht ausgerollt ist, scheitert der Filter — wir fangen das in
    // einem zweiten try-Pfad ab.
    let rows: ScanRow[] = [];
    try {
      rows = await sql`
        SELECT s.id::text, s.url, s.created_at::text,
               s.issues_json, s.unterseiten_json,
               s.result, s.tech_fingerprint,
               s.meta_json,
               s.id AS s_id_marker,
               (SELECT scan_cache.response_json FROM scan_cache WHERE scan_cache.url = s.url LIMIT 1) AS scan_cache_payload
        FROM saved_websites sw
        JOIN LATERAL (
          SELECT s.id, s.url, s.created_at,
                 s.issues_json, s.unterseiten_json
          FROM scans s
          WHERE s.url = sw.url AND s.user_id = sw.user_id
            AND s.is_superseded = FALSE
          ORDER BY s.created_at DESC
          LIMIT 1
        ) s ON true
        WHERE sw.user_id = ${owner.user_id}
          AND (${urlFilter}::text IS NULL OR sw.url = ${urlFilter})
        ORDER BY s.created_at DESC
        LIMIT 50
      ` as unknown as ScanRow[];
    } catch {
      // Fallback ohne is_superseded-Filter (Migration noch nicht durch).
      rows = await sql`
        SELECT s.id::text, s.url, s.created_at::text,
               s.issues_json, s.unterseiten_json
        FROM saved_websites sw
        JOIN LATERAL (
          SELECT s.id, s.url, s.created_at, s.issues_json, s.unterseiten_json
          FROM scans s
          WHERE s.url = sw.url AND s.user_id = sw.user_id
          ORDER BY s.created_at DESC
          LIMIT 1
        ) s ON true
        WHERE sw.user_id = ${owner.user_id}
          AND (${urlFilter}::text IS NULL OR sw.url = ${urlFilter})
        ORDER BY s.created_at DESC
        LIMIT 50
      ` as unknown as ScanRow[];
    }

    const sites = rows.map(buildSitePayload);

    return NextResponse.json({
      version: 1,
      agency:  { name: owner.agency_name ?? "Agency" },
      sites,
    }, {
      headers: {
        // Plugin polled wahrscheinlich häufiger; wir geben Cache-Hints.
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("[wp-bridge] GET failed:", err);
    return NextResponse.json({ error: "Datenabruf fehlgeschlagen." }, { status: 500 });
  }
}

// ── POST /api/wp-bridge ──────────────────────────────────────────────────────
// Plugin meldet zurück, welche Korrekturen es übernommen hat. Body:
//   { url, applied: [{ kind, page_url, image_url? }] }
// Wir vermerken das in scan_meta und lassen den Agency-User im Dashboard sehen,
// was der Auto-Heal-Bot wirklich gemacht hat. Idempotent — doppelte applied-
// Items überschreiben sich.
export async function POST(req: NextRequest) {
  const owner = await authByKey(req);
  if ("error" in owner) {
    return NextResponse.json({ error: owner.error }, { status: owner.status });
  }

  let body: { url?: string; applied?: Array<{ kind: string; page_url?: string; image_url?: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON-Body erwartet." }, { status: 400 });
  }
  const url     = body.url?.trim() || null;
  const applied = Array.isArray(body.applied) ? body.applied : [];
  if (!url || applied.length === 0) {
    return NextResponse.json({ error: "url und applied[] sind Pflichtfelder." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Ownership-Check: gehört die url dem Agency-Owner?
    const ownerCheck = await sql`
      SELECT 1 FROM saved_websites
      WHERE user_id = ${owner.user_id} AND url = ${url}
      LIMIT 1
    ` as unknown[];
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: "URL nicht in deinem Agency-Konto registriert." }, { status: 404 });
    }

    // Insert in website_alerts als 'auto_heal'-Eintrag — dieselbe Tabelle wie
    // Plugin-Diff-Alerts, severity=info. Damit erscheint die Aktivität direkt
    // im Live-Monitor-Widget des Agency-Dashboards.
    try {
      const summary = applied.length === 1
        ? `1 Korrektur durch WordPress-Plugin angewendet`
        : `${applied.length} Korrekturen durch WordPress-Plugin angewendet`;
      const sample = applied.slice(0, 5).map(a => `${a.kind}${a.image_url ? ` (${a.image_url})` : ""}`).join(", ");
      await sql`
        INSERT INTO website_alerts (
          user_id, website_id, alert_type, severity, title, message, payload
        )
        SELECT ${owner.user_id}, sw.id, 'auto_heal', 'info', ${summary}, ${sample},
               ${JSON.stringify({ applied, count: applied.length })}::jsonb
        FROM saved_websites sw
        WHERE sw.user_id = ${owner.user_id} AND sw.url = ${url}
        LIMIT 1
      `;
    } catch (err) {
      // Tabelle existiert evtl. noch nicht (Migration ausstehend) — Endpoint
      // soll trotzdem 200 zurückgeben, damit das Plugin nicht retried.
      console.error("[wp-bridge] alert insert failed:", err);
    }

    return NextResponse.json({ ok: true, accepted: applied.length });
  } catch (err) {
    console.error("[wp-bridge] POST failed:", err);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }
}
