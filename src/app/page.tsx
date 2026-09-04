import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "./components/BrandLogo";
import NavAuthLink from "./components/nav-auth-link";
import MobileNav from "./components/MobileNav";
import InlineScan from "./components/inline-scan";
import SiteFooter from "./components/SiteFooter";

// Blog-Teaser-Loader siehe src/lib/blog-loader.ts.
// Auf der Homepage zeigen wir den jüngsten END-USER-Post
// (alles außer Kategorie "agency").

export const metadata: Metadata = {
  title: {
    absolute:
      "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen",
  },
  description:
    "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und finde heraus, was du als Nächstes tun solltest.",
  alternates: {
    canonical: "https://website-fix.com/",
  },
  openGraph: {
    title:
      "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen",
    description:
      "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und finde heraus, was du als Nächstes tun solltest.",
    url: "https://website-fix.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen",
    description:
      "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und finde heraus, was du als Nächstes tun solltest.",
  },
};

// ─── PLANS ─────────────────────────────────────────────────────────────

// ─── PLANS ───────────────────────────────────────────────────────────────────
// Single Source für die Homepage-Pricing-Sektion. KEEP SYNCED with
// src/app/fuer-agenturen/page.tsx — beide Pages müssen Inhalt + Audience
// + Badges identisch zeigen, sonst Vertrauensbruch beim Tab-Wechsel.
//
// Stripe-Mapping: planKey → STRIPE_PRICE_<UPPERCASE>-Env-Var
// (siehe priceIdToPlan in /api/webhooks/stripe). In Vercel:
//   STRIPE_PRICE_STARTER       → "starter"
//   STRIPE_PRICE_PROFESSIONAL  → "professional"
//   STRIPE_PRICE_AGENCY        → "agency"
// Pay-per-Fix (9,90 €) läuft NICHT über die PLANS — eigener anon-checkout-
// Flow (siehe /api/guides/[id]/anon-checkout).
const PLANS = [
  {
    name: "Starter",
    planKey: "starter",
    price: "29",
    per: "/Monat",
    desc: "Für bis zu zwei Sites mit voller Deep-Diagnose",
    audienceFootnote: "Ideal für Solo-Webdesigner mit eigener Site plus einer Kundenseite. Mehr Projekte? Professional ab 89 €/Mo (10 Sites).",
    badge: null,
    accent: "#475569",
    accentBg: "#F1F5F9",
    accentBorder: "#E2E8F0",
    // KEEP SYNCED with /fuer-agenturen PLANS Starter — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "2 Projekte · 10 Deep-Scans pro Monat",                highlight: true },
      { text: "Voller Deep-Scan: SEO, Technik, Performance, BFSG",   highlight: true },
      { text: "Inkl. Read-Only Plugin (kann nichts ändern — nur diagnostizieren)",highlight: true },
      { text: "Basis-Monitoring (Uptime + Score-Trend)",             highlight: true },
      { text: "Alle Smart-Fix-Anleitungen inklusive (kein Einzelkauf)",highlight: true },
      { text: "Kein White-Label-PDF · Pro startet ab 89 €/Mo",       highlight: false, locked: true },
      { text: "Keine Team-Rollen · Pro startet ab 89 €/Mo",          highlight: false, locked: true },
      { text: "Kein Kunden-Portal · Agency ab 249 €/Mo",          highlight: false, locked: true },
    ],
    cta: "Starter wählen",
    href: "/register?plan=starter",
    recommended: false,
    enterprise: false,
    scale: false,
  },
  {
    name: "Professional",
    planKey: "professional",
    price: "89",
    per: "/Monat",
    desc: "Effizienz für Selbst-Macher & Freelancer",
    audienceFootnote: "Für Freelancer und wachsende Web-Projekte mit bis zu 10 Kunden.",
    badge: "★ Beliebtestes Paket",
    accent: "#2563EB",
    accentBg: "#EFF6FF",
    accentBorder: "#BFDBFE",
    // KEEP SYNCED with /fuer-agenturen PLANS Professional — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "10 WordPress-Projekte · unbegrenzte Scans",                   highlight: true },
      { text: "Voller Deep-Scan: SEO, Technik, Performance, BFSG",           highlight: true },
      { text: "Deep-Scan Plugin + KI-Analyse: was zuerst zu fixen ist",   highlight: true },
      { text: "Smart-Fix-Drawer mit Builder-Anleitung (Elementor / Divi)",   highlight: true },
      { text: "KI-Auto-Fix — Copy-Paste-Code direkt im Drawer",              highlight: true },
      { text: "White-Label PDF (Logo + Brand-Farbe)",                        highlight: true },
      { text: "Score-Verlauf · Site-Tracking · Daily Health-Check",          highlight: true },
      { text: "Slack- und E-Mail-Alerts bei kritischen Befunden",            highlight: true },
      { text: "Executive Summary für Endkunden-Reports",                     highlight: false },
    ],
    cta: "Professional starten",
    href: "/register?plan=professional",
    recommended: true,
    enterprise: false,
    scale: false,
  },
  {
    name: "Agency Scale",
    planKey: "agency",
    price: "249",
    per: "/Monat",
    desc: "Infrastruktur & Profit-Maximierung für Inhaber",
    audienceFootnote: "Für Agentur-Inhaber, die Wartung profitabel skalieren wollen.",
    badge: "Bester ROI",
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentBorder: "#DDD6FE",
    // KEEP SYNCED with /fuer-agenturen PLANS Agency Scale — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "Bis zu 50 Kunden · Scan-Flatrate (Anti-Abuse-Cap 500/Mo)",             highlight: true },
      { text: "White-Label Plugin (Dein Branding beim Endkunden)",                    highlight: true },
      { text: "Delegations-Hebel im Dashboard (Junior-Lohnkosten-Ersparnis)",            highlight: true },
      { text: "Embeddable Lead-Generator — Scanner mit deinem Logo auf deiner Website",  highlight: true },
      { text: "Kunden-Portal unter Ihrer Custom-Domain (Q3 — Bestandskunden behalten Preis)", highlight: true },
      { text: "Bis zu 10 Team-Sitze (Rollen-Logik Q3 — Bestandskunden behalten Preis)",  highlight: true },
      { text: "Daily Health-Check mit Slack-/E-Mail-Alarm bei Ausfall (60-Sek-Watchdog ab Q3 — Bestandskunden behalten Preis)", highlight: true },
      { text: "Workflow-API: Jira, Trello, Asana, Zapier — automatisch verbucht",        highlight: true },
      { text: "Custom-SMTP-Versand — White-Label-E-Mails unter Ihrem eigenen Absender",  highlight: true },
      { text: "Plugin-Diff-Alarme — Sofort-Warnung bei neuen Plugins auf Kunden-Sites",  highlight: true },
      { text: "DSGVO-AVV, Aktivitäts-Log + Haftungs-Dokumentation",                      highlight: true },
    ],
    cta: "Agentur-Marge jetzt skalieren →",
    href: "/register?plan=agency",
    recommended: false,
    enterprise: false,
    scale: true,
  },
];

// FAQ — End-User-Audience (schnelle Hilfe, Sicherheit, Kosten).
// Bewusst "du"-Form. Pricing-Reality klar abgebildet: 9,90 € Pay-per-Fix,
// 29 € Starter, 89 € Pro, 249 € Agency Scale. Read-Only-Plugin-Frage und
// Hoster-Kompatibilität explizit beantwortet — beide sind häufige Verkaufs-
// Blocker. Für B2B-Tiefe siehe /fuer-agenturen — eigener FAQ-Block,
// "Sie"-Form, B2B-Wording (Haftung, Kunden, Skalierung).
const FAQ = [
  {
    q: "Muss ich euch mein WordPress-Passwort geben oder etwas installieren?",
    a: "Nein. Der Scan läuft komplett von außen — du gibst nur deine URL ein, wir crawlen die Seite wie ein normaler Besucher. Kein Login, kein FTP, kein Plugin nötig. Ab dem Starter-Plan (29 €/Monat) kannst du optional unser Read-Only-Plugin installieren: Es liest WordPress-internen Status (Plugin-Versionen, Datenbank-Health, geplante Aktualisierungen), schreibt aber NIE etwas zurück. Read-Only heißt wirklich Read-Only — wir können deine Seite gar nicht verändern. Das Plugin gibt uns einfach tiefere Diagnose ohne Sicherheitsrisiko.",
  },
  {
    q: "Warum brauche ich das Plugin überhaupt? Reicht der externe Scan nicht?",
    a: "Für maximale Sicherheit und Tiefe. Ein externer Scan sieht nur, was deine Website öffentlich rausgibt — Title-Tags, Meta-Daten, sichtbare Links, Bilder. Was er NICHT sieht: PHP-Fehler im Error-Log, langsame Datenbank-Queries, Plugin-Versions-Konflikte, Cron-Jobs, die nie laufen, gehackte Theme-Dateien. Genau das liest unser Read-Only-Plugin aus — ohne Schreibzugriff, ohne dass du uns dein WP-Passwort geben musst. Das Ergebnis ist ein Diagnose-Tiefe, die kein billiger Online-Scanner liefern kann. Ab Starter-Plan inklusive.",
  },
  {
    q: "Was ist der Unterschied zwischen dem 9,90 € Einzel-Fix und einem Abo?",
    a: "Der 9,90 €-Pay-per-Fix ist eine Einmalzahlung für GENAU EINEN Schritt-für-Schritt-Guide — ideal, wenn du ein konkretes akutes Problem hast. Kein Abo, kein Konto vorab nötig. Ein Abo lohnt sich ab dem 3. Problem pro Monat (Starter rechnet sich dann), oder sofort wenn du mehrere Websites betreust (Pro/Agency Scale). Faustregel: Ein Fix → Pay-per-Fix. Regelmäßige Kontrolle oder mehrere Seiten → Starter (29 €). Vollständig delegieren mit Team und White-Label → Agency Scale (249 €).",
  },
  {
    q: "Was passiert nach dem Kauf eines 9,90 €-Guides?",
    a: "Kein Konto, kein Login, kein Dashboard. Direkt nach der Stripe-Zahlung schicken wir dir eine Bestätigungs-Mail mit zwei Dingen: (1) dem kompletten Guide als PDF-Anhang — dauerhaft in deinem Postfach nutzbar, auch in Jahren noch — und (2) einem persönlichen Online-Link mit Code-Copy-Buttons (bei den drei Premium-Guides zusätzlich mit hoster-spezifischen Klick-Pfaden für Strato, IONOS, All-Inkl, Hostinger und Hetzner), der vier Wochen aktiv ist. Brauchst du dauerhaften Online-Zugriff plus alle 7 Guides? Dann lohnt sich Professional für 89 €/Mo. Details siehe AGB §5.6. Bei Fragen: support@website-fix.com.",
  },
  {
    q: "Was kostet WebsiteFix in der Übersicht?",
    a: "Drei Abo-Stufen plus eine Notfall-Option: Pay-per-Fix für 9,90 € einmalig (Einzel-Guide ohne Abo). Starter für 29 €/Monat (2 Projekte, 10 Deep-Scans/Monat, voller SEO-/Technik-/BFSG-Check, alle Smart-Fix-Guides inklusive, Read-Only-Plugin). Professional für 89 €/Monat (10 Projekte, unbegrenzte Scans, KI-Auto-Fix, White-Label-PDF). Agency Scale für 249 €/Monat (50 Kunden, Scan-Flatrate, Kunden-Portal unter Custom-Domain ab Q3, Team-Rollen, Daily Health-Check inkl. 60-Sek-Watchdog ab Q3). Alle Abos monatlich kündbar.",
  },
  {
    q: "Funktioniert WebsiteFix mit meinem Hoster?",
    a: "Ja, mit jedem Hoster, dessen Seite öffentlich erreichbar ist. Unsere drei Premium-Guides (Hosting-Speed, Google-Sichtbarkeit, WP-Critical-Error) liefern hoster-spezifische Klick-Pfade für die deutschen Top-Hoster: Strato, IONOS / 1&1, All-Inkl, Hostinger und Hetzner — exakte Backend-Pfade (.htaccess-Editor, PHP-Versions-Wechsel, SSL-Toggle etc.). Die übrigen Guides arbeiten mit der generischen WordPress-Anleitung, die mit jedem Hoster funktioniert. Bei Spezial-Hostern (Cloudways, Kinsta, WP Engine) greift ebenfalls die Standard-Anleitung — wir ergänzen die Hoster-Spezial-Pfade laufend.",
  },
  {
    q: "Was genau prüft der Deep-Scan?",
    a: "Der Scanner crawlt alle öffentlich erreichbaren Unterseiten deiner WordPress-Website und prüft jede einzeln auf: fehlende Alt-Texte, Meta-Daten, kaputte Links (404), HTTPS-Status, Ladezeit und Formular-Zugänglichkeit. Alle Ergebnisse erscheinen auf einer interaktiven Site-Map mit konkreten Fix-Anleitungen.",
  },
  {
    q: "Was ist der Smart-Fix Drawer und wie hilft er mir?",
    a: "Der Smart-Fix Drawer öffnet sich per Klick auf einen gefundenen Fehler. Er zeigt dir eine Schritt-für-Schritt-Anleitung, die exakt erklärt, wo du in Gutenberg, Elementor oder Divi klicken musst, um das Problem zu beheben — kein Entwickler-Wissen nötig. In der Regel dauert ein Fix weniger als 5 Minuten.",
  },
  {
    q: "Was unterscheidet WebsiteFix von kostenlosen Scannern?",
    a: "WebsiteFix ist kein oberflächlicher Scanner, sondern eine KI-gestützte Workflow-Lösung für Agenturen und Profis. Während kostenlose Tools nur die Startseite prüfen und rohe Fehlerlisten ausgeben, crawlt WebsiteFix alle Unterseiten, erstellt eine interaktive Site-Map und liefert für jeden Befund eine konkrete, page-builder-spezifische Fix-Anleitung — direkt umsetzbar, kein Entwickler-Wissen nötig.",
  },
  {
    q: "Wie sicher sind meine Daten?",
    a: "Hosting in Frankfurt, EU-only Datenfluss, TLS-verschlüsselt. Wir speichern deine Scan-Ergebnisse, aber keine Login-Daten oder sensiblen Inhalte deiner Seite — der Scan läuft vollständig von außen wie ein normaler Besucher. Selbst das optionale Read-Only-Plugin hat keinen Schreibzugriff auf deine Datenbank oder Dateien. DSGVO-AVV bekommst du im Account-Bereich.",
  },
  {
    q: "Kann ich WebsiteFix für Kunden-Websites nutzen (Agenturen)?",
    a: "Absolut. Im Agency-Scale-Plan (249 €/Monat) verwaltest du bis zu 50 Kunden, nutzt Full White-Label mit eigenem Branding. Im Q3 kommt dazu das Kunden-Portal unter deiner Custom-Domain — Bestandskunden behalten ihren Preis. Bereits inklusive: Embeddable Lead-Generator — ein Scanner mit deinem Logo zum Einbauen auf deiner Marketing-Site, der eingehende Leads direkt in dein Dashboard schiebt. Mehr Details auf der Agentur-Seite.",
  },
];

export default function Page() {
  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div className="hide-sm" style={{ display: "flex", gap: 24 }}>
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Für Agenturen</Link>
              <Link href="/blog" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Blog</Link>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <NavAuthLink />
              <Link href="/login" className="hide-sm" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Anmelden
              </Link>
              {/* Burger-Menü — nur auf Mobile sichtbar */}
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      <main>

        {/* HERO V2 */}
        <section className="wf-hero" style={{ paddingTop: 64, paddingBottom: 72 }}>
          <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              margin: "0 0 18px",
              fontSize: 12,
              fontWeight: 650,
              color: "var(--wf-text-muted)",
              letterSpacing: "0.04em",
            }}>
              WebsiteFix · WordPress-Diagnose
            </p>

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 760,
              lineHeight: 1.04,
              margin: "0 auto 20px",
              letterSpacing: "-0.045em",
              maxWidth: 860,
              textWrap: "balance",
            }}>
              Finde heraus, was mit deiner Website nicht stimmt.
            </h1>

            <p style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "var(--wf-text-secondary)",
              lineHeight: 1.65,
              maxWidth: 700,
              margin: "0 auto 34px",
              fontWeight: 400,
              textWrap: "balance",
            }}>
              WebsiteFix erkennt technische WordPress-Probleme, grenzt mögliche Ursachen ein
              und zeigt dir, was du als Nächstes tun solltest.
            </p>

            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <InlineScan />
            </div>

            <p style={{
              margin: "18px auto 0",
              fontSize: 12.5,
              color: "var(--wf-text-muted)",
              lineHeight: 1.5,
            }}>
              Von einer Entwicklerin entwickelt · Plugin auf WordPress.org verfügbar
            </p>
          </div>

         {/* PRODUCT PROOF — echte WebsiteFix-Diagnose */}
<div
  className="mkt-grid"
  style={{
    maxWidth: 920,
    margin: "54px auto 0",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(250px, 0.75fr)",
    gap: 14,
    alignItems: "stretch",
  }}
>
  {/* Hauptdiagnose */}
  <div
    style={{
      background: "var(--wf-surface)",
      border: "1px solid var(--wf-border)",
      borderRadius: "var(--wf-radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--wf-shadow-sm)",
      textAlign: "left",
    }}
  >
    {/* Window header */}
    <div
      style={{
        minHeight: 48,
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        borderBottom: "1px solid var(--wf-border-soft)",
        background: "var(--wf-surface-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--wf-danger)",
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontSize: 12,
            color: "var(--wf-text-secondary)",
            fontWeight: 650,
          }}
        >
          WebsiteFix Diagnose
        </span>
      </div>

      <span
        style={{
          fontSize: 11,
          color: "var(--wf-text-muted)",
          fontFamily: "var(--font-family-mono, monospace)",
        }}
      >
        beispiel.de
      </span>
    </div>

    <div style={{ padding: "24px 24px 22px" }}>
      {/* Severity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 13,
        }}
      >
        <span
          style={{
            padding: "5px 8px",
            borderRadius: 6,
            background: "rgba(239, 68, 68, 0.10)",
            border: "1px solid rgba(239, 68, 68, 0.18)",
            color: "#fca5a5",
            fontSize: 10.5,
            fontWeight: 750,
            letterSpacing: "0.08em",
          }}
        >
          KRITISCH
        </span>

        <span
          style={{
            padding: "5px 8px",
            borderRadius: 6,
            background: "var(--wf-surface-subtle)",
            border: "1px solid var(--wf-border-soft)",
            color: "var(--wf-text-muted)",
            fontSize: 10.5,
            fontWeight: 650,
          }}
        >
          WordPress
        </span>

        <span
          style={{
            padding: "5px 8px",
            borderRadius: 6,
            background: "var(--wf-surface-subtle)",
            border: "1px solid var(--wf-border-soft)",
            color: "var(--wf-text-muted)",
            fontSize: 10.5,
            fontWeight: 650,
          }}
        >
          HTTP 500
        </span>
      </div>

      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(23px, 3vw, 31px)",
          lineHeight: 1.18,
          fontWeight: 740,
          letterSpacing: "-0.03em",
        }}
      >
        Kritischer WordPress-Fehler erkannt
      </h2>

      <p
        style={{
          margin: "0 0 24px",
          color: "var(--wf-text-secondary)",
          fontSize: 13.5,
          lineHeight: 1.65,
          maxWidth: 610,
        }}
      >
        Die Website antwortet mit einem Serverfehler. WordPress ist weiterhin
        erkennbar, die eigentliche Seite kann aber nicht ausgeliefert werden.
      </p>

      {/* Evidence */}
      <div
        style={{
          borderTop: "1px solid var(--wf-border-soft)",
          borderBottom: "1px solid var(--wf-border-soft)",
          padding: "5px 0",
        }}
      >
        {[
          {
            label: "HTTP-Status",
            value: "500 Internal Server Error",
            status: "Fehler",
            statusColor: "var(--wf-danger)",
          },
          {
            label: "CMS",
            value: "WordPress erkannt",
            status: "Bestätigt",
            statusColor: "var(--wf-success)",
          },
          {
            label: "Frontend",
            value: "Seite nicht erreichbar",
            status: "Gestört",
            statusColor: "var(--wf-danger)",
          },
        ].map((row, index) => (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0, 1fr) auto",
              gap: 14,
              alignItems: "center",
              minHeight: 42,
              borderTop:
                index === 0 ? "none" : "1px solid var(--wf-border-soft)",
              fontSize: 12.5,
            }}
            className="wf-proof-row-v2"
          >
            <span style={{ color: "var(--wf-text-muted)" }}>
              {row.label}
            </span>

            <span
              style={{
                color: "var(--wf-text)",
                fontFamily:
                  row.label === "HTTP-Status"
                    ? "var(--font-family-mono, monospace)"
                    : undefined,
              }}
            >
              {row.value}
            </span>

            <span
              style={{
                color: row.statusColor,
                fontSize: 11,
                fontWeight: 650,
                whiteSpace: "nowrap",
              }}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      {/* Ursache */}
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "36px minmax(0, 1fr)",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--wf-surface-subtle)",
            border: "1px solid var(--wf-border)",
            fontFamily: "var(--font-family-mono, monospace)",
            color: "var(--wf-text-muted)",
            fontSize: 11,
          }}
        >
          01
        </div>

        <div>
          <p
            style={{
              margin: "0 0 5px",
              fontSize: 12,
              color: "var(--wf-text-muted)",
              fontWeight: 650,
            }}
          >
            Wahrscheinliche Ursache
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--wf-text)",
            }}
          >
            Ein interner PHP-, Plugin- oder Theme-Fehler ist wahrscheinlich.
            Von außen lässt sich die genaue PHP-Ursache noch nicht sicher
            bestimmen.
          </p>
        </div>
      </div>

      {/* Nächster Schritt */}
      <div
        style={{
          marginTop: 18,
          padding: "15px 16px",
          borderRadius: "var(--wf-radius-md)",
          border: "1px solid var(--wf-border)",
          background: "var(--wf-surface-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--wf-text-muted)",
              marginBottom: 4,
              fontWeight: 650,
            }}
          >
            Empfohlener nächster Schritt
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--wf-text)",
              fontWeight: 620,
            }}
          >
            WordPress-Tiefendiagnose starten
          </div>
        </div>

        <Link
          href="/scan?problem=wordpress-critical-error"
          style={{
            minHeight: 40,
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--wf-radius-md)",
            background: "var(--wf-primary)",
            border: "1px solid var(--wf-primary)",
            color: "#fff",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: 680,
            whiteSpace: "nowrap",
          }}
        >
          Diagnose vertiefen →
        </Link>
      </div>
    </div>
  </div>

  {/* Seitenleiste */}
  <div
    style={{
      background: "var(--wf-surface)",
      border: "1px solid var(--wf-border)",
      borderRadius: "var(--wf-radius-lg)",
      padding: "20px",
      textAlign: "left",
      boxShadow: "var(--wf-shadow-sm)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <p
      style={{
        margin: "0 0 5px",
        fontSize: 12,
        color: "var(--wf-text)",
        fontWeight: 680,
      }}
    >
      Weitere Befunde
    </p>

    <p
      style={{
        margin: "0 0 18px",
        fontSize: 11.5,
        lineHeight: 1.5,
        color: "var(--wf-text-muted)",
      }}
    >
      WebsiteFix priorisiert zusätzliche technische Auffälligkeiten nach
      Relevanz.
    </p>

    {[
      {
        value: "3",
        label: "kaputte interne Links",
        meta: "sollten korrigiert werden",
        tone: "var(--wf-danger)",
      },
      {
        value: "4,8 s",
        label: "Largest Contentful Paint",
        meta: "Startseite ist langsam",
        tone: "var(--wf-warning)",
      },
      {
        value: "8",
        label: "Seiten mit noindex",
        meta: "nicht in Google indexierbar",
        tone: "var(--wf-warning)",
      },
    ].map((item, index) => (
      <div
        key={item.label}
        style={{
          padding: "16px 0",
          borderTop:
            index === 0
              ? "1px solid var(--wf-border-soft)"
              : "1px solid var(--wf-border-soft)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 7,
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 22,
              lineHeight: 1,
              fontWeight: 740,
              color: item.tone,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.025em",
            }}
          >
            {item.value}
          </span>
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: "var(--wf-text)",
            lineHeight: 1.45,
            fontWeight: 620,
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 11.5,
            color: "var(--wf-text-muted)",
            lineHeight: 1.45,
          }}
        >
          {item.meta}
        </div>
      </div>
    ))}

    <div
      style={{
        marginTop: "auto",
        paddingTop: 17,
        borderTop: "1px solid var(--wf-border-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11.5,
          color: "var(--wf-text-muted)",
          lineHeight: 1.5,
        }}
      >
        <span
          style={{
            color: "var(--wf-success)",
            fontWeight: 800,
          }}
        >
          ✓
        </span>
        Ergebnisse nach Schweregrad priorisiert
      </div>
    </div>
  </div>
</div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid var(--wf-border-soft)" }} />

        {/* V2 — HÄUFIGE PROBLEME */}
        <section style={{ maxWidth: 920, margin: "0 auto", padding: "82px 24px 76px" }}>
          <div style={{ maxWidth: 620, marginBottom: 34 }}>
            <p style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 650,
              color: "var(--wf-text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Häufige Probleme
            </p>
            <h2 style={{
              margin: "0 0 12px",
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              fontWeight: 740,
            }}>
              Starte bei dem Problem, das du gerade siehst.
            </h2>
            <p style={{ margin: 0, color: "var(--wf-text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
              WebsiteFix ordnet den Check dem konkreten Symptom zu, statt dir nur eine lange Fehlerliste zu zeigen.
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--wf-border)" }}>
            {[
              {
                num: "01",
                title: "Kritischer WordPress-Fehler",
                desc: "Website ist nicht erreichbar, zeigt HTTP 500 oder die WordPress-Meldung zu einem kritischen Fehler.",
                href: "/scan?problem=wordpress-critical-error",
                cta: "Fehler untersuchen",
              },
              {
                num: "02",
                title: "Google findet meine Website nicht",
                desc: "Indexierbarkeit, noindex, robots.txt, Sitemap und weitere öffentlich erkennbare Signale prüfen.",
                href: "/scan?problem=visibility",
                cta: "Sichtbarkeit prüfen",
              },
              {
                num: "03",
                title: "Website lädt zu langsam",
                desc: "Antwortzeit und technische Performance-Signale prüfen und die größten Auffälligkeiten priorisieren.",
                href: "/scan?problem=speed",
                cta: "Performance prüfen",
              },
            ].map((problem) => (
              <Link
                key={problem.num}
                href={problem.href}
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px minmax(0, 1fr) auto",
                  gap: 18,
                  alignItems: "center",
                  padding: "24px 4px",
                  borderBottom: "1px solid var(--wf-border)",
                  textDecoration: "none",
                  color: "inherit",
                }}
                className="wf-problem-row-v2"
              >
                <span style={{
                  fontSize: 12,
                  color: "var(--wf-text-muted)",
                  fontFamily: "var(--font-family-mono, monospace)",
                }}>
                  {problem.num}
                </span>
                <span>
                  <span style={{
                    display: "block",
                    fontSize: 18,
                    fontWeight: 680,
                    letterSpacing: "-0.015em",
                    marginBottom: 5,
                  }}>
                    {problem.title}
                  </span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--wf-text-secondary)", lineHeight: 1.55 }}>
                    {problem.desc}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: "var(--wf-text-secondary)", whiteSpace: "nowrap" }}>
                  {problem.cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* V2 — HYBRID DIAGNOSIS */}
        <section style={{ borderTop: "1px solid var(--wf-border-soft)", borderBottom: "1px solid var(--wf-border-soft)" }}>
          <div style={{ maxWidth: 920, margin: "0 auto", padding: "82px 24px" }}>
            <div style={{ maxWidth: 680, marginBottom: 38 }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 650,
                color: "var(--wf-text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                Zwei Diagnose-Ebenen
              </p>
              <h2 style={{
                margin: "0 0 14px",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                fontWeight: 740,
              }}>
                Von außen prüfen. In WordPress tiefer diagnostizieren.
              </h2>
              <p style={{ margin: 0, color: "var(--wf-text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
                Der Website-Check arbeitet ohne Zugangsdaten. Wenn die Ursache intern liegt, ergänzt das Read-only-Plugin die Diagnose um WordPress-Daten, die ein externer Crawler nicht sehen kann.
              </p>
            </div>

            <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                {
                  kicker: "Ohne Installation",
                  title: "Website Check",
                  desc: "Für alles, was öffentlich messbar oder sichtbar ist.",
                  items: ["Erreichbarkeit & HTTP-Status", "Links & Weiterleitungen", "Indexierungs-Signale", "Performance-Auffälligkeiten", "öffentliche WordPress-Signale"],
                },
                {
                  kicker: "Read-only Plugin",
                  title: "WordPress Deep Diagnosis",
                  desc: "Für interne Ursachen, die von außen verborgen bleiben.",
                  items: ["PHP- und WordPress-Fehlerdaten", "Plugin- & Theme-Kontext", "Cron- und Systemzustand", "Datenbank-Health", "interne Konfigurationshinweise"],
                },
              ].map((mode) => (
                <div key={mode.title} style={{
                  padding: "26px",
                  background: "var(--wf-surface)",
                  border: "1px solid var(--wf-border)",
                  borderRadius: "var(--wf-radius-lg)",
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--wf-text-muted)", fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {mode.kicker}
                  </p>
                  <h3 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.025em" }}>
                    {mode.title}
                  </h3>
                  <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--wf-text-secondary)", lineHeight: 1.6 }}>
                    {mode.desc}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {mode.items.map((item) => (
                      <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--wf-text-secondary)", lineHeight: 1.5 }}>
                        <span style={{ color: "var(--wf-success)", marginTop: 1 }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16,
              padding: "14px 16px",
              border: "1px solid var(--wf-border)",
              borderRadius: "var(--wf-radius-md)",
              color: "var(--wf-text-secondary)",
              fontSize: 13,
              lineHeight: 1.55,
            }}>
              <strong style={{ color: "var(--wf-text)", fontWeight: 650 }}>Wichtig:</strong>{" "}
              Das Plugin ist Read-only. Es liefert Diagnoseinformationen, verändert aber nicht automatisch deine Website.
            </div>
          </div>
        </section>

        {/* V2 — HOW IT WORKS */}
        <section style={{ maxWidth: 920, margin: "0 auto", padding: "82px 24px 88px" }}>
          <div style={{ maxWidth: 640, marginBottom: 38 }}>
            <p style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 650,
              color: "var(--wf-text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              So funktioniert WebsiteFix
            </p>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              fontWeight: 740,
            }}>
              Prüfen. Verstehen. Beheben und verifizieren.
            </h2>
          </div>

          <div style={{ borderTop: "1px solid var(--wf-border)" }}>
            {[
              { num: "01", title: "Prüfen", desc: "URL eingeben. WebsiteFix erfasst Seitenstruktur, technische Antworten und relevante Signale." },
              { num: "02", title: "Verstehen", desc: "Befunde werden nach Schweregrad und möglicher Ursache geordnet — statt als unpriorisierte Checkliste." },
              { num: "03", title: "Beheben & verifizieren", desc: "Führe die passende Lösung durch und prüfe anschließend erneut, ob das Problem tatsächlich behoben ist." },
            ].map((step) => (
              <div key={step.num} style={{
                display: "grid",
                gridTemplateColumns: "70px 190px minmax(0, 1fr)",
                gap: 20,
                padding: "24px 0",
                borderBottom: "1px solid var(--wf-border)",
                alignItems: "start",
              }} className="wf-step-row-v2">
                <span style={{ fontFamily: "var(--font-family-mono, monospace)", fontSize: 12, color: "var(--wf-text-muted)", paddingTop: 3 }}>
                  {step.num}
                </span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 680, letterSpacing: "-0.015em" }}>{step.title}</h3>
                <p style={{ margin: 0, color: "var(--wf-text-secondary)", fontSize: 13.5, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ──────────────────────────────────────────────────────────────
            WEBSITEFIX V2 — LOWER HOMEPAGE
            Weniger Marketing-Flächen, mehr Produktklarheit.
        ────────────────────────────────────────────────────────────── */}

        {/* TECHNICAL TRUST */}
        <section style={{ maxWidth: 980, margin: "0 auto", padding: "88px 24px 72px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, .95fr)",
            gap: 56,
            alignItems: "start",
          }} className="wf-trust-grid-v2">
            <div>
              <p style={{
                margin: "0 0 12px", fontSize: 11, fontWeight: 700,
                color: "var(--wf-text-muted)", textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}>
                Technisch nachvollziehbar
              </p>
              <h2 style={{
                margin: "0 0 16px",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                fontWeight: 740,
              }}>
                Diagnose statt Blackbox.
              </h2>
              <p style={{
                margin: 0, maxWidth: 570, fontSize: 15,
                lineHeight: 1.75, color: "var(--wf-text-secondary)",
              }}>
                WebsiteFix trennt messbare Befunde von Erklärungen. Der externe Check
                arbeitet mit öffentlich sichtbaren Signalen. Für interne WordPress-Ursachen
                ergänzt das Read-only-Plugin technische Diagnosedaten — ohne deine Website
                automatisch zu verändern.
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--wf-border)" }}>
              {[
                ["01", "Messbare Befunde", "HTTP-Status, Links, Indexierungs- und Performance-Signale."],
                ["02", "WordPress-Kontext", "PHP-, Plugin-, Theme-, Cron- und Systemhinweise über das Read-only-Plugin."],
                ["03", "Konkrete nächste Schritte", "Nicht nur Fehler anzeigen, sondern priorisieren, erklären und anschließend erneut prüfen."],
              ].map(([num, title, desc]) => (
                <div key={num} style={{
                  display: "grid", gridTemplateColumns: "38px minmax(0,1fr)", gap: 12,
                  padding: "18px 0", borderBottom: "1px solid var(--wf-border)",
                }}>
                  <span style={{
                    fontFamily: "var(--font-family-mono, monospace)",
                    color: "var(--wf-text-muted)", fontSize: 11, paddingTop: 2,
                  }}>{num}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 680, marginBottom: 5 }}>{title}</div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--wf-text-secondary)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--wf-border-soft)" }} />

        {/* PRICING V2 */}
        <section id="pricing" style={{ maxWidth: 980, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ maxWidth: 650, marginBottom: 42 }}>
            <p style={{
              margin: "0 0 12px", fontSize: 11, fontWeight: 700,
              color: "var(--wf-text-muted)", textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}>
              Preise
            </p>
            <h2 style={{
              margin: "0 0 14px",
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              fontWeight: 740,
            }}>
              Bezahle für das, was du wirklich brauchst.
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--wf-text-secondary)" }}>
              Ein akutes Problem kannst du einmalig lösen. Für laufende Diagnose und mehrere Websites gibt es monatliche Pläne.
            </p>
          </div>

          <div className="wf-pricing-grid-v2" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            borderTop: "1px solid var(--wf-border)",
            borderBottom: "1px solid var(--wf-border)",
          }}>
            {[
              {
                eyebrow: "Ein Problem",
                name: "Pay-per-Fix",
                price: "9,90 €",
                period: "einmalig",
                desc: "Für ein konkretes akutes Problem ohne Abo.",
                features: ["Ein Smart-Fix-Guide", "Kein Konto vorab", "Kein Abo"],
                href: "/scan",
                cta: "Problem prüfen",
                primary: false,
              },
              {
                eyebrow: "Eigene Website",
                name: "Starter",
                price: "29 €",
                period: "/ Monat",
                desc: "Für bis zu zwei WordPress-Websites mit laufender Diagnose.",
                features: ["2 Projekte", "10 Diagnosen pro Monat", "Read-only-Plugin inklusive", "Monitoring + Smart Fix"],
                href: "/register?plan=starter",
                cta: "Starter wählen",
                primary: true,
              },
              {
                eyebrow: "Freelancer & kleine Agenturen",
                name: "Professional",
                price: "89 €",
                period: "/ Monat",
                desc: "Für mehrere Kunden-Websites und wiederkehrende Workflows.",
                features: ["10 Projekte", "Unbegrenzte Scans", "White-Label-Reports", "Alerts & Team-Workflows"],
                href: "/register?plan=professional",
                cta: "Professional wählen",
                primary: false,
              },
            ].map((plan, index) => (
              <article key={plan.name} style={{
                padding: "30px 26px 28px",
                borderLeft: index === 0 ? "none" : "1px solid var(--wf-border)",
                background: plan.primary ? "var(--wf-surface)" : "transparent",
                display: "flex", flexDirection: "column", minHeight: 430,
              }} className="wf-price-card-v2">
                <div style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: plan.primary ? "var(--wf-brand)" : "var(--wf-text-muted)",
                  marginBottom: 12,
                }}>
                  {plan.eyebrow}
                </div>
                <h3 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {plan.name}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: 32, fontWeight: 760, letterSpacing: "-0.04em" }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: "var(--wf-text-muted)" }}>{plan.period}</span>
                </div>
                <p style={{ margin: "0 0 24px", fontSize: 13.5, lineHeight: 1.65, color: "var(--wf-text-secondary)" }}>
                  {plan.desc}
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map(feature => (
                    <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, lineHeight: 1.5, color: "var(--wf-text-secondary)" }}>
                      <span aria-hidden="true" style={{ color: "var(--wf-success)", fontWeight: 800 }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} style={{
                  marginTop: "auto",
                  minHeight: 44,
                  padding: "0 16px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "var(--wf-radius-md)",
                  background: plan.primary ? "var(--wf-primary)" : "transparent",
                  border: plan.primary ? "1px solid var(--wf-primary)" : "1px solid var(--wf-border-strong)",
                  color: plan.primary ? "#fff" : "var(--wf-text)",
                  textDecoration: "none", fontSize: 13, fontWeight: 680,
                }}>
                  {plan.cta} →
                </Link>
              </article>
            ))}
          </div>

          <div style={{
            marginTop: 20,
            color: "var(--wf-text-muted)",
            fontSize: 12.5,
          }}>
            <span>Monatlich kündbar · Read-only Plugin · kein WordPress-Passwort erforderlich</span>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--wf-border-soft)" }} />

        {/* TRUST V2 */}
        <section style={{ maxWidth: 980, margin: "0 auto", padding: "72px 24px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)",
            gap: 56, alignItems: "start",
          }} className="wf-trust-grid-v2">
            <div>
              <p style={{
                margin: "0 0 10px", fontSize: 11, fontWeight: 700,
                color: "var(--wf-text-muted)", textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}>
                Vertrauen
              </p>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 3.5vw, 34px)", letterSpacing: "-0.03em", fontWeight: 730 }}>
                Gebaut mit klaren Grenzen.
              </h2>
              <p style={{ margin: 0, color: "var(--wf-text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                WebsiteFix soll dir zeigen, was messbar ist, was nur wahrscheinlich ist und wann für eine genaue Diagnose interne WordPress-Daten nötig sind.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 1, background: "var(--wf-border)" }} className="wf-trust-points-v2">
              {[
                ["Entwicklerin", "Persönlich entwickelt statt anonymer Blackbox."],
                ["WordPress.org", "Plugin über das offizielle WordPress-Verzeichnis verfügbar."],
                ["Read-only", "Diagnosedaten lesen; das Plugin benötigt keinen Schreibzugriff."],
                ["EU-Hosting", "Produkt- und Scan-Infrastruktur mit EU-Fokus."],
              ].map(([title, desc]) => (
                <div key={title} style={{ background: "var(--wf-bg)", padding: "18px 20px" }}>
                  <div style={{ fontSize: 13, fontWeight: 680, marginBottom: 5 }}>{title}</div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--wf-text-muted)", lineHeight: 1.55 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--wf-border-soft)" }} />

        {/* FAQ V2 — bewusst nur kaufentscheidende Fragen */}
        <section id="faq" style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{
            margin: "0 0 10px", fontSize: 11, fontWeight: 700,
            color: "var(--wf-text-muted)", textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}>
            FAQ
          </p>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 730, letterSpacing: "-0.03em" }}>
            Was du vor dem Start wissen solltest.
          </h2>
          <p style={{ margin: "0 0 34px", fontSize: 14.5, color: "var(--wf-text-secondary)", lineHeight: 1.65 }}>
            Die wichtigsten Fragen zu Scan, Plugin, Preisen und Datenschutz.
          </p>

          <div style={{ borderTop: "1px solid var(--wf-border)", borderBottom: "1px solid var(--wf-border)" }}>
            {FAQ.slice(0, 6).map((item) => (
              <details key={item.q} style={{ borderBottom: "1px solid var(--wf-border-soft)" }}>
                <summary style={{
                  cursor: "pointer",
                  listStyle: "none",
                  padding: "22px 0",
                  fontSize: 14,
                  fontWeight: 680,
                  color: "var(--wf-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                }}>
                  <span>{item.q}</span>
                  <span aria-hidden="true" style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    border: "1px solid var(--wf-border)",
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--wf-text-muted)",
                    fontSize: 18,
                    fontWeight: 400,
                    lineHeight: 1,
                  }}>+</span>
                </summary>
                <div style={{
                  padding: "0 46px 22px 0",
                  color: "var(--wf-text-secondary)",
                  fontSize: 13.5,
                  lineHeight: 1.75,
                }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA V2 */}
        <section style={{ maxWidth: 980, margin: "0 auto", padding: "16px 24px 88px" }}>
          <div style={{
            padding: "38px 0",
            borderTop: "1px solid var(--wf-border)",
            borderBottom: "1px solid var(--wf-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 28, flexWrap: "wrap",
          }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 720, letterSpacing: "-0.03em" }}>
                Was stimmt mit deiner Website nicht?
              </h2>
              <p style={{ margin: 0, color: "var(--wf-text-secondary)", fontSize: 13.5 }}>
                Starte mit dem kostenlosen Website-Check. Kein Login erforderlich.
              </p>
            </div>
            <Link href="/scan" style={{
              minHeight: 46, padding: "0 20px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--wf-radius-md)",
              background: "var(--wf-primary)", color: "#fff",
              fontSize: 13.5, fontWeight: 680, textDecoration: "none",
            }}>
              Website prüfen →
            </Link>
          </div>
        </section>


      </main>

      {/* FOOTER */}
      <SiteFooter />
    </>
  );
}
