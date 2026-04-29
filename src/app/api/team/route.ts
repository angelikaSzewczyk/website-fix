import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isAgency, normalizePlan } from "@/lib/plans";
import { ensureTeamSchema } from "@/lib/team-schema";
import { logAudit } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/team-mailer";

/** 256-Bit URL-safe Token. Mehr als genug Entropie gegen Brute-Force; nach
 *  Base64URL-Encoding ~43 Zeichen. */
function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Resolves the absolute base URL for invite links. NEXT_PUBLIC_BASE_URL ist
 *  in den existierenden Routes etabliert — fallback auf production-host wenn
 *  ein Fehlkonfig im Deploy auftritt. */
function inviteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://website-fix.com";
}

// Seat limits per canonical plan (additional members, excluding owner)
function getPlanSeats(plan: string): number {
  return normalizePlan(plan) === "agency" ? 9 : 0;
}

function isPaidAgencyPlan(plan: string): boolean {
  return isAgency(plan);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isPaidAgencyPlan(plan)) return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  // Erweiterte Query (Phase 7B):
  //   - LEFT JOIN users: liefert last_seen_at für Online-Status (Phase 7A
  //     Heartbeat-Spalte). Email-Match case-insensitiv via LOWER() — robust
  //     gegen mixed-case-Registrierungen, auch wenn der INSERT in POST schon
  //     toLowerCase() macht.
  //   - LEFT JOIN LATERAL scans: Tages-Aktivität (CURRENT_DATE in UTC,
  //     siehe Code-Comment unten). LATERAL ist hier sauberer als ein
  //     normales LEFT JOIN + GROUP BY, weil die Aggregation pro outer-row
  //     unabhängig läuft.
  //   - Beide JOINs sind LEFT: invited-only Members ohne User-Account
  //     bekommen last_seen_at = NULL und scans_today = 0.
  //
  // CURRENT_DATE = aktuelle UTC-Server-Datum. Ein Scan in Berlin um 23:30
  // (UTC 22:30) zählt korrekt zum heutigen Tag. Edge-Case nur das 23:00–00:00
  // Berlin-Fenster — akzeptabel für eine Aktivitäts-Anzeige.
  // Phase 8: zusätzlich scans_total für die Management-Page. EINE Lateral-
  // Subquery liefert beide Werte — sonst zwei Round-Trips pro Member.
  const members = await sql`
    SELECT
      tm.id,
      tm.member_email,
      tm.status,
      tm.invited_at,
      tm.joined_at,
      u.last_seen_at,
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
  `;

  return NextResponse.json({ members, maxSeats: getPlanSeats(plan) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isPaidAgencyPlan(plan)) return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });

  // Schema-Ensure VOR dem ersten Query — invite_token-Spalten existieren
  // sonst nicht. ensureTeamSchema() ist idempotent + per-Instance-Cached.
  await ensureTeamSchema();

  const sql = neon(process.env.DATABASE_URL!);
  const maxSeats = getPlanSeats(plan);

  const count = await sql`SELECT COUNT(*) as c FROM team_members WHERE owner_id = ${session.user.id}`;
  if (Number(count[0].c) >= maxSeats) {
    return NextResponse.json({
      error: `Maximale Teamgröße (${maxSeats + 1} Seats) erreicht. Upgrade auf Agency Scale für mehr Seats.`,
    }, { status: 400 });
  }

  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!email.includes("@")) return NextResponse.json({ error: "Ungültige E-Mail." }, { status: 400 });

  // Token-Generierung server-side mit crypto.randomBytes — 256 Bit Entropie,
  // brute-force-resistent. Expires_at = NOW + 7 Tage.
  const inviteToken = generateInviteToken();

  // INSERT mit Token. Bei ON CONFLICT (gleiche owner_id + email) updaten wir
  // den Token (Re-Invite überschreibt alten Token, alte URL wird invalide).
  // Erfordert UNIQUE(owner_id, member_email) — falls das Constraint fehlt,
  // greift ON CONFLICT DO NOTHING und kein Re-Invite ist möglich. Beides safe.
  const inserted = await sql`
    INSERT INTO team_members (owner_id, member_email, invite_token, token_expires_at)
    VALUES (${session.user.id}, ${email}, ${inviteToken}, NOW() + INTERVAL '7 days')
    ON CONFLICT (owner_id, member_email) DO UPDATE SET
      invite_token     = EXCLUDED.invite_token,
      token_expires_at = EXCLUDED.token_expires_at
    RETURNING id
  ` as { id: number }[];

  const memberId = inserted[0]?.id ?? null;

  // Agency-Branding-Daten für die White-Label-Mail. Single-Lookup, alles
  // was wir brauchen in einem Roundtrip — inkl. owner.email für reply_to.
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
    console.error("[team-invite] agency-meta lookup failed:", err);
  }

  // Audit ZUERST schreiben (fire-and-forget) — soll auch bei Mail-Failure
  // im Log stehen. Mail danach senden, ebenfalls non-blocking für Response.
  logAudit({
    ownerId:     session.user.id as string,
    action:      "team.invite",
    memberEmail: email,
    memberId,
    metadata:    { token_expires_in_days: 7 },
  });

  const inviteUrl = `${inviteBaseUrl()}/invite/${inviteToken}`;
  const mailOk = await sendInviteEmail({
    agencyName,
    brandColor,
    recipientEmail: email,
    inviteUrl,
    inviterName,
    inviterEmail,
  });

  // Mail-Failure ist NICHT kritisch — der Invite-Datensatz existiert, der
  // Owner kann den Link aus der UI erneut versenden lassen (Phase-10-Feature).
  return NextResponse.json({ ok: true, mailSent: mailOk });
}

/**
 * DELETE /api/team
 *
 * Body: { id: number | string }
 * Response: { ok: true, deleted: boolean }
 *
 * Sicherheits-Architektur (Defense-in-Depth, Phase-8-Härtung):
 *
 *   Schicht 1 — Auth-Gate (Schicht 1 §4.2):
 *     Session-Check via auth(). Plan kommt aus signiertem JWT, nicht aus Body.
 *     Ohne Session → 401, kein DB-Roundtrip.
 *
 *   Schicht 2 — Plan-Gate:
 *     Nur Agency darf team_members manipulieren. Vorher fehlte dieser Check
 *     komplett — ein Starter-User mit Prä-Migration-Daten in team_members
 *     hätte sie löschen können (theoretisch leeres Set, praktisch kein Schaden,
 *     aber wir härten gegen das Prinzip "wenig Verantwortung statt zu viel").
 *
 *   Schicht 3 — Input-Validation:
 *     id muss number ODER non-empty string sein. Kein null, kein object,
 *     kein boolean. Postgres würde solche Werte zwar zurückweisen, aber
 *     wir wollen klare 400-Responses, nicht generische 500-Errors.
 *
 *   Schicht 4 — Owner-Bound DELETE (war bereits da):
 *     `WHERE id = $1 AND owner_id = session.user.id` → der Requester kann
 *     NUR seine eigenen team_members löschen. Cross-Owner-Manipulation
 *     unmöglich, selbst wenn er die ID eines anderen Owners errät.
 *
 *   Schicht 5 — Idempotente Response:
 *     RETURNING id zeigt, ob wirklich eine Zeile betroffen war. So kann der
 *     Client zwischen "erfolgreich gelöscht" und "ID gehörte uns nicht" /
 *     "schon weg" unterscheiden — ohne über eine separate Existence-Probe
 *     Information über fremde Owner zu leaken.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isPaidAgencyPlan(plan)) {
    return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });
  }

  let body: { id?: unknown };
  try { body = await req.json(); } catch { body = {}; }

  // Akzeptiert nur primitive id-Typen. team_members.id ist serial → number,
  // aber Client könnte stringified senden — beides erlauben, alles andere ablehnen.
  const rawId = body.id;
  const isValidId =
    (typeof rawId === "number" && Number.isFinite(rawId)) ||
    (typeof rawId === "string" && rawId.length > 0 && rawId.length < 64);
  if (!isValidId) {
    return NextResponse.json({ error: "id (number|string) ist Pflicht" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  // RETURNING liefert auch die member_email für den Audit-Log — ein einziger
  // Roundtrip statt SELECT-then-DELETE.
  const deletedRows = await sql`
    DELETE FROM team_members
    WHERE id = ${rawId as number | string}
      AND owner_id = ${session.user.id}
    RETURNING id, member_email
  ` as { id: number; member_email: string }[];

  if (deletedRows[0]) {
    logAudit({
      ownerId:     session.user.id as string,
      action:      "team.remove",
      memberEmail: deletedRows[0].member_email,
      memberId:    deletedRows[0].id,
    });
  }

  return NextResponse.json({ ok: true, deleted: deletedRows.length > 0 });
}
