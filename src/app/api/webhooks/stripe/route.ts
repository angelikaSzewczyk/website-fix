import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

function priceIdToPlan(priceId: string | undefined): string {
  if (!priceId) return "free";
  // New plan price IDs (must be set in Vercel env):
  if (process.env.STRIPE_PRICE_STARTER      && priceId === process.env.STRIPE_PRICE_STARTER)      return "starter";
  if (process.env.STRIPE_PRICE_PROFESSIONAL && priceId === process.env.STRIPE_PRICE_PROFESSIONAL) return "professional";
  // Legacy / existing price IDs:
  if (process.env.STRIPE_PRICE_SMART_GUARD  && priceId === process.env.STRIPE_PRICE_SMART_GUARD)  return "smart-guard";
  if (process.env.STRIPE_PRICE_AGENCY_STARTER && priceId === process.env.STRIPE_PRICE_AGENCY_STARTER) return "agency-starter";
  if (process.env.STRIPE_PRICE_AGENCY_PRO   && priceId === process.env.STRIPE_PRICE_AGENCY_PRO)   return "agency-pro";
  // Unknown price ID — log and keep free to avoid silent failures
  console.warn(`[stripe-webhook] Unknown priceId: ${priceId} — plan stays 'free'. Add ENV var if this is a new plan.`);
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

  // Fehlgeschlagene Abo-Erneuerung (z. B. Karte abgelaufen, Limit erschöpft).
  // Stripe versucht es automatisch 3–4× über mehrere Tage (Smart Retries / Dunning).
  // Erst beim finalen Fehlschlag feuert customer.subscription.deleted → Plan → free.
  // Hier loggen wir den ersten Fehlschlag für Monitoring und optionale E-Mail.
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    if (invoice.billing_reason === "subscription_cycle") {
      console.warn(`Abo-Zahlung fehlgeschlagen: customer=${customerId}, invoice=${invoice.id}, attempt=${invoice.attempt_count}`);
      // TODO: Resend-E-Mail an Nutzer schicken ("Ihre Zahlung ist fehlgeschlagen")
      // Erst nach subscription.deleted den Plan auf 'free' setzen — nicht hier.
    }
  }

  return NextResponse.json({ received: true });
}
