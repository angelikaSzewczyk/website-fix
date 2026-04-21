import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  "starter":        process.env.STRIPE_PRICE_STARTER,
  "professional":   process.env.STRIPE_PRICE_PROFESSIONAL ?? process.env.STRIPE_PRICE_SMART_GUARD,
  "smart-guard":    process.env.STRIPE_PRICE_SMART_GUARD   ?? process.env.STRIPE_PRICE_PROFESSIONAL,
  "agency-starter": process.env.STRIPE_PRICE_AGENCY_STARTER ?? process.env.STRIPE_PRICE_AGENCY,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { plan } = await req.json();
    const priceId = PLAN_PRICE_MAP[plan as string];

    if (!priceId) {
      return NextResponse.json({ error: "Plan nicht gefunden." }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session?.user?.email ?? undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/fuer-agenturen#pricing`,
      locale: "de",
      allow_promotion_codes: true,
      metadata: {
        plan,
        userId: session?.user?.id ?? "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden." }, { status: 500 });
  }
}
