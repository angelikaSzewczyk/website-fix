import type { Metadata } from "next";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
      <h1 style={{ marginTop: 0 }}>Datenschutzerklärung</h1>

      <p style={{ opacity: 0.85 }}>
        Diese Datenschutzerklärung informiert dich über die Art, den Umfang und Zweck der Verarbeitung
        personenbezogener Daten auf dieser Website.
      </p>

      <h2>1. Verantwortliche Stelle</h2>
      <p>
        <strong>Angelika Szewczyk</strong><br />
        Einzelunternehmen<br />
        Am Hühnerberg 5<br />
        51381 Leverkusen<br />
        Deutschland<br />
        E-Mail: support@website-fix.com
      </p>

      <h2>2. Hosting</h2>
      <p>
        Diese Website wird bei einem externen Dienstleister gehostet. Beim Besuch der Website werden
        automatisch sogenannte Server-Logfiles erhoben (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs,
        Browsertyp).
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
        sicheren und stabilen Betrieb der Website).
      </p>

      <h2>3. Kontaktformular / Anfrage</h2>
      <p>
        Wenn du mich per Formular kontaktierst, werden deine Angaben (z. B. Website-URL, Beschreibung,
        E-Mail-Adresse) zur Bearbeitung der Anfrage verarbeitet.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).
      </p>

      <h2>4. Zahlungsabwicklung</h2>
      <p>
        Für die Bezahlung angebotener Leistungen nutze ich einen externen Zahlungsdienstleister
        (Stripe). Die Zahlungsabwicklung erfolgt ausschließlich über den Anbieter. Ich erhalte keine
        vollständigen Zahlungsdaten.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
      </p>

      <h2>5. Webanalyse (Google Analytics)</h2>
      <p>
        Diese Website nutzt Google Analytics 4 zur Analyse der Nutzung. Google Analytics wird nur
        eingesetzt, sofern du zuvor deine Einwilligung erteilt hast.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
      </p>

      <h2>6. Speicherdauer</h2>
      <p>
        Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der jeweiligen
        Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen Daten.
      </p>

      <h2>8. Beschwerderecht</h2>
      <p>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
      </p>

      <p style={{ marginTop: 26 }}>
        <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          ← Zur Startseite
        </a>
      </p>
    </main>
  );
}
