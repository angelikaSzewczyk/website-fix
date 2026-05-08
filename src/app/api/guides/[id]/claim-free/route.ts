/**
 * POST /api/guides/[id]/claim-free
 *
 * Auto-Unlock für eingeloggte Plan-User (alle bezahlten Pläne).
 *
 * Logik (08.05.2026 vereinfacht):
 *   - Auth required
 *   - Jeder eingeloggte User mit aktivem Plan (Starter/Pro/Agency) kann
 *     unbegrenzt Smart-Fix-Anleitungen freischalten — die Pricing-Cards
 *     versprechen "Alle Anleitungen inklusive".
 *   - Pay-per-Fix (9,90 €) ist NUR für Anon-Käufer ohne Abo (siehe
 *     /api/guides/[id]/anon-checkout). Eingeloggte User sehen das nie.
 *   - Idempotent via UNIQUE(user_id, guide_id) → wenn schon unlocked: 200 mit
 *     alreadyUnlocked=true.
 *
 * paid_amount_cents = 0 ist der Marker, dass es ein Plan-Claim war (nicht
 * Stripe-Kauf). Das hilft bei Reporting/Admin-Audits.
 *
 * Vorher (bis 07.05.2026): Quota-Limit von 5 für Starter, "weitere 9,90 €" —
 * wurde am 08.05.2026 entfernt. Pivot: Pay-per-Fix nur für Nicht-Abonnenten.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { normalizePlan } from "@/lib/plans";

export const runtime = "nodejs";

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

  // 1. Plan-Check: nur User mit aktivem Plan (Starter/Pro/Agency).
  //    NULL-Plan-User (registriert aber nie gezahlt) bekommen nichts geschenkt.
  const userRows = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ plan: string | null }>;
  const planKey = normalizePlan(userRows[0]?.plan ?? null);

  if (!planKey) {
    return NextResponse.json({
      ok: false,
      error: "Kein aktiver Plan — bitte zuerst einen Plan abschließen.",
    }, { status: 403 });
  }

  // 2. Idempotenz: schon unlocked? → 200 mit alreadyUnlocked=true.
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

  // 4. Insert mit paid_amount_cents = 0 als Plan-Claim-Marker.
  //    ON CONFLICT verhindert Race-Condition (zwei parallele Klicks).
  await sql`
    INSERT INTO user_unlocked_guides
      (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
    VALUES
      (${session.user.id}::int, ${guideId}, NULL, 0, 'default')
    ON CONFLICT (user_id, guide_id) DO NOTHING
  `;

  return NextResponse.json({
    ok:          true,
    unlocked:    true,
    claimedFree: true,
  });
}

// GET: Status-Abfrage — ist Plan-Claim für diesen User möglich?
//      Nach 08.05.2026 immer "ja" für alle aktiven Pläne (kein Limit mehr).
//      Bleibt erhalten für Backwards-Compat falls Frontend GET-Status nutzt.
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
    plan:       planKey,
    canClaim:   planKey !== null,
    unlimited:  true,
  });
}
