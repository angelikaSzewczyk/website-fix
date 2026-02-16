import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
      <h1 style={{ marginTop: 0 }}>Impressum</h1>

      <p>
        <strong>Angelika Szewczyk</strong><br />
        Einzelunternehmen<br />
        Am Hühnerberg 5<br />
        51381 Leverkusen<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: support@website-fix.com
      </p>

      <h2>Umsatzsteuer</h2>
      <p>
        Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
      </p>

      <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p>
        Angelika Szewczyk<br />
        [Adresse wie oben]
      </p>

      <h2>Streitschlichtung</h2>
      <p style={{ opacity: 0.85 }}>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
        https://ec.europa.eu/consumers/odr
        <br /><br />
        Ich bin nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p style={{ opacity: 0.85 }}>
        Als Diensteanbieter bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
        allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
        übermittelte oder gespeicherte fremde Informationen zu überwachen.
      </p>

      <h2>Haftung für Links</h2>
      <p style={{ opacity: 0.85 }}>
        Diese Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte ich keinen
        Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen.
      </p>

      <p style={{ marginTop: 26 }}>
        <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          ← Zur Startseite
        </a>
      </p>
    </main>
  );
}
