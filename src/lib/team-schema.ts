/**
 * Schema-Ensures für Team + Audit (Phase 9, erweitert um Rollen 06.05.2026).
 *
 * Idempotente ALTER/CREATE-Statements im Pattern aus lib/integrations.ts:
 * pro Server-Instanz wird der Ensure-Call genau einmal gefeuert (modul-
 * lokales schemaReady-Flag). Verhindert separates Migrations-Tooling.
 *
 *   team_members:
 *     - invite_token       (TEXT, UNIQUE) — der per Email versendete Token
 *     - token_expires_at   (TIMESTAMPTZ)  — Replay-Schutz, default 7 Tage
 *     - role               (TEXT)         — admin | editor | viewer
 *                                            (default editor, Owner ist nicht in
 *                                             team_members → der ist immer Admin
 *                                             via implicit owner_id-Match)
 *
 *   agency_audit_logs (NEW):
 *     - Append-only Protokoll: Owner X hat Member Y mit Aktion Z verändert.
 *     - KEINE FK auf users(id), damit der Audit auch dann erhalten bleibt
 *       wenn ein Owner-Account später gelöscht wird (Compliance/Forensik).
 */

import { neon } from "@neondatabase/serverless";

/** Whitelist für Rollen — Single Source. Backend-Validation gegen diese Liste,
 *  damit kein Fremd-String per API ins CHECK-constraint einsickern kann. */
export const TEAM_ROLES = ["admin", "editor", "viewer"] as const;
export type TeamRole = typeof TEAM_ROLES[number];

let schemaReady = false;

export async function ensureTeamSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = neon(process.env.DATABASE_URL!);

  // ── team_members: Token-Spalten ──────────────────────────────────────────
  await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_token       TEXT`;
  await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS token_expires_at   TIMESTAMPTZ`;

  // ── team_members.role — Granular-Rollen-Differenzierung (06.05.2026) ─────
  // ADD COLUMN IF NOT EXISTS ist idempotent. CHECK-Constraint per separater
  // ALTER-Statement, damit ältere Postgres-Versionen ohne ADD-COLUMN-CHECK-
  // Combo das auch verkraften. Existing rows bekommen 'editor' als Default
  // (kompatibel mit pre-Roles-Verhalten — niemand hat bisher Admin-Rechte
  // außerhalb des Owners, der ohnehin nicht in team_members steht).
  await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor'`;
  // CHECK-Constraint anbringen falls noch nicht vorhanden. Catch-and-ignore,
  // weil DROP-CONSTRAINT-IF-EXISTS in PG13+ nicht mit ADD CONSTRAINT IF NOT EXISTS
  // kombinierbar ist — und ein doppeltes ADD wirft duplicate_object error.
  try {
    await sql`
      ALTER TABLE team_members
      ADD CONSTRAINT team_members_role_check
      CHECK (role IN ('admin', 'editor', 'viewer'))
    `;
  } catch (err) {
    // Vermutlich "constraint already exists" — bei jedem Re-Run der Fall.
    // Nur loggen wenn es etwas ANDERES als duplicate_object ist.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists|duplicate/i.test(msg)) {
      console.error("[team-schema] role CHECK constraint failed:", msg);
    }
  }
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
