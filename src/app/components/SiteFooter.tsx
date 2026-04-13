import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
        </span>
        <div className="wf-footer-links">
          <Link href="/impressum" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
          <Link href="/datenschutz" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
          <Link href="/fuer-agenturen" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Agentur-Programm</Link>
          <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Blog</Link>
        </div>
      </div>
    </footer>
  );
}
