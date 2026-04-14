/**
 * POST /api/support — submit a support ticket (authenticated users only)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json() as { subject?: string; message?: string };
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Betreff und Nachricht sind Pflicht." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Nachricht zu lang (max. 2000 Zeichen)." }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO support_tickets (user_id, user_email, subject, message)
    VALUES (
      ${session.user.id ? parseInt(session.user.id) : null},
      ${session.user.email},
      ${subject},
      ${message}
    )
  `;

  return NextResponse.json({ ok: true });
}
