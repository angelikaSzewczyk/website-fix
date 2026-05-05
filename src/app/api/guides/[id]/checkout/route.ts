/**
 * POST /api/guides/[id]/checkout — Erstellt eine Stripe-Checkout-Session
 * für einen One-Time-Payment auf einen Rescue-Guide.
 *
 * Body: { hoster: "strato" | "ionos" | ... }
 * Response: { url: string } — Stripe-Checkout-URL für Redirect.
 *
 * Webhook /api/webhooks/stripe verarbeitet das checkout.session.completed-
 * Event und INSERT'tet in user_unlocked_guides via metadata.guide_id +
 * metadata.user_id.
 *
 * Idempotenz: wenn der User den Guide schon unlocked hat, kein neuer
 * Checkout — direkter Redirect zur Guide-Page.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { HOSTER_OPTIONS } from "@/lib/rescue-guides";
import { isAtLeastProfessional } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id: guideId } = await params;
  const { hoster } = await req.json().catch(() => ({})) as { hoster?: string };

  // Hoster-Validation gegen die Whitelist (XSS/injection-Schutz)
  const validHoster = HOSTER_OPTIONS.find(o => o.value === hoster)?.value ?? "default";

  const sql = neon(process.env.DATABASE_URL!);

  // Guide laden + Unlock-Check
  const guides = await sql`
    SELECT id, title, price_cents, stripe_price_id, active
    FROM rescue_guides
    WHERE id = ${guideId}
    LIMIT 1
  ` as Array<{ id: string; title: string; price_cents: number; stripe_price_id: string | null; active: boolean }>;

  if (guides.length === 0 || !guides[0].active) {
    return NextResponse.json({ error: "Guide nicht gefunden" }, { status: 404 });
  }
  const guide = guides[0];
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";

  // ── Sorglos-Flatrate-Bypass (Pro/Agency) ────────────────────────────
  // Pro+-User durchlaufen NIE den Stripe-Checkout. Direkter Redirect zur
  // Guide-Page; getGuideForUser auf der Ziel-Seite returnt ohnehin
  // unlocked=true für diese Pläne (lib/rescue-guides Flatrate-Check).
  // Kein DB-Write hier — wir verbrauchen keinen user_unlocked_guides-Slot
  // für etwas, das via Plan-Membership zugesichert ist.
  const userRow = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ plan: string | null }>;
  if (isAtLeastProfessional(userRow[0]?.plan ?? null)) {
    return NextResponse.json({
      url:           `${baseUrl}/dashboard/guides/${guideId}`,
      flatrate:      true,
      alreadyUnlocked: true,
    });
  }

  // Idempotenz — User hat schon unlocked → direkt zur Guide-Page
  const existingUnlock = await sql`
    SELECT id FROM user_unlocked_guides
    WHERE user_id = ${session.user.id} AND guide_id = ${guideId}
    LIMIT 1
  ` as Array<{ id: number }>;

  if (existingUnlock.length > 0) {
    return NextResponse.json({
      url: `${baseUrl}/dashboard/guides/${guideId}`,
      alreadyUnlocked: true,
    });
  }

  // Stripe-Session
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[guides/checkout] STRIPE_SECRET_KEY missing");
    return NextResponse.json({ error: "Zahlungssystem nicht konfiguriert" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [
        {
          // Wenn ein stripe_price_id in der DB ist, nutzen wir das.
          // Sonst inline ein price_data — robust für Test-Mode ohne
          // vorab angelegte Stripe-Prices.
          ...(guide.stripe_price_id
            ? { price: guide.stripe_price_id }
            : {
                price_data: {
                  currency: "eur",
                  product_data: { name: guide.title },
                  unit_amount: guide.price_cents,
                },
              }),
          quantity: 1,
        },
      ],
      // Metadata wird vom Webhook ausgelesen, um den User-Unlock zu schreiben
      metadata: {
        guide_id:  guideId,
        user_id:   String(session.user.id),
        hoster:    validHoster,
        kind:      "rescue_guide", // Diskriminator für Webhook-Routing
      },
      success_url: `${baseUrl}/dashboard/guides/${guideId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/dashboard?guide_cancelled=${guideId}`,
      // EU-MwSt: automatic_tax aktivieren wenn Stripe Tax konfiguriert
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[guides/checkout] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Stripe-Fehler";
    return NextResponse.json({ error: `Checkout fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
