import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";

// Legacy-Keys (smart-guard, agency-starter) akzeptieren wir weiter für alte Links,
// mappen aber intern auf professional / agency.
const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  "starter":        process.env.STRIPE_PRICE_STARTER,
  "professional":   process.env.STRIPE_PRICE_PROFESSIONAL ?? process.env.STRIPE_PRICE_SMART_GUARD,
  "agency":         process.env.STRIPE_PRICE_AGENCY        ?? process.env.STRIPE_PRICE_AGENCY_STARTER,
  "smart-guard":    process.env.STRIPE_PRICE_PROFESSIONAL  ?? process.env.STRIPE_PRICE_SMART_GUARD,
  "agency-starter": process.env.STRIPE_PRICE_AGENCY        ?? process.env.STRIPE_PRICE_AGENCY_STARTER,
};

function missingEnvPage(plan: string): Response {
  const varName = `STRIPE_PRICE_${plan.toUpperCase().replace(/-/g, "_")}`;
  return new Response(
    `<!DOCTYPE html><html><body style="font-family:monospace;padding:40px;background:#fff;color:#111">
    <h2>⚠ Checkout-Fehler: Fehlende Umgebungsvariable</h2>
    <p>Plan: <strong>${plan}</strong></p>
    <p>Erwartet: <strong>${varName}</strong> in Vercel → Settings → Environment Variables</p>
    <p>Bitte die Variable anlegen und neu deployen.</p>
    </body></html>`,
    { status: 500, headers: { "Content-Type": "text/html" } }
  );
}

// ── GET: Harter Browser-Redirect aus register/page.tsx → window.location.href ──
export async function GET(req: NextRequest) {
  const session = await auth();
  const plan = req.nextUrl.searchParams.get("plan") ?? "";

  if (!plan) {
    return NextResponse.redirect(new URL("/fuer-agenturen", req.url));
  }

  const priceId = PLAN_PRICE_MAP[plan];
  if (!priceId) return missingEnvPage(plan);

  if (!session?.user) {
    // Nicht eingeloggt → zur Registrierung mit Plan
    return NextResponse.redirect(new URL(`/register?plan=${encodeURIComponent(plan)}`, req.url));
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email ?? undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/fuer-agenturen`,
      locale: "de",
      allow_promotion_codes: true,
      metadata: { plan, userId: session.user.id ?? "" },
    });
    return NextResponse.redirect(checkoutSession.url!);
  } catch (err) {
    console.error("Stripe GET Fehler:", err);
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:monospace;padding:40px"><h2>Stripe Fehler</h2><pre>${String(err)}</pre></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

// ── POST: Bleibt für CheckoutButton (eingeloggte User auf Pricing-Seite) ──
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/fuer-agenturen`,
      locale: "de",
      allow_promotion_codes: true,
      metadata: {
        plan,
        userId: session?.user?.id ?? "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe POST Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden." }, { status: 500 });
  }
}
