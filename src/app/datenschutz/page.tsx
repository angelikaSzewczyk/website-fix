import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Datenschutz — WebsiteFix",
  robots: { index: false, follow: false },
};

// ── Tokens (light card context) ───────────────────────────────────────────────
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

// ── Section heading: yellow number pill + dark label ──────────────────────────
function SH({ num, children }: { num: string; children: string }) {
  return (
    <h2 style={{
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 15, fontWeight: 700, color: "#0F172A",
      margin: "40px 0 10px", letterSpacing: "-0.01em",
    }}>
      <span style={{
        flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: "50%",
        background: "#EAB308",
        color: "#0F172A",
        fontSize: 11, fontWeight: 800,
      }}>
        {num}
      </span>
      {children}
    </h2>
  );
}

// ── Legal basis row ───────────────────────────────────────────────────────────
function Basis({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      margin: "10px 0 14px",
      padding: "10px 14px", borderRadius: 8,
      background: "#EFF6FF", border: "1px solid #BFDBFE",
    }}>
      <span style={{
        flexShrink: 0, marginTop: 1,
        fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        padding: "2px 8px", borderRadius: 5,
        background: "#DBEAFE", color: "#1D4ED8",
        border: "1px solid #BFDBFE",
        whiteSpace: "nowrap",
      }}>
        Rechtsgrundlage
      </span>
      <span style={{ fontSize: 13, color: "#3B82F6", lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung" footerLink="/impressum" footerLabel="Impressum">

      {/* Intro */}
      <p style={{ ...P, color: "#64748B", marginBottom: 32 }}>
        Diese Datenschutzerklärung informiert dich über die Art, den Umfang und Zweck der Verarbeitung
        personenbezogener Daten auf dieser Website.
      </p>

      {/* 1 */}
      <SH num="1">Verantwortliche Stelle</SH>
      <p style={P}>
        <strong style={{ color: "#0F172A", fontWeight: 700 }}>Angelika Szewczyk</strong><br />
        Einzelunternehmen · Am Hühnerberg 5 · 51381 Leverkusen · Deutschland<br />
        E-Mail:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />

      {/* 2 */}
      <SH num="2">Hosting</SH>
      <p style={P}>
        Diese Website wird bei einem externen Dienstleister gehostet. Beim Besuch der Website werden
        automatisch sogenannte Server-Logfiles erhoben (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs,
        Browsertyp).
      </p>
      <Basis>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb der Website).</Basis>

      <hr style={DIVIDER} />

      {/* 3 */}
      <SH num="3">Kontaktformular / Anfrage</SH>
      <p style={P}>
        Wenn du mich per Formular kontaktierst, werden deine Angaben (z. B. Website-URL, Beschreibung,
        E-Mail-Adresse) zur Bearbeitung der Anfrage verarbeitet.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).</Basis>

      <hr style={DIVIDER} />

      {/* 4 */}
      <SH num="4">Zahlungsabwicklung</SH>
      <p style={P}>
        Für die Bezahlung angebotener Leistungen nutze ich einen externen Zahlungsdienstleister
        (Stripe). Die Zahlungsabwicklung erfolgt ausschließlich über den Anbieter. Ich erhalte keine
        vollständigen Zahlungsdaten.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</Basis>

      <hr style={DIVIDER} />

      {/* 5 */}
      <SH num="5">Webanalyse (Google Analytics)</SH>
      <p style={P}>
        Diese Website nutzt Google Analytics 4 zur Analyse der Nutzung. Google Analytics wird nur
        eingesetzt, sofern du zuvor deine Einwilligung erteilt hast.
      </p>
      <Basis>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</Basis>

      <hr style={DIVIDER} />

      {/* 6 */}
      <SH num="6">Speicherdauer</SH>
      <p style={P}>
        Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der jeweiligen
        Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
      </p>

      <hr style={DIVIDER} />

      {/* 7 */}
      <SH num="7">Deine Rechte</SH>
      <p style={P}>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen Daten.
        Wende dich dazu an:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />

      {/* 8 */}
      <SH num="8">Beschwerderecht</SH>
      <p style={P}>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
      </p>

    </LegalLayout>
  );
}
