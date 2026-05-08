/**
 * POST /api/guides/[id]/anon-checkout — Stripe-Checkout für Pay-per-Fix-Käufer.
 *
 * Body: { email: string, hoster?: HosterValue }
 * Resp: { url: string } — Stripe-Checkout-URL für Redirect.
 *
 * Architektur (Token-basiert, kein Konto — Stand 2026-05-08):
 *  - Landingpage verspricht "Einmal-Fix ab 9,90 €". Der reguläre /api/guides/[id]/checkout
 *    erfordert Auth — würde das Versprechen brechen ("erst 29 € Sub abschließen").
 *  - Dieser Endpoint nimmt nur eine Email entgegen, erstellt KEINEN User-Account.
 *  - Webhook (kind === "rescue_guide_anon") legt einen 4-Wochen-Online-Token in
 *    guide_access_tokens an und schickt dem Käufer eine Mail mit:
 *       (a) PDF-Anhang dauerhaft im Postfach
 *       (b) Online-Link /g/<token> für 4 Wochen interaktiven Zugriff
 *  - Käufer braucht weder Login noch Dashboard — beides würde fälschlich Abo-Optik
 *    suggerieren. Eingeloggte Pro/Agency-Käufer haben den getrennten kind ==
 *    "rescue_guide"-Branch, der unverändert auf Dashboard-Unlock geht.
 *
 * Sicherheits-Überlegungen:
 *  - Email wird strukturell validiert (Pattern + Length) — Stripe erzwingt
 *    zusätzlich Format beim Checkout.
 *  - Idempotenz: kein DB-Write hier; Token-Insert im Webhook ist UNIQUE auf
 *    stripe_session_id, doppelte Webhook-Deliveries erzeugen keine Duplikate.
 *  - Hoster-Wert wird gegen HOSTER_OPTIONS-Whitelist geprüft, Default "default".
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { HOSTER_OPTIONS } from "@/lib/rescue-guides";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: guideId } = await params;
  const body = await req.json().catch(() => ({})) as { email?: string; hoster?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  }

  const validHoster = HOSTER_OPTIONS.find(o => o.value === body.hoster)?.value ?? "default";

  const sql = neon(process.env.DATABASE_URL!);

  // Guide laden + Active-Check
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

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[guides/anon-checkout] STRIPE_SECRET_KEY missing");
    return NextResponse.json({ error: "Zahlungssystem nicht konfiguriert" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
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
      // Webhook-Branch-Diskriminator: "rescue_guide_anon" triggert User-find-or-create.
      // email wird NUR im Notfall genutzt (falls customer_details.email leer wäre — sollte
      // bei customer_email niemals passieren, aber Defense-in-depth).
      metadata: {
        guide_id:  guideId,
        hoster:    validHoster,
        email,
        kind:      "rescue_guide_anon",
      },
      // Claim-Page lädt den Guide direkt aus session_id — wir reichen guide_id
      // im Pfad mit, sodass das UI sofort weiß was anzuzeigen ist (keine extra
      // Stripe-API-Abfrage nötig).
      success_url: `${baseUrl}/scan/checkout/claim?guide=${guideId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/scan/checkout?cancelled=${guideId}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[guides/anon-checkout] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Stripe-Fehler";
    return NextResponse.json({ error: `Checkout fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
