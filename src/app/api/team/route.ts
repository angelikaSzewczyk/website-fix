import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const members = await sql`
    SELECT id, member_email, status, invited_at, joined_at
    FROM team_members
    WHERE owner_id = ${session.user.id}
    ORDER BY invited_at DESC
  `;

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);

  // Max 2 zusätzliche Mitglieder (= 3 Seats gesamt inkl. Owner)
  const count = await sql`SELECT COUNT(*) as c FROM team_members WHERE owner_id = ${session.user.id}`;
  if (Number(count[0].c) >= 2) {
    return NextResponse.json({ error: "Maximale Teamgröße (3 Seats) erreicht." }, { status: 400 });
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
