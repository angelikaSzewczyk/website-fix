import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/stripe/portal
 *
 * Erzeugt eine Stripe Customer Portal Session für den eingeloggten User.
 * Der Portal lässt User Zahlungsmethoden ändern, Rechnungen herunterladen
 * und das Abo kündigen — alles über Stripe-Hosted-UI, kein eigener Code.
 *
 * Voraussetzung: User hat einen `stripe_customer_id` in der users-Tabelle
 * (wird beim ersten Checkout via Webhook gesetzt).
 *
 * Response: { url: string } für client-side window.location.href = data.url
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT stripe_customer_id FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as { stripe_customer_id: string | null }[];

  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({
      error: "Kein Stripe-Kunde hinterlegt — bitte erst ein Abo abschließen.",
    }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${baseUrl}/dashboard/settings#profil`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal] Stripe error:", err);
    return NextResponse.json({
      error: "Stripe-Portal konnte nicht geöffnet werden. Bitte versuche es erneut.",
    }, { status: 500 });
  }
}
