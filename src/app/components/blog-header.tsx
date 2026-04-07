import Link from "next/link";

type BlogHeaderProps = {
  lang?: "de" | "en";
  active?: "blog" | "none";
  ctaLabel?: string;
};

export default function BlogHeader({ lang = "de", ctaLabel }: BlogHeaderProps) {
  const cta = ctaLabel || (lang === "en" ? "Scan for free" : "Jetzt scannen");

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
        <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
          Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
        </Link>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/blog" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Blog
          </Link>
          <Link href="/scan" style={{
            padding: "8px 16px", borderRadius: 8,
            background: "#fff", color: "#0b0c10",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            {cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}
