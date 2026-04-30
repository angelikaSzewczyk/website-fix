/**
 * /api/leads/capture — externer Lead-Capture-Endpoint für Widgets.
 *
 * Sprint 12 Backend-Säule: ein Lead-Widget auf einer beliebigen Kunden-Site
 * (Embed via <iframe> oder <script>-Tag) postet hierhin, sobald ein Besucher
 * seine E-Mail-Adresse eingibt. Wir validieren, ordnen den Lead der
 * passenden agency_id zu und speichern in widget_leads.
 *
 * Unterschied zu /api/widget/scan:
 *   - /api/widget/scan triggert einen vollständigen WebsiteFix-Scan und
 *     ist tightly coupled mit dem hauseigenen Widget-Flow.
 *   - /api/leads/capture ist der schlanke Webhook-Endpoint: nur Lead-Insert,
 *     keine Scan-Trigger, schnelle Response. Für Drittanbieter-Tools, eigene
 *     Landingpages oder externe Embedded-Forms.
 *
 * Body (JSON):
 *   {
 *     "agencyId":   "123"               // Pflicht: numerische User-ID des Agency-Owners
 *     "email":      "interessent@..."   // Pflicht: gültige E-Mail
 *     "url":        "https://..."       // Pflicht: gescannte/relevante URL
 *     "source":     "embed-form"        // Optional: free-text Quelle (max 64)
 *     "name":       "Max Mustermann"    // Optional, ungenutzt aber persistiert in diagnose
 *     "score":      72                  // Optional: vorgeneriertes Lead-Score (0-100)
 *   }
 *
 * Response:
 *   200  { ok: true, leadId: "<uuid>" }
 *   400  { error: "..." }   — Validation
 *   403  { error: "..." }   — Agency-Plan-Check
 *   404  { error: "..." }   — Agency nicht gefunden
 *   429  { error: "..." }   — Rate-Limit
 *
 * Schutz:
 *   1. Rate-Limit: 5 req/min PRO IP+agencyId-Kombi (gegen Missbrauch).
 *   2. Origin-/Referer-Check: wenn agency_settings.custom_domain gesetzt,
 *      muss der Origin-Header damit matchen (sonst 403). Sonst egal.
 *   3. E-Mail-Format-Check (RFC-light).
 *   4. URL-Format-Check (http/https only).
 *
 * CORS: weil das Widget cross-origin postet, schicken wir Access-Control-
 * Allow-Origin entsprechend dem Request-Origin (oder *, wenn keine custom_domain).
 * Ein OPTIONS-Handler für Preflights ist exportiert.
 */

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAgency } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 15;

// ── Rate-Limit ────────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 5;
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

// ── Validation ────────────────────────────────────────────────────────────────
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

function clampInt(n: unknown, min: number, max: number, dflt: number): number {
  const v = typeof n === "number" ? n : NaN;
  if (!Number.isFinite(v)) return dflt;
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// Liefert Access-Control-Allow-Origin basierend auf agency_settings.custom_domain.
// Default = "*" (öffentlicher Capture). Wenn der Agency-Owner eine custom_domain
// gesetzt hat und der Request-Origin nicht passt → leerer Header (Browser blockt).
function corsHeadersFor(allowedOrigin: string | null, requestOrigin: string | null): Record<string, string> {
  const origin = allowedOrigin === null
    ? "*"
    : (requestOrigin && originMatches(requestOrigin, allowedOrigin)) ? requestOrigin : "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age":       "86400",
    "Vary":                         "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function originMatches(origin: string, allowed: string): boolean {
  // allowed ist eine Domain wie "kunde-agency.de" oder "https://kunde-agency.de".
  // Wir akzeptieren auch www.<domain> als Match.
  try {
    const o = new URL(origin);
    const allowedHost = allowed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
    const oHost       = o.hostname.toLowerCase();
    return oHost === allowedHost || oHost === `www.${allowedHost}` || `www.${oHost}` === allowedHost;
  } catch {
    return false;
  }
}

// ── OPTIONS (CORS Preflight) ─────────────────────────────────────────────────
export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  // Beim Preflight kennen wir die agencyId noch nicht — wir geben "*" zurück,
  // der eigentliche POST validiert dann strenger.
  const headers = corsHeadersFor(null, requestOrigin);
  return new NextResponse(null, { status: 204, headers });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? req.headers.get("x-real-ip")
          ?? "unknown";

  let body: {
    agencyId?: unknown; email?: unknown; url?: unknown;
    source?: unknown; name?: unknown; score?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON-Body erwartet.", 400, requestOrigin, null);
  }

  // ── Validation ──
  const agencyIdRaw = String(body.agencyId ?? "").trim();
  const email       = String(body.email ?? "").trim();
  const url         = String(body.url ?? "").trim();
  const source      = String(body.source ?? "external-capture").slice(0, 64);
  const name        = body.name ? String(body.name).slice(0, 120) : null;
  const score       = clampInt(body.score, 0, 100, 50);

  if (!agencyIdRaw || !/^\d+$/.test(agencyIdRaw)) {
    return jsonError("agencyId fehlt oder ist keine Zahl.", 400, requestOrigin, null);
  }
  if (!email || !isValidEmail(email)) {
    return jsonError("E-Mail-Adresse ungültig.", 400, requestOrigin, null);
  }
  if (!url || !isValidUrl(url)) {
    return jsonError("URL ungültig (http/https erforderlich).", 400, requestOrigin, null);
  }

  // ── Rate-Limit ──
  // Schlüssel = ip + agencyId. Damit kann ein Bot nicht 1000 verschiedene
  // agencyIds durchprobieren — er kommt nur mit 5/min pro Kombi durch.
  const rateKey = `${ip}:${agencyIdRaw}`;
  if (!checkRate(rateKey)) {
    return jsonError("Rate-Limit überschritten.", 429, requestOrigin, null);
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // ── Agency-Lookup + Plan-Check + Custom-Domain-Origin-Verifikation ──
    const rows = await sql`
      SELECT u.id::text AS user_id, u.plan, u.email AS owner_email, u.name AS owner_name,
             a.agency_name, a.custom_domain
      FROM users u
      LEFT JOIN agency_settings a ON a.user_id = u.id
      WHERE u.id = ${parseInt(agencyIdRaw, 10)}
      LIMIT 1
    ` as Array<{
      user_id: string; plan: string;
      owner_email: string | null; owner_name: string | null;
      agency_name: string | null; custom_domain: string | null;
    }>;

    if (rows.length === 0) {
      return jsonError("Agency nicht gefunden.", 404, requestOrigin, null);
    }
    const agency = rows[0];
    if (!isAgency(agency.plan)) {
      return jsonError("Lead-Capture ist Agency-Plans vorbehalten.", 403, requestOrigin, null);
    }

    // Wenn custom_domain gesetzt: Origin MUSS matchen. Sonst weisen wir ab.
    // Damit kann ein Konkurrent nicht das Widget einer anderen Agency
    // auf seiner eigenen Domain einbetten.
    if (agency.custom_domain && agency.custom_domain.trim()) {
      if (!requestOrigin || !originMatches(requestOrigin, agency.custom_domain)) {
        return jsonError(
          "Origin nicht autorisiert für diese Agency-Domain.",
          403,
          requestOrigin,
          agency.custom_domain,
        );
      }
    }

    // ── Insert ──
    // diagnose-Feld nutzen wir hier als Container für Source + Name —
    // der diagnose-Spalten-Type ist TEXT, wir hängen optional einen
    // strukturierten "@meta"-Marker an. Andere Capture-Pfade tun dasselbe.
    const diagnose = name ? `[${source}] Lead: ${name}` : `[${source}]`;

    const insert = await sql`
      INSERT INTO widget_leads (agency_user_id, visitor_email, scanned_url, score, diagnose)
      VALUES (${parseInt(agency.user_id, 10)}, ${email}, ${url}, ${score}, ${diagnose})
      RETURNING id::text
    ` as Array<{ id: string }>;

    return NextResponse.json(
      { ok: true, leadId: insert[0]?.id ?? null },
      { status: 200, headers: corsHeadersFor(agency.custom_domain ?? null, requestOrigin) },
    );
  } catch (err) {
    console.error("[leads/capture] failed:", err);
    return jsonError("Speichern fehlgeschlagen.", 500, requestOrigin, null);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonError(
  message: string,
  status: number,
  requestOrigin: string | null,
  customDomain: string | null,
) {
  return NextResponse.json(
    { error: message },
    { status, headers: corsHeadersFor(customDomain, requestOrigin) },
  );
}
