import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zahlung erfolgreich — WebsiteFix",
  robots: { index: false },
};

const PLAN_LABELS: Record<string, string> = {
  freelancer:   "Freelancer",
  agency_core:  "Agency Core",
  agency_scale: "Agency Scale",
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plan = searchParams.plan ?? "agency_core";
  const planLabel = PLAN_LABELS[plan] ?? "Agency Core";
  const isAgency = plan === "agency_core" || plan === "agency_scale";

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#2563EB,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
              Website<span style={{ color: "#2563EB" }}>Fix</span>
            </span>
          </Link>
        </div>
      </nav>

      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 560, width: "100%" }}>

          {/* Success icon */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em" }}>
              Zahlung erfolgreich!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Willkommen im <strong style={{ color: "#fff" }}>{planLabel}</strong>-Plan. Dein Dashboard ist sofort verfügbar.
            </p>
          </div>

          {/* Next steps */}
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, overflow: "hidden",
            marginBottom: 24,
          }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nächste Schritte</p>
            </div>

            {[
              {
                num: "01",
                title: "Bestätigungs-E-Mail prüfen",
                desc: "Du erhältst eine Stripe-Quittung und eine Begrüßungs-E-Mail.",
                done: true,
              },
              ...(isAgency ? [{
                num: "02",
                title: "Logo & Farbe einrichten",
                desc: "Lade dein Agentur-Logo hoch und wähle deine Primärfarbe — für alle White-Label Reports.",
                cta: { label: "Jetzt einrichten →", href: "/dashboard/settings?focus=branding" },
                done: false,
                highlight: true,
              }] : []),
              {
                num: isAgency ? "03" : "02",
                title: "Erste Website eintragen",
                desc: "Füge deine erste Kunden-Website hinzu und starte den Deep-Scan.",
                cta: { label: "Website hinzufügen →", href: "/dashboard/scan" },
                done: false,
              },
              {
                num: isAgency ? "04" : "03",
                title: "Team einladen",
                desc: isAgency
                  ? "Lade Kollegen in dein Team ein — bis zu 3 Seats im Agency Core Plan."
                  : "Upgrade auf Agency Core für Team-Zugang.",
                cta: isAgency
                  ? { label: "Team verwalten →", href: "/dashboard/settings?focus=team" }
                  : { label: "Upgrade ansehen →", href: "/#pricing" },
                done: false,
              },
            ].map((step, i) => (
              <div key={i} style={{
                padding: "18px 24px",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "flex", gap: 16, alignItems: "flex-start",
                background: (step as { highlight?: boolean }).highlight ? "rgba(37,99,235,0.05)" : "transparent",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: step.done ? "#22C55E" : "rgba(255,255,255,0.2)", letterSpacing: "0.05em", width: 20, flexShrink: 0, paddingTop: 2 }}>
                  {step.done ? "✓" : step.num}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: (step as { highlight?: boolean }).highlight ? "#7aa6ff" : "#fff" }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: (step as { cta?: object }).cta ? 10 : 0 }}>{step.desc}</div>
                  {(step as { cta?: { label: string; href: string } }).cta && (
                    <Link href={(step as { cta: { label: string; href: string } }).cta.href} style={{
                      fontSize: 13, fontWeight: 600,
                      color: (step as { highlight?: boolean }).highlight ? "#2563EB" : "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                    }}>
                      {(step as { cta: { label: string; href: string } }).cta.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{
              padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: "linear-gradient(90deg,#007BFF,#0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0,123,255,0.3)",
            }}>
              Dashboard öffnen →
            </Link>
            {isAgency && (
              <Link href="/dashboard/settings?focus=branding" style={{
                padding: "13px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "1px solid rgba(37,99,235,0.4)", color: "#7aa6ff",
                textDecoration: "none",
              }}>
                Logo hochladen
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
