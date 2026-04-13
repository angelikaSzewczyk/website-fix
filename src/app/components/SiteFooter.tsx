import Link from "next/link";
import BrandLogo from "./BrandLogo";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "#0b0c10",
      padding: "56px 24px 32px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* 3-column grid */}
        <div className="wf-footer-grid">

          {/* Col 1: Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BrandLogo />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 220 }}>
              Der 360° WordPress-Check für Agenturen.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              {`© ${year} website-fix.com`}
            </p>
          </div>

          {/* Col 2: Produkt */}
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Produkt
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/#pricing",       label: "Preise" },
                { href: "/fuer-agenturen", label: "Agentur-Programm" },
                { href: "/blog",           label: "Blog" },
                { href: "/scan",           label: "Kostenlos scannen" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="wf-footer-link">{label}</Link>
              ))}
            </nav>
          </div>

          {/* Col 3: Rechtliches */}
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Rechtliches
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/impressum",   label: "Impressum" },
                { href: "/datenschutz", label: "Datenschutz" },
                { href: "/agb",         label: "AGB" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="wf-footer-link">{label}</Link>
              ))}
              <a href="mailto:support@website-fix.com" className="wf-footer-link">
                support@website-fix.com
              </a>
            </nav>
          </div>

        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "36px 0 24px" }} />

        {/* Bottom bar: trust + payment */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>

          {/* DSGVO text */}
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            100% DSGVO-konform · Hosting in Deutschland
          </p>

          {/* Payment icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Stripe */}
            <div style={{ padding: "4px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="38" height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.5 7c-2.2 0-3.6 1-3.6 2.6 0 1.8 1.5 2.4 3 2.9 1.3.4 2.4.8 2.4 1.8 0 .9-.8 1.4-2 1.4-1.4 0-2.7-.5-3.8-1.3l-.6 1.7c1.1.8 2.6 1.3 4.3 1.3 2.4 0 4-.9 4-2.8 0-1.8-1.5-2.5-3.1-3-1.2-.4-2.3-.8-2.3-1.7 0-.8.7-1.2 1.8-1.2 1.2 0 2.4.4 3.3 1l.6-1.6C30.3 7.4 29 7 27.5 7zm8.7.2L34 17.3h2l2.2-10.1h-2zm-5.9 0L28 17.3h2l2.3-10.1h-2zm15.8 0c-1.2 0-2.1.5-2.7 1.4l-.2-1.2h-1.8l-1.4 10.1h2l.8-5.9c.3-2 1.3-3 2.5-3 .5 0 .9.1 1.3.3l.4-1.9c-.4-.2-.8-.3-1-.3v.5zm6.5 0c-2.8 0-4.8 2.2-4.8 5.3 0 2.3 1.4 3.8 3.6 3.8 1.2 0 2.2-.4 3-.9l-.5-1.5c-.6.4-1.3.7-2.1.7-1.2 0-2-.7-2-2.1h5.7c.1-.4.1-.8.1-1.1 0-2.4-1.3-4.2-3-4.2zm-2.7 3.8c.2-1.3.9-2.2 2-2.2 1 0 1.6.8 1.6 2.2h-3.6zm-31 1.4c-.9 0-1.6.7-1.6 1.6s.7 1.5 1.6 1.5 1.6-.7 1.6-1.5c0-1-.7-1.6-1.6-1.6zM8 7l-4 10.3h2.1l.9-2.4h4l.9 2.4h2.1L10 7H8zm1 1.8l1.5 4.3H7.5L9 8.8z" fill="rgba(255,255,255,0.45)"/>
              </svg>
            </div>
            {/* Visa */}
            <div style={{ padding: "4px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
              VISA
            </div>
            {/* Mastercard */}
            <div style={{ padding: "4px 6px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 2 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(235,0,27,0.6)" }} />
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,163,0,0.6)", marginLeft: -5 }} />
            </div>
            {/* SEPA */}
            <div style={{ padding: "4px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
              SEPA
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
