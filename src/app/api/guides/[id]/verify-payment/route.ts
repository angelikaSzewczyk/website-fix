/**
 * POST /api/guides/[id]/verify-payment — Polling-Fallback für die Guide-
 * Success-Page. Wenn der User nach Stripe-Redirect ankommt aber der
 * Webhook noch nicht durchgekommen ist, prüfen wir die Stripe-Session
 * direkt und führen den Unlock manuell aus.
 *
 * Body: { sessionId: string }  // CHECKOUT_SESSION_ID aus dem Success-URL-Param
 *
 * Idempotent — ON CONFLICT DO NOTHING im Insert.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id: guideId } = await params;
  const { sessionId } = await req.json().catch(() => ({})) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: "Session-ID fehlt" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  // Wenn schon unlocked (Webhook war schneller), kein API-Call nötig
  const existing = await sql`
    SELECT id FROM user_unlocked_guides
    WHERE user_id = ${session.user.id} AND guide_id = ${guideId}
    LIMIT 1
  ` as Array<{ id: number }>;
  if (existing.length > 0) {
    return NextResponse.json({ unlocked: true });
  }

  // Stripe direkt fragen — bestätigt ob Payment durch ist
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Owner-Check: Session muss zu DIESEM User + DIESEM Guide gehören
    if (checkoutSession.metadata?.user_id !== String(session.user.id)) {
      return NextResponse.json({ error: "Session gehört nicht diesem Account" }, { status: 403 });
    }
    if (checkoutSession.metadata?.guide_id !== guideId) {
      return NextResponse.json({ error: "Session-Guide-ID stimmt nicht" }, { status: 400 });
    }

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ unlocked: false, payment_status: checkoutSession.payment_status });
    }

    // Manueller Unlock — Webhook hat versagt oder kommt verzögert
    const hoster = checkoutSession.metadata?.hoster ?? "default";
    const paidCents = checkoutSession.amount_total ?? 0;
    await sql`
      INSERT INTO user_unlocked_guides (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
      VALUES (${session.user.id}::int, ${guideId}, ${sessionId}, ${paidCents}, ${hoster})
      ON CONFLICT (user_id, guide_id) DO NOTHING
    `;

    return NextResponse.json({ unlocked: true, viaPolling: true });
  } catch (err) {
    console.error("[guides/verify-payment] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Stripe-Verify-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
