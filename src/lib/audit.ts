/**
 * Agency-Audit-Log Helper (Phase 9).
 *
 * Append-only Schreiber für agency_audit_logs. Wird von den Team-Routes
 * fire-and-forget aufgerufen — Audit-Failure darf den Haupt-Flow nicht
 * blockieren, aber wird geloggt damit fehlende Audit-Records erkennbar sind.
 *
 * action-Konvention: "<domain>.<verb>"
 *   team.invite          — neuer Member-Datensatz angelegt
 *   team.remove          — Member-Datensatz gelöscht
 *   team.invite_resent   — bestehender Token re-versendet (Phase 10+)
 */

import { neon } from "@neondatabase/serverless";
import { ensureTeamSchema } from "./team-schema";

export type AuditAction =
  | "team.invite"
  | "team.remove"
  | "team.invite_resent"
  | "team.join";

export type AuditEntry = {
  ownerId:      number | string;
  action:       AuditAction;
  memberEmail?: string | null;
  memberId?:    number | string | null;
  metadata?:    Record<string, unknown>;
};

/**
 * Schreibt einen Audit-Eintrag. Fire-and-forget; nie awaiten.
 * Schluckt DB-Fehler (mit console.error), damit der Caller nicht blockiert.
 */
export function logAudit(entry: AuditEntry): void {
  ensureTeamSchema()
    .then(() => {
      const sql = neon(process.env.DATABASE_URL!);
      return sql`
        INSERT INTO agency_audit_logs (owner_id, action, member_email, member_id, metadata)
        VALUES (
          ${entry.ownerId},
          ${entry.action},
          ${entry.memberEmail ?? null},
          ${entry.memberId    ?? null},
          ${entry.metadata ? JSON.stringify(entry.metadata) : null}
        )
      `;
    })
    .catch(err => {
      console.error("[audit] logAudit failed:", err, { action: entry.action, ownerId: entry.ownerId });
    });
}
