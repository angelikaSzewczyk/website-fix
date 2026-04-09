import Link from "next/link";
import type { ReactNode } from "react";

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ background: "#0D1117", borderRadius: 7, padding: 3, flexShrink: 0 }}>
      <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.65)"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 7,20 L 13,25 L 24,6" stroke="#EAB308"
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
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(234,179,8,0.06) 0%, transparent 60%), #0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        .legal-link:hover { color: #EAB308 !important; text-shadow: 0 0 12px rgba(234,179,8,0.4); }
        .legal-email:hover { color: #EAB308 !important; text-shadow: 0 0 16px rgba(234,179,8,0.5); }
        .legal-link, .legal-email { transition: color 0.15s, text-shadow 0.15s; }
      `}</style>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <BrandMark />
            <span style={{ fontWeight: 300, fontSize: 16, color: "#fff", letterSpacing: "-0.01em" }}>
              Website<span style={{ fontWeight: 800, color: "#EAB308" }}>Fix</span>
            </span>
          </Link>
          <Link href="/scan" style={{
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            padding: "8px 18px", borderRadius: 9,
            background: "#EAB308", color: "#0a0a0a",
            boxShadow: "0 2px 16px rgba(234,179,8,0.35)",
          }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 100px" }}>

        {/* Glass card */}
        <div style={{
          background: "rgba(15,23,42,0.6)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "2px solid rgba(234,179,8,0.5)",
          borderRadius: 20,
          padding: "52px 52px 60px",
          boxShadow: "0 0 60px rgba(234,179,8,0.05), 0 24px 64px rgba(0,0,0,0.4)",
        }}>
          {children}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href="/" className="legal-link" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Startseite</Link>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href={footerLink} className="legal-link" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            {footerLabel}
          </Link>
        </p>
      </footer>
    </div>
  );
}
