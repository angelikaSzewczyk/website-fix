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
              Die spezialisierte Compliance-Plattform für WordPress-Agenturen.
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
        <div className="wf-footer-bottom-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>

          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            100% DSGVO-konform · Hosting in Deutschland
          </p>

          {/* Payment badges */}
          <div className="wf-footer-payments" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>

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
            <div className="wf-pay-badge wf-pay-apple">
              {/* Unicode Apple logo () + Pay */}
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "-0.01em" }}> Pay</span>
            </div>

            {/* Google Pay */}
            <div className="wf-pay-badge wf-pay-gpay">
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.01em" }}>G Pay</span>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
