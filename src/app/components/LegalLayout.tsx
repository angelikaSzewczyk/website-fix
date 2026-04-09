import Link from "next/link";
import type { ReactNode } from "react";

// ── Shared nav + footer shell for legal pages ────────────────────────────────

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ background: "#0D1117", borderRadius: 7, padding: 3, flexShrink: 0 }}>
      <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.65)"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function LegalLayout({
  children,
  footerLink,
  footerLabel,
}: {
  children: ReactNode;
  footerLink: string;
  footerLabel: string;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <BrandMark />
            <span style={{ fontWeight: 300, fontSize: 16, color: "#fff", letterSpacing: "-0.01em" }}>
              Website<span style={{ fontWeight: 800, color: "#F59E0B" }}>Fix</span>
            </span>
          </Link>

          {/* CTA */}
          <Link href="/scan" style={{
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            padding: "8px 18px", borderRadius: 9,
            background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
            color: "#0a0a0a",
            boxShadow: "0 2px 12px rgba(245,158,11,0.3)",
            transition: "opacity 0.15s",
          }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      {/* ── Page content ── */}
      {children}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href="/" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Startseite</Link>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href={footerLink} style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
            {footerLabel}
          </Link>
        </p>
      </footer>
    </div>
  );
}
