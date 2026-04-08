import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — WebsiteFix",
  robots: { index: false, follow: false },
};

export default function ImpressumPage() {
  const h2Style = { fontSize: 16, fontWeight: 700, margin: "32px 0 8px", letterSpacing: "-0.01em" };
  const pStyle = { fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: "0 0 8px" };

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/scan" style={{ fontSize: 13, fontWeight: 700, color: "#0b0c10", textDecoration: "none", padding: "7px 16px", borderRadius: 8, background: "#fff" }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 40px", letterSpacing: "-0.02em" }}>Impressum</h1>

        <p style={pStyle}>
          <strong style={{ color: "#fff" }}>Angelika Szewczyk</strong><br />
          Einzelunternehmen<br />
          Am Hühnerberg 5<br />
          51381 Leverkusen<br />
          Deutschland
        </p>

        <h2 style={h2Style}>Kontakt</h2>
        <p style={pStyle}>E-Mail: support@website-fix.com</p>

        <h2 style={h2Style}>Umsatzsteuer</h2>
        <p style={pStyle}>
          Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
        </p>

        <h2 style={h2Style}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p style={pStyle}>
          Angelika Szewczyk<br />
          Am Hühnerberg 5, 51381 Leverkusen
        </p>

        <h2 style={h2Style}>Streitschlichtung</h2>
        <p style={pStyle}>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          https://ec.europa.eu/consumers/odr
        </p>
        <p style={pStyle}>
          Ich bin nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2 style={h2Style}>Haftung für Inhalte</h2>
        <p style={pStyle}>
          Als Diensteanbieter bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>

        <h2 style={h2Style}>Haftung für Links</h2>
        <p style={pStyle}>
          Diese Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte ich keinen
          Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Startseite</Link>
          {" · "}
          <Link href="/datenschutz" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Datenschutz</Link>
        </p>
      </footer>
    </>
  );
}
