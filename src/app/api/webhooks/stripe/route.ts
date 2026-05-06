import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

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

    // ── Anon-Guide-Branch ─────────────────────────────────────────────
    // Käufer hat ohne Login bezahlt. Wir müssen erst den User anlegen
    // (oder existierenden by-email finden) und dann den Unlock schreiben.
    // Idempotent: doppelter Webhook-Trigger erzeugt keine Duplikate.
    if (session.mode === "payment" && session.metadata?.kind === "rescue_guide_anon") {
      const guideId   = session.metadata.guide_id;
      const hoster    = session.metadata.hoster ?? "default";
      const paidCents = session.amount_total ?? 0;
      // Quellpriorität: Stripe-eingegebene Email → metadata-Fallback (sollte nie greifen)
      const buyerEmail = (session.customer_details?.email ?? session.metadata.email ?? "")
        .trim().toLowerCase();

      if (!guideId || !buyerEmail) {
        console.error("[stripe-webhook] CRITICAL: rescue_guide_anon missing guideId or email", {
          sessionId: session.id, hasGuideId: Boolean(guideId), hasEmail: Boolean(buyerEmail),
        });
        return NextResponse.json({ error: "missing_metadata", sessionId: session.id }, { status: 400 });
      }

      try {
        // Find-or-create — race-safe.
        // Bei zwei parallelen Webhook-Deliveries gleicher Email würde der naive
        // SELECT-then-INSERT-Ansatz beim Second auf UNIQUE(email) crashen. Lösung:
        // INSERT … ON CONFLICT (email) DO NOTHING RETURNING id liefert bei Race
        // einen leeren Result-Set; das fangen wir mit einem Fallback-SELECT ab.
        // password_hash IS NULL = der existierende /api/auth/register-Flow erkennt
        // das später als "Account ohne Passwort" und linkt das Passwort beim
        // ersten Register-Versuch (oder via /forgot-password).
        const defaultName = buyerEmail.split("@")[0];
        const inserted = await sql`
          INSERT INTO users (name, email, password_hash, "emailVerified")
          VALUES (${defaultName}, ${buyerEmail}, NULL, NOW())
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        ` as Array<{ id: string | number }>;

        let userId: string;
        let isNewAccount: boolean;
        if (inserted[0]?.id) {
          // INSERT erfolgreich → frischer Account.
          userId       = String(inserted[0].id);
          isNewAccount = true;
        } else {
          // ON CONFLICT triggered → User existiert bereits (entweder vorher angelegt
          // ODER paralleler Webhook-Trigger war schneller). Fallback-SELECT liefert
          // den existierenden id. Idempotent in beide Richtungen.
          const existing = await sql`
            SELECT id FROM users WHERE email = ${buyerEmail} LIMIT 1
          ` as Array<{ id: string | number }>;
          if (!existing[0]?.id) {
            // Sollte praktisch nie passieren (ON CONFLICT (email) ohne match wäre Bug
            // im UNIQUE-Index). Trotzdem defensiv: 500 → Stripe retried.
            throw new Error(`anon user resolution failed for email=${buyerEmail}`);
          }
          userId       = String(existing[0].id);
          isNewAccount = false;
        }

        await sql`
          INSERT INTO user_unlocked_guides (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
          VALUES (${userId}::int, ${guideId}, ${session.id}, ${paidCents}, ${hoster})
          ON CONFLICT (user_id, guide_id) DO NOTHING
        `;
        console.log(`[stripe-webhook] anon guide unlocked: user=${userId} (new=${isNewAccount}) guide=${guideId} email=${buyerEmail}`);

        // Resend-Mail: Claim-Link mit kurzer Erklärung, wie der Käufer auf den Guide
        // kommt. Bei isNewAccount: Hinweis auf "Passwort setzen via Forgot-Password".
        // Bei existing: Hinweis auf normalen Login. Failure ist nicht kritisch — der
        // User landet ohnehin nach Stripe auf der Claim-Page.
        if (process.env.RESEND_API_KEY) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
            const claimUrl = isNewAccount
              ? `${baseUrl}/forgot-password?email=${encodeURIComponent(buyerEmail)}`
              : `${baseUrl}/login?callbackUrl=${encodeURIComponent(`/dashboard/guides/${guideId}`)}`;
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from:    "WebsiteFix <noreply@website-fix.com>",
              to:      buyerEmail,
              subject: "Dein Fix-Guide ist freigeschaltet ✓",
              html: `
                <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F172A;">
                  <h2 style="margin:0 0 12px;font-size:20px;">Dein Fix-Guide ist bereit.</h2>
                  <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
                    Vielen Dank für deinen Kauf. Dein Fix-Guide ist mit deiner E-Mail-Adresse
                    <strong>${buyerEmail}</strong> verknüpft und steht ab sofort zur Verfügung.
                  </p>
                  ${isNewAccount ? `
                  <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
                    Wir haben dir ein kostenloses Konto erstellt. Setze dein Passwort, um den
                    Guide aufzurufen — danach hast du lebenslangen Zugriff auf deine gekauften Guides.
                  </p>
                  <a href="${claimUrl}" style="display:inline-block;padding:12px 22px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                    Passwort setzen &amp; Guide öffnen
                  </a>
                  ` : `
                  <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
                    Logge dich mit deiner bekannten E-Mail-Adresse ein, um den Guide zu öffnen.
                  </p>
                  <a href="${claimUrl}" style="display:inline-block;padding:12px 22px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                    Zum Guide
                  </a>
                  `}
                  <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">
                    Beleg: Stripe-Session ${session.id} · Betrag ${(paidCents/100).toFixed(2).replace(".",",")} €
                  </p>
                </div>
              `,
            });
          } catch (mailErr) {
            console.error("[stripe-webhook] anon guide claim mail failed:", mailErr);
          }
        }
      } catch (err) {
        console.error("[stripe-webhook] anon guide unlock failed:", err);
        // 500 → Stripe retried (3-4 mal über Tage). Wir wollen den Unlock nicht verlieren.
        return NextResponse.json({ error: "anon_unlock_failed", sessionId: session.id }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    // ── Branch-Routing per metadata.kind ──────────────────────────────
    // mode === "payment" + metadata.kind === "rescue_guide" → User-Unlock
    // mode === "subscription" → klassischer Plan-Upgrade (siehe unten)
    if (session.mode === "payment" && session.metadata?.kind === "rescue_guide") {
      const guideId = session.metadata.guide_id;
      const userId  = session.metadata.user_id;
      const hoster  = session.metadata.hoster ?? "default";
      const paidCents = session.amount_total ?? 0;

      if (!guideId || !userId) {
        // 400 statt 200 — Stripe retried den Webhook bei 4xx/5xx automatisch
        // (Dunning-Flow, ~3 Tage). Bei 200 wäre der Unlock SILENT verloren.
        // Wenn die metadata wirklich fehlen (Stripe-Console-Manipulation,
        // Bug im checkout.create), wollen wir das in den Stripe-Logs sehen.
        console.error("[stripe-webhook] CRITICAL: rescue_guide payment missing metadata — returning 400 to trigger Stripe retry", {
          sessionId: session.id,
          hasGuideId: Boolean(guideId),
          hasUserId:  Boolean(userId),
        });
        return NextResponse.json(
          { error: "missing_metadata", sessionId: session.id },
          { status: 400 },
        );
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
