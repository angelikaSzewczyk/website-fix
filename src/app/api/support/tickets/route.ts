/**
 * GET /api/support/tickets — returns the current user's own tickets
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const tickets = await sql`
    SELECT
      id::text, subject, message, status,
      admin_reply, replied_at::text, created_at::text,
      user_read
    FROM support_tickets
    WHERE user_email = ${session.user.email}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ tickets });
}
