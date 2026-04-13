import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";

export const metadata: Metadata = {
  title: "AGB — Allgemeine Geschäftsbedingungen | WebsiteFix",
  description:
    "Allgemeine Geschäftsbedingungen für die Nutzung von WebsiteFix — SaaS-Plattform zur WordPress-Website-Analyse.",
  robots: { index: true, follow: true },
};

/* ── Shared style tokens ───────────────────────────────────── */

const P: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.85,
  margin: "0 0 10px",
};

const SMALL: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.55)",
  lineHeight: 1.75,
  margin: "0 0 6px",
};

const DIVIDER: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "36px 0 0",
};

/* ── Section heading with § badge ─────────────────────────── */
function SH({ par, children }: { par: string; children: string }) {
  return (
    <h2
      id={`par-${par}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 15,
        fontWeight: 800,
        color: "#fff",
        margin: "40px 0 12px",
        letterSpacing: "-0.01em",
        scrollMarginTop: 80,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          minWidth: 34,
          height: 24,
          borderRadius: 6,
          background: "rgba(37,99,235,0.18)",
          border: "1px solid rgba(37,99,235,0.35)",
          color: "#7aa6ff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.03em",
          padding: "0 8px",
        }}
      >
        § {par}
      </span>
      {children}
    </h2>
  );
}

/* ── Callout box ───────────────────────────────────────────── */
function Callout({
  variant = "blue",
  children,
}: {
  variant?: "blue" | "yellow" | "red";
  children: React.ReactNode;
}) {
  const colors = {
    blue: {
      bg: "rgba(37,99,235,0.08)",
      border: "rgba(37,99,235,0.25)",
      text: "rgba(147,197,253,0.85)",
    },
    yellow: {
      bg: "rgba(234,179,8,0.07)",
      border: "rgba(234,179,8,0.25)",
      text: "rgba(253,224,71,0.85)",
    },
    red: {
      bg: "rgba(239,68,68,0.07)",
      border: "rgba(239,68,68,0.25)",
      text: "rgba(252,165,165,0.85)",
    },
  }[variant];

  return (
    <div
      style={{
        margin: "14px 0",
        padding: "12px 16px",
        borderRadius: 8,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: 13,
        color: colors.text,
        lineHeight: 1.75,
      }}
    >
      {children}
    </div>
  );
}

/* ── Numbered list item ────────────────────────────────────── */
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        fontSize: 14,
        color: "rgba(255,255,255,0.78)",
        lineHeight: 1.8,
        marginBottom: 6,
        paddingLeft: 4,
      }}
    >
      {children}
    </li>
  );
}

/* ── Table of contents ─────────────────────────────────────── */
const TOC_ITEMS = [
  { par: "1", label: "Geltungsbereich" },
  { par: "2", label: "Vertragsgegenstand" },
  { par: "3", label: "B2B – Ausschluss von Verbrauchern" },
  { par: "4", label: "Vertragsschluss & Nutzerkonto" },
  { par: "5", label: "Abonnement, Preise & Zahlung" },
  { par: "6", label: "Laufzeit, Verlängerung & Kündigung" },
  { par: "7", label: "Widerrufsrecht" },
  { par: "8", label: "White-Label-Nutzungsrechte" },
  { par: "9", label: "Haftungsausschluss & keine Rechtsberatung" },
  { par: "10", label: "Datenschutz, Gerichtsstand & Schlussbestimmungen" },
];

function TableOfContents() {
  return (
    <div
      style={{
        margin: "0 0 40px",
        padding: "20px 24px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 10,
          fontWeight: 800,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Inhaltsverzeichnis
      </p>
      <ol
        style={{
          margin: 0,
          padding: "0 0 0 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2px 32px",
        }}
      >
        {TOC_ITEMS.map((item) => (
          <li key={item.par} style={{ margin: 0 }}>
            <a
              href={`#par-${item.par}`}
              className="legal-a"
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                lineHeight: 2,
                display: "block",
              }}
            >
              <span style={{ color: "#7aa6ff", fontWeight: 700, marginRight: 6 }}>
                § {item.par}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function AgbPage() {
  return (
    <LegalLayout
      title="Allgemeine Geschäftsbedingungen"
      footerLink="/impressum"
      footerLabel="Impressum"
    >
      {/* Intro */}
      <p style={{ ...SMALL, marginBottom: 6 }}>
        Stand: April 2026 · WebsiteFix · Angelika Szewczyk · Am Hühnerberg 5 · 51381 Leverkusen
      </p>
      <p style={{ ...P, color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: 13 }}>
        Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der SaaS-Plattform WebsiteFix
        (website-fix.com) ausschließlich im B2B-Verhältnis zwischen Unternehmern.
      </p>

      <TableOfContents />

      {/* ── § 1 ── */}
      <SH par="1">Geltungsbereich</SH>
      <p style={P}>
        Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") der Angelika Szewczyk,
        Einzelunternehmen, Am Hühnerberg 5, 51381 Leverkusen, Deutschland (nachfolgend
        „Anbieterin") gelten für alle Verträge über die Nutzung der unter{" "}
        <strong style={{ color: "#fff" }}>website-fix.com</strong> bereitgestellten
        Software-as-a-Service-Plattform (nachfolgend „Dienst").
      </p>
      <p style={P}>
        Entgegenstehende oder abweichende Bedingungen des Nutzers erkennt die Anbieterin nicht an,
        es sei denn, sie hat deren Geltung ausdrücklich schriftlich zugestimmt.
      </p>
      <p style={P}>
        Die jeweils gültigen AGB sind jederzeit unter{" "}
        <strong style={{ color: "#fff" }}>website-fix.com/agb</strong> abrufbar.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 2 ── */}
      <SH par="2">Vertragsgegenstand</SH>
      <p style={P}>
        Gegenstand des Vertrags ist die Bereitstellung einer cloudbasierten
        Software-as-a-Service-Lösung zur automatisierten Analyse von WordPress-Websites. Der Dienst
        umfasst insbesondere:
      </p>
      <ul style={{ margin: "4px 0 16px", paddingLeft: 22 }}>
        <Li>
          Analyse von Websites hinsichtlich <strong style={{ color: "#fff" }}>Barrierefreiheit</strong>{" "}
          (WCAG 2.1/2.2, BFSG-Anforderungen),{" "}
          <strong style={{ color: "#fff" }}>Suchmaschinenoptimierung</strong> (SEO) und{" "}
          <strong style={{ color: "#fff" }}>Performance</strong>
        </Li>
        <Li>Bereitstellung von Diagnoseberichten mit Handlungsempfehlungen</Li>
        <Li>
          Generierung von White-Label-Reports zur Weitergabe an Endkunden der Nutzerin gemäß § 8
        </Li>
        <Li>Zugang zu einem webbasierten Dashboard zur Verwaltung von Scans, Leads und Berichten</Li>
        <Li>Monitoring-Funktionen für regelmäßige Prüfungen registrierter Websites</Li>
      </ul>
      <Callout variant="blue">
        <strong>Hinweis Leistungsumfang:</strong> Der konkret verfügbare Funktionsumfang richtet sich
        nach dem jeweils gebuchten Abonnement-Plan. Die Anbieterin behält sich das Recht vor, den
        Funktionsumfang im Rahmen der Weiterentwicklung des Dienstes anzupassen, sofern dies dem
        Nutzer zumutbar ist und wesentliche Vertragspflichten nicht berührt werden.
      </Callout>

      <hr style={DIVIDER} />

      {/* ── § 3 ── */}
      <SH par="3">B2B – Ausschluss von Verbrauchern</SH>
      <Callout variant="yellow">
        <strong>Wichtig:</strong> Das Angebot der Anbieterin richtet sich ausschließlich an
        Unternehmer im Sinne von{" "}
        <strong>§ 14 BGB</strong> — d. h. an natürliche oder juristische Personen oder
        rechtsfähige Personengesellschaften, die bei Abschluss des Vertrags in Ausübung ihrer
        gewerblichen oder selbständigen beruflichen Tätigkeit handeln. Dies umfasst insbesondere
        Web- und WordPress-Agenturen, Freelancer sowie IT-Dienstleister.{" "}
        <strong>Verbraucher im Sinne des § 13 BGB sind vom Vertragsabschluss ausgeschlossen.</strong>
      </Callout>
      <p style={P}>
        Mit dem Abschluss eines Abonnements bestätigt der Nutzer ausdrücklich, dass er
        als Unternehmer im Sinne des § 14 BGB handelt. Die Anbieterin behält sich vor,
        Nutzerkonten zu sperren oder zu kündigen, sofern sich herausstellt, dass der Nutzer
        kein Unternehmer ist.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 4 ── */}
      <SH par="4">Vertragsschluss &amp; Nutzerkonto</SH>
      <p style={P}>
        Der Vertrag kommt durch die Registrierung auf der Plattform und die Buchung eines
        Abonnements zustande. Mit dem Absenden der Bestellung im Checkout-Prozess gibt der Nutzer
        ein verbindliches Angebot zum Abschluss eines Nutzungsvertrags ab. Die Anbieterin nimmt
        dieses Angebot durch Freischaltung des Zugangs und Bestätigung per E-Mail an.
      </p>
      <p style={P}>
        Der Nutzer ist verpflichtet, bei der Registrierung vollständige und wahrheitsgemäße Angaben
        zu machen und diese aktuell zu halten. Er ist für die Geheimhaltung seiner Zugangsdaten
        verantwortlich. Für Handlungen, die unter seinem Konto vorgenommen werden, haftet der Nutzer
        gegenüber der Anbieterin.
      </p>
      <p style={P}>
        Die Anbieterin ist berechtigt, die Registrierung ohne Angabe von Gründen abzulehnen.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 5 ── */}
      <SH par="5">Abonnement, Preise &amp; Zahlung</SH>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        5.1 Abonnement-Pläne
      </p>
      <p style={P}>
        Die Anbieterin bietet verschiedene Abonnement-Pläne mit unterschiedlichem Leistungsumfang
        an. Der jeweils aktuelle Funktions- und Preisumfang ist unter{" "}
        <strong style={{ color: "#fff" }}>website-fix.com</strong> abrufbar. Bei Abschluss des
        Abonnements gilt der zum Zeitpunkt der Buchung ausgewiesene Preis.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        5.2 Preise &amp; Steuern
      </p>
      <p style={P}>
        Alle angegebenen Preise sind <strong style={{ color: "#fff" }}>Nettopreise</strong> für
        Unternehmer. Da die Anbieterin die steuerliche Kleinunternehmerregelung (§ 19 UStG) in
        Anspruch nimmt, wird keine Umsatzsteuer ausgewiesen. Ausländische Nutzer sind für die
        Abführung etwaiger nach ihrem nationalen Steuerrecht anfallender Steuern selbst
        verantwortlich.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        5.3 Zahlungsabwicklung via Stripe
      </p>
      <p style={P}>
        Die Zahlungsabwicklung erfolgt über den Zahlungsdienstleister{" "}
        <strong style={{ color: "#fff" }}>Stripe, Inc.</strong> (354 Oyster Point Blvd, South San
        Francisco, CA 94080, USA) bzw. Stripe Payments Europe, Ltd. Die Zahlung wird im
        Checkout-Prozess unmittelbar bei Buchung fällig. Akzeptierte Zahlungsmethoden sind:
        Kreditkarte (Visa, Mastercard, American Express) sowie weitere im Checkout angezeigte
        Methoden.
      </p>
      <Callout variant="blue">
        Mit Abschluss des Abonnements erteilt der Nutzer Stripe die Erlaubnis, die anfallenden
        Beträge automatisch zum jeweiligen Verlängerungszeitpunkt (monatlich oder jährlich)
        einzuziehen. Die Stripe-eigenen{" "}
        <strong>Nutzungsbedingungen</strong> (stripe.com/de/legal) und{" "}
        <strong>Datenschutzbestimmungen</strong> gelten ergänzend für den Zahlungsvorgang.
      </Callout>
      <p style={P}>
        Die Anbieterin erhält keine vollständigen Zahlungsdaten (z. B. vollständige Kartennummer)
        des Nutzers. Diese werden ausschließlich durch Stripe verarbeitet.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        5.4 Digitale Leistung &amp; Zugang
      </p>
      <p style={P}>
        Der Zugang zur Plattform wird unmittelbar nach erfolgreicher Zahlung freigeschaltet
        (digitaler Sofortzugang). Die Leistung wird vollständig digital erbracht; ein physischer
        Versand findet nicht statt.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        5.5 Zahlungsverzug
      </p>
      <p style={P}>
        Bei Scheitern der automatischen Zahlung (z. B. abgelaufene Karte) wird der Nutzer per
        E-Mail informiert. Die Anbieterin ist berechtigt, den Zugang nach erfolgloser Mahnung
        vorübergehend zu sperren. Gespeicherte Daten des Nutzers bleiben für einen Zeitraum von
        30 Tagen erhalten, um die Reaktivierung zu ermöglichen.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 6 ── */}
      <SH par="6">Laufzeit, Verlängerung &amp; Kündigung</SH>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        6.1 Laufzeit &amp; automatische Verlängerung
      </p>
      <p style={P}>
        Das Abonnement läuft je nach gewähltem Plan für einen Monat oder ein Jahr und verlängert
        sich automatisch um den jeweils gleichen Zeitraum, sofern es nicht rechtzeitig gekündigt
        wird. Die automatische Verlängerung gilt als ausdrücklich vereinbart; der Nutzer wird durch
        entsprechende Hinweise im Checkout-Prozess darüber informiert.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        6.2 Kündigung durch den Nutzer
      </p>
      <p style={P}>
        Der Nutzer kann das Abonnement jederzeit selbständig über das Dashboard unter{" "}
        <strong style={{ color: "#fff" }}>Einstellungen → Abonnement</strong> kündigen. Die
        Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam; eine Erstattung
        anteiliger Beträge für nicht genutzte Zeiträume erfolgt nicht. Der Zugang zur Plattform
        bleibt bis zum Ablauf des bezahlten Zeitraums erhalten.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        6.3 Kündigung durch die Anbieterin
      </p>
      <p style={P}>
        Die Anbieterin ist berechtigt, das Vertragsverhältnis mit einer Frist von 30 Tagen zum
        Monatsende zu kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
        unberührt. Ein wichtiger Grund liegt insbesondere vor bei schwerem Missbrauch der Plattform,
        dauerhaftem Zahlungsverzug oder Verstößen gegen diese AGB.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        6.4 Datenlöschung nach Vertragsende
      </p>
      <p style={P}>
        Nach Vertragsende werden die Nutzerdaten und gespeicherten Scan-Ergebnisse nach einer
        Übergangsfrist von 30 Tagen endgültig gelöscht, sofern keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 7 ── */}
      <SH par="7">Widerrufsrecht</SH>
      <Callout variant="red">
        <strong>Kein Widerrufsrecht im B2B-Verhältnis:</strong> Da sich das Angebot der Anbieterin
        ausschließlich an Unternehmer im Sinne des § 14 BGB richtet, steht dem Nutzer kein
        gesetzliches Widerrufsrecht nach § 312g BGB zu. Das Fernabsatz-Widerrufsrecht gilt nur für
        Verbraucher (§ 13 BGB) und findet hier keine Anwendung.
      </Callout>
      <p style={P}>
        Die Anbieterin bietet freiwillig eine <strong style={{ color: "#fff" }}>7-tägige
        Geld-zurück-Garantie</strong> für Neukunden an, die das Abonnement erstmals abschließen.
        Anfragen dazu sind an{" "}
        <a
          href="mailto:support@website-fix.com"
          style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}
        >
          support@website-fix.com
        </a>{" "}
        zu richten und werden im Ermessen der Anbieterin bearbeitet. Ein Rechtsanspruch besteht
        hierauf nicht.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 8 ── */}
      <SH par="8">White-Label-Nutzungsrechte</SH>
      <p style={P}>
        Die Anbieterin räumt dem Nutzer das nicht-exklusive, nicht übertragbare Recht ein, die über
        die Plattform generierten Berichte (Reports) im Rahmen seiner eigenen unternehmerischen
        Tätigkeit an seine Endkunden weiterzugeben. Folgende Bedingungen gelten dabei:
      </p>
      <ul style={{ margin: "4px 0 16px", paddingLeft: 22 }}>
        <Li>
          Die Reports dürfen mit dem Logo und der Marke des Nutzers versehen (White-Label) und
          im Rahmen von Kundenpräsentationen, Angeboten oder Beratungsleistungen genutzt werden.
        </Li>
        <Li>
          Eine Weiterveräußerung der Reports als eigenständiges Produkt oder eine Nutzung als
          Grundlage für automatisierte Massen-Scans außerhalb der Plattform ist ohne ausdrückliche
          schriftliche Genehmigung der Anbieterin untersagt.
        </Li>
        <Li>
          Der Nutzer übernimmt gegenüber seinen Endkunden die volle Verantwortung für die
          Kommunikation und Interpretation der Berichtsinhalte. Er hat seine Endkunden darüber zu
          informieren, dass es sich um automatisierte Analyseergebnisse handelt (vgl. § 9).
        </Li>
        <Li>
          Eine Nutzung der Reports zur irreführenden Werbung oder in einer Weise, die den Ruf der
          Anbieterin schädigen könnte, ist untersagt.
        </Li>
      </ul>
      <Callout variant="blue">
        Alle Rechte an der Plattform, den zugrundeliegenden Algorithmen und der Software verbleiben
        ausschließlich bei der Anbieterin. Der Nutzer erwirbt durch das Abonnement ausschließlich
        ein Nutzungsrecht im beschriebenen Umfang.
      </Callout>

      <hr style={DIVIDER} />

      {/* ── § 9 ── */}
      <SH par="9">Haftungsausschluss &amp; keine Rechtsberatung</SH>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        9.1 Charakter des Dienstes
      </p>
      <Callout variant="red">
        <strong>Wichtiger Hinweis:</strong> WebsiteFix ist ein automatisiertes{" "}
        <strong>Analyse- und Diagnose-Tool</strong>. Die Ergebnisse der Scans stellen technische
        Hinweise auf mögliche Compliance-Abweichungen, Performance-Probleme oder SEO-Schwächen dar.
        Sie begründen weder eine <strong>Rechtsberatung</strong> noch eine{" "}
        <strong>rechtlich verbindliche Aussage</strong> über die tatsächliche Rechtmäßigkeit einer
        Website nach dem BFSG, der DSGVO, WCAG oder sonstigen Regelwerken.
      </Callout>
      <p style={P}>
        Die Anbieterin erbringt keine Rechtsdienstleistungen im Sinne des Rechtsdienstleistungsgesetzes
        (RDG). Die Diagnoseberichte dienen ausschließlich zur technischen Orientierung. Die
        finale Beurteilung der Rechtskonformität einer Website und die Verantwortung für die
        Umsetzung etwaiger Korrekturen liegen allein beim Nutzer und seinen Endkunden.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        9.2 Haftungsbeschränkung
      </p>
      <p style={P}>
        Die Anbieterin haftet nach den gesetzlichen Vorschriften unbegrenzt bei Vorsatz und grober
        Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der
        Gesundheit.
      </p>
      <p style={P}>
        Im Übrigen ist die Haftung der Anbieterin auf den vorhersehbaren, vertragstypischen Schaden
        begrenzt. Eine Haftung für:
      </p>
      <ul style={{ margin: "4px 0 16px", paddingLeft: 22 }}>
        <Li>
          Schäden, die daraus resultieren, dass der Nutzer oder seine Endkunden Scan-Ergebnisse
          falsch interpretiert oder ohne weitere rechtliche Prüfung umgesetzt haben
        </Li>
        <Li>
          mittelbare Schäden, entgangenen Gewinn oder Folgeschäden aus der Nutzung des Dienstes
        </Li>
        <Li>
          die Vollständigkeit oder Aktualität der Analyseergebnisse — da diese von technischen
          Standards abhängen, die sich laufend weiterentwickeln
        </Li>
        <Li>
          vorübergehende Nichtverfügbarkeit des Dienstes aufgrund von Wartung oder technischen
          Störungen (Verfügbarkeit von mind. 98 % im Jahresdurchschnitt wird angestrebt)
        </Li>
      </ul>
      <p style={P}>
        ist ausgeschlossen, soweit gesetzlich zulässig. Die Anbieterin haftet nicht für die
        Richtigkeit, Vollständigkeit oder Eignung der Analyseergebnisse für konkrete rechtliche oder
        geschäftliche Entscheidungen des Nutzers.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        9.3 Pflichten des Nutzers bei Weitergabe von Berichten
      </p>
      <p style={P}>
        Der Nutzer verpflichtet sich, Scan-Ergebnisse und Reports an seine Endkunden stets mit dem
        Hinweis zu versehen, dass es sich um automatisierte Analyseergebnisse handelt, die keine
        abschließende rechtliche Beurteilung darstellen. Er stellt die Anbieterin von sämtlichen
        Ansprüchen Dritter frei, die aus einer fehler- oder irreführenden Weitergabe der Berichte
        entstehen.
      </p>

      <hr style={DIVIDER} />

      {/* ── § 10 ── */}
      <SH par="10">Datenschutz, Gerichtsstand &amp; Schlussbestimmungen</SH>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        10.1 Datenschutz
      </p>
      <p style={P}>
        Die Verarbeitung personenbezogener Daten erfolgt gemäß der{" "}
        <a
          href="/datenschutz"
          style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}
        >
          Datenschutzerklärung
        </a>{" "}
        der Anbieterin, die Bestandteil dieser AGB ist.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.2 Änderung der AGB
      </p>
      <p style={P}>
        Die Anbieterin behält sich vor, diese AGB mit einer Ankündigungsfrist von mindestens{" "}
        <strong style={{ color: "#fff" }}>4 Wochen</strong> per E-Mail zu ändern. Widerspricht der
        Nutzer der Änderung nicht innerhalb von 4 Wochen nach Zugang der Mitteilung, gelten die
        neuen AGB als akzeptiert. Auf diese Folge wird in der Änderungsmitteilung ausdrücklich
        hingewiesen. Im Falle des Widerspruchs ist die Anbieterin berechtigt, das
        Vertragsverhältnis ordentlich zu kündigen.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.3 Anwendbares Recht
      </p>
      <p style={P}>
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.4 Gerichtsstand
      </p>
      <p style={P}>
        Für alle Streitigkeiten aus und im Zusammenhang mit diesem Vertrag ist, soweit der Nutzer
        Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
        Sondervermögen ist, der Gerichtsstand{" "}
        <strong style={{ color: "#fff" }}>Leverkusen, Deutschland</strong> vereinbart.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.5 Online-Streitbeilegung
      </p>
      <p style={P}>
        Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit (OS-Plattform):
        ec.europa.eu/consumers/odr. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle ist die Anbieterin nicht verpflichtet und nicht bereit, da
        der Dienst ausschließlich für Unternehmer angeboten wird.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.6 Salvatorische Klausel
      </p>
      <p style={P}>
        Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam oder undurchführbar
        sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle
        der unwirksamen Bestimmung tritt die gesetzliche Regelung.
      </p>

      <p style={{ ...SMALL, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "16px 0 8px" }}>
        10.7 Vollständige Vereinbarung &amp; Anbieterkennzeichnung
      </p>
      <p style={P}>
        Diese AGB, die Datenschutzerklärung sowie die im Checkout angezeigten Preisinformationen
        bilden die vollständige Vereinbarung zwischen den Parteien. Vollständige Anbieterangaben
        (Impressum) sind unter{" "}
        <a href="/impressum" style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 500 }}>
          website-fix.com/impressum
        </a>{" "}
        abrufbar.
      </p>

      {/* Footer note */}
      <div
        style={{
          marginTop: 48,
          padding: "16px 20px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7aa6ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ ...SMALL, margin: 0, color: "rgba(255,255,255,0.35)" }}>
          Diese AGB wurden zuletzt im April 2026 aktualisiert. Bei Fragen wende dich an{" "}
          <a
            href="mailto:support@website-fix.com"
            style={{ color: "#7aa6ff", textDecoration: "none" }}
          >
            support@website-fix.com
          </a>
          . Diese AGB stellen keine Rechtsberatung dar und ersetzen nicht die individuelle
          rechtliche Prüfung durch einen Rechtsanwalt.
        </p>
      </div>
    </LegalLayout>
  );
}
