import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz — WebsiteFix",
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 40px", letterSpacing: "-0.02em" }}>Datenschutzerklärung</h1>

        <p style={pStyle}>
          Diese Datenschutzerklärung informiert dich über die Art, den Umfang und Zweck der Verarbeitung
          personenbezogener Daten auf dieser Website.
        </p>

        <h2 style={h2Style}>1. Verantwortliche Stelle</h2>
        <p style={pStyle}>
          <strong style={{ color: "#fff" }}>Angelika Szewczyk</strong><br />
          Einzelunternehmen<br />
          Am Hühnerberg 5<br />
          51381 Leverkusen<br />
          Deutschland<br />
          E-Mail: support@website-fix.com
        </p>

        <h2 style={h2Style}>2. Hosting</h2>
        <p style={pStyle}>
          Diese Website wird bei einem externen Dienstleister gehostet. Beim Besuch der Website werden
          automatisch sogenannte Server-Logfiles erhoben (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs,
          Browsertyp).
        </p>
        <p style={pStyle}>
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
          sicheren und stabilen Betrieb der Website).
        </p>

        <h2 style={h2Style}>3. Kontaktformular / Anfrage</h2>
        <p style={pStyle}>
          Wenn du mich per Formular kontaktierst, werden deine Angaben (z. B. Website-URL, Beschreibung,
          E-Mail-Adresse) zur Bearbeitung der Anfrage verarbeitet.
        </p>
        <p style={pStyle}>
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).
        </p>

        <h2 style={h2Style}>4. Zahlungsabwicklung</h2>
        <p style={pStyle}>
          Für die Bezahlung angebotener Leistungen nutze ich einen externen Zahlungsdienstleister
          (Stripe). Die Zahlungsabwicklung erfolgt ausschließlich über den Anbieter. Ich erhalte keine
          vollständigen Zahlungsdaten.
        </p>
        <p style={pStyle}>
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        </p>

        <h2 style={h2Style}>5. Webanalyse (Google Analytics)</h2>
        <p style={pStyle}>
          Diese Website nutzt Google Analytics 4 zur Analyse der Nutzung. Google Analytics wird nur
          eingesetzt, sofern du zuvor deine Einwilligung erteilt hast.
        </p>
        <p style={pStyle}>
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
        </p>

        <h2 style={h2Style}>6. Speicherdauer</h2>
        <p style={pStyle}>
          Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der jeweiligen
          Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
        </p>

        <h2 style={h2Style}>7. Deine Rechte</h2>
        <p style={pStyle}>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen Daten.
        </p>

        <h2 style={h2Style}>8. Beschwerderecht</h2>
        <p style={pStyle}>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Startseite</Link>
          {" · "}
          <Link href="/impressum" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Impressum</Link>
        </p>
      </footer>
    </>
  );
}
