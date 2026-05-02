import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

/** Invalidiert den scan_cache für alle URLs, die dieser User schonmal gescannt hat.
 *  Wird bei JEDEM Plan-Wechsel gerufen — sonst sieht ein frisch upgegradeter
 *  Agency-Kunde noch bis zu 24h den alten 10-Subpages-Scan aus dem Cache.
 *  Failure-Mode: silently — Plan-Upgrade darf nicht hängen wenn Cache-Tabelle
 *  fehlt oder Berechtigungen fehlen. Nächster Scan füllt den Cache eh neu.
 *  Hinweis: erstellt eine neue neon-Instance — neon poolt intern, daher
 *  kein Performance-Issue durch wiederholte Connections pro Webhook-Event. */
async function invalidateScanCacheForUser(userId: string): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      DELETE FROM scan_cache
      WHERE url IN (SELECT DISTINCT url FROM scans WHERE user_id = ${userId})
    `;
  } catch (err) {
    console.warn(`[stripe-webhook] scan_cache invalidation failed for user ${userId}:`, err);
  }
}

/** Returns the plan key for a Stripe price ID, or null if unknown.
 *  null = abort the DB update — we never silently downgrade to "free" on a mystery price. */
function priceIdToPlan(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (process.env.STRIPE_PRICE_STARTER        && priceId === process.env.STRIPE_PRICE_STARTER)        return "starter";
  if (process.env.STRIPE_PRICE_PROFESSIONAL   && priceId === process.env.STRIPE_PRICE_PROFESSIONAL)   return "professional";
  if (process.env.STRIPE_PRICE_SMART_GUARD    && priceId === process.env.STRIPE_PRICE_SMART_GUARD)    return "professional"; // legacy alias
  if (process.env.STRIPE_PRICE_AGENCY         && priceId === process.env.STRIPE_PRICE_AGENCY)         return "agency";
  if (process.env.STRIPE_PRICE_AGENCY_STARTER && priceId === process.env.STRIPE_PRICE_AGENCY_STARTER) return "agency"; // legacy alias
  // CRITICAL: unknown price — log loudly and abort. Never fall back to "free".
  console.error(
    `[stripe-webhook] CRITICAL: Unknown priceId '${priceId}' — plan upgrade ABORTED.` +
    ` Check STRIPE_PRICE_* env vars in Vercel. No DB update performed.`
  );
  return null;
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

    // ── Branch-Routing per metadata.kind ──────────────────────────────
    // mode === "payment" + metadata.kind === "rescue_guide" → User-Unlock
    // mode === "subscription" → klassischer Plan-Upgrade (siehe unten)
    if (session.mode === "payment" && session.metadata?.kind === "rescue_guide") {
      const guideId = session.metadata.guide_id;
      const userId  = session.metadata.user_id;
      const hoster  = session.metadata.hoster ?? "default";
      const paidCents = session.amount_total ?? 0;

      if (!guideId || !userId) {
        console.error("[stripe-webhook] rescue_guide payment missing metadata", session.id);
        return NextResponse.json({ received: true });
      }

      try {
        await sql`
          INSERT INTO user_unlocked_guides (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
          VALUES (${userId}::int, ${guideId}, ${session.id}, ${paidCents}, ${hoster})
          ON CONFLICT (user_id, guide_id) DO NOTHING
        `;
        console.log(`[stripe-webhook] guide unlocked: user=${userId} guide=${guideId} hoster=${hoster}`);
      } catch (err) {
        console.error("[stripe-webhook] guide unlock failed:", err);
      }
      return NextResponse.json({ received: true });
    }

    // ── Subscription-Pfad (Plan-Upgrade) ──────────────────────────────
    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ received: true });

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const plan = priceIdToPlan(priceId);
    if (!plan) return NextResponse.json({ received: true }); // unknown price — already logged

    const subscriptionId = (session.subscription as string | null) ?? null;
    const updated = await sql`
      UPDATE users
      SET plan = ${plan},
          stripe_customer_id = ${session.customer as string},
          stripe_subscription_id = ${subscriptionId}
      WHERE email = ${email.toLowerCase()}
      RETURNING id
    ` as { id: string }[];

    // Cache-Invalidierung: Plan-Wechsel muss sofort wirksam sein, sonst
    // läuft der nächste Scan in den 24h-Cache vom alten Plan.
    if (updated[0]?.id) {
      await invalidateScanCacheForUser(updated[0].id);
    }

    console.log(`[stripe-webhook] Plan upgraded: ${email} → ${plan} (sub: ${subscriptionId})`);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const updated = await sql`
      UPDATE users SET plan = 'starter' WHERE stripe_customer_id = ${customerId}
      RETURNING id
    ` as { id: string }[];
    if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const status = sub.status;
    if (status === "active") {
      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceIdToPlan(priceId);
      if (!plan) return NextResponse.json({ received: true }); // unknown price — already logged
      const updated = await sql`
        UPDATE users SET plan = ${plan} WHERE stripe_customer_id = ${customerId}
        RETURNING id
      ` as { id: string }[];
      if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
    } else if (status === "canceled" || status === "unpaid") {
      const updated = await sql`
        UPDATE users SET plan = 'starter' WHERE stripe_customer_id = ${customerId}
        RETURNING id
      ` as { id: string }[];
      if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
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
