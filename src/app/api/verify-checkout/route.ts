import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/auth";

/**
 * POST /api/verify-checkout
 * Wird von /checkout-success aufgerufen mit { sessionId }.
 * Verifiziert die Stripe-Session und updated den Plan direkt in der DB —
 * unabhängig vom Webhook. Webhook bleibt als Backup erhalten.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    // Nur bezahlte Sessions akzeptieren
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ plan: "starter", paid: false });
    }

    const priceId = checkoutSession.line_items?.data?.[0]?.price?.id;
    const PRICE_TO_PLAN: Record<string, string> = {
      [process.env.STRIPE_PRICE_STARTER        ?? ""]: "starter",
      [process.env.STRIPE_PRICE_PROFESSIONAL   ?? ""]: "professional",
      [process.env.STRIPE_PRICE_SMART_GUARD    ?? ""]: "professional", // legacy alias
      [process.env.STRIPE_PRICE_AGENCY         ?? ""]: "agency",
      [process.env.STRIPE_PRICE_AGENCY_STARTER ?? ""]: "agency",      // legacy alias
    };

    const plan = priceId ? PRICE_TO_PLAN[priceId] : undefined;
    if (!plan) {
      console.error(`[verify-checkout] Unknown priceId: ${priceId}`);
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    const subscriptionId = (checkoutSession.subscription as string | null) ?? null;
    const customerId     = checkoutSession.customer as string | null;
    const email          = (checkoutSession.customer_details?.email ?? session.user.email).toLowerCase();

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE users
      SET plan                  = ${plan},
          stripe_customer_id    = ${customerId},
          stripe_subscription_id = ${subscriptionId}
      WHERE email = ${email}
    `;

    console.log(`[verify-checkout] Plan updated: ${email} → ${plan}`);
    return NextResponse.json({ plan, paid: true });

  } catch (err) {
    console.error("[verify-checkout] Stripe error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
