"use client";

/**
 * AvvPrintClient — Druckbare AVV-Vorlage.
 *
 * Light-Theme (für Print). Print-Button verwendet window.print(). User
 * exportiert via Browser-Print-Dialog als PDF (Chrome/Safari/Firefox alle
 * supported).
 *
 * Inhalt: Standard-AVV-Klauseln gem. Art. 28 DSGVO. Agency-Name + Webseite
 * automatisch ausgefüllt. Mandanten-Felder als Platzhalter zum manuellen
 * Eintragen oder Per-Mandant-Druck.
 */

type Props = {
  agency: {
    agency_name:    string | null;
    agency_website: string | null;
    custom_domain:  string | null;
  };
  contactEmail: string;
};

export default function AvvPrintClient({ agency, contactEmail }: Props) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const agencyName = agency.agency_name || "[Agency-Name in Settings hinterlegen]";
  const agencyWeb  = agency.agency_website || "[Webseite in Settings hinterlegen]";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#ffffff",
      color: "#0F172A",
      fontFamily: "Georgia, 'Times New Roman', serif",
      padding: "32px 32px 80px",
    }}>
      {/* Print-Toolbar (wird beim Drucken ausgeblendet) */}
      <div className="wf-no-print" style={{
        maxWidth: 880, margin: "0 auto 28px",
        padding: "14px 18px", borderRadius: 11,
        background: "#F1F5F9", border: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 14, flexWrap: "wrap",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
            AVV-Vorlage · Auftragsverarbeitungsvertrag
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.55 }}>
            Per Browser-Print als PDF speichern → vom Mandanten unterschreiben
            lassen → Kopie an support@website-fix.com.
            <strong style={{ color: "#92400E" }}> Vor Verwendung von Fachanwalt prüfen lassen.</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: "10px 22px", borderRadius: 9,
            background: "#7C3AED", color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          🖨 Als PDF drucken
        </button>
      </div>

      {/* AVV-Dokument */}
      <article style={{
        maxWidth: 800, margin: "0 auto",
        padding: "60px 70px",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        fontSize: 14,
        lineHeight: 1.75,
      }}>
        <header style={{ borderBottom: "2px solid #0F172A", paddingBottom: 22, marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Vereinbarung zur Auftragsverarbeitung
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748B" }}>
            gemäß Art. 28 Datenschutz-Grundverordnung (DSGVO) · Stand {today}
          </p>
        </header>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Zwischen</h2>
          <p style={{ margin: "0 0 14px" }}>
            <strong>{agencyName}</strong><br/>
            {agencyWeb}<br/>
            E-Mail: {contactEmail}<br/>
            <em>— nachfolgend „Auftragsverarbeiter" —</em>
          </p>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>und</h2>
          <p style={{ margin: 0 }}>
            <strong>[Mandant — Firma, Adresse, Vertretungsberechtigte/r]</strong><br/>
            <em>— nachfolgend „Verantwortlicher" —</em>
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 1 Gegenstand der Vereinbarung</h3>
          <p style={{ margin: 0 }}>
            Der Auftragsverarbeiter führt für den Verantwortlichen Wartungs-, SEO-,
            Performance- und Barrierefreiheits-Audits an dessen Web-Auftritten
            durch. Im Rahmen dieser Tätigkeit verarbeitet der Auftragsverarbeiter
            personenbezogene Daten, die im Quellcode der Webseiten oder in der
            Server-Umgebung des Verantwortlichen anfallen (Art. 4 Nr. 8 DSGVO).
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 2 Art und Zweck der Verarbeitung</h3>
          <p style={{ margin: "0 0 8px" }}>
            <strong>Art:</strong> Lesen (Crawling) öffentlich erreichbarer Webseiten,
            optional Auslesen von Server-Konfigurationsdaten via Read-Only-Plugin
            ohne Schreibrechte.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Zweck:</strong> Identifikation technischer, rechtlicher und
            barrierefreiheits-bezogener Mängel; Erstellung von Optimierungs-
            empfehlungen und Audit-Reports; laufende Erfolgskontrolle gem. BFSG 2025.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 3 Kategorien betroffener Personen und Daten</h3>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Betroffene Personenkategorien:</strong> Webseiten-Besucher des
            Verantwortlichen, deren personenbezogene Daten im Rahmen des Crawlings
            ggf. inzident verarbeitet werden (z. B. IP-Adressen in Server-Logs).
          </p>
          <p style={{ margin: 0 }}>
            <strong>Datenkategorien:</strong> Webseiten-Inhalte, Konfigurations-
            und Strukturdaten, Performance-Metriken. Keine Verarbeitung von
            Stammdaten der Endkunden des Verantwortlichen ohne separate Beauftragung.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 4 Pflichten des Auftragsverarbeiters</h3>
          <p style={{ margin: "0 0 6px" }}>
            Der Auftragsverarbeiter verarbeitet die Daten ausschließlich auf
            dokumentierte Weisung des Verantwortlichen (Art. 28 Abs. 3 lit. a DSGVO).
            Er gewährleistet:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>Vertraulichkeit aller mit der Auftragsverarbeitung befassten Personen (Art. 28 Abs. 3 lit. b DSGVO)</li>
            <li>Geeignete technisch-organisatorische Maßnahmen gem. Art. 32 DSGVO (TLS-Verschlüsselung, EU-only Datenfluss, ISO-27001-konformer Hosting-Provider)</li>
            <li>Unterstützung des Verantwortlichen bei der Erfüllung seiner Pflichten aus Art. 32 bis 36 DSGVO</li>
            <li>Löschung oder Rückgabe aller personenbezogenen Daten nach Vertragsende auf Wunsch</li>
            <li>Bereitstellung aller erforderlichen Informationen zum Nachweis der Einhaltung der DSGVO-Pflichten</li>
          </ul>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 5 Weisungsbefugnis und Subunternehmer</h3>
          <p style={{ margin: "0 0 6px" }}>
            Der Auftragsverarbeiter setzt zur Erbringung der Dienstleistung
            folgende Subunternehmer (weitere Auftragsverarbeiter) ein:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li><strong>WebsiteFix</strong> (Plattform-Betreiber, EU-Hosting via Vercel/Frankfurt + Neon/EU-West) — DSGVO-konform, AVV verfügbar</li>
            <li><strong>Resend</strong> (Mail-Versand, Ireland eu-west-1) — DSGVO-konform</li>
            <li><strong>Stripe</strong> (Zahlungsabwicklung, sofern aktiviert) — DSGVO-konform mit Standardvertragsklauseln</li>
          </ul>
          <p style={{ margin: "8px 0 0" }}>
            Der Wechsel oder die Hinzunahme weiterer Subunternehmer wird dem
            Verantwortlichen mit einer Frist von 14 Tagen angekündigt. Der
            Verantwortliche kann diesem widersprechen.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 6 Speicherdauer und Löschung</h3>
          <p style={{ margin: 0 }}>
            Audit-Reports und Scan-Daten werden für die Dauer des Mandats
            zuzüglich 90 Tagen aufbewahrt, anschließend automatisiert gelöscht.
            Auf Wunsch des Verantwortlichen erfolgt eine sofortige Löschung mit
            Bestätigung per E-Mail.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 7 Auskunftsrechte und Mitwirkung</h3>
          <p style={{ margin: 0 }}>
            Der Auftragsverarbeiter unterstützt den Verantwortlichen bei der
            Wahrnehmung von Auskunfts-, Berichtigungs-, Lösch-, Einschränkungs-
            und Datenübertragbarkeits-Rechten der betroffenen Personen
            (Art. 15 ff. DSGVO).
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 8 Audit-Log und Nachweispflicht</h3>
          <p style={{ margin: 0 }}>
            Der Auftragsverarbeiter führt ein Append-only-Audit-Log aller
            Datenzugriffe im Rahmen dieser Vereinbarung. Auf Anforderung des
            Verantwortlichen wird ein Auszug innerhalb von 7 Werktagen bereitgestellt.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>§ 9 Haftung</h3>
          <p style={{ margin: 0 }}>
            Es gelten die allgemeinen Bestimmungen aus Art. 82 DSGVO sowie die
            zwischen den Parteien getroffenen Haftungsregelungen im Wartungs-Hauptvertrag.
          </p>
        </section>

        {/* Unterschriften */}
        <section style={{ marginTop: 50, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50 }}>
            <div>
              <p style={{ margin: 0, borderBottom: "1px solid #0F172A", paddingBottom: 50 }}>&nbsp;</p>
              <p style={{ margin: "8px 0 0", fontSize: 12 }}>
                Ort, Datum, Unterschrift<br/>
                <strong>Auftragsverarbeiter</strong><br/>
                {agencyName}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, borderBottom: "1px solid #0F172A", paddingBottom: 50 }}>&nbsp;</p>
              <p style={{ margin: "8px 0 0", fontSize: 12 }}>
                Ort, Datum, Unterschrift<br/>
                <strong>Verantwortlicher</strong><br/>
                [Mandant]
              </p>
            </div>
          </div>
        </section>

        {/* Footer-Hinweis */}
        <footer style={{ marginTop: 50, paddingTop: 18, borderTop: "1px solid #E2E8F0",
                          fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
          Diese Vorlage ist eine Standard-AVV gem. Art. 28 DSGVO. Vor Verwendung
          empfehlen wir die Prüfung durch einen Fachanwalt für IT-/Datenschutzrecht.
          Bereitgestellt durch WebsiteFix für Agency-Scale-Kunden.
        </footer>
      </article>

      <style>{`
        @media print {
          .wf-no-print { display: none !important; }
          body { background: #fff !important; }
          main { padding: 0 !important; }
          article { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </main>
  );
}
