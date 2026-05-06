/**
 * GET /api/guides/[id]/verify-anon?session_id=cs_...
 *
 * Polling-Endpoint für die /scan/checkout/claim-Page. Bestätigt, dass
 * der Webhook den anonymen Guide-Kauf bereits verarbeitet hat.
 *
 * Returns 200 mit:
 *  { verified: true,  email: "user@x.de", isNewAccount: bool }
 *  { verified: false }                     — noch nicht verarbeitet
 *
 * Sicherheits-Eigenschaften:
 *  - Stripe-Session muss zu DIESEM Guide gehören (metadata.guide_id ===
 *    URL-Param) — verhindert Session-ID-Schmuggel zur Info-Discovery.
 *  - Email wird zurückgegeben, weil die Claim-Page sie anzeigen muss
 *    ("Wir haben dir an X eine Mail geschickt"). Der Käufer hat sie eh
 *    selbst gerade eingegeben.
 *  - isNewAccount-Flag wird über password_hash IS NULL bestimmt.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: guideId } = await params;
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ verified: false });
  }

  let stripeSession: Stripe.Checkout.Session;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ verified: false });
  }

  // Owner-Check: Session muss zum richtigen Guide gehören (Anti-Schmuggel)
  if (stripeSession.metadata?.guide_id !== guideId) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }
  // Nur anon-Käufe — andere Pfade haben ihre eigenen Verify-Endpoints
  if (stripeSession.metadata?.kind !== "rescue_guide_anon") {
    return NextResponse.json({ verified: false }, { status: 400 });
  }
  if (stripeSession.payment_status !== "paid") {
    return NextResponse.json({ verified: false });
  }

  const email = (stripeSession.customer_details?.email ?? stripeSession.metadata?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ verified: false });

  const sql = neon(process.env.DATABASE_URL!);

  // User existiert + Unlock geschrieben? → Webhook hat fertig.
  const rows = await sql`
    SELECT u.id::text AS user_id, u.password_hash IS NULL AS is_new_account, ug.id AS unlock_id
    FROM users u
    LEFT JOIN user_unlocked_guides ug ON ug.user_id = u.id AND ug.guide_id = ${guideId}
    WHERE u.email = ${email}
    LIMIT 1
  ` as Array<{ user_id: string; is_new_account: boolean; unlock_id: number | null }>;

  if (rows.length === 0 || rows[0].unlock_id === null) {
    return NextResponse.json({ verified: false });
  }

  return NextResponse.json({
    verified:     true,
    email,
    isNewAccount: rows[0].is_new_account,
  });
}
