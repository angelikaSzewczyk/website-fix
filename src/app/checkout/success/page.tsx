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
        background: "rgba(11,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
        </div>
      </nav>

      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 16px" }}>
            Zahlung erfolgreich!
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 17, lineHeight: 1.7, margin: "0 0 32px" }}>
            Willkommen bei WebsiteFix. Du bekommst gleich eine Bestätigungs-E-Mail.
            Wir melden uns innerhalb von 24 Stunden mit dem Zugang zu deinem Dashboard.
          </p>

          <div style={{
            background: "rgba(141,243,211,0.06)",
            border: "1px solid rgba(141,243,211,0.2)",
            borderRadius: 14, padding: "20px 24px",
            marginBottom: 32, textAlign: "left",
          }}>
            <p style={{ margin: "0 0 12px", fontWeight: 650, fontSize: 15 }}>Nächste Schritte:</p>
            {[
              "Bestätigungs-E-Mail prüfen",
              "Wir melden uns innerhalb von 24h",
              "Erste Kunden-Website scannen",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#8df3d3", fontWeight: 700 }}>{i + 1}.</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scan" className="cta" style={{ fontSize: 15, padding: "13px 24px" }}>
              Jetzt scannen →
            </Link>
            <Link href="/" className="ghost" style={{ fontSize: 14, padding: "13px 20px" }}>
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
