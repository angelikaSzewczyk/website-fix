import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Datenschutz — WebsiteFix",
  robots: { index: false, follow: false },
};

const P: React.CSSProperties = {
  fontSize: 14, color: "rgba(255,255,255,0.85)",
  lineHeight: 1.8, margin: "0 0 6px",
};

const DIVIDER: React.CSSProperties = {
  border: "none", borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "32px 0 0",
};

function SH({ num, children }: { num: string; children: string }) {
  return (
    <h2 style={{
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 13, fontWeight: 700, color: "#7aa6ff",
      margin: "36px 0 10px", letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <span style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
        background: "#2563EB", color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800,
      }}>
        {num}
      </span>
      {children}
    </h2>
  );
}

function Basis({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      margin: "10px 0 12px", padding: "10px 14px", borderRadius: 8,
      background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
    }}>
      <span style={{
        flexShrink: 0, whiteSpace: "nowrap",
        fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
        padding: "3px 7px", borderRadius: 4,
        background: "rgba(37,99,235,0.15)", color: "#7aa6ff",
        border: "1px solid rgba(37,99,235,0.3)", marginTop: 1,
      }}>
        Rechtsgrundlage
      </span>
      <span style={{ fontSize: 13, color: "rgba(147,197,253,0.75)", lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung" footerLink="/impressum" footerLabel="Impressum">

      <p style={{ ...P, color: "rgba(255,255,255,0.35)", marginBottom: 28, fontSize: 13 }}>
        Diese Datenschutzerklärung informiert dich über die Art, den Umfang und Zweck der Verarbeitung
        personenbezogener Daten auf dieser Website.
      </p>

      <SH num="1">Verantwortliche Stelle</SH>
      <p style={P}>
        <strong style={{ color: "#fff", fontWeight: 700 }}>Angelika Szewczyk</strong><br />
        Einzelunternehmen · Am Hühnerberg 5 · 51381 Leverkusen · Deutschland<br />
        E-Mail:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />
      <SH num="2">Hosting</SH>
      <p style={P}>
        Diese Website wird bei einem externen Dienstleister gehostet. Beim Besuch der Website werden
        automatisch sogenannte Server-Logfiles erhoben (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs,
        Browsertyp).
      </p>
      <Basis>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb der Website).</Basis>

      <hr style={DIVIDER} />
      <SH num="3">Kontaktformular / Anfrage</SH>
      <p style={P}>
        Wenn du mich per Formular kontaktierst, werden deine Angaben (z. B. Website-URL, Beschreibung,
        E-Mail-Adresse) zur Bearbeitung der Anfrage verarbeitet.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).</Basis>

      <hr style={DIVIDER} />
      <SH num="4">Zahlungsabwicklung</SH>
      <p style={P}>
        Für die Bezahlung angebotener Leistungen nutze ich einen externen Zahlungsdienstleister
        (Stripe). Die Zahlungsabwicklung erfolgt ausschließlich über den Anbieter. Ich erhalte keine
        vollständigen Zahlungsdaten.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</Basis>

      <hr style={DIVIDER} />
      <SH num="5">Webanalyse (Google Analytics)</SH>
      <p style={P}>
        Diese Website nutzt Google Analytics 4 zur Analyse der Nutzung. Google Analytics wird nur
        eingesetzt, sofern du zuvor deine Einwilligung erteilt hast.
      </p>
      <Basis>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</Basis>

      <hr style={DIVIDER} />
      <SH num="6">Speicherdauer</SH>
      <p style={P}>
        Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der jeweiligen
        Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
      </p>

      <hr style={DIVIDER} />
      <SH num="7">Deine Rechte</SH>
      <p style={P}>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen Daten.
        Wende dich dazu an:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />
      <SH num="8">Beschwerderecht</SH>
      <p style={P}>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
      </p>

    </LegalLayout>
  );
}
