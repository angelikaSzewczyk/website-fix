import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zahlung erfolgreich — WebsiteFix",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
        </div>
      </nav>

      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(141,243,211,0.12)", border: "1px solid rgba(141,243,211,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>
            ✓
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Zahlung erfolgreich
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.7, margin: "0 0 36px" }}>
            Willkommen bei WebsiteFix. Du bekommst eine Bestätigungs-E-Mail. Dein Dashboard ist sofort verfügbar.
          </p>

          <div style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px 24px",
            marginBottom: 28, textAlign: "left",
          }}>
            <p style={{ margin: "0 0 14px", fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nächste Schritte</p>
            {[
              "Bestätigungs-E-Mail prüfen",
              "Dashboard öffnen",
              "Erste Website scannen",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: i < 2 ? 10 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8df3d3", width: 16 }}>0{i + 1}</span>
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{
              padding: "12px 24px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Dashboard öffnen
            </Link>
            <Link href="/" style={{
              padding: "12px 20px", borderRadius: 9, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}>
              Startseite
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
