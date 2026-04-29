/**
 * /dashboard/team — Team-Management Hub (Phase 8).
 *
 * Server-Component-Shell:
 *   - Auth + Plan-Gate (Agency-only)
 *   - SSR-Fetch der Member-Liste (gleiche Query wie /api/team, plus scans_total)
 *   - Übergibt initial geladene Daten + ?email-Highlight an Client-Component
 *
 * Die Client-Component (TeamManagementClient) übernimmt Invite/Remove via
 * fetch + router.refresh(), damit die SSR-Snapshot wieder konsistent wird.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { isAgency, normalizePlan } from "@/lib/plans";
import { ensureTeamSchema } from "@/lib/team-schema";
import TeamManagementClient, { type Member, type AuditEntry } from "./team-management-client";

export const dynamic = "force-dynamic";

function getPlanSeats(plan: string | null | undefined): number {
  return normalizePlan(plan) === "agency" ? 9 : 0;
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) redirect("/dashboard");

  // Schema-Ensure VOR dem ersten Lesen — auf neuer Instance läuft hier ggf.
  // der allererste Hit, der die Token-Spalten/Audit-Tabelle anlegt.
  await ensureTeamSchema();

  const sql = neon(process.env.DATABASE_URL!);

  // Selbe Query wie /api/team GET, plus scans_total. Server-side gerendert
  // damit der erste Paint sofort die Daten zeigt — Client-Component übernimmt
  // danach für Invite/Remove-Aktionen.
  let members: Member[] = [];
  try {
    members = await sql`
      SELECT
        tm.id::text                   AS id,
        tm.member_email               AS member_email,
        tm.invited_at::text           AS invited_at,
        tm.joined_at::text            AS joined_at,
        u.last_seen_at::text          AS last_seen_at,
        s.scans_today,
        s.scans_total
      FROM team_members tm
      LEFT JOIN users u
        ON LOWER(u.email) = LOWER(tm.member_email)
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS scans_today,
          COUNT(*)::int                                            AS scans_total
        FROM scans
        WHERE user_id = u.id
      ) s ON TRUE
      WHERE tm.owner_id = ${session.user.id}
      ORDER BY tm.invited_at DESC
    ` as Member[];
  } catch (err) {
    console.error("[team-page] member-fetch failed:", err);
  }

  const maxSeats = getPlanSeats(plan);

  // Audit-Log: letzte 10 Einträge des Owners. Append-only Tabelle, geordnet
  // DESC für "neueste zuerst" Activity-Feed-UX.
  let auditLog: AuditEntry[] = [];
  try {
    auditLog = await sql`
      SELECT
        action,
        member_email,
        created_at::text AS created_at,
        metadata
      FROM agency_audit_logs
      WHERE owner_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 10
    ` as AuditEntry[];
  } catch (err) {
    console.error("[team-page] audit-log fetch failed:", err);
  }

  // Highlight-Hint: wenn der User per Drill-Down vom Widget kommt (?email=...),
  // soll diese Zeile in der UI optisch hervorgehoben sein. Lower-case + trim,
  // damit Casing aus der URL nicht zum Mismatch führt.
  const highlightEmail = searchParams.email
    ? String(searchParams.email).toLowerCase().trim()
    : null;

  return (
    <TeamManagementClient
      initialMembers={members}
      maxSeats={maxSeats}
      highlightEmail={highlightEmail}
      auditLog={auditLog}
    />
  );
}
