/**
 * POST /api/alerts/acknowledge — markiert einen website_alerts-Eintrag als
 * gesehen (acknowledged_at = NOW()). Der Cron-Mailer wertet das aus, der
 * Live-Monitor blendet den Alarm aus.
 *
 * Body: { id: number }
 * Owner-Check: alert.user_id === session.user.id (kein horizontaler Zugriff).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  let body: { id?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON-Body erwartet" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? parseInt(body.id, 10) : body.id;
  if (!id || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Alert-ID erforderlich" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  try {
    const rows = await sql`
      UPDATE website_alerts
      SET acknowledged_at = NOW()
      WHERE id = ${id}
        AND user_id = ${session.user.id}
        AND acknowledged_at IS NULL
      RETURNING id
    ` as Array<{ id: number }>;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Alarm nicht gefunden oder bereits bestätigt" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("[alerts/acknowledge] update failed:", err);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}
