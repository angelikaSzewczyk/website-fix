/**
 * GET  /api/admin/tickets   — list all tickets
 * POST /api/admin/tickets   — reply | resolve | reopen a ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const tickets = await sql`
    SELECT
      id::text, user_email, subject, message, status,
      admin_reply, replied_at::text, created_at::text,
      user_read, metadata
    FROM support_tickets
    ORDER BY
      CASE status WHEN 'open' THEN 0 WHEN 'replied' THEN 1 WHEN 'resolved' THEN 2 ELSE 3 END,
      created_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    action:   "reply" | "resolve" | "reopen";
    ticketId: string;
    reply?:   string;
  };

  const sql = neon(process.env.DATABASE_URL!);

  if (body.action === "reply") {
    if (!body.reply?.trim()) return NextResponse.json({ error: "reply required" }, { status: 400 });
    // user_read = FALSE → triggers notification badge for user
    await sql`
      UPDATE support_tickets
      SET admin_reply = ${body.reply.trim()},
          replied_at  = NOW(),
          status      = 'replied',
          user_read   = FALSE
      WHERE id::text = ${body.ticketId}
    `;
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resolve") {
    await sql`
      UPDATE support_tickets
      SET status    = 'resolved',
          user_read = FALSE
      WHERE id::text = ${body.ticketId}
    `;
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reopen") {
    await sql`
      UPDATE support_tickets
      SET status      = 'open',
          admin_reply = NULL,
          replied_at  = NULL,
          user_read   = TRUE
      WHERE id::text = ${body.ticketId}
    `;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
