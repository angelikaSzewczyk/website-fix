import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`SELECT stripe_customer_id FROM users WHERE id = ${session.user.id}`;
  const customerId = rows[0]?.stripe_customer_id as string | null;

  if (!customerId) {
    return NextResponse.json({ error: "Kein aktives Abonnement gefunden." }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
