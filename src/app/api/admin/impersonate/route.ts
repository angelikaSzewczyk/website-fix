/**
 * POST /api/admin/impersonate
 * Creates a one-time impersonation token for a target user (admin only).
 * Returns { token } — frontend redirects to /api/admin/impersonate/callback?token=...
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json() as { userId: string };
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  // Verify user exists
  const users = await sql`SELECT id FROM users WHERE id::text = ${userId} LIMIT 1`;
  if (!users[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rows = await sql`
    INSERT INTO impersonation_tokens (user_id, created_by)
    VALUES (${userId}::integer, ${session.user.email})
    RETURNING token::text
  ` as { token: string }[];

  return NextResponse.json({ token: rows[0].token });
}
