/**
 * /invite/[token] — Token-Validation + Routing zur Registrierung (Phase 9).
 *
 * Sicherheits-Architektur (5 Schichten):
 *
 *   Schicht 1 — Token-Format-Validation:
 *     URL-Param wird auf base64url-Pattern geprüft, bevor er die DB sieht.
 *     Verhindert SQL-Probing mit Quatsch-Werten (lange Strings, NUL-Bytes,
 *     Unicode-Garbage).
 *
 *   Schicht 2 — Single-Lookup mit Composite-Bedingung:
 *     SELECT … WHERE invite_token = $1 AND token_expires_at > NOW()
 *           AND joined_at IS NULL
 *     Eine Query, drei Bedingungen. Wenn IRGEND eine fehlt → 0 Rows → generischer
 *     "ungültig oder abgelaufen"-Page. Kein Info-Leak, welche Bedingung versagte.
 *
 *   Schicht 3 — Generic Error-Response:
 *     Token nicht gefunden, abgelaufen, schon eingelöst → IDENTISCHE UI.
 *     Verhindert Token-Enumeration via Timing/Response-Diff.
 *
 *   Schicht 4 — Email kommt aus DB, NICHT aus URL:
 *     Der Empfänger-Email steht in team_members.member_email. Würden wir
 *     sie in der Invite-URL als Query-Param mitschicken, könnte ein Leaked
 *     Token mit beliebiger Email kombiniert werden. Stattdessen: der Token
 *     IST die Email-Identität. Wir reichen sie an /register weiter.
 *
 *   Schicht 5 — Token kann NICHT direkt eine Session erzeugen:
 *     Diese Route triggert KEINEN Login. Sie leitet nur zu /register weiter.
 *     Der eigentliche Account wird per Passwort-Setup erstellt — Token ist
 *     ein "Identitäts-Anker", nicht ein Auth-Bypass.
 *
 *   Token-Handling NACH Verbrauch:
 *     Beim erfolgreichen Register-Submit wird in /api/auth/register das
 *     joined_at gesetzt. Schicht-2-Query prüft "joined_at IS NULL" — ein
 *     zweiter Klick auf dieselbe URL führt dann zum generic Error-Page.
 *     Replay nicht möglich.
 */

import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { ensureTeamSchema } from "@/lib/team-schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

// base64url-Pattern: A-Z a-z 0-9 - _ ; ohne Padding. Tokens sind 43 Zeichen
// (256 Bit / 6 Bit pro Char, gerundet). Wir lassen 32–80 zu, defensiv gegen
// Format-Drift in Zukunft.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;

type InviteRow = {
  id:           number;
  member_email: string;
  owner_id:    number;
};

export default async function InvitePage({ params }: { params: { token: string } }) {
  const token = params.token ?? "";

  // ── Schicht 1: Format-Check vor jedem DB-Roundtrip ─────────────────────
  if (!TOKEN_PATTERN.test(token)) {
    return <InviteInvalidPage reason="Format" />;
  }

  // Schema kann theoretisch noch nicht migriert sein wenn der erste Hit
  // dieser Route VOR dem ersten /api/team-Hit kommt. ensureTeamSchema()
  // ist idempotent + cached.
  await ensureTeamSchema();

  // ── Schicht 2: Composite-Lookup ────────────────────────────────────────
  let row: InviteRow | undefined;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, member_email, owner_id
      FROM   team_members
      WHERE  invite_token     = ${token}
        AND  token_expires_at > NOW()
        AND  joined_at        IS NULL
      LIMIT  1
    ` as InviteRow[];
    row = rows[0];
  } catch (err) {
    console.error("[invite] lookup failed:", err);
    return <InviteInvalidPage reason="DB" />;
  }

  // ── Schicht 3: Generic Error für jede Failure-Variante ─────────────────
  if (!row) {
    return <InviteInvalidPage reason="NotFound" />;
  }

  // ── Schicht 4: Email aus DB, Token an /register durchreichen ───────────
  // Der register-Endpoint claimed den Token nach erfolgreicher User-Erstellung.
  const params2 = new URLSearchParams({
    email:  row.member_email,
    invite: token,
  });
  redirect(`/register?${params2.toString()}`);
}

// ─── Error-Page (eine Variante für ALLE Fail-Modes) ──────────────────────────

function InviteInvalidPage({ reason: _reason }: { reason: "Format" | "NotFound" | "DB" }) {
  // _reason wird absichtlich NICHT in der UI gezeigt — generic Error gegen
  // Token-Enumeration. Server-Logs (oben) haben den Detail.
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0b0c10",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
    }}>
      <div style={{
        maxWidth: 460, width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "36px 32px",
        color: "#ffffff",
        textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, margin: "0 auto 20px",
          borderRadius: 14,
          background: "rgba(248,113,113,0.10)",
          border: "1px solid rgba(248,113,113,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Einladung ungültig oder abgelaufen
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
          Dieser Einladungs-Link ist nicht (mehr) gültig. Mögliche Gründe:
          der Token ist abgelaufen (älter als 7 Tage), wurde bereits benutzt
          oder vom Owner zurückgezogen.
        </p>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
          Bitte den Owner deiner Agentur, dir eine neue Einladung zu senden.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 22px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#ffffff", fontSize: 13, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Zur Anmeldung →
        </Link>
      </div>
    </main>
  );
}
