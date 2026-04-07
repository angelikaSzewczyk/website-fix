import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const schedules = await sql`
    SELECT * FROM scheduled_scans WHERE user_id = ${session.user.id} ORDER BY created_at DESC
  `;
  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const { url, type, frequency, notify_email } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + (frequency === "daily" ? 1 : 7));
  await sql`
    INSERT INTO scheduled_scans (user_id, url, type, frequency, notify_email, next_run_at)
    VALUES (${session.user.id}, ${url}, ${type ?? "website"}, ${frequency ?? "weekly"}, ${notify_email ?? true}, ${nextRun.toISOString()})
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const { id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM scheduled_scans WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ success: true });
}
