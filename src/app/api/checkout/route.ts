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

/** Liest und validiert den `?trial=N`-Param. Akzeptiert 1..30 Tage, sonst 0. */
function parseTrialDays(req: NextRequest, fallback: number = 0): number {
  const raw = req.nextUrl.searchParams.get("trial");
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return n > 0 && n <= 30 ? n : fallback;
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
    // Nicht eingeloggt → zur Registrierung mit Plan + Trial weitergereicht
    const trial = req.nextUrl.searchParams.get("trial") ?? "";
    const params = new URLSearchParams({ plan });
    if (trial) params.set("trial", trial);
    return NextResponse.redirect(new URL(`/register?${params.toString()}`, req.url));
  }

  const trialDays = parseTrialDays(req);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email ?? undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/fuer-agenturen?checkout=cancelled`,
      locale: "de",
      allow_promotion_codes: true,
      // Trial: Stripe Subscription Trial-Days. Wir setzen es nur, wenn explizit
      // angefragt — sonst startet die Subscription sofort kostenpflichtig.
      ...(trialDays > 0 ? { subscription_data: { trial_period_days: trialDays } } : {}),
      metadata: { plan, userId: session.user.id ?? "", trial: String(trialDays) },
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
// Hardening (06.05.2026): Auth jetzt zwingend, Plan gegen Whitelist validiert.
// Vorher: jeder konnte ohne Auth POSTen → unauthenticated Stripe-Sessions
// erzeugen (DoS-Vektor + Stripe-Test-Calls auf unsere Quota).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Bitte erst einloggen." }, { status: 401 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { plan } = await req.json() as { plan?: string };
    if (!plan || typeof plan !== "string") {
      return NextResponse.json({ error: "Plan-Parameter fehlt." }, { status: 400 });
    }
    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json({ error: `Unbekannter Plan: ${plan}` }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/fuer-agenturen?checkout=cancelled`,
      locale: "de",
      allow_promotion_codes: true,
      metadata: {
        plan,
        userId: session.user.id ?? "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe POST Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht erstellt werden." }, { status: 500 });
  }
}
