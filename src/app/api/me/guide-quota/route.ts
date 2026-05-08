/**
 * GET /api/me/guide-quota
 *
 * Returnt den Inklusiv-Guide-Quota-Status für den eingeloggten User —
 * ohne dass eine konkrete guide_id bekannt sein muss.
 *
 * Nutzungs-Kontext: das UpgradeModal in IssueList wird beim Klick auf
 * "Schritt-für-Schritt-Anleitung freischalten" geöffnet, ohne dass das
 * System weiß welcher Guide zum Issue passt. Damit der User trotzdem
 * sieht ob er noch Inklusiv-Quota hat (statt fälschlich 9,90 € zu zahlen),
 * lädt das Modal diesen Endpoint.
 *
 * Returns:
 *   - { applicable: false }  → Pro/Agency (Flatrate) oder NULL-Plan
 *   - { applicable: true, used, quota, remaining }  → Starter mit Quota-Status
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { normalizePlan } from "@/lib/plans";

const STARTER_FREE_QUOTA = 5; // Synchron mit /api/guides/[id]/claim-free

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

  // Pro/Agency haben Flatrate-Zugang, kein Quota-Konzept.
  // NULL-Plan (nicht-zahlend) hat keinen Quota.
  if (planKey !== "starter") {
    return NextResponse.json({ ok: true, applicable: false, plan: planKey });
  }

  const claimedRows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_unlocked_guides
    WHERE user_id = ${session.user.id}
      AND paid_amount_cents = 0
  ` as Array<{ cnt: number }>;
  const used = claimedRows[0]?.cnt ?? 0;

  return NextResponse.json({
    ok:         true,
    applicable: true,
    plan:       "starter",
    used,
    quota:      STARTER_FREE_QUOTA,
    remaining:  Math.max(0, STARTER_FREE_QUOTA - used),
  });
}
