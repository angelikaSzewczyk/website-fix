/**
 * GET /api/guides/[id]/verify-anon?session_id=cs_...
 *
 * Polling-Endpoint für die /scan/checkout/claim-Page. Bestätigt, dass der
 * Webhook den anonymen Guide-Kauf bereits verarbeitet und einen 4-Wochen-
 * Online-Token in guide_access_tokens angelegt hat.
 *
 * Returns 200 mit:
 *   { verified: true,  token: "<uuid>", email: "user@x.de" }
 *   { verified: false }                                       — noch nicht da
 *
 * Sicherheits-Eigenschaften:
 *   - Stripe-Session muss zu DIESEM Guide gehören (metadata.guide_id ===
 *     URL-Param) — verhindert Session-ID-Schmuggel zur Info-Discovery.
 *   - Token-Lookup über UNIQUE(stripe_session_id) — race-safe, kein User-
 *     Account involviert (Pay-per-Fix-Käufer haben kein Konto, siehe
 *     guide_access_tokens-Migration 2026-05-08).
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
  if (stripeSession.metadata?.kind !== "rescue_guide_anon") {
    return NextResponse.json({ verified: false }, { status: 400 });
  }
  if (stripeSession.payment_status !== "paid") {
    return NextResponse.json({ verified: false });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT token::text AS token, email
    FROM guide_access_tokens
    WHERE stripe_session_id = ${sessionId}
    LIMIT 1
  ` as Array<{ token: string; email: string }>;

  if (rows.length === 0) {
    return NextResponse.json({ verified: false });
  }

  return NextResponse.json({
    verified: true,
    token:    rows[0].token,
    email:    rows[0].email,
  });
}
