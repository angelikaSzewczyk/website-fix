import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Impressum — WebsiteFix",
  robots: { index: false, follow: false },
};

// ── Style tokens ──────────────────────────────────────────────────────────────
const H1: React.CSSProperties = {
  fontSize: "clamp(32px, 5vw, 46px)",
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 1.1,
  margin: "0 0 16px",
  background: "linear-gradient(135deg, #fff 30%, #EAB308 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const LEAD: React.CSSProperties = {
  fontSize: 15,
  color: "rgba(255,255,255,0.4)",
  lineHeight: 1.8,
  margin: "0 0 52px",
  letterSpacing: "0.01em",
};

const H2: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: "#fff",
  margin: "52px 0 14px",
  letterSpacing: "-0.015em",
};

const P: React.CSSProperties = {
  fontSize: 15,
  color: "rgba(255,255,255,0.65)",
  lineHeight: 1.8,
  margin: "0 0 10px",
};

const DIVIDER: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "48px 0 0",
};

export default function ImpressumPage() {
  return (
    <LegalLayout footerLink="/datenschutz" footerLabel="Datenschutz">

      {/* Title */}
      <h1 style={H1}>Impressum</h1>
      <p style={LEAD}>Pflichtangaben gemäß § 5 TMG</p>

      {/* Angaben */}
      <p style={P}>
        <strong style={{ color: "#fff", fontWeight: 700 }}>Angelika Szewczyk</strong><br />
        Einzelunternehmen<br />
        Am Hühnerberg 5<br />
        51381 Leverkusen<br />
        Deutschland
      </p>

      <hr style={DIVIDER} />

      {/* Kontakt */}
      <h2 style={H2}>Kontakt</h2>
      <p style={P}>
        E-Mail:{" "}
        <a href="mailto:support@website-fix.com" className="legal-email"
          style={{ color: "#EAB308", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />

      {/* Umsatzsteuer */}
      <h2 style={H2}>Umsatzsteuer</h2>
      <p style={P}>
        Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
      </p>

      <hr style={DIVIDER} />

      {/* Verantwortlich */}
      <h2 style={H2}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p style={P}>
        Angelika Szewczyk<br />
        Am Hühnerberg 5, 51381 Leverkusen
      </p>

      <hr style={DIVIDER} />

      {/* Streitschlichtung */}
      <h2 style={H2}>Streitschlichtung</h2>
      <p style={P}>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
          className="legal-link" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
          https://ec.europa.eu/consumers/odr
        </a>
      </p>
      <p style={P}>
        Ich bin nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <hr style={DIVIDER} />

      {/* Haftung Inhalte */}
      <h2 style={H2}>Haftung für Inhalte</h2>
      <p style={P}>
        Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
        allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
        übermittelte oder gespeicherte fremde Informationen zu überwachen.
      </p>

      <hr style={DIVIDER} />

      {/* Haftung Links */}
      <h2 style={H2}>Haftung für Links</h2>
      <p style={P}>
        Diese Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte ich keinen
        Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen.
      </p>

    </LegalLayout>
  );
}
