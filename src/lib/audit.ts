/**
 * Agency-Aktivitäts-Log Helper (Phase 9, erweitert 11.05.2026).
 *
 * Append-only Schreiber für agency_audit_logs. Fire-and-forget aufgerufen —
 * Log-Failure darf den Haupt-Flow nicht blockieren, aber wird console.error'd
 * damit fehlende Records erkennbar sind.
 *
 * action-Konvention: "<domain>.<verb>"
 *   team.invite          — neuer Member-Datensatz angelegt
 *   team.remove          — Member-Datensatz gelöscht
 *   team.invite_resent   — bestehender Token re-versendet
 *   team.join            — Member hat Invite eingelöst
 *   scan.start           — Scan wurde getriggert (Agency-User, kein Member)
 *   website.create       — Neue Kundenseite angelegt
 *   website.delete       — Kundenseite entfernt
 *   settings.update      — agency_settings via PUT geändert (Branding/Domain/SMTP)
 *
 * Pricing-Card-Versprechen "Aktivitäts-Log + Haftungs-Dokumentation"
 * (Agency-Plan) hängt an diesem Helper. Wer einen Event-Typ braucht, der
 * hier noch fehlt: AuditAction-Union erweitern, NICHT freie Strings nutzen.
 */

import { neon } from "@neondatabase/serverless";
import { ensureTeamSchema } from "./team-schema";

export type AuditAction =
  | "team.invite"
  | "team.remove"
  | "team.invite_resent"
  | "team.join"
  | "scan.start"
  | "website.create"
  | "website.delete"
  | "settings.update";

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
