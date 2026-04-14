import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Seat limits per plan (additional members, excluding owner)
const SEAT_LIMITS: Record<string, number> = {
  "agency-starter": 2,  // 3 total
  "agency-pro":     9,  // 10 total
  agency_core:      2,  // legacy
  agency_scale:     9,  // legacy
  agentur:          2,  // legacy
};

function getPlanSeats(plan: string): number {
  return SEAT_LIMITS[plan] ?? 0;
}

function isPaidAgencyPlan(plan: string): boolean {
  return ["agency-pro", "agency-starter", "agency_core", "agency_scale", "agentur"].includes(plan);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "free";
  if (!isPaidAgencyPlan(plan)) return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const members = await sql`
    SELECT id, member_email, status, invited_at, joined_at
    FROM team_members
    WHERE owner_id = ${session.user.id}
    ORDER BY invited_at DESC
  `;

  return NextResponse.json({ members, maxSeats: getPlanSeats(plan) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "free";
  if (!isPaidAgencyPlan(plan)) return NextResponse.json({ error: "Upgrade erforderlich." }, { status: 403 });

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

  await sql`
    INSERT INTO team_members (owner_id, member_email)
    VALUES (${session.user.id}, ${email})
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM team_members WHERE id = ${id} AND owner_id = ${session.user.id}`;

  return NextResponse.json({ ok: true });
}
