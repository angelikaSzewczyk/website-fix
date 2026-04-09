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
      background: "#0F172A",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        .legal-a:hover { color: #EAB308 !important; }
        .legal-a { transition: color 0.15s; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(15,23,42,0.95)",
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
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 24px 100px" }}>

        {/* Report card */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}>

          {/* Blue header banner */}
          <div style={{
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
            padding: "28px 48px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  WebsiteFix · Rechtliches
                </p>
                <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                  {title}
                </h1>
              </div>
            </div>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)",
              textAlign: "right", lineHeight: 1.6,
            }}>
              <div>website-fix.com</div>
              <div>{new Date().getFullYear()}</div>
            </div>
          </div>

          {/* Content area */}
          <div style={{ padding: "48px 48px 56px", color: "#0F172A" }}>
            {children}
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/" className="legal-a" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Startseite</Link>
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href={footerLink} className="legal-a" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
            {footerLabel}
          </Link>
        </p>
      </footer>
    </div>
  );
}
