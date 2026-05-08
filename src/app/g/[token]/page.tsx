/**
 * /g/[token] — Public Pay-per-Fix Online-Bericht (kein Login).
 *
 * Käufer kommt nach 9,90 €-Zahlung mit einem 4-Wochen-Token aus der
 * Bestätigungsmail hier her. Read-only-Render des Guides; Checkliste rendert
 * client-side (kein Server-Sync). Nach 4 Wochen → Soft-Upsell-Page mit
 * Hinweis "PDF im Postfach bleibt gültig".
 *
 * Routing-Annahmen:
 *   - Stripe-Webhook (kind=rescue_guide_anon) erstellt einen Token-Eintrag
 *     in guide_access_tokens, KEINEN User. Mail-Template linkt /g/[token].
 *   - Eingeloggte Pro/Agency-Käufer landen weiterhin auf /dashboard/guides/[id]
 *     (eigener Branch im Webhook), nicht hier.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getGuideByToken } from "@/lib/rescue-guides";
import TokenGuideView from "./token-guide-view";

export const metadata: Metadata = {
  title: "Dein Fix-Guide — WebsiteFix",
  robots: { index: false, follow: false },
};

export default async function TokenGuidePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getGuideByToken(token);

  if (result.kind === "notfound") {
    notFound();
  }

  if (result.kind === "expired") {
    return <ExpiredView guideTitle={result.guide.title} expiresAt={result.expiresAt} />;
  }

  return (
    <TokenGuideView
      guide={result.guide}
      hoster={result.hoster}
      expiresAt={result.expiresAt.toISOString()}
    />
  );
}

/** Soft-Upsell-Page bei abgelaufenem Online-Zugriff. PDF im Postfach des
 *  Käufers bleibt davon unberührt — wir betonen das, damit kein "habe ich
 *  meinen Kauf verloren?"-Eindruck entsteht. */
function ExpiredView({ guideTitle, expiresAt }: { guideTitle: string; expiresAt: Date }) {
  const expiredOn = expiresAt.toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  return (
    <main style={{
      minHeight: "100vh", background: "#0b0c10",
      color: "rgba(255,255,255,0.92)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "60px 24px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{
          padding: "32px 28px", borderRadius: 16,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.10)",
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 18px", borderRadius: 14,
            background: "rgba(167,139,250,0.14)",
            border: "1px solid rgba(167,139,250,0.34)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#a78bfa", fontSize: 22,
          }}>⏱</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Online-Zugriff abgelaufen
          </h1>
          <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.62)" }}>
            Der 4-Wochen-Online-Zugriff für „{guideTitle}" ist am <strong style={{ color: "rgba(255,255,255,0.85)" }}>{expiredOn}</strong> ausgelaufen.
          </p>

          <div style={{
            margin: "0 0 22px", padding: "14px 16px", borderRadius: 10,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.28)",
            textAlign: "left",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: "#4ade80",
                        letterSpacing: "0.08em", textTransform: "uppercase" }}>
              📎 Dein PDF bleibt gültig
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
              Der komplette Guide wurde dir damals als PDF-Anhang zur Bestätigungsmail
              zugestellt. Das PDF ist dauerhaft in deinem Postfach und unabhängig vom
              Online-Zugriff nutzbar. Suche in deiner Inbox nach „WebsiteFix-Guide".
            </p>
          </div>

          <div style={{
            padding: "16px 18px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(122,166,255,0.06))",
            border: "1px solid rgba(16,185,129,0.32)",
            textAlign: "left",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#10b981",
                        letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Dauerhafter Zugriff + alle 7 Guides
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
              Mit Professional bekommst du dauerhaften Online-Zugriff auf <strong>alle</strong> Guides plus den Read-Only-Plugin-Mode für präzise Diagnose. Monatlich kündbar.
            </p>
            <Link href="/fuer-agenturen?upgrade=professional#pricing" style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 9,
              background: "linear-gradient(90deg,#059669,#10B981)",
              color: "#fff", fontSize: 12.5, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
            }}>
              Professional ansehen →
            </Link>
          </div>

          <p style={{ margin: "20px 0 0", fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
            Fragen? <Link href="/kontakt" style={{ color: "rgba(255,255,255,0.55)" }}>support@website-fix.com</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
