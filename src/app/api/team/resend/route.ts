/**
 * POST /api/team/resend
 *
 * Re-Invite eines bestehenden Pending-Members. Generiert einen NEUEN Token
 * (alter wird invalide), versendet neue Mail, schreibt Audit-Log.
 *
 * Sicherheits-Architektur (5 Schichten — gleiche Härtung wie DELETE):
 *
 *   Schicht 1  Auth-Gate
 *   Schicht 2  Plan-Gate (Agency-only, isPaidAgencyPlan)
 *   Schicht 3  Input-Validation (id-Typ + Range)
 *   Schicht 4  Owner-Bound UPDATE (id MUSS owner_id matchen)
 *   Schicht 5  Pending-only (joined_at IS NULL) — ein bereits beigetretener
 *              Member kann nicht "resent" werden, das wäre semantisch falsch
 *              und würde einen aktiven User aus dem Workspace werfen.
 */

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isAgency } from "@/lib/plans";
import { ensureTeamSchema } from "@/lib/team-schema";
import { logAudit } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/team-mailer";

function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}
function inviteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://website-fix.com";
}

export async function POST(req: Request) {
  // ── Schicht 1: Auth ──────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Schicht 2: Plan ──────────────────────────────────────────────────
  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) {
    return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });
  }

  // ── Schicht 3: Input-Validation ──────────────────────────────────────
  let body: { id?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const rawId = body.id;
  const isValidId =
    (typeof rawId === "number" && Number.isFinite(rawId)) ||
    (typeof rawId === "string" && rawId.length > 0 && rawId.length < 64);
  if (!isValidId) {
    return NextResponse.json({ error: "id (number|string) ist Pflicht" }, { status: 400 });
  }

  await ensureTeamSchema();
  const sql = neon(process.env.DATABASE_URL!);

  // ── Schicht 4 + 5: Owner-bound UPDATE auf pending-only Row ───────────
  // RETURNING liefert die Email für den Mail-Send + Audit. Wenn 0 Rows
  // matchen (fremde id, joined-Member, gelöscht): keine Action, 404.
  const newToken = generateInviteToken();
  const updated = await sql`
    UPDATE team_members
    SET    invite_token     = ${newToken},
           token_expires_at = NOW() + INTERVAL '7 days'
    WHERE  id        = ${rawId as number | string}
      AND  owner_id  = ${session.user.id}
      AND  joined_at IS NULL
    RETURNING id, member_email
  ` as { id: number; member_email: string }[];

  if (!updated[0]) {
    return NextResponse.json({
      ok: false,
      error: "Member nicht gefunden oder bereits beigetreten",
    }, { status: 404 });
  }

  // Agency-Branding-Daten für die White-Label-Mail. Identisch zu /api/team POST,
  // inkl. owner.email für reply_to-Header.
  let agencyName   = "Deine Agentur";
  let brandColor:  string | null = null;
  let inviterName: string | null = session.user.name  ?? null;
  let inviterEmail:string | null = session.user.email ?? null;
  try {
    const rows = await sql`
      SELECT a.agency_name, a.primary_color, u.name AS owner_name, u.email AS owner_email
      FROM   users u
      LEFT JOIN agency_settings a ON a.user_id = u.id
      WHERE  u.id = ${session.user.id}
      LIMIT 1
    ` as { agency_name: string | null; primary_color: string | null; owner_name: string | null; owner_email: string | null }[];
    agencyName   = rows[0]?.agency_name   ?? agencyName;
    brandColor   = rows[0]?.primary_color ?? null;
    inviterName  = rows[0]?.owner_name    ?? inviterName;
    inviterEmail = rows[0]?.owner_email   ?? inviterEmail;
  } catch (err) {
    console.error("[team-resend] agency-meta lookup failed:", err);
  }

  // Audit ZUERST, Mail danach (analog zur initial-invite Reihenfolge).
  logAudit({
    ownerId:     session.user.id as string,
    action:      "team.invite_resent",
    memberEmail: updated[0].member_email,
    memberId:    updated[0].id,
  });

  const inviteUrl = `${inviteBaseUrl()}/invite/${newToken}`;
  const mailOk = await sendInviteEmail({
    agencyName,
    brandColor,
    recipientEmail: updated[0].member_email,
    inviteUrl,
    inviterName,
    inviterEmail,
  });

  return NextResponse.json({ ok: true, mailSent: mailOk });
}
