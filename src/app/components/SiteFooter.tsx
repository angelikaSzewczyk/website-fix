import Link from "next/link";
import BrandLogo from "./BrandLogo";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "#0b0c10",
      padding: "56px 0 32px",
    }}>
      {/* Centered content wrapper — same max-width as page sections */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* 3-column grid */}
        <div className="wf-footer-grid">

          {/* Col 1: Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BrandLogo />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 220 }}>
              Die All-in-One Compliance-Plattform für WordPress-Agenturen.
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
                { href: "/#pricing",         label: "Preise" },
                { href: "/fuer-agenturen",   label: "Agentur-Programm" },
                { href: "/fuer-agenturen#white-label", label: "White-Label Reports" },
                { href: "/blog",             label: "Blog" },
                { href: "/scan",             label: "Kostenlos scannen" },
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

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>

          {/* DSGVO text — bündig unter Logo */}
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            100% DSGVO-konform · Hosting in Deutschland
          </p>

          {/* Payment icons */}
          <div className="wf-footer-payments" style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* Powered by Stripe */}
            <div className="wf-pay-badge wf-pay-stripe" title="Powered by Stripe">
              <svg width="52" height="14" viewBox="0 0 52 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Powered by Stripe">
                <text x="0" y="11" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="600" fill="currentColor" opacity="0.5">Powered by</text>
                <text x="0" y="11" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="700" fill="currentColor" opacity="0.5" dx="38">Stripe</text>
              </svg>
            </div>

            {/* Visa */}
            <div className="wf-pay-badge wf-pay-visa" title="Visa">
              <svg width="34" height="11" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5 1L17 15H13.5L17 1H20.5ZM34.5 9.8L36.3 4.9L37.3 9.8H34.5ZM38.5 15H41.7L38.9 1H35.9C35.2 1 34.6 1.4 34.3 2L29.3 15H32.7L33.4 13H37.5L38.5 15ZM29.3 10.5C29.3 7.1 24.7 6.9 24.7 5.5C24.7 5.1 25.1 4.6 26 4.5C26.5 4.4 27.8 4.4 29.3 5.1L29.9 2.3C29.1 2 28 1.7 26.7 1.7C23.5 1.7 21.3 3.4 21.3 5.8C21.3 7.6 22.9 8.6 24.1 9.2C25.4 9.8 25.8 10.2 25.8 10.8C25.8 11.6 24.8 12 23.9 12C22.3 12 21.3 11.5 20.6 11.2L20 14C20.7 14.4 22.1 14.7 23.5 14.7C26.9 14.8 29 13.1 29.3 10.5ZM15.5 1L10.2 15H6.7L4.1 3.6C3.9 2.8 3.8 2.5 3.2 2.2C2.2 1.7 0.6 1.2 0 1L0.1 0.7H5.5C6.2 0.7 6.8 1.2 7 2L8.4 9.6L11.8 0.7L15.5 1Z" fill="currentColor"/>
              </svg>
            </div>

            {/* Mastercard */}
            <div className="wf-pay-badge wf-pay-mc" title="Mastercard" style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div className="wf-mc-left" style={{ width: 13, height: 13, borderRadius: "50%", background: "currentColor", opacity: 0.5 }} />
              <div className="wf-mc-right" style={{ width: 13, height: 13, borderRadius: "50%", background: "currentColor", opacity: 0.5, marginLeft: -5 }} />
            </div>

            {/* SEPA */}
            <div className="wf-pay-badge wf-pay-sepa" title="SEPA Lastschrift">
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>SEPA</span>
            </div>

            {/* Apple Pay */}
            <div className="wf-pay-badge wf-pay-apple" title="Apple Pay">
              <svg width="34" height="14" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.2 3.7C8.5 4.5 7.4 5.1 6.3 5C6.2 3.9 6.7 2.7 7.4 1.9C8.1 1.1 9.3 0.5 10.2 0.5C10.3 1.7 9.9 2.9 9.2 3.7ZM10.2 5.2C8.5 5.1 7 6.1 6.2 6.1C5.4 6.1 4.1 5.2 2.8 5.2C1 5.3 -0.4 6.2 -1.2 7.7C-2.8 10.6 -1.6 14.9 0 17.1C0.8 18.2 1.8 19.4 3.1 19.3C4.3 19.3 4.8 18.5 6.4 18.5C7.9 18.5 8.4 19.3 9.7 19.3C11 19.3 11.9 18.2 12.7 17.1C13.6 15.8 14 14.6 14 14.5C13.9 14.5 11.3 13.5 11.3 10.4C11.3 7.8 13.3 6.6 13.4 6.5C12.2 4.7 10.4 5.2 10.2 5.2ZM19.4 1.7V19H21.9V13.1H25.5C28.7 13.1 31 10.8 31 7.4C31 4 28.8 1.7 25.6 1.7H19.4ZM21.9 3.9H24.9C27.1 3.9 28.4 5.1 28.4 7.4C28.4 9.7 27.1 10.9 24.9 10.9H21.9V3.9ZM36.6 19.1C38.3 19.1 39.8 18.3 40.6 16.9H40.7V19H43V11.1C43 8.6 41 7 37.7 7C34.6 7 32.5 8.6 32.4 11H34.7C34.9 9.8 36 9 37.7 9C39.6 9 40.6 9.9 40.6 11.5V12.5L37.1 12.7C33.8 12.9 32 14.2 32 16.5C32 18.8 33.9 19.1 36.6 19.1ZM37.3 17.2C35.6 17.2 34.5 16.4 34.5 15.2C34.5 13.9 35.5 13.2 37.5 13.1L40.6 12.9V14C40.6 15.8 39.1 17.2 37.3 17.2ZM46 23.5C48.4 23.5 49.6 22.5 50.6 19.7L55 7.2H52.4L49.5 16.9H49.4L46.5 7.2H43.8L48.1 19L47.9 19.7C47.5 20.9 46.8 21.4 45.7 21.4C45.5 21.4 45.1 21.4 44.9 21.3V23.4C45.2 23.5 45.7 23.5 46 23.5Z" fill="currentColor" transform="translate(2,0) scale(0.8)"/>
              </svg>
            </div>

            {/* Google Pay */}
            <div className="wf-pay-badge wf-pay-gpay" title="Google Pay">
              <svg width="34" height="14" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="14" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="500" fill="currentColor">G Pay</text>
              </svg>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
