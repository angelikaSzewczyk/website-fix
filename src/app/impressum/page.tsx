import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Impressum — WebsiteFix",
  robots: { index: false, follow: false },
};

const H2: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: "#EAB308",
  margin: "36px 0 10px", letterSpacing: "0.04em", textTransform: "uppercase",
};

const P: React.CSSProperties = {
  fontSize: 14, color: "rgba(255,255,255,0.85)",
  lineHeight: 1.8, margin: "0 0 6px",
};

const DIVIDER: React.CSSProperties = {
  border: "none", borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "32px 0 0",
};

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" footerLink="/datenschutz" footerLabel="Datenschutz">

      <p style={{ ...P, color: "rgba(255,255,255,0.35)", marginBottom: 28, fontSize: 13 }}>
        Pflichtangaben gemäß § 5 TMG
      </p>

      <p style={P}>
        <strong style={{ color: "#fff", fontWeight: 700 }}>Angelika Szewczyk</strong><br />
        Einzelunternehmen<br />
        Am Hühnerberg 5<br />
        51381 Leverkusen<br />
        Deutschland
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Kontakt</h2>
      <p style={P}>
        E-Mail:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#EAB308", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Umsatzsteuer</h2>
      <p style={P}>
        Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p style={P}>
        Angelika Szewczyk<br />
        Am Hühnerberg 5, 51381 Leverkusen
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Streitschlichtung</h2>
      <p style={P}>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
          className="legal-a" style={{ color: "#EAB308", textDecoration: "none" }}>
          https://ec.europa.eu/consumers/odr
        </a>
      </p>
      <p style={P}>
        Ich bin nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Haftung für Inhalte</h2>
      <p style={P}>
        Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
        allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
        übermittelte oder gespeicherte fremde Informationen zu überwachen.
      </p>

      <hr style={DIVIDER} />
      <h2 style={H2}>Haftung für Links</h2>
      <p style={P}>
        Diese Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte ich keinen
        Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen.
      </p>

    </LegalLayout>
  );
}
