import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "Datenschutz — WebsiteFix",
  // Pflichtangabe nach DSGVO — muss indexierbar sein. Google wertet noindex
  // auf §13 TMG / Art. 13 DSGVO-Pages als Verschleierung (Trust-Signal-Verlust).
  robots: { index: true, follow: true },
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
    <LegalLayout title="Datenschutzerklärung" footerLink="/impressum" footerLabel="Impressum" extraLinks={[{ href: "/agb", label: "AGB" }]}>

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
      <SH num="2">Hosting in Frankfurt (EU)</SH>
      <p style={P}>
        Die Auslieferung dieser Website erfolgt über <strong style={{ color: "#fff" }}>Vercel Inc.</strong>{" "}
        in der dedizierten Region <code style={{ fontFamily: "ui-monospace, monospace", color: "#7aa6ff" }}>fra1</code>{" "}
        (Frankfurt am Main, Hessen). Die zugehörige PostgreSQL-Datenbank wird von{" "}
        <strong style={{ color: "#fff" }}>Neon Inc.</strong> in der Region{" "}
        <code style={{ fontFamily: "ui-monospace, monospace", color: "#7aa6ff" }}>eu-central-1</code>{" "}
        (ebenfalls Frankfurt, ISO-27001-zertifiziert) betrieben. Sämtliche Compute- und
        Speicheroperationen erfolgen damit innerhalb der EU; eine Übermittlung an
        Drittstaaten findet im regulären Betrieb nicht statt. Beim Seitenaufruf werden Server-
        Logfiles (IP-Adresse, Datum und Uhrzeit des Zugriffs, Browsertyp, aufgerufene URL)
        verarbeitet und nach max. 14 Tagen automatisch gelöscht.
      </p>
      <Basis>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und stabilem Betrieb).</Basis>

      <hr style={DIVIDER} />
      <SH num="3">Kontaktformular / Anfrage</SH>
      <p style={P}>
        Wenn du mich per Formular kontaktierst, werden deine Angaben (z. B. Website-URL, Beschreibung,
        E-Mail-Adresse) zur Bearbeitung der Anfrage verarbeitet.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).</Basis>

      <hr style={DIVIDER} />
      <SH num="4">WordPress-Plugin „WebsiteFix Health Check"</SH>
      <p style={P}>
        Beim Einsatz unseres optionalen WordPress-Plugins überträgt deine Site auf deinen Klick hin
        ausschließlich <strong style={{ color: "#fff" }}>technische System-Metadaten</strong> an unsere
        Server-API: PHP-Version, WordPress-Core-Version, Anzahl aktiver Plugins, Datenbank-Indikatoren
        (z. B. <code style={{ fontFamily: "ui-monospace, monospace", color: "#7aa6ff" }}>wp_options</code>-Autoload-Größe,
        Slow-Query-Counts), Hoster-Identifier sowie ausgewählte Performance-Metriken. Das Plugin
        arbeitet ausdrücklich <strong style={{ color: "#fff" }}>Read-Only</strong> — keine schreibenden
        Operationen auf Dateisystem oder Datenbank deiner WordPress-Installation.
      </p>
      <p style={P}>
        <strong style={{ color: "#fff" }}>Keine personenbezogenen Daten von Endnutzern</strong> der von
        dir gescannten Website (z. B. deren Besucher, Kunden, Kommentar-Autoren) werden erhoben oder
        an uns übermittelt. Nicht erfasst werden insbesondere: Inhalte von Beiträgen, Kommentare,
        Bestelldaten, User-Accounts deiner WordPress-Site oder personenbezogene Logs.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung der angebotenen Diagnoseleistung).</Basis>

      <hr style={DIVIDER} />
      <SH num="5">Lead-Formular „Plugin-Report" &amp; Newsletter (Double-Opt-In)</SH>
      <p style={P}>
        Wenn du auf{" "}
        <a href="/plugin-report" style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          /plugin-report
        </a>{" "}
        deine E-Mail-Adresse einträgst, verarbeiten wir diese Adresse zusammen mit deiner optional
        angegebenen WordPress-URL sowie UTM-Parametern (Source, Medium, Campaign), um dir den
        angeforderten 92-Punkt-Diagnose-Bericht zu übermitteln. Zusätzlich erheben wir einen
        gehashten IP-Hash (SHA-256, gesalzen) zur Abwehr von Spam-Anmeldungen.
      </p>
      <p style={P}>
        Wenn du das optionale Newsletter-Häkchen setzt, fordern wir deine Zustimmung über einen
        gesonderten <strong style={{ color: "#fff" }}>Double-Opt-In</strong> ab: du erhältst eine
        zusätzliche Bestätigungs-Mail mit einem einmaligen Link. Erst nach deinem Klick auf diesen
        Link wirst du in den Newsletter-Verteiler aufgenommen. Wenn du den Link nicht binnen 14 Tagen
        anklickst, wird der Newsletter-Wunsch automatisch gelöscht; deine ursprüngliche
        Diagnose-Anfrage bleibt davon unberührt. Eine Abmeldung ist jederzeit möglich, z. B. per
        Antwort auf eine unserer Newsletter-Mails oder an{" "}
        <a href="mailto:support@website-fix.com" style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>.
      </p>
      <Basis>
        Für den Bericht-Versand: Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich/Vertragserfüllung).
        Für den Newsletter: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung mit Double-Opt-In).
      </Basis>

      <hr style={DIVIDER} />
      <SH num="6">E-Mail-Versand via Resend</SH>
      <p style={P}>
        Für die zweckgebundene Zustellung transaktionaler E-Mails — etwa den Diagnose-Bericht,
        Newsletter-Bestätigungen, Abo-Welcome-Mails oder Passwort-Resets — nutzen wir den
        Mail-Dienstleister <strong style={{ color: "#fff" }}>Resend, Inc.</strong> (San Francisco, CA,
        USA; aktive Standardvertragsklauseln nach Art. 46 DSGVO). Übermittelt werden ausschließlich
        deine E-Mail-Adresse sowie der jeweilige Mail-Inhalt. Es findet kein Tracking, keine
        Open-Pixel-Auswertung und kein Re-Sale deiner Adresse statt.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO bzw. lit. a DSGVO (je nach Mail-Typ); Datenübermittlung in die USA gestützt auf Standardvertragsklauseln.</Basis>

      <hr style={DIVIDER} />
      <SH num="7">Zahlungsabwicklung via Stripe</SH>
      <p style={P}>
        Für die Bezahlung kostenpflichtiger Pläne und Einzel-Käufe nutzen wir{" "}
        <strong style={{ color: "#fff" }}>Stripe Payments Europe, Ltd.</strong> (Dublin, Irland) als
        Zahlungsdienstleister. Die vollständige Abwicklung deiner Zahlungsdaten (z. B. Kreditkarten-
        oder SEPA-Daten) erfolgt direkt zwischen dir und Stripe; wir selbst erhalten und speichern{" "}
        <strong style={{ color: "#fff" }}>keine</strong> vollständigen Zahlungsmittel-Daten, sondern
        ausschließlich eine pseudonyme Stripe-Customer-ID, deinen Plan-Status und den jeweiligen
        Abo-Zustand (aktiv, gekündigt, ausstehende Zahlung). Über Stripes Kunden-Portal kannst du
        Zahlungsmittel selbständig verwalten, Rechnungen herunterladen und Abos kündigen.
      </p>
      <Basis>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung der gebuchten Leistung).</Basis>

      <hr style={DIVIDER} />
      <SH num="8">Webanalyse (Google Analytics)</SH>
      <p style={P}>
        Diese Website nutzt Google Analytics 4 zur Analyse der Nutzung. Google Analytics wird nur
        eingesetzt, sofern du zuvor deine Einwilligung erteilt hast.
      </p>
      <Basis>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</Basis>

      <hr style={DIVIDER} />
      <SH num="9">Speicherdauer</SH>
      <p style={P}>
        Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der jeweiligen
        Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen. Server-Logfiles werden
        nach 14 Tagen automatisch gelöscht. Lead-Einträge ohne bestätigten Newsletter-Wunsch werden
        nach max. 14 Tagen anonymisiert, sofern keine vertragliche Beziehung besteht.
      </p>

      <hr style={DIVIDER} />
      <SH num="10">Deine Rechte</SH>
      <p style={P}>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen Daten.
        Eingewilligte Verarbeitungen kannst du jederzeit mit Wirkung für die Zukunft widerrufen.
        Wende dich dazu an:{" "}
        <a href="mailto:support@website-fix.com"
          style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          support@website-fix.com
        </a>
      </p>

      <hr style={DIVIDER} />
      <SH num="11">Beschwerderecht</SH>
      <p style={P}>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
      </p>

    </LegalLayout>
  );
}
