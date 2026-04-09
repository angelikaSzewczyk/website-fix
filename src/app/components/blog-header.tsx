import Link from "next/link";
import BrandLogo from "./BrandLogo";

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
        <BrandLogo />

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
