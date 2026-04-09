import type { Metadata } from "next";
import Link from "next/link";
import LoginClient from "./login-client";
import BrandLogo from "../components/BrandLogo";

export const metadata: Metadata = {
  title: "Login — WebsiteFix",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* LEFT — dark branding panel */}
      <div style={{
        width: "42%", flexShrink: 0,
        background: "linear-gradient(160deg, #060d1a 0%, #0a1628 50%, #071020 100%)",
        padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="hide-sm">
        {/* Background glow */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,123,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <BrandLogo size="lg" />
        </div>

        {/* Value props */}
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Dein Agentur-Dashboard<br />wartet.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.7 }}>
            White-Label Reports, BFSG-Compliance und<br />automatische Jira-Tickets — alles in einem Tool.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "✓", text: "Wöchentliche Deep-Scans für alle Kunden", color: "#22C55E" },
              { icon: "✓", text: "White-Label Reports mit deinem Logo", color: "#22C55E" },
              { icon: "✓", text: "BFSG 2025 automatisch überwacht", color: "#22C55E" },
              { icon: "✓", text: "Jira · Trello · Asana Integration", color: "#22C55E" },
            ].map(item => (
              <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{
          position: "relative",
          padding: "20px 22px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.55)", fontStyle: "italic", lineHeight: 1.65 }}>
            {`\u201EWebsiteFix hat unsere Report-Erstellung von 20 Stunden auf Null reduziert. Unsere Kunden sind begeistert.\u201C`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>M</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Markus T.</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Pixelwerk Agentur</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — white login panel */}
      <div style={{
        flex: 1,
        background: "#ffffff",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 40px",
        minWidth: 0,
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            ← Zurück
          </Link>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            Noch kein Account?{" "}
            <Link href="/register" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Registrieren</Link>
          </span>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <LoginClient />
        </div>

        {/* Legal footer */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Impressum", href: "/impressum" },
              { label: "Datenschutz", href: "/datenschutz" },
              { label: "AGB", href: "/agb" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#CBD5E1" }}>
            {`© ${new Date().getFullYear()} website-fix.com`}
          </p>
        </div>
      </div>
    </div>
  );
}
