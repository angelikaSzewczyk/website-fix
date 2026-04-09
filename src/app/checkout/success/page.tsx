import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zahlung erfolgreich — WebsiteFix",
  robots: { index: false },
};

const PLAN_INFO: Record<string, { label: string; accent: string; isAgency: boolean }> = {
  freelancer:    { label: "Freelancer",    accent: "#475569", isAgency: false },
  agency_core:   { label: "Agency Core",   accent: "#2563EB", isAgency: true },
  agency_scale:  { label: "Agency Scale",  accent: "#7C3AED", isAgency: true },
  agentur:       { label: "Agentur",       accent: "#2563EB", isAgency: true },
  enterprise:    { label: "Enterprise",    accent: "#0F172A", isAgency: true },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string; session_id?: string };
}) {
  const plan = searchParams.plan ?? "agency_core";
  const info = PLAN_INFO[plan] ?? PLAN_INFO.agency_core;

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #007BFF, #0057b8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(0,123,255,0.35)",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
              Website<span style={{ color: "#007BFF" }}>Fix</span>
            </span>
          </Link>
        </div>
      </nav>

      <main style={{
        minHeight: "calc(100vh - 58px)", background: "#0b0c10",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ maxWidth: 580, width: "100%", textAlign: "center" }}>

          {/* Success icon */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
            background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 48px rgba(34,197,94,0.12)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          {/* Plan badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
            padding: "4px 14px", borderRadius: 20, fontSize: 12,
            border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.08)",
            color: "#22C55E", fontWeight: 700, letterSpacing: "0.04em",
          }}>
            ✓ {info.label} aktiviert
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.1,
            margin: "0 0 14px", letterSpacing: "-0.03em", color: "#fff",
          }}>
            Willkommen bei WebsiteFix!
          </h1>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.75,
            margin: "0 auto 44px", maxWidth: 440,
          }}>
            Dein Account ist sofort einsatzbereit. Richte in 2 Minuten dein White-Label ein
            und starte direkt mit dem ersten Deep-Scan.
          </p>

          {/* ── TWO PRIMARY CTAs ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>

            {/* CTA 1 — Logo upload */}
            {info.isAgency && (
              <Link href="/dashboard/settings" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "24px 28px", borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(0,123,255,0.12), rgba(0,87,184,0.08))",
                  border: "1px solid rgba(0,123,255,0.3)",
                  display: "flex", alignItems: "center", gap: 18, textAlign: "left",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: "rgba(0,123,255,0.2)", border: "1px solid rgba(0,123,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "#7aa6ff", letterSpacing: "0.08em",
                      textTransform: "uppercase", marginBottom: 5,
                    }}>
                      Schritt 1 — Empfohlen
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 5 }}>
                      Agentur-Logo hochladen
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      Lade dein Logo hoch für White-Label Reports — deine Kunden sehen ausschließlich
                      dein Branding, kein WebsiteFix.
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,123,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            )}

            {/* CTA 2 — First deep scan */}
            <Link href="/dashboard/scan" style={{ textDecoration: "none" }}>
              <div style={{
                padding: "24px 28px", borderRadius: 16,
                background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(22,163,74,0.05))",
                border: "1px solid rgba(34,197,94,0.25)",
                display: "flex", alignItems: "center", gap: 18, textAlign: "left",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: "0.08em",
                    textTransform: "uppercase", marginBottom: 5,
                  }}>
                    {info.isAgency ? "Schritt 2" : "Jetzt starten"}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 5 }}>
                    Ersten Deep-Scan starten
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    Gib eine Domain ein — der Crawler analysiert alle Unterseiten automatisch
                    und liefert den vollständigen Site-Report.
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>

          </div>

          {/* Secondary link */}
          <Link href="/dashboard" style={{
            fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none",
          }}>
            Direkt zum Dashboard →
          </Link>

        </div>
      </main>
    </>
  );
}
