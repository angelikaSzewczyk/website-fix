import type { Metadata } from "next";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
      <h1 style={{ marginTop: 0 }}>Datenschutzerklärung</h1>

      <p style={{ opacity: 0.85 }}>
        ⚠️ Platzhalter: Für eine rechtssichere Datenschutzerklärung (Hosting, Formspree, Analytics)
        bitte Generator/Jurist nutzen.
      </p>

      <h2>1. Verantwortliche Stelle</h2>
      <p>(Hier Name/Firma + Anschrift + Kontakt ergänzen)</p>

      <h2>2. Kontaktaufnahme / Formular</h2>
      <p>
        Wenn du das Formular nutzt, werden die eingegebenen Daten zur Bearbeitung deiner Anfrage verarbeitet.
      </p>

      <h2>3. Webanalyse</h2>
      <p>Diese Website nutzt Google Analytics (GA4). IP-Anonymisierung ist aktiviert.</p>

      <h2>4. Kontakt</h2>
      <p>E-Mail: hello.websitefix.team@web.de</p>

      <p>
        <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>← Zur Startseite</a>
      </p>
    </main>
  );
}
