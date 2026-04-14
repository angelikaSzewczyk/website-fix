/**
 * POST /api/support/mark-read
 * Marks all replied tickets for the current user as read (user_read = true).
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE support_tickets
    SET user_read = TRUE
    WHERE user_email = ${session.user.email}
      AND user_read  = FALSE
  `;

  return NextResponse.json({ ok: true });
}
