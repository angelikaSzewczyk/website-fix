/**
 * POST /api/guides/[id]/claim-free
 *
 * Auto-Unlock für Starter-User: pro Account 5 Guides kostenlos freischaltbar.
 * Implementiert das Marketing-Promise "5 Smart-Fix-Guides inklusive" auf der
 * Pricing-Card.
 *
 * Logik:
 *   - Auth required
 *   - Plan-Check: Starter-only (Pro/Agency haben Flatrate-Bypass über
 *     userHasFlatrate, brauchen diesen Endpoint nicht)
 *   - Quota-Check: COUNT(user_unlocked_guides WHERE paid_amount_cents = 0) < 5
 *   - Idempotent via UNIQUE(user_id, guide_id) → wenn schon unlocked: 200 mit
 *     alreadyUnlocked=true, Quota nicht zweifach belastet
 *
 * Wenn Quota voll: 402 Payment Required mit Hint auf 9,90-Stripe oder Pro.
 *
 * paid_amount_cents = 0 ist der Marker, dass es ein Quota-Claim war (nicht
 * Stripe-Kauf). Das hilft bei Reporting/Admin-Audits.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { normalizePlan } from "@/lib/plans";

export const runtime = "nodejs";

/** Anzahl der Guides, die ein Starter-User kostenlos freischalten kann.
 *  Synchron mit Pricing-Card-Bullet "5 inklusive". Bei Änderung hier
 *  parallel die PLANS-Arrays in app/page.tsx, fuer-agenturen/page.tsx
 *  und scan/results/page.tsx anpassen.
 *  Nicht exportieren — Next.js erlaubt in route.ts nur HTTP-Methods +
 *  Config-Felder als Exports. */
const STARTER_FREE_QUOTA = 5;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id: guideId } = await params;
  const sql = neon(process.env.DATABASE_URL!);

  // 1. Plan-Check: nur Starter darf claimen. Pro/Agency haben Flatrate
  //    (siehe lib/rescue-guides.userHasFlatrate) und sehen den Guide direkt
  //    ohne Unlock-Eintrag.
  const userRows = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ plan: string | null }>;
  const planKey = normalizePlan(userRows[0]?.plan ?? null);

  if (planKey !== "starter") {
    return NextResponse.json({
      ok: false,
      error: "Quota-Claim nur für Starter — höhere Pläne haben Flatrate-Zugriff.",
    }, { status: 403 });
  }

  // 2. Idempotenz: schon unlocked? → 200 mit alreadyUnlocked=true, kein
  //    weiterer Verbrauch der Quota.
  const existing = await sql`
    SELECT id FROM user_unlocked_guides
    WHERE user_id = ${session.user.id} AND guide_id = ${guideId}
    LIMIT 1
  ` as Array<{ id: number }>;

  if (existing.length > 0) {
    return NextResponse.json({ ok: true, alreadyUnlocked: true });
  }

  // 3. Guide existiert + ist aktiv?
  const guides = await sql`
    SELECT id FROM rescue_guides WHERE id = ${guideId} AND active = TRUE LIMIT 1
  ` as Array<{ id: string }>;
  if (guides.length === 0) {
    return NextResponse.json({ ok: false, error: "Guide nicht gefunden" }, { status: 404 });
  }

  // 4. Quota-Check: wie viele Quota-Claims hat dieser User bereits verbraucht?
  //    paid_amount_cents = 0 → Quota-Claim (nicht Stripe-Kauf).
  const claimedRows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_unlocked_guides
    WHERE user_id = ${session.user.id}
      AND paid_amount_cents = 0
  ` as Array<{ cnt: number }>;
  const used = claimedRows[0]?.cnt ?? 0;

  if (used >= STARTER_FREE_QUOTA) {
    return NextResponse.json({
      ok: false,
      error: "quota_exhausted",
      hint: `Deine ${STARTER_FREE_QUOTA} inklusiven Guides sind aufgebraucht. Weitere für 9,90 € einzeln oder ab Professional alle Guides inklusive.`,
      used,
      quota: STARTER_FREE_QUOTA,
      upgrade_url: "/fuer-agenturen?upgrade=professional#pricing",
    }, { status: 402 });
  }

  // 5. Insert mit paid_amount_cents = 0 als Quota-Marker.
  //    ON CONFLICT verhindert Race-Condition (zwei parallele Klicks).
  await sql`
    INSERT INTO user_unlocked_guides
      (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
    VALUES
      (${session.user.id}::int, ${guideId}, NULL, 0, 'default')
    ON CONFLICT (user_id, guide_id) DO NOTHING
  `;

  return NextResponse.json({
    ok: true,
    unlocked:    true,
    claimedFree: true,
    used:        used + 1,
    quota:       STARTER_FREE_QUOTA,
    remaining:   STARTER_FREE_QUOTA - used - 1,
  });
}

// GET: Quota-Status abfragen ohne zu claimen (für Counter-UI im Dashboard)
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

  // Pro/Agency: Flatrate, kein Quota-Konzept — UI versteckt den Counter.
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
