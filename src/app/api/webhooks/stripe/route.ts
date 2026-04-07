import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

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

    // Expand line_items to get the price ID
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const priceId = fullSession.line_items?.data?.[0]?.price?.id;

    const plan =
      priceId === process.env.STRIPE_PRICE_AGENTUR ? "agentur" :
      priceId === process.env.STRIPE_PRICE_PRO ? "pro" : "pro"; // default to pro if unknown

    await sql`
      UPDATE users
      SET plan = ${plan}, stripe_customer_id = ${session.customer as string}
      WHERE email = ${email.toLowerCase()}
    `;

    console.log(`Plan updated: ${email} → ${plan}`);
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
      const plan =
        priceId === process.env.STRIPE_PRICE_AGENTUR ? "agentur" :
        priceId === process.env.STRIPE_PRICE_PRO ? "pro" : "pro";
      await sql`UPDATE users SET plan = ${plan} WHERE stripe_customer_id = ${customerId}`;
    } else if (status === "canceled" || status === "unpaid") {
      await sql`UPDATE users SET plan = 'free' WHERE stripe_customer_id = ${customerId}`;
    }
  }

  return NextResponse.json({ received: true });
}
