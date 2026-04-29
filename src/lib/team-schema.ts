/**
 * Schema-Ensures für Team + Audit (Phase 9).
 *
 * Idempotente ALTER/CREATE-Statements im Pattern aus lib/integrations.ts:
 * pro Server-Instanz wird der Ensure-Call genau einmal gefeuert (modul-
 * lokales schemaReady-Flag). Verhindert separates Migrations-Tooling.
 *
 *   team_members:
 *     - invite_token       (TEXT, UNIQUE) — der per Email versendete Token
 *     - token_expires_at   (TIMESTAMPTZ)  — Replay-Schutz, default 7 Tage
 *
 *   agency_audit_logs (NEW):
 *     - Append-only Protokoll: Owner X hat Member Y mit Aktion Z verändert.
 *     - KEINE FK auf users(id), damit der Audit auch dann erhalten bleibt
 *       wenn ein Owner-Account später gelöscht wird (Compliance/Forensik).
 */

import { neon } from "@neondatabase/serverless";

let schemaReady = false;

export async function ensureTeamSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = neon(process.env.DATABASE_URL!);

  // ── team_members: Token-Spalten ──────────────────────────────────────────
  await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_token       TEXT`;
  await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS token_expires_at   TIMESTAMPTZ`;
  // UNIQUE-Constraint via partial Index — verhindert dubletten Token-Wert.
  // Partial weil NULL-Werte (alte Datensätze, gelöschte Tokens) erlaubt sein müssen.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_invite_token
      ON team_members (invite_token)
      WHERE invite_token IS NOT NULL
  `;
  // UNIQUE auf (owner_id, member_email) — Voraussetzung für ON CONFLICT in
  // /api/team POST. Verhindert duplicate Invites desselben Owners an dieselbe
  // Email; Re-Invite überschreibt den Token statt eine zweite Row zu erzeugen.
  // KEIN LOWER() im Index: ON CONFLICT (col) muss exakt zum Index passen.
  // Application-Code lowercased bereits beim INSERT (route.ts), daher reicht
  // die direkte Spalten-Form.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_owner_email
      ON team_members (owner_id, member_email)
  `;

  // ── agency_audit_logs: Append-only Protokoll-Tabelle ─────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS agency_audit_logs (
      id            BIGSERIAL PRIMARY KEY,
      owner_id      INTEGER     NOT NULL,
      action        TEXT        NOT NULL,
      member_email  TEXT,
      member_id     BIGINT,
      metadata      JSONB,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_owner_created
      ON agency_audit_logs (owner_id, created_at DESC)
  `;

  schemaReady = true;
}
