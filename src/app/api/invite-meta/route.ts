/**
 * GET /api/invite-meta?token=<token>
 *
 * Public endpoint — keine Authentifizierung erforderlich, weil eingeladene
 * User noch keinen Account haben. Liefert minimal nötige Branding-Daten,
 * damit die /register-Page das White-Label-Erlebnis fortsetzen kann.
 *
 * Response (200):
 *   { agency_name: string, brand_color: string | null }
 *
 * Response (404):
 *   { error: "Invalid or expired" }   ← generic, identisch zu /invite/[token]
 *
 * Sicherheits-Architektur (5 Schichten):
 *
 *   Schicht 1 — Token-Format-Validation:
 *     Pattern-Check vor jedem DB-Roundtrip.
 *
 *   Schicht 2 — Composite-Lookup:
 *     Token + nicht-abgelaufen + nicht-eingelöst in einer Query.
 *
 *   Schicht 3 — Generic Error für ALLE Fail-Modes:
 *     Kein Info-Leak welche Bedingung versagte.
 *
 *   Schicht 4 — Minimum-Disclosure-Principle:
 *     Response enthält NUR was die UI für das Rendering braucht. KEINE PII:
 *       - kein member_email (würde Token-zu-Email-Mapping ermöglichen)
 *       - keine owner_email/owner_name
 *       - keine team_member.id
 *       - keine token_expires_at (wäre OSINT-Hilfe für Token-Cracking)
 *
 *   Schicht 5 — Cache-Header:
 *     no-store: das Endpoint liest live-Daten und sollte nie gecached werden.
 *     Verhindert auch Token-Caching in Shared-Caches/CDNs.
 */

import { NextResponse, type NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ensureTeamSchema } from "@/lib/team-schema";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  // ── Schicht 1 ─────────────────────────────────────────────────────────
  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Invalid or expired" }, { status: 404, headers: HEADERS });
  }

  await ensureTeamSchema();

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // ── Schicht 2: Composite-Lookup, JOIN nur die zwei Branding-Felder ──
    const rows = await sql`
      SELECT
        a.agency_name,
        a.primary_color
      FROM   team_members tm
      JOIN   users u           ON u.id      = tm.owner_id
      LEFT JOIN agency_settings a ON a.user_id = tm.owner_id
      WHERE  tm.invite_token     = ${token}
        AND  tm.token_expires_at > NOW()
        AND  tm.joined_at        IS NULL
      LIMIT  1
    ` as { agency_name: string | null; primary_color: string | null }[];

    // ── Schicht 3: Generic Error für jede Failure-Variante ──────────────
    if (!rows[0]) {
      return NextResponse.json({ error: "Invalid or expired" }, { status: 404, headers: HEADERS });
    }

    // ── Schicht 4: Minimum-Disclosure ──────────────────────────────────
    // Validiere primary_color server-side, damit der Client nicht selbst
    // entscheiden muss ob ein DB-Wert "vertrauenswürdig" ist.
    const brandColor = rows[0].primary_color && /^#[0-9a-fA-F]{6}$/.test(rows[0].primary_color)
      ? rows[0].primary_color
      : null;

    return NextResponse.json({
      agency_name: rows[0].agency_name ?? "Deine Agentur",
      brand_color: brandColor,
    }, { headers: HEADERS });
  } catch (err) {
    console.error("[invite-meta] lookup failed:", err);
    // Bei DB-Fehler ebenfalls Generic 404 — der Client soll bei jedem Fehler
    // sauber auf den Default-Render zurückfallen.
    return NextResponse.json({ error: "Invalid or expired" }, { status: 404, headers: HEADERS });
  }
}
