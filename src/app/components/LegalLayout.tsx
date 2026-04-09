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
  title,
  footerLink,
  footerLabel,
}: {
  children: ReactNode;
  title: string;
  footerLink: string;
  footerLabel: string;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        .legal-a { transition: color 0.15s; }
        .legal-a:hover { color: #EAB308 !important; }
      `}</style>

      {/* ── Nav ── */}
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

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 24px 96px" }}>
        {/* Glass card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          boxShadow: "0 0 50px rgba(234,179,8,0.05), 0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>

          {/* Gradient header */}
          <div style={{
            padding: "28px 40px",
            background: "linear-gradient(90deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.04) 50%, transparent 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  WebsiteFix · Rechtliches
                </p>
                <h1 style={{ margin: "3px 0 0", fontSize: 21, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                  {title}
                </h1>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "right", lineHeight: 1.7 }}>
              <div>website-fix.com</div>
              <div>{new Date().getFullYear()}</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "40px 40px 52px" }}>
            {children}
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.22)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/" className="legal-a" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Startseite</Link>
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href={footerLink} className="legal-a" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
            {footerLabel}
          </Link>
        </p>
      </footer>
    </div>
  );
}
