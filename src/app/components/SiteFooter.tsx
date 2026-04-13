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
      {/* Same max-width + padding as all page sections → perfect alignment */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* 3-column grid */}
        <div className="wf-footer-grid">

          {/* Col 1: Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BrandLogo />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 220 }}>
              Die spezialisierte Compliance-Plattform für WordPress-Agenturen & professionelle Web-Entwicklung.
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
                { href: "/#pricing",                   label: "Preise" },
                { href: "/fuer-agenturen",             label: "Agentur-Programm" },
                { href: "/fuer-agenturen#white-label", label: "White-Label Reports" },
                { href: "/blog",                       label: "Blog" },
                { href: "/scan",                       label: "Kostenlos scannen" },
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

        {/* Bottom bar: DSGVO left (under logo), payment right (under Rechtliches) */}
        <div className="wf-footer-bottom-bar" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center", gap: 12 }}>

          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            100% DSGVO-konform · Hosting in Deutschland
          </p>
          {/* Spacer middle column */}
          <div />

          {/* Payment badges — right-aligned in 3rd grid column */}
          <div className="wf-footer-payments" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>

            {/* Powered by Stripe */}
            <div className="wf-pay-badge wf-pay-stripe">
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>Powered by&nbsp;</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.01em" }}>Stripe</span>
            </div>

            {/* Visa */}
            <div className="wf-pay-badge wf-pay-visa">
              <span style={{ fontSize: 11, fontWeight: 800, fontStyle: "italic", letterSpacing: "0.01em" }}>VISA</span>
            </div>

            {/* Mastercard */}
            <div className="wf-pay-badge wf-pay-mc" style={{ display: "flex", alignItems: "center" }}>
              <div className="wf-mc-left"  style={{ width: 13, height: 13, borderRadius: "50%", background: "rgba(235,0,27,0.55)" }} />
              <div className="wf-mc-right" style={{ width: 13, height: 13, borderRadius: "50%", background: "rgba(255,163,0,0.55)", marginLeft: -5 }} />
            </div>

            {/* SEPA */}
            <div className="wf-pay-badge wf-pay-sepa">
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>SEPA</span>
            </div>

            {/* Apple Pay */}
            <div className="wf-pay-badge wf-pay-apple" style={{ padding: "4px 10px", gap: 4 }}>
              {/* Apple logo mark */}
              <svg width="11" height="13" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-166.5-117.6C159.3 748.2 104 634.7 104 526.1 104 319.1 238.2 209.2 370.4 209.2c65.2 0 119.2 43.2 159.6 43.2 38.6 0 99.6-46 166.6-46 27.2 0 108.2 2.6 168.1 94.2zM510.7 190c30.2-35.4 51.3-84.7 51.3-134 0-6.5-.6-13-1.9-18.2-48.7 1.9-106.9 32.5-141.3 73.2-26.9 30.2-52 79.5-52 129.4 0 7.1 1.3 14.2 1.9 16.5 3.2.6 8.4 1.3 13.6 1.3 43.5 0 98.9-29.2 128.4-68.2z"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "-0.01em" }}>Pay</span>
            </div>

            {/* Google Pay */}
            <div className="wf-pay-badge wf-pay-gpay" style={{ padding: "4px 10px", gap: 3 }}>
              {/* Google G icon */}
              <svg width="11" height="11" viewBox="0 0 488 488" aria-hidden="true">
                <path d="M488 261c0-10-1-20-3-30H249v57h135c-6 31-23 57-49 74v61h79c47-43 74-107 74-162z" fill="#4285F4"/>
                <path d="M249 488c67 0 124-22 165-60l-79-61c-22 15-51 24-86 24-66 0-122-44-142-104H25v63c42 83 128 138 224 138z" fill="#34A853"/>
                <path d="M107 287c-5-15-8-31-8-49s3-34 8-49v-63H25C9 157 0 200 0 244s9 87 25 118l82-75z" fill="#FBBC05"/>
                <path d="M249 97c37 0 70 13 96 38l72-72C373 22 316 0 249 0 153 0 67 55 25 138l82 63c20-60 76-104 142-104z" fill="#EA4335"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.01em" }}>Pay</span>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
