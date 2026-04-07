import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const websites = await sql`
    SELECT sw.id, sw.url, sw.name, sw.created_at,
      (SELECT issue_count FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_issue_count,
      (SELECT created_at FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_scan_at,
      (SELECT type FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_scan_type
    FROM saved_websites sw
    WHERE sw.user_id = ${session.user.id}
    ORDER BY sw.created_at DESC
  `;
  return NextResponse.json({ websites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const { url, name } = await req.json();
  if (!url) return NextResponse.json({ error: "URL fehlt" }, { status: 400 });
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO saved_websites (user_id, url, name)
    VALUES (${session.user.id}, ${url.trim()}, ${name?.trim() ?? null})
    ON CONFLICT (user_id, url) DO NOTHING
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const { id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM saved_websites WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ success: true });
}
