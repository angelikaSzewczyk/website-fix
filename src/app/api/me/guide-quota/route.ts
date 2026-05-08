/**
 * GET /api/me/guide-quota
 *
 * Legacy-Endpoint: vor 08.05.2026 returnte das den Inklusiv-Guide-Quota-Status
 * für Starter (5 Smart-Fix-Guides Limit). Nach Pivot zu "Alle Anleitungen
 * inklusive" gibt es kein Quota mehr — alle Plan-User haben unlimitierten
 * Zugriff.
 *
 * Bleibt als Stub erhalten falls noch Frontend-Code dagegen fetcht.
 * Returnt immer { applicable: false } — UI rendert daraufhin keinen
 * Quota-Hinweis.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { normalizePlan } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const userRows = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ plan: string | null }>;
  const planKey = normalizePlan(userRows[0]?.plan ?? null);

  return NextResponse.json({
    ok:         true,
    applicable: false,
    plan:       planKey,
    unlimited:  true,
  });
}
