import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

function priceIdToPlan(priceId: string | undefined): string {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_FREELANCER)   return "freelancer";
  if (priceId === process.env.STRIPE_PRICE_AGENCY_CORE)  return "agency_core";
  if (priceId === process.env.STRIPE_PRICE_AGENCY_SCALE) return "agency_scale";
  // Legacy
  if (priceId === process.env.STRIPE_PRICE_AGENTUR) return "agency_core";
  if (priceId === process.env.STRIPE_PRICE_PRO)     return "freelancer";
  return "free";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ received: true });

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const plan = priceIdToPlan(priceId);

    await sql`
      UPDATE users
      SET plan = ${plan},
          stripe_customer_id = ${session.customer as string},
          stripe_subscription_id = ${session.subscription as string}
      WHERE email = ${email.toLowerCase()}
    `;

    console.log(`Plan upgraded: ${email} → ${plan}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await sql`UPDATE users SET plan = 'free' WHERE stripe_customer_id = ${customerId}`;
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const status = sub.status;
    if (status === "active") {
      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceIdToPlan(priceId);
      await sql`UPDATE users SET plan = ${plan} WHERE stripe_customer_id = ${customerId}`;
    } else if (status === "canceled" || status === "unpaid") {
      await sql`UPDATE users SET plan = 'free' WHERE stripe_customer_id = ${customerId}`;
    }
  }

  return NextResponse.json({ received: true });
}
