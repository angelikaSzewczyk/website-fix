import Link from "next/link";
import type { Metadata } from "next";
import { getLatestEndUserPost, categoryTheme } from "@/lib/blog-loader";
import FaqAccordion from "./components/faq-accordion";
import BrandLogo from "./components/BrandLogo";
import NavAuthLink from "./components/nav-auth-link";
import MobileNav from "./components/MobileNav";
import InlineScan from "./components/inline-scan";
import SiteFooter from "./components/SiteFooter";
import MaintenanceBanner from "./components/MaintenanceBanner";
import { JiraIcon, AsanaIcon, TrelloIcon, SlackIcon } from "./components/BrandIcons";
import PluginInfobox from "./components/PluginInfobox";

// Blog-Teaser-Loader siehe src/lib/blog-loader.ts.
// Auf der Homepage zeigen wir den jüngsten END-USER-Post (alles außer
// Kategorie "agency") — der Endkunde soll Lösungen für seine Website sehen,
// nicht Skalierungs-Tipps für Agenturen.

export const metadata: Metadata = {
  title: { absolute: "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen" },
  description: "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und fixe technische Probleme sofort.",
  alternates: { canonical: "https://website-fix.com/" },
  openGraph: {
    title:       "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen",
    description: "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und fixe technische Probleme sofort.",
    url:         "https://website-fix.com/",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "WebsiteFix – WordPress kritische Fehler beheben & Google Sichtbarkeit prüfen",
    description: "Deine Website wird bei Google nicht gefunden oder zeigt einen kritischen Fehler? Starte den kostenlosen Scan und fixe technische Probleme sofort.",
  },
};

const STEPS = [
  {
    num: "01",
    label: "Schritt 01",
    title: "URL eingeben — Scan startet",
    desc: "Trage deine URL ein. Unsere Engine crawlt alle Unterseiten automatisch und erstellt eine interaktive Map deiner Website — SEO, Technik und Zugänglichkeit auf einen Blick.",
    color: "#7aa6ff",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    pills: ["Kein Login nötig", "Multi-Page-Scan", "Live-Analyse"],
  },
  {
    num: "02",
    label: "Schritt 02",
    title: "Interaktive Map — Fehler sehen",
    desc: "Alle gefundenen Probleme erscheinen auf einer interaktiven Site-Map. Per Klick öffnet sich der Smart-Fix Drawer mit einer Schritt-für-Schritt-Anleitung für dein Page-Builder-System.",
    color: "#8df3d3",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
        <line x1="16" y1="8" x2="2" y2="22"/>
        <line x1="17.5" y1="15" x2="9" y2="15"/>
      </svg>
    ),
    pills: ["Interaktive Site-Map", "Smart-Fix Drawer", "Fehler priorisiert"],
  },
  {
    num: "03",
    label: "Schritt 03",
    title: "Fehler beheben — Score steigt",
    desc: "Folge den Anleitungen für Gutenberg, Elementor oder Divi — kein Entwickler-Wissen nötig. Hake erledigte Punkte ab und beobachte, wie dein Website-Score und dein Google-Ranking steigen.",
    color: "#c084fc",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <polyline points="10 17 8 17 6 19"/>
        <polyline points="14 17 16 17 18 19"/>
      </svg>
    ),
    pills: ["Gutenberg · Elementor · Divi", "Score-Tracking", "24/7 Monitoring"],
  },
];

const BENEFITS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    iconBg: "rgba(37,99,235,0.1)",
    iconBorder: "rgba(37,99,235,0.25)",
    iconColor: "#7aa6ff",
    label: "WordPress-Fokus",
    title: "Spezialisiert auf WordPress-Exzellenz",
    desc: "Wir scannen nicht alles – wir scannen WordPress tiefer als jeder andere. SEO, Technik, Plugins und Barrierefreiheit in einem Durchlauf.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    iconBg: "rgba(141,243,211,0.08)",
    iconBorder: "rgba(141,243,211,0.2)",
    iconColor: "#8df3d3",
    label: "Automatisierung",
    title: "Monitoring ohne Aufwand",
    desc: "Einmal einrichten, nie wieder manuell prüfen. Die Engine arbeitet 24/7 im Hintergrund und alarmiert dich sofort, wenn neue Fehler auftauchen.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    iconBg: "rgba(234,179,8,0.08)",
    iconBorder: "rgba(234,179,8,0.22)",
    iconColor: "#EAB308",
    label: "Sichtbarkeit",
    title: "Google-Rankings verbessern",
    desc: "Jeder behobene Fehler ist ein Signal an Google. Fehlende Alt-Texte, kaputte Links und Ladezeit-Probleme kosten dich Plätze in den Suchergebnissen — website-fix zeigt dir genau, wo.",
  },
];

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
    desc: "Für kleine Portfolios bis 3 Projekte",
    audienceFootnote: "Ideal für Selbstständige mit eigener Website + 1–2 Kundenprojekten.",
    badge: null,
    accent: "#475569",
    accentBg: "#F1F5F9",
    accentBorder: "#E2E8F0",
    // KEEP SYNCED with /fuer-agenturen PLANS Starter — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "Bis zu 3 Projekte · wöchentlicher Deep-Scan",         highlight: true },
      { text: "🔒 Inkl. Deep-Scan Plugin (Read-Only)",               highlight: true },
      { text: "Basis-Monitoring (Uptime + Score-Trend)",             highlight: true },
      { text: "Smart-Fix-Guides — 5 inklusive, weitere 9,90 €",      highlight: true },
      { text: "SEO-, Technik- & Sicherheits-Check",                  highlight: false },
      { text: "Kein White-Label",                                    highlight: false, locked: true },
      { text: "Keine Team-Rollen",                                   highlight: false, locked: true },
      { text: "Kein Mandanten-Portal",                               highlight: false, locked: true },
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
    audienceFootnote: "Für Freelancer und wachsende Web-Projekte mit bis zu 10 Mandanten.",
    badge: "★ Beliebtestes Paket",
    accent: "#2563EB",
    accentBg: "#EFF6FF",
    accentBorder: "#BFDBFE",
    // KEEP SYNCED with /fuer-agenturen PLANS Professional — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "10 WordPress-Projekte · unbegrenzte Scans",                   highlight: true },
      { text: "🔒 Deep-Scan Plugin · KI-Analyse aller Befunde",              highlight: true },
      { text: "Smart-Fix-Drawer mit Builder-Anleitung (Elementor / Divi)",   highlight: true },
      { text: "KI-Auto-Fix — Copy-Paste-Code direkt im Drawer",              highlight: true },
      { text: "White-Label PDF (Logo + Brand-Farbe)",                        highlight: true },
      { text: "Score-Verlauf · Client-Tracking · 24/7-Monitoring",           highlight: true },
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
    badge: "💎 Bester ROI",
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentBorder: "#DDD6FE",
    // KEEP SYNCED with /fuer-agenturen PLANS Agency Scale — wortgleich, gleiche Reihenfolge.
    features: [
      { text: "Bis zu 50 Mandanten · unbegrenzte Scans",                                 highlight: true },
      { text: "🔒 White-Label Plugin (Dein Branding beim Endkunden)",                    highlight: true },
      { text: "Delegations-Hebel im Dashboard (Junior-Lohnkosten-Ersparnis)",            highlight: true },
      { text: "Mandanten-Portal unter Ihrer eigenen Subdomain",                          highlight: true },
      { text: "Team-Rollen: Admin, Editor (Junior), Viewer — granular",                  highlight: true },
      { text: "60-Sekunden-Watchdog mit Slack-/E-Mail-Alarm bei Ausfall",                highlight: true },
      { text: "Workflow-API: Jira, Trello, Asana, Zapier — automatisch verbucht",        highlight: true },
      { text: "DSGVO-AVV, Audit-Log + Haftungs-Dokumentation",                           highlight: true },
      { text: "Priority-Onboarding: 60-Min-Setup-Call mit Account-Manager",              highlight: false },
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
// "Sie"-Form, B2B-Wording (Haftung, Mandanten, Skalierung).
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
    a: "Direkt nach Stripe-Zahlung wirst du auf eine Bestätigungsseite weitergeleitet. Wir legen automatisch ein kostenloses Konto mit deiner E-Mail an (kein Passwort vorab erforderlich) und schicken dir einen Link, mit dem du das Passwort setzt und sofort auf deinen Guide zugreifst. Du hast lebenslangen Zugriff — der Guide bleibt in deinem Account, auch wenn du nie ein Abo abschließt. Bei Fragen: support@website-fix.com.",
  },
  {
    q: "Was kostet WebsiteFix in der Übersicht?",
    a: "Drei Abo-Stufen plus eine Notfall-Option: Pay-per-Fix für 9,90 € einmalig (Einzel-Guide ohne Abo). Starter für 29 €/Monat (bis zu 3 Projekte, wöchentlicher Deep-Scan, 5 Guides inklusive, Read-Only-Plugin). Professional für 89 €/Monat (10 Projekte, unbegrenzte Scans, KI-Auto-Fix, White-Label-PDF). Agency Scale für 249 €/Monat (bis zu 50 Mandanten, Mandanten-Portal unter eigener Subdomain, Team-Rollen, 60-Sekunden-Watchdog). Alle Abos monatlich kündbar.",
  },
  {
    q: "Funktioniert WebsiteFix mit meinem Hoster?",
    a: "Ja, mit jedem Hoster, dessen Seite öffentlich erreichbar ist. Für die deutschen Top-Hoster haben wir hoster-spezifische Optimierungs-Anleitungen: Strato, IONOS / 1&1, All-Inkl, Hostinger, Hetzner. Das heißt: wenn du einen Fix-Guide kaufst, bekommst du nicht nur die generische WordPress-Anleitung, sondern zusätzlich die exakten Klick-Pfade für DEIN Hoster-Backend (.htaccess-Editor, PHP-Versions-Wechsel, SSL-Toggle etc.). Bei Spezial-Hostern (Cloudways, Kinsta, WP Engine) funktioniert die Standard-Anleitung — wir ergänzen die Hoster-Spezial-Pfade laufend.",
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
    a: "Absolut. Im Agency-Scale-Plan (249 €/Monat) verwaltest du bis zu 50 Mandanten, nutzt Full White-Label mit eigenem Branding und Mandanten-Portal unter deiner Subdomain. Mehr Details findest du auf der eigenen Agentur-Seite.",
  },
];

export default function Page() {
  // Dynamischer Blog-Teaser — jüngster Post EXKLUSIVE Kategorie "agency".
  // End-User-Audience: Notfall, Sichtbarkeit, Speed, Compliance — keine
  // Agentur-Skalierungs-Themen (die landen auf /fuer-agenturen).
  // Server-side beim Build evaluiert, kein Client-Roundtrip.
  const latestPost = getLatestEndUserPost();

  return (
    <>
      {/* Soft-Launch-Hinweis bis Stripe-Live + Resend-Verify komplett sind */}
      <MaintenanceBanner />

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

        {/* HERO */}
        <section className="wf-hero">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(122,166,255,0.25)",
            background: "rgba(122,166,255,0.06)",
            fontSize: 12, color: "#7aa6ff", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7aa6ff", boxShadow: "0 0 6px #7aa6ff" }} />
            WordPress · Deep Scan · Smart-Fix Drawer
          </div>

          <h1 style={{ fontSize: "clamp(28px, 4.5vw, 58px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Website-Fehler &amp; WordPress Probleme sofort beheben.
          </h1>

          <p style={{ fontSize: "clamp(16px, 2.1vw, 19px)", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, maxWidth: 720, margin: "0 auto 16px", fontWeight: 600 }}>
            Wird deine Seite bei Google nicht gefunden? Wir zeigen dir warum — in 60 Sekunden.
          </p>

          <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 36px", fontWeight: 400 }}>
            Der Deep-Scanner findet kritische WordPress-Fehler, Indexierungs-Probleme und Hosting-Bremsen — und liefert dir die passende Schritt-für-Schritt-Anleitung.
          </p>

          {/* URL Input */}
          <div style={{ maxWidth: 580, margin: "0 auto 10px" }}>
            <InlineScan />
          </div>

          {/* Social-Proof: aus den 1.561 monatlichen GSC-Impressionen
              destilliert. Suchende sollen sofort sehen, dass die Engine
              regelmäßig genutzt wird — Autorität ohne anonyme Zahlen. */}
          <p style={{
            margin: "0 auto 32px", fontSize: 12.5, color: "rgba(255,255,255,0.55)",
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 999,
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.18)",
            fontWeight: 600, letterSpacing: "0.01em",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22d3ee", boxShadow: "0 0 8px #22d3ee",
            }} />
            Schon über 1.500 Website-Checks diesen Monat durchgeführt
          </p>

          {/* ── FEATURE CARDS ── */}
          <div className="wf-feature-grid">

            {/* Card 1 — SEO & Sichtbarkeit */}
            <div className="wf-feature-card wf-feature-card--legal">
              <div className="wf-feature-card__icon" style={{
                background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.22)",
                filter: "drop-shadow(0 0 6px rgba(234,179,8,0.3))",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="wf-feature-card__body">
                <div className="wf-feature-card__label">SEO &amp; Ranking</div>
                <div className="wf-feature-card__title">SEO &amp; Sichtbarkeit</div>
                <p className="wf-feature-card__text">Alt-Texte, Meta-Daten, Duplicate Content — alles, was Google sieht (oder eben nicht). Jede fehlende Angabe kostet dich Ranking-Punkte.</p>
              </div>
            </div>

            {/* Card 2 — Technik & UX */}
            <div className="wf-feature-card wf-feature-card--speed">
              <div className="wf-feature-card__icon" style={{
                background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
                filter: "drop-shadow(0 0 6px rgba(59,130,246,0.3))",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div className="wf-feature-card__body">
                <div className="wf-feature-card__label">Technik &amp; UX</div>
                <div className="wf-feature-card__title">Technik &amp; UX</div>
                <p className="wf-feature-card__text">404-Fehler, kaputte Links, HTTPS-Probleme — technische Mängel, die Besucher verlieren und Google-Rankings senken.</p>
              </div>
            </div>

            {/* Card 3 — Standards & Recht */}
            <div className="wf-feature-card wf-feature-card--security">
              <div className="wf-feature-card__icon" style={{
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)",
                filter: "drop-shadow(0 0 6px rgba(34,197,94,0.35))",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div className="wf-feature-card__body">
                <div className="wf-feature-card__label">Standards</div>
                <div className="wf-feature-card__title">Standards &amp; Recht</div>
                <p className="wf-feature-card__text">Barrierefreiheit (BFSG/WCAG), fehlende Formular-Labels, Zugänglichkeit — eine der drei Säulen einer gesunden WordPress-Website.</p>
              </div>
            </div>

          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ── DREI-SÄULEN-PANIK-LÖSUNG ── (05.05.2026)
            Direkt unter Hero — ohne Divider — damit die Top-3 GSC-Queries
            (warum findet google meine homepage nicht / wordpress kritischer
            fehler / mein webhosting ist langsam) sofort als matchende
            Antworten sichtbar sind. Layout-Styles in globals.css unter
            .wf-seo-anchors / .wf-seo-grid. */}
        <section id="seo-anchors" className="wf-seo-anchors">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Sofort-Hilfe statt Warteschleife
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Welches Problem hast du gerade?
            </h2>
            <p style={{ fontSize: "clamp(14px, 1.6vw, 16px)", color: "rgba(255,255,255,0.55)", maxWidth: 620, margin: "0 auto", lineHeight: 1.65 }}>
              Drei der häufigsten Notfall-Situationen — ein Klick und der Scanner liefert dir die passende Schritt-für-Schritt-Anleitung.
            </p>
          </div>

          <div className="wf-seo-grid">
            {/* Card 1 — WordPress Kritischer Fehler */}
            <article style={{
              padding: "28px 26px", borderRadius: 16,
              background: "linear-gradient(180deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))",
              border: "1px solid rgba(251,191,36,0.30)",
              display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 4px 24px rgba(251,191,36,0.05)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 8, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", alignSelf: "flex-start" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.08em", textTransform: "uppercase" }}>WordPress · Notfall</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                WordPress Kritischer Fehler?
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                Weiße Seite oder Fehlermeldung? Unser Guide führt dich Schritt für Schritt aus dem Blackout.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                <li>· Recovery-Mail + Debug-Modus aktivieren</li>
                <li>· Plugin-Konflikte per FTP isolieren</li>
                <li>· PHP-Update auf 8.2 + Theme-Reset</li>
              </ul>
              <Link
                href="/scan?problem=health"
                style={{
                  marginTop: "auto", padding: "12px 18px", borderRadius: 10,
                  background: "rgba(251,191,36,0.20)", border: "1px solid rgba(251,191,36,0.50)",
                  color: "#fbbf24", fontWeight: 800, fontSize: 13.5, textAlign: "center", textDecoration: "none",
                }}
              >
                Jetzt Fehler scannen →
              </Link>
            </article>

            {/* Card 2 — Google Sichtbarkeit */}
            <article style={{
              padding: "28px 26px", borderRadius: 16,
              background: "linear-gradient(180deg, rgba(122,166,255,0.08), rgba(122,166,255,0.02))",
              border: "1px solid rgba(122,166,255,0.30)",
              display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 4px 24px rgba(122,166,255,0.05)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 8, background: "rgba(122,166,255,0.15)", border: "1px solid rgba(122,166,255,0.35)", alignSelf: "flex-start" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7aa6ff" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#7aa6ff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Google · Sichtbarkeit</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                Google Sichtbarkeit
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                Deine Homepage wird nicht angezeigt? Wir checken Indexierung, Robots.txt und Sitemaps.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                <li>· Indexierungs-Status pro Seite</li>
                <li>· Robots.txt + Sitemap.xml-Validierung</li>
                <li>· noindex-Tags und leere Titles aufdecken</li>
              </ul>
              <Link
                href="/scan?problem=visibility"
                style={{
                  marginTop: "auto", padding: "12px 18px", borderRadius: 10,
                  background: "rgba(122,166,255,0.20)", border: "1px solid rgba(122,166,255,0.50)",
                  color: "#7aa6ff", fontWeight: 800, fontSize: 13.5, textAlign: "center", textDecoration: "none",
                }}
              >
                Sichtbarkeit prüfen →
              </Link>
            </article>

            {/* Card 3 — Speed & Ladezeit */}
            <article style={{
              padding: "28px 26px", borderRadius: 16,
              background: "linear-gradient(180deg, rgba(34,211,238,0.08), rgba(34,211,238,0.02))",
              border: "1px solid rgba(34,211,238,0.30)",
              display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 4px 24px rgba(34,211,238,0.05)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 8, background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)", alignSelf: "flex-start" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#22d3ee", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hosting · Ladezeit</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                Speed &amp; Ladezeit
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                Langsame Website verliert Kunden. Hol dir die technische Analyse für High-Speed Hosting.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                <li>· Server-Antwortzeit messen + bewerten</li>
                <li>· PHP-Version + GZIP/Brotli prüfen</li>
                <li>· Strato / IONOS / All-Inkl-spezifische Fixes</li>
              </ul>
              <Link
                href="/scan?problem=speed"
                style={{
                  marginTop: "auto", padding: "12px 18px", borderRadius: 10,
                  background: "rgba(34,211,238,0.20)", border: "1px solid rgba(34,211,238,0.50)",
                  color: "#22d3ee", fontWeight: 800, fontSize: 13.5, textAlign: "center", textDecoration: "none",
                }}
              >
                Ladezeit messen →
              </Link>
            </article>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* 3 STEPS */}
        <section className="wf-steps-section" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.65)", textTransform: "uppercase", letterSpacing: "0.14em", textAlign: "center" }}>
            So funktioniert es
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 56px", letterSpacing: "-0.02em", textAlign: "center" }}>
            In drei Schritten zur technisch perfekten Website.
          </h2>

          <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{
                padding: "28px 28px 24px",
                border: `1px solid ${step.color}20`,
                borderRadius: 14,
                background: `${step.color}06`,
                display: "flex", flexDirection: "column", gap: 0,
                position: "relative", overflow: "hidden",
              }}>
                {/* Background number watermark */}
                <div style={{
                  position: "absolute", right: 20, top: 16,
                  fontSize: 64, fontWeight: 900, color: `${step.color}04`,
                  lineHeight: 1, userSelect: "none", pointerEvents: "none",
                  letterSpacing: "-0.04em",
                }}>
                  {step.num}
                </div>

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `${step.color}15`, border: `1px solid ${step.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: step.color, marginBottom: 18, flexShrink: 0,
                }}>
                  {step.icon}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: step.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  {step.title}
                </div>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, flexGrow: 1 }}>
                  {step.desc}
                </p>

                {/* Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {step.pills.map(pill => (
                    <span key={pill} style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 16,
                      background: `${step.color}10`, border: `1px solid ${step.color}25`,
                      color: step.color, fontWeight: 500,
                    }}>
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AGENTUR-VORTEILE ── */}
        <section className="wf-benefits-section">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.65)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Warum WebsiteFix?
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.025em", color: "#fff" }}>
                Spezialisiert auf WordPress — von SEO bis Barrierefreiheit.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.75 }}>
                Kein generischer Scanner. Kein Oberflächencheck. Tiefer Einblick in jede Unterseite — mit konkreten Fix-Anleitungen für dein System.
              </p>
            </div>

            <div className="wf-benefits-grid">
              {BENEFITS.map(b => (
                <div key={b.label} className="wf-benefit-card">
                  <div style={{
                    width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                    background: b.iconBg, border: `1px solid ${b.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: b.iconColor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      {b.label}
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                      {b.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTEGRATIONS ── */}
        <section className="wf-integration-section">
          <style>{`
            @keyframes wf-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
            @keyframes wf-flow {
              0%   { stroke-dashoffset: 24; opacity: 0.3; }
              50%  { opacity: 1; }
              100% { stroke-dashoffset: 0;  opacity: 0.3; }
            }
            .wf-flow-line { stroke-dasharray: 6 6; animation: wf-flow 2.2s linear infinite; }
            .wf-flow-line-2 { animation-delay: 0.55s; }
            .wf-flow-line-3 { animation-delay: 1.1s; }
            .wf-flow-line-4 { animation-delay: 1.65s; }
          `}</style>

          <div className="wf-integration-layout">

            {/* ── Visual column (top on mobile, right on desktop) ── */}
            <div className="wf-integration-visual">
              {/* Hub diagram */}
              <div style={{
                background: "rgba(8,10,20,0.7)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "28px 20px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
              }}>
                {/* Central node */}
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 20px rgba(37,99,235,0.25)",
                  zIndex: 1,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>

                {/* Animated connection lines SVG */}
                <svg width="200" height="44" viewBox="0 0 200 44" fill="none" style={{ overflow: "visible", margin: "-2px 0" }}>
                  <line x1="100" y1="0" x2="22"  y2="44" stroke="#7aa6ff" strokeWidth="1" className="wf-flow-line"/>
                  <line x1="100" y1="0" x2="68"  y2="44" stroke="#7aa6ff" strokeWidth="1" className="wf-flow-line wf-flow-line-2"/>
                  <line x1="100" y1="0" x2="132" y2="44" stroke="#7aa6ff" strokeWidth="1" className="wf-flow-line wf-flow-line-3"/>
                  <line x1="100" y1="0" x2="178" y2="44" stroke="#7aa6ff" strokeWidth="1" className="wf-flow-line wf-flow-line-4"/>
                </svg>

                {/* Tool logos */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  {/* Brand-SVGs aus shared components/BrandIcons — KEEP SYNCED
                      mit /fuer-agenturen Workflow-Integration-Sektion. */}
                  {[
                    { name: "Slack",  Icon: SlackIcon },
                    { name: "Jira",   Icon: JiraIcon },
                    { name: "Trello", Icon: TrelloIcon },
                    { name: "Asana",  Icon: AsanaIcon },
                  ].map(({ name, Icon }) => (
                    <div key={name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Icon size={28} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{name}</span>
                    </div>
                  ))}
                </div>

                {/* Flow status */}
                <div style={{
                  marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 999,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0, animation: "wf-pulse 2s ease-in-out infinite" }} />
                  Scan → Ticket erstellt → Team benachrichtigt
                </div>
              </div>
            </div>

            {/* ── Text column ── */}
            <div className="wf-integration-text">
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.65)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Schnittstellen
              </p>
              <h2 style={{ margin: "0 0 16px", fontSize: "clamp(22px, 2.8vw, 34px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Gefundene Fehler landen direkt in deinem Workflow.
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>
                website-fix arbeitet nicht isoliert. Jedes gefundene Problem wird automatisch als Ticket in Jira, Trello oder Asana erstellt — oder als Slack-Alert direkt ans Team gepusht. Kein manuelles Copy-Paste, kein Übersehen.
              </p>
              <ul className="wf-integration-bullets">
                {[
                  "Scan-Ergebnis → Jira-Ticket in Sekunden",
                  "Automatisierter Check auf SEO- & Qualitäts-Standards",
                  "Slack-Alert sobald ein kritischer Fehler auftaucht",
                ].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* ── RUNDUM-SCHUTZ ── */}
        <section className="wf-advantage-section">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.65)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Das Herzstück
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.025em", color: "#fff" }}>
                Drei Stufen. Ein Ziel: Maximale Sichtbarkeit.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.75 }}>
                Von der ersten Analyse bis zur vollautomatischen Agentur-Pipeline — jede Stufe baut auf der nächsten auf.
              </p>
            </div>

            <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                /* ── Säule 1: Sofort-Analyse (Starter) ── */
                {
                  planLabel: "Starter",
                  planColor: "#60a5fa",
                  planBg:   "rgba(96,165,250,0.12)",
                  planBorder:"rgba(96,165,250,0.28)",
                  cardBorder:"rgba(96,165,250,0.18)",
                  cardGlow:  "rgba(96,165,250,0.06)",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {/* Lightning bolt */}
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                  title: "Sofort-Analyse",
                  desc: "In &lt; 60 Sek. zum vollständigen Ranking-Report. Identifiziere alle Wachstums-Bremsen deiner Website — ohne Installation, ohne Entwickler.",
                  bullets: [
                    "< 60 Sek. · bis zu 25 Unterseiten",
                    "Interaktive Site-Map nach Schweregrad",
                    "SEO, Technik & BFSG auf einen Blick",
                  ],
                },
                /* ── Säule 2: KI-Smart-Fix (Professional) ── */
                {
                  planLabel: "Professional",
                  planColor: "#FBBF24",
                  planBg:   "rgba(251,191,36,0.12)",
                  planBorder:"rgba(251,191,36,0.28)",
                  cardBorder:"rgba(251,191,36,0.18)",
                  cardGlow:  "rgba(251,191,36,0.06)",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {/* Wand / sparkle */}
                      <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
                      <path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/>
                      <path d="M17.8 6.2 19 5"/><path d="M3 21l9-9"/>
                      <path d="M12.2 6.2 11 5"/>
                    </svg>
                  ),
                  title: "KI-Smart-Fix",
                  desc: "KI-gestützte Schritt-für-Schritt-Guides — priorisiert nach SEO-Impact. Copy-paste-fertiger Code direkt für Gutenberg, Elementor oder Divi.",
                  bullets: [
                    "Fix-Guide für dein Page-Builder-System",
                    "KI-Auto-Fix: fertiger Code, kein Entwickler",
                    "Priorisierung nach Google-Impact",
                  ],
                },
                /* ── Säule 3: API-Automatisierung (Agency) ── */
                {
                  planLabel: "Agency",
                  planColor: "#a78bfa",
                  planBg:   "rgba(167,139,250,0.12)",
                  planBorder:"rgba(167,139,250,0.28)",
                  cardBorder:"rgba(167,139,250,0.18)",
                  cardGlow:  "rgba(167,139,250,0.06)",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {/* Cloud + down-arrow */}
                      <polyline points="8 17 12 21 16 17"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                    </svg>
                  ),
                  title: "API-Automatisierung",
                  desc: "Exklusives WP-Plugin für Agenturen. Fixes per Klick direkt aus dem Dashboard auf alle Kunden-Seiten übertragen — ohne manuelles Copy-Paste.",
                  bullets: [
                    "WP-Plugin: verbinde unbegrenzte Sites",
                    "KI-Mass-Fixer: Befehl an alle Sites",
                    "White-Label Reports für Endkunden",
                  ],
                },
              ].map(f => (
                <div key={f.title} style={{
                  background: "rgba(8,10,20,0.75)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: `1px solid ${f.cardBorder}`,
                  borderRadius: 20,
                  padding: "0 0 28px",
                  boxShadow: `0 2px 32px ${f.cardGlow}, 0 2px 20px rgba(0,0,0,0.3)`,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}>
                  {/* Plan stripe */}
                  <div style={{
                    padding: "8px 26px",
                    background: f.planBg,
                    borderBottom: `1px solid ${f.planBorder}`,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: f.planColor, boxShadow: `0 0 6px ${f.planColor}`, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: f.planColor }}>
                      {f.planLabel}
                    </span>
                  </div>

                  <div style={{ padding: "24px 26px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Icon + title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                        background: f.planBg, border: `1px solid ${f.planBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        filter: `drop-shadow(0 0 10px ${f.planColor}55)`,
                      }}>
                        {f.icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                        {f.title}
                      </h3>
                    </div>

                    <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, flex: 1 }}
                      dangerouslySetInnerHTML={{ __html: f.desc }} />

                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                      {f.bullets.map(b => (
                        <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.planColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* PRICING */}
        <section id="pricing" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
                Starte mit einem Einzel-Fix oder wähle eine Flatrate für dauerhafte Sicherheit.
              </p>
            </div>

            {/* ─── PAY-PER-FIX HIGHLIGHT-BANNER ──────────────────────────────
                Vorgelagertes Notfall-Angebot: 9,90 €, kein Abo, anonymer
                Checkout. Dient als Cashflow-Mitnahme für User mit akutem
                Einzelproblem — stört den Abo-Vergleich darunter nicht. */}
            <div style={{
              maxWidth: 920, margin: "0 auto 36px",
              padding: "20px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(245,158,11,0.05))",
              border: "1px solid rgba(251,191,36,0.32)",
              boxShadow: "0 0 36px rgba(251,191,36,0.08)",
              display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "rgba(251,191,36,0.16)",
                border: "1px solid rgba(251,191,36,0.40)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#FBBF24", letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 999 }}>
                    ⚡ Notfall · ohne Abo
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                    Pay-per-Fix · 9,90 € einmalig
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                  Konkretes Problem auf deiner Seite? Hol dir den passenden Fix-Guide einmalig — anonymer Checkout, kein Konto vorab nötig, lebenslanger Zugriff nach Zahlung.
                </p>
              </div>
              <Link href="/scan" style={{
                flexShrink: 0,
                padding: "12px 24px", borderRadius: 10,
                background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
                color: "#1a1300", fontSize: 14, fontWeight: 800,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(251,191,36,0.40)",
              }}>
                Jetzt fixen →
              </Link>
            </div>

            <p style={{ margin: "0 auto 18px", maxWidth: 720, textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Ein Abo lohnt sich ab dem <strong style={{ color: "rgba(255,255,255,0.65)" }}>3. Problem pro Monat</strong> (Starter), oder sofort, wenn mehrere Seiten betreut werden.
            </p>

            <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, alignItems: "stretch" }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: plan.recommended
                    ? `2px solid #2563EB`
                    : ("scale" in plan && plan.scale)
                      ? `2px solid #7C3AED`
                      : `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: plan.recommended
                    ? "0 8px 40px rgba(37,99,235,0.2)"
                    : ("scale" in plan && plan.scale)
                      ? "0 8px 40px rgba(124,58,237,0.2)"
                      : "0 2px 20px rgba(0,0,0,0.3)",
                  position: "relative",
                }}>

                  {/* Top stripe — Badge aus plan.badge.
                      Starter hat kein Badge → neutrale Spacer-Stripe für
                      einheitliche Card-Höhe (kein Layout-Shift). */}
                  {(() => {
                    const isBlue   = plan.recommended;
                    const isPurple = "scale" in plan && plan.scale;
                    const bg = isBlue
                      ? "linear-gradient(90deg,#1d4ed8,#2563EB)"
                      : isPurple
                        ? "linear-gradient(90deg,#6d28d9,#7C3AED)"
                        : "rgba(255,255,255,0.03)";
                    const textColor = (isBlue || isPurple) ? "#fff" : "rgba(255,255,255,0.30)";
                    const label = plan.badge ?? "Basis-Schutz";
                    return (
                      <div style={{
                        padding: "9px 24px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: bg,
                        borderBottom: (isBlue || isPurple)
                          ? "none"
                          : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isBlue
                          ? "inset 0 -1px 0 rgba(255,255,255,0.1)"
                          : isPurple
                            ? "inset 0 -1px 0 rgba(255,255,255,0.08)"
                            : "none",
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: textColor }}>
                          {label}
                        </span>
                      </div>
                    );
                  })()}

                  <div style={{ padding: "28px 28px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Plan name + desc */}
                    <div style={{ marginBottom: 20, minHeight: 128 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: plan.recommended ? "#7aa6ff" : plan.enterprise ? "rgba(255,255,255,0.5)" : plan.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {plan.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        {plan.enterprise ? (
                          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>Auf Anfrage</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{plan.price}€</span>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{plan.per}</span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{plan.desc}</p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

                    {/* Feature list — locked: true rendert "✕" in grau (Upsell-
                        Delta-Hinweis, z.B. "Kein White-Label" in Starter-Card) */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => {
                        const locked = "locked" in f && f.locked;
                        return (
                          <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                              background: locked
                                ? "rgba(255,255,255,0.04)"
                                : f.highlight
                                  ? (plan.recommended ? "#2563EB" : ("scale" in plan && plan.scale) ? "#7C3AED" : plan.enterprise ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.12)")
                                  : "rgba(255,255,255,0.07)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {locked ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6"  y1="6" x2="18" y2="18"/>
                                </svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <span style={{
                              fontSize: 13,
                              fontWeight: locked ? 400 : f.highlight ? 600 : 400,
                              color: locked
                                ? "rgba(255,255,255,0.30)"
                                : f.highlight ? "#fff" : "rgba(255,255,255,0.4)",
                            }}>
                              {f.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Audience-Footnote — "Für wen ist das?"-Hinweis */}
                    {plan.audienceFootnote && (
                      <div style={{
                        padding: "10px 12px", marginBottom: 16, borderRadius: 8,
                        background: "rgba(0,0,0,0.25)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        fontSize: 11.5, color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.55, fontStyle: "italic",
                      }}>
                        {plan.audienceFootnote}
                      </div>
                    )}

                    {/* CTA button */}
                    <div style={{ paddingBottom: 28 }}>
                      <Link href={plan.href} style={{
                        display: "block", textAlign: "center",
                        padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        textDecoration: "none",
                        background: plan.recommended
                          ? "#2563EB"
                          : ("scale" in plan && plan.scale)
                            ? "#7C3AED"
                            : plan.enterprise
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(255,255,255,0.06)",
                        color: (plan.recommended || ("scale" in plan && plan.scale)) ? "#ffffff" : "rgba(255,255,255,0.7)",
                        border: (plan.recommended || ("scale" in plan && plan.scale)) ? "none" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: plan.recommended
                          ? "0 4px 14px rgba(37,99,235,0.35)"
                          : ("scale" in plan && plan.scale)
                            ? "0 4px 14px rgba(124,58,237,0.35)"
                            : "none",
                        transition: "opacity 0.15s",
                      }}>
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
              {["Sichere Zahlung", "Jederzeit kündbar", "DSGVO-konform", "Daten in Deutschland"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Soft-Launch (06.05.2026): Komplette Testimonials-Sektion + Agency-
            Trust-Strip entfernt — alle Namen, Quotes und Agentur-Bezeichnungen
            waren Platzhalter (Michael R., Julia S., Dr. Thomas W., Pixelwerk
            etc.). Im B2B-Kontext ist Fake-Social-Proof aktiver Trust-Killer.
            Sobald echte Pilot-Kunden-Zitate + freigegebene Logos vorliegen:
            hier wieder einsetzen, jeder Quote mit URL/Branche, Logos als
            <img> nicht als Text. AgencyStats-Komponente (oben im Hero) bleibt
            als quantifizierte Trust-Quelle bis dahin. */}

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Read-Only-Plugin Verkaufsblock — Kern-Differenzierung gegenüber
            billigen Online-Scannern. KEEP SYNCED mit /fuer-agenturen. */}
        <PluginInfobox />

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* FAQ ACCORDION */}
        <section id="faq" style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em" }}>
            Häufige Fragen
          </h2>
          <p style={{ margin: "0 0 40px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Alles, was Sie vor dem Start wissen wollen.
          </p>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            overflow: "hidden",
            padding: "0 28px",
          }}>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* BLOG TEASER */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Experten-Logbuch</p>
              <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                WordPress-Wissen: Das Experten-Logbuch
              </h2>
            </div>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Alle Artikel →
            </Link>
          </div>

          {/* Dynamischer Teaser: jüngster der PFLICHT_SLUGS. Fallback auf
              den BFSG-Klassiker, wenn aus irgendeinem Grund keine Pflicht-
              Datei lesbar ist (defensive). */}
          {(() => {
            const teaser = latestPost ?? {
              slug:        "bfsg-2025-agenturen",
              title:       "Das BFSG 2025 – Warum WordPress-Agenturen jetzt handeln müssen",
              description: "Wie Agenturen das Thema Barrierefreiheit als Qualitätsmerkmal positionieren und damit höhere Wartungspauschalen rechtfertigen.",
              category:    "agency",
              date:        "2025-05-12",
            };
            const theme = categoryTheme(teaser.category);
            const dateLabel = (() => {
              try {
                return new Date(teaser.date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
              } catch {
                return teaser.date;
              }
            })();
            return (
              <Link href={`/blog/${teaser.slug}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  padding: "28px 32px",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 14,
                  background: theme.bg.replace("0.12", "0.04"),
                  display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }} className="wf-blog-card">
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                        background: theme.bg, color: theme.color,
                        border: `1px solid ${theme.border}`, letterSpacing: "0.05em",
                      }}>
                        {theme.label}
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>{dateLabel}</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                      {teaser.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>
                      {teaser.description}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, color: theme.color, fontWeight: 600, whiteSpace: "nowrap", alignSelf: "center" }}>
                    Jetzt lesen →
                  </span>
                </div>
              </Link>
            );
          })()}
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* CTA BANNER */}
        <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
          <div className="wf-cta-box" style={{
            padding: "clamp(40px, 6vw, 72px) clamp(28px, 5vw, 64px)",
            borderRadius: 20,
            background: "linear-gradient(135deg, #0d1520 0%, #0b0c10 50%, #0a0f1a 100%)",
            border: "1px solid rgba(0,123,255,0.2)",
            boxShadow: "0 0 80px rgba(0,123,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32,
            position: "relative", overflow: "hidden",
          }}>
            {/* Background glow */}
            <div style={{
              position: "absolute", top: "-50%", left: "-10%",
              width: "50%", height: "200%",
              background: "radial-gradient(ellipse, rgba(0,123,255,0.10) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div className="wf-cta-text" style={{ position: "relative" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Analysiere deine Website-Exzellenz jetzt.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                Ergebnis in unter 60 Sekunden — ohne Installation, ohne Login.<br className="hide-sm" />
                Sieh sofort, welche Optimierungen deiner Website im Weg stehen.
              </p>
            </div>
            <div className="wf-cta-actions" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", position: "relative" }}>
              <Link href="/scan?problem=visibility" style={{
                padding: "15px 36px", borderRadius: 11, fontWeight: 800, fontSize: 16,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 32px rgba(0,123,255,0.55), 0 0 60px rgba(0,123,255,0.20)",
                letterSpacing: "-0.01em",
              }}>
                Ranking-Check starten →
              </Link>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", paddingLeft: 4 }}>
                Ergebnis in unter 60 Sekunden. Einmal-Fix ab 9,90 € oder Sorglos-Flatrate.
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <SiteFooter />
    </>
  );
}
