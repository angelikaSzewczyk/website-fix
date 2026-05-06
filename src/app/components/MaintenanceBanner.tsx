/**
 * MaintenanceBanner — temporärer Top-Bar-Hinweis.
 *
 * Stand 06.05.2026: Stripe-Live-Mode + Resend-Domain-Verify sind noch nicht
 * abgeschlossen. Bis das durch ist, dürfen wir keine Bezahl-Klicks ohne
 * Vorwarnung zulassen — sonst sieht der Käufer eine Stripe-Fehlermeldung
 * oder bekommt keine Bestätigungs-Mail nach Anon-Guide-Kauf.
 *
 * Wann entfernen:
 *   1. Stripe-Live-Keys in Vercel-ENV gesetzt (STRIPE_SECRET_KEY ohne _test)
 *   2. STRIPE_PRICE_STARTER / _PROFESSIONAL / _AGENCY auf Live-Prices
 *   3. resend.com Domain-Verify für noreply@website-fix.com grün
 *   4. End-to-end-Test: Anon-Guide-Checkout + Email-Bestätigung erfolgreich
 *
 * Bis dahin: Banner sichtbar auf allen public-facing Seiten (/, /fuer-agenturen,
 * /scan/results, /scan/checkout). Server-Component-kompatibel — kein State,
 * kein Dismiss (sonst ignoriert es jeder).
 */

import Link from "next/link";

export default function MaintenanceBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "linear-gradient(90deg, rgba(251,191,36,0.18), rgba(251,191,36,0.10))",
        borderBottom: "1px solid rgba(251,191,36,0.32)",
        padding: "9px 16px",
        textAlign: "center",
        fontSize: 12.5,
        color: "#FEF3C7",
        letterSpacing: "0.01em",
        lineHeight: 1.5,
      }}
    >
      <span aria-hidden="true" style={{ marginRight: 8 }}>🔧</span>
      <strong style={{ fontWeight: 700, color: "#FBBF24" }}>Soft-Launch · Wartungsarbeiten:</strong>{" "}
      Bezahlsystem (Stripe) und Aktivierungs-Mails werden gerade fertiggestellt. Beim Start der ersten paar Kunden bitte direkt per Mail melden:{" "}
      <Link
        href="mailto:hello@website-fix.com?subject=Soft-Launch%20Anfrage"
        style={{ color: "#FBBF24", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 }}
      >
        hello@website-fix.com
      </Link>
      {" — wir richten Sie persönlich ein."}
    </div>
  );
}
