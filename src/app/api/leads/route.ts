import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const leads = await sql`
    SELECT id::text, visitor_email, scanned_url, score, status, created_at
    FROM widget_leads
    WHERE agency_user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ leads });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { id, status } = await req.json() as { id: string; status: string };
  if (!["new", "contacted", "converted"].includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE widget_leads SET status = ${status}
    WHERE id::text = ${id} AND agency_user_id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}
