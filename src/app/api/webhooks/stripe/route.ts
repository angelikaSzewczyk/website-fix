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
    const priceId = (session as { line_items?: { data?: Array<{ price?: { id?: string } }> } })
      ?.line_items?.data?.[0]?.price?.id;

    if (!email) return NextResponse.json({ received: true });

    const plan =
      priceId === process.env.STRIPE_PRICE_AGENTUR ? "agentur" :
      priceId === process.env.STRIPE_PRICE_PRO ? "pro" : "free";

    // Fetch line items to get actual price id
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const actualPriceId = fullSession.line_items?.data?.[0]?.price?.id;
    const actualPlan =
      actualPriceId === process.env.STRIPE_PRICE_AGENTUR ? "agentur" :
      actualPriceId === process.env.STRIPE_PRICE_PRO ? "pro" : plan;

    await sql`
      UPDATE users SET plan = ${actualPlan}, stripe_customer_id = ${session.customer as string}
      WHERE email = ${email.toLowerCase()}
    `;
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await sql`
      UPDATE users SET plan = 'free' WHERE stripe_customer_id = ${customerId}
    `;
  }

  return NextResponse.json({ received: true });
}
