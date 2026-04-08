import Link from "next/link";

type BlogHeaderProps = {
  lang?: "de" | "en";
  active?: "blog" | "none";
  ctaLabel?: string;
};

export default function BlogHeader({ lang = "de", active, ctaLabel }: BlogHeaderProps) {
  const cta = ctaLabel || (lang === "en" ? "Scan for free" : "Kostenlos scannen");

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo — matches homepage exactly */}
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Nav links */}
          <div style={{ display: "flex", gap: 24, marginRight: 12 }}>
            <Link href="/fuer-agenturen" style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none",
            }}>
              Für Agenturen
            </Link>
            <Link href="/blog" style={{
              fontSize: 14, textDecoration: "none",
              color: active === "blog" ? "#fff" : "rgba(255,255,255,0.5)",
              fontWeight: active === "blog" ? 600 : 400,
            }}>
              Blog
            </Link>
          </div>
          {/* Buttons */}
          <Link href="/login" style={{
            fontSize: 13, padding: "7px 16px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
          }}>
            Anmelden
          </Link>
          <Link href="/scan" style={{
            fontSize: 13, padding: "7px 16px", borderRadius: 8, fontWeight: 600,
            background: "#fff", color: "#0b0c10", textDecoration: "none",
          }}>
            {cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}
