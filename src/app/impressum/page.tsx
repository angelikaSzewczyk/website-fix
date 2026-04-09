import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Impressum — WebsiteFix",
  robots: { index: false, follow: false },
};

// ── Tokens (light card context) ───────────────────────────────────────────────
const H2: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#0F172A",
  margin: "40px 0 10px",
  letterSpacing: "-0.01em",
};

const P: React.CSSProperties = {
  fontSize: 15,
  color: "#475569",
  lineHeight: 1.8,
  margin: "0 0 8px",
};

const DIVIDER: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #E2E8F0",
  margin: "36px 0 0",
};

const STRONG: React.CSSProperties = { color: "#0F172A", fontWeight: 700 };

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" footerLink="/datenschutz" footerLabel="Datenschutz">

      {/* Intro */}
      <p style={{ ...P, color: "#64748B", marginBottom: 32 }}>
        Pflichtangaben gemäß § 5 TMG
      </p>

      {/* Angaben */}
      <p style={P}>
        <span style={STRONG}>Angelika Szewczyk</span><br />
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
          style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
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
          style={{ color: "#2563EB", textDecoration: "none" }}>
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
