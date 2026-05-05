import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, BellDot, ShieldAlert, Globe, ShieldCheck, Zap, Server, Palette, Headphones, Magnet, Crown, ArrowRight, Check } from "lucide-react";
import FaqAccordion from "../components/faq-accordion";
import RoiCalculator from "../components/roi-calculator";
import CheckoutButton from "../components/checkout-button";
import AutoCheckout from "../components/auto-checkout";
import BrandLogo from "../components/BrandLogo";
import MobileNav from "../components/MobileNav";
import AgencyStats from "../components/agency-stats";
import SiteFooter from "../components/SiteFooter";

const LayersIcon = Layers;
const BellAlertIcon = BellDot;
const ShieldAlertIcon = ShieldAlert;

export const metadata: Metadata = {
  title:       { absolute: "Für Agenturen | Mehr Marge mit automatisierter WordPress-Wartung" },
  description: "Skalieren Sie Ihre Agentur mit website-fix. Smart-Fix Drawer, Lead-Magnet Widget, White-Label Reports und Workflow-Automatisierung für Web-Agenturen.",
  alternates:  { canonical: "https://website-fix.com/fuer-agenturen" },
  openGraph: {
    title:       "Für Agenturen | Mehr Marge mit automatisierter WordPress-Wartung",
    description: "Skalieren Sie Ihre Agentur mit website-fix. Smart-Fix Drawer, Lead-Magnet Widget, White-Label Reports und Workflow-Automatisierung für Web-Agenturen.",
    url:         "https://website-fix.com/fuer-agenturen",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Für Agenturen | Mehr Marge mit automatisierter WordPress-Wartung",
    description: "Skalieren Sie Ihre Agentur mit website-fix. Smart-Fix Drawer, Lead-Magnet Widget, White-Label Reports und Workflow-Automatisierung für Web-Agenturen.",
  },
};

const PLANS = [
  {
    name: "Starter",
    planKey: "starter",
    price: "29",
    per: "/Monat",
    desc: "Für erste Schritte & Einzelprojekte",
    accent: "#60a5fa",
    features: [
      { text: "1 Projekt · 5 Scans / Monat", highlight: true },
      { text: "SEO, Technik & Sicherheits-Check", highlight: true },
      { text: "Pay-per-Fix Guides (9,90 € pro Stück)", highlight: false },
      { text: "Kein White-Label", highlight: false, locked: true },
      { text: "Kein Client Tracking", highlight: false, locked: true },
      { text: "Kein Executive Summary", highlight: false, locked: true },
    ],
    cta: "Starter testen",
    href: undefined,
    recommended: false,
    enterprise: false,
  },
  {
    name: "Professional",
    planKey: "professional",
    price: "89",
    per: "/Monat",
    desc: "Für WordPress-Agenturen, die Kunden beeindrucken wollen",
    accent: "#10B981",
    features: [
      { text: "10 WordPress-Projekte & täglicher Deep-Scan", highlight: true, key: true },
      { text: "WP-Plugin-Erkennung (Elementor, Yoast, WP Rocket)", highlight: true, key: true },
      { text: "White-Label PDF — dein Logo, deine Farbe", highlight: true, key: true },
      { text: "Client Tracking — Echtzeit-Aufrufe & Downloads", highlight: true, key: true },
      { text: "Executive Summary — dein persönliches Fazit", highlight: true, key: true },
      { text: "Teilen-Links für Kunden (ohne Dashboard-Zugang)", highlight: true, key: false },
      { text: "KI-Fix-Vorschläge & Smart-Fix Drawer", highlight: false },
    ],
    cta: "Professional für 89 € starten →",
    href: undefined,
    recommended: false,
    enterprise: false,
  },
  {
    name: "Agency Pro (White-Label)",
    planKey: "agency",
    price: "249",
    per: "/Monat",
    desc: "Full White-Label · die Empfehlung für etablierte Agenturen",
    accent: "#7C3AED",
    features: [
      { text: "Bis zu 50 Projekte inklusive", highlight: true, key: true },
      { text: "Eigenes Branding im Lead-Widget (Farbe, Logo, Domain)", highlight: true, key: true },
      { text: "PDF-Export für Kunden — komplett unter deiner Marke", highlight: true, key: true },
      { text: "API-Zugriff für eigene Workflows & Integrationen", highlight: true, key: true },
      { text: "Eigene Subdomain (portal.ihre-agentur.de)", highlight: true, key: false },
      { text: "Automatischer Report-Versand mit deinem SMTP", highlight: true, key: false },
      { text: "Lead-Magnet Widget für Neukunden-Akquise", highlight: false, key: false },
      { text: "Priority-Support · Onboarding-Call inklusive", highlight: false, key: false },
    ],
    cta: "Agency Pro für 249 € starten →",
    href: undefined,
    recommended: true,
    enterprise: false,
  },
];

const FAQ = [
  {
    q: "Kann ich mein eigenes Branding nutzen?",
    a: "Ja, im Agency Pro Plan nutzen Sie Full White-Labeling inklusive eigener Subdomain und SMTP-Versand über Ihre Mail-Adresse. Ihre Kunden sehen ausschließlich Ihr Agentur-Branding — kein WebsiteFix-Logo, kein Hinweis auf das Tool.",
  },
  {
    q: "Wie sicher sind die Daten meiner Kunden?",
    a: "Wir hosten 100% DSGVO-konform auf Servern in Deutschland. Alle Daten werden TLS-verschlüsselt übertragen und gespeichert. Sie erhalten DSGVO-konforme Auftragsverarbeitungsverträge (AVV) und bleiben jederzeit Eigentümer Ihrer Daten — wir verkaufen oder teilen sie nicht.",
  },
  {
    q: "Was ist der Smart-Fix Drawer und wie hilft er meinem Team?",
    a: "Der Smart-Fix Drawer öffnet sich per Klick auf jeden gefundenen Fehler und zeigt eine exakte Schritt-für-Schritt-Anleitung für Gutenberg, Elementor oder Divi. Ihr Junior-Team kann damit Aufgaben erledigen, die sonst Senior-Know-how erfordern — Alt-Texte setzen, Formular-Labels korrigieren, kaputte Links finden und beheben. Kein Ticket schreiben, kein Rückfragen.",
  },
  {
    q: "Für welche Website-Plattformen funktioniert das?",
    a: "Für jede öffentlich erreichbare Website — WordPress, WooCommerce, Shopify, Wix, Squarespace, Webflow, TYPO3, Joomla, Drupal und Custom-Entwicklungen. Kein Plugin, kein Hosting-Zugang nötig.",
  },
  {
    q: "Wie läuft die Jira / Trello / Asana Integration?",
    a: "Sie verbinden Ihr Projekt-Management-Tool einmalig in den Einstellungen. Sobald ein Scan Probleme findet, werden Fehler direkt als Tickets in Jira, Trello oder Asana erstellt — inklusive Screenshot und Code-Fix-Vorschlag. Kein manuelles Copy-Paste mehr.",
  },
  {
    q: "Kann ich den Plan jederzeit kündigen?",
    a: "Ja. Monatliche Kündigung, keine Mindestlaufzeit. Abrechnung über Stripe. Nach der Kündigung haben Sie noch Zugang bis zum Ende des bezahlten Zeitraums.",
  },
];

export default function AgencyPage() {
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
              <Link href="/" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Home</Link>
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: "#fff", textDecoration: "none", fontWeight: 600 }}>Für Agenturen</Link>
              <Link href="/blog" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Blog</Link>
              <Link href="#pricing" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Preise</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/login" className="hide-sm" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Anmelden
              </Link>
              <Link href="#pricing" className="hide-sm" style={{
                fontSize: 13, padding: "7px 18px", borderRadius: 8, fontWeight: 700,
                background: "#007BFF", color: "#fff", textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,123,255,0.4)",
              }}>
                Jetzt optimieren →
              </Link>
              {/* Burger-Menü — nur auf Mobile sichtbar */}
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Auto-trigger Stripe checkout after post-login redirect (?checkout=plan) */}
        <Suspense fallback={null}>
          <AutoCheckout />
        </Suspense>

        {/* HERO */}
        <section style={{
          maxWidth: 1100, margin: "0 auto", padding: "88px 24px 72px", textAlign: "center",
          position: "relative",
          backgroundImage: "linear-gradient(rgba(122,166,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(122,166,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}>
          {/* Radial fade to mask grid edges */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #0b0c10 100%)",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
              padding: "5px 14px", borderRadius: 20,
              border: "1px solid rgba(122,166,255,0.25)",
              background: "rgba(122,166,255,0.06)",
              fontSize: 12, color: "#7aa6ff", fontWeight: 600, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7aa6ff", boxShadow: "0 0 6px #7aa6ff" }} />
              Exklusiv für WordPress-Agenturen &amp; Freelancer
            </div>

            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
              Das <span style={{ background: "linear-gradient(90deg, #10B981, #8df3d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>#1 White-Label<br />Audit Tool</span> für WordPress-Agenturen.
            </h1>

            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 680, margin: "0 auto 40px", fontWeight: 400 }}>
              Gewinne mehr WordPress-Aufträge durch professionelle Audits. SEO, BFSG, WP-Performance, /wp-admin-Sicherheit und Plugin-Analyse — mit deinem Logo auf dem Bericht. Für <strong style={{ color: "rgba(255,255,255,0.8)" }}>89 €/Monat</strong> — das erste Tool, das sich direkt in Aufträge übersetzt.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <CheckoutButton
                plan="professional"
                label="Professional für 89 € starten →"
                style={{
                  padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: "linear-gradient(90deg, #059669, #10B981)",
                  color: "#fff", border: "none",
                  boxShadow: "0 4px 32px rgba(16,185,129,0.55), 0 0 64px rgba(16,185,129,0.2)",
                }}
              />
              <Link href="#pricing" style={{
                padding: "14px 28px", borderRadius: 10, fontSize: 15,
                border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Preise ansehen
              </Link>
            </div>

            <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
              Professional-Plan · 89 €/Monat · Keine Mindestlaufzeit · DSGVO-konform
            </p>

            {/* Animated trust stats */}
            <AgencyStats />
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ── FEATURE-SHOWCASE ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(16,185,129,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Professional-Plan · 89 €/Monat
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
              Drei Features. Ein klarer Business-Vorteil.
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
              Kein anderes Tool unter 100 € gibt dir White-Label, Echtzeit-Tracking und individuelle Kundenkommunikation in einem.
            </p>
          </div>

          <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {/* Card 1: White-Label Power */}
            <div style={{
              padding: "32px 28px", borderRadius: 16,
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.18)",
              display: "flex", flexDirection: "column", gap: 16,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Palette/Brush icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r="0.5" fill="#10B981"/><circle cx="17.5" cy="10.5" r="0.5" fill="#10B981"/><circle cx="8.5" cy="7.5" r="0.5" fill="#10B981"/><circle cx="6.5" cy="12.5" r="0.5" fill="#10B981"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  White-Label Power
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Dein Logo.<br />Deine Marke.
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
                  Erstelle Reports, die aussehen, als kämen sie aus deiner eigenen Software-Abteilung. Kein WebsiteFix-Branding. Dein Kunde sieht nur dich.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Logo + Primärfarbe einmalig setzen", "Jeder PDF-Export vollständig gebrandert", "Teilen-Links in deinem Design", "Keine fremde Marke — nirgendwo"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Client Tracking */}
            <div style={{
              padding: "32px 28px", borderRadius: 16,
              background: "rgba(141,243,211,0.03)",
              border: "1px solid rgba(141,243,211,0.15)",
              display: "flex", flexDirection: "column", gap: 16,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(141,243,211,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "rgba(141,243,211,0.08)", border: "1px solid rgba(141,243,211,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Eye + chart icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  <path d="M8 20v-4M12 20v-7M16 20v-2" strokeWidth="1.5" stroke="#8df3d3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8df3d3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Client Tracking
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Wisse, wann<br />Kunden beißen.
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
                  Erhalte Echtzeit-Insights, wenn deine Berichte angesehen oder als PDF gespeichert werden. Du rufst an, während der Bericht noch offen ist.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Aufruf-Zähler pro geteiltem Bericht", "Download-Tracking (PDF gespeichert)", "Aktiv-Badge wenn Bericht gerade offen ist", "Live-Feed im Dashboard: Wer liest gerade?"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Executive Summaries */}
            <div style={{
              padding: "32px 28px", borderRadius: 16,
              background: "rgba(251,191,36,0.03)",
              border: "1px solid rgba(251,191,36,0.15)",
              display: "flex", flexDirection: "column", gap: 16,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(251,191,36,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Pen/comment icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Executive Summaries
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Deine Note.<br />Deine Expertise.
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
                  Füge ein individuelles Fazit hinzu, das deine Handschrift trägt. 3 smarte Vorlagen für den schnellen Start — oder dein eigener Text.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Textfeld direkt im Bericht-Panel", "Autosave — kein Klicken nötig", "Erscheint auf Seite 1 des PDFs", "3 Vorlagen: Dringlich · Technisch · Kompakt"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div style={{ marginTop: 36, textAlign: "center" }}>
            <CheckoutButton
              plan="professional"
              label="Alle drei Features für 89 € freischalten →"
              style={{
                padding: "13px 32px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: "linear-gradient(90deg, #059669, #10B981)",
                color: "#fff", border: "none",
                boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
              }}
            />
            <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Monatlich kündbar · Sofort aktiv nach Checkout
            </p>
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ── WHITE-LABEL DASHBOARD PREVIEW ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(122,166,255,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>White-Label Expertise</p>
          <h2 style={{ fontSize: "clamp(22px, 2.8vw, 34px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.025em", color: "#fff" }}>
            Ihre Agentur. Ihre Expertise. Unser System.
          </h2>
          <p style={{ margin: "0 auto 40px", fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 560, lineHeight: 1.7 }}>
            Exportieren Sie professionelle PDF-Reports oder geben Sie Kunden Zugang zu einem Dashboard in Ihrem Branding – ohne Hinweis auf WebsiteFix.
          </p>

          <div style={{ position: "relative", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            {/* Ambient glow behind window */}
            <div style={{
              position: "absolute", inset: "-40px -60px",
              background: "radial-gradient(ellipse at 50% 60%, rgba(0,123,255,0.14) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Browser window */}
            <div className="wf-dashboard-mock" style={{
              position: "relative", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0d0f14",
              boxShadow: "0 32px 100px rgba(0,0,0,0.75), 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}>
              {/* Browser chrome */}
              <div style={{
                height: 36, background: "#161820",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", padding: "0 16px", gap: 6,
              }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
                <div style={{
                  flex: 1, maxWidth: 240, margin: "0 auto",
                  height: 18, borderRadius: 4, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>app.website-fix.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard layout */}
              <div style={{ display: "flex", minHeight: 360 }}>

                {/* Sidebar — hidden on mobile via CSS */}
                <div className="wf-dashboard-sidebar" style={{
                  width: 160, flexShrink: 0, background: "#0A192F",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#007BFF,#0057b8)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>WebsiteFix</span>
                  </div>
                  {[
                    { label: "Übersicht", active: false },
                    { label: "Scan starten", active: false },
                    { label: "Kunden", active: false },
                    { label: "Activity Log", active: false },
                    { label: "Berichte", active: true },
                    { label: "Einstellungen", active: false },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: "7px 10px", borderRadius: 6, fontSize: 10,
                      color: item.active ? "#fff" : "rgba(255,255,255,0.3)",
                      background: item.active ? "rgba(0,123,255,0.22)" : "transparent",
                      borderLeft: item.active ? "2px solid #007BFF" : "2px solid transparent",
                      fontWeight: item.active ? 700 : 400,
                      boxShadow: item.active ? "inset 0 0 12px rgba(0,123,255,0.12)" : "none",
                    }}>
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main: White-Label Report — full width on mobile */}
                <div className="wf-dashboard-content" style={{ flex: 1, padding: "16px", overflowY: "hidden", background: "#0d0f14", minWidth: 0 }}>
                  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontSize: 0 }}>

                    {/* Report header — stacks on mobile via CSS */}
                    <div className="wf-report-header" style={{
                      background: "linear-gradient(135deg, #007BFF, #0057b8)",
                      padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>M</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Muster Agentur GmbH</div>
                          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>Monatlicher Website-Report</div>
                        </div>
                      </div>
                      <div className="wf-report-header-right" style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>April 2026</div>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>Müller &amp; Söhne Sanitär</div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 16px" }}>
                      {/* Management summary */}
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(0,123,255,0.06)", border: "1px solid rgba(0,123,255,0.15)", marginBottom: 10 }}>
                        <div style={{ fontSize: 7, fontWeight: 700, color: "#007BFF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Management-Zusammenfassung</div>
                        <div style={{ fontSize: 8, color: "#444", lineHeight: 1.6 }}>
                          Im April 2026 haben wir alle vereinbarten Leistungen erbracht und den reibungslosen Betrieb Ihrer Website sichergestellt. Durch proaktive WCAG-Audits und sofortige Fehlerbehebung per KI-Assistent wurde die Rechtssicherheit Ihrer Online-Präsenz kontinuierlich gewährleistet.
                        </div>
                      </div>

                      {/* Stats — 2×2 on mobile via CSS */}
                      <div className="wf-report-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                        {[
                          { label: "Website-Score", value: "100%" },
                          { label: "Verfügbarkeit", value: "99.9%" },
                          { label: "Krit. Fehler", value: "0" },
                          { label: "Optimierungen", value: "7" },
                        ].map(k => (
                          <div key={k.label} style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #e5e7eb", textAlign: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#007BFF" }}>{k.value}</div>
                            <div style={{ fontSize: 7, color: "#999", marginTop: 1 }}>{k.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Activity log */}
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                        {[
                          { icon: "🤖", label: "KI-Optimierungsvorschlag erstellt", date: "12.04" },
                          { icon: "📋", label: "Jira-Ticket: PHP-Update erforderlich", date: "08.04" },
                          { icon: "🔍", label: "WCAG-Audit durchgeführt (7 Issues)", date: "04.04" },
                        ].map((a, i) => (
                          <div key={i} style={{
                            padding: "5px 10px", display: "flex", alignItems: "center", gap: 6,
                            borderBottom: i < 2 ? "1px solid #f5f5f5" : "none",
                          }}>
                            <span style={{ fontSize: 9 }}>{a.icon}</span>
                            <span style={{ flex: 1, fontSize: 8, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                            <span style={{ fontSize: 7, color: "#bbb", flexShrink: 0 }}>{a.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              White-Label Report — mit Ihrem Logo, Ihrer Farbe, Ihrem Namen
            </p>
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ── DREI SCHRITTE (AGENTUR) ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center" }}>
            So funktioniert es
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 56px", letterSpacing: "-0.02em", textAlign: "center" }}>
            Drei Schritte zu mehr Marge.
          </h2>
          <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {[
              {
                num: "01", label: "Connect & Sync", title: "Alles in Sekunden verknüpft",
                desc: "Verknüpfen Sie Ihre Kunden-Websites und Ihre Workflow-Tools (Jira, Trello, Asana) in Sekunden. Erst-Analyse ohne Zugriff — Fixes via Agency-Plugin direkt in WordPress.",
                color: "#7aa6ff",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                ),
                pills: ["1-Klick Setup", "Jira · Trello · Asana", "Kein technischer Zugriff nötig"],
              },
              {
                num: "02", label: "Automatischer Deep-Scan", title: "KI übernimmt den Wachdienst",
                desc: "Die KI scannt täglich oder wöchentlich auf SEO-Qualität, Technik-Fehler und Performance. Jeder Befund landet automatisch als Ticket — direkt dort, wo Ihr Team arbeitet.",
                color: "#8df3d3",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                ),
                pills: ["SEO & Technik-Scan", "Performance-Check", "Täglich · Wöchentlich", "Smart-Fix Anleitungen"],
              },
              {
                num: "03", label: "White-Label Reporting", title: "Professionelle Reports in Ihrem Design",
                desc: "Kassieren Sie monatlich für Ihre Wartung mit professionellen Reports in IHREM Agentur-Design. Automatisch generiert, automatisch versendet — mit Ihrem Logo und Ihrer Farbe.",
                color: "#c084fc",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                ),
                pills: ["Ihr Logo & Farben", "Management-Zusammenfassung", "Auto-Versand"],
              },
            ].map((step) => (
              <div key={step.num} className={`wf-step-card wf-step-card-${step.num}`} style={{
                padding: "28px 28px 24px",
                border: `1px solid ${step.color}20`,
                borderRadius: 14,
                background: `${step.color}06`,
                display: "flex", flexDirection: "column", gap: 0,
                position: "relative", overflow: "hidden",
                transition: "border-color 0.22s ease, box-shadow 0.22s ease",
              }}>
                <div style={{
                  position: "absolute", right: 20, top: 16,
                  fontSize: 64, fontWeight: 900, color: `${step.color}03`,
                  lineHeight: 1, userSelect: "none", pointerEvents: "none",
                  letterSpacing: "-0.04em",
                }}>
                  {step.num}
                </div>
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

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* INTEGRATIONS NAHTLOSE WORKFLOWS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(192,132,252,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Nahtlose Workflows
            </p>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 34px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
              Alles verbunden. Nichts übersehen.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Verbinden Sie Ihre Lieblingstools mit einem Klick. Fehler landen automatisch dort, wo Sie arbeiten.
            </p>
          </div>

          <div className="wf-integ-grid">

            {/* Slack */}
            <div className="integ-card integ-card-slack" style={{
              padding: "24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(192,132,252,0.25)",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="integ-icon integ-icon-slack" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: "rgba(192,132,252,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s, background 0.2s" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.522A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.52-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
                    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.52 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.52 2.521 2.528 2.528 0 0 1-2.52 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
                    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
                    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Slack</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Echtzeit-Alerts für Ihr Team. Wissen, wenn es brennt, bevor der Kunde anruft.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="integ-pulse integ-pulse-slack" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(192,132,252,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(217,119,6,0.15)", color: "#D97706", letterSpacing: "0.06em" }}>DEMNÄCHST VERFÜGBAR</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "9px 14px", borderRadius: 8, textAlign: "center" as const, background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)", color: "rgba(192,132,252,0.9)", cursor: "pointer" }}>
                  Auf Warteliste
                </button>
              </div>
            </div>

            {/* Jira */}
            <div className="integ-card integ-card-jira" style={{
              padding: "24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(122,166,255,0.22)",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="integ-icon integ-icon-jira" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s, background 0.2s" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient id="wf-agency-jira-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%"   stopColor="#0052CC"/>
                        <stop offset="100%" stopColor="#2684FF"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#wf-agency-jira-grad)" d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005z"/>
                    <path fill="#2684FF" d="M17.294 5.757H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005z"/>
                    <path fill="#0052CC" d="M23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Jira</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Automatisierte Tickets. Fehler werden ohne manuelles Kopieren direkt zu Entwickler-Tasks.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="integ-pulse integ-pulse-jira" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(122,166,255,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(217,119,6,0.15)", color: "#D97706", letterSpacing: "0.06em" }}>DEMNÄCHST VERFÜGBAR</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "9px 14px", borderRadius: 8, textAlign: "center" as const, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(122,166,255,0.3)", color: "rgba(122,166,255,0.9)", cursor: "pointer" }}>
                  Auf Warteliste
                </button>
              </div>
            </div>

            {/* Trello */}
            <div className="integ-card integ-card-trello" style={{
              padding: "24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(91,184,250,0.2)",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="integ-icon integ-icon-trello" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: "rgba(0,121,191,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s, background 0.2s" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="3" fill="#0079BF"/>
                    <rect x="5" y="5" width="6"  height="13" rx="1" fill="#fff" opacity="0.95"/>
                    <rect x="13" y="5" width="6" height="8"  rx="1" fill="#fff" opacity="0.95"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Trello</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Kanban für Wartungs-Tasks</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="integ-pulse integ-pulse-trello" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(91,184,250,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(217,119,6,0.15)", color: "#D97706", letterSpacing: "0.06em" }}>DEMNÄCHST VERFÜGBAR</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "9px 14px", borderRadius: 8, textAlign: "center" as const, background: "rgba(0,121,191,0.1)", border: "1px solid rgba(91,184,250,0.3)", color: "rgba(91,184,250,0.9)", cursor: "pointer" }}>
                  Auf Warteliste
                </button>
              </div>
            </div>

            {/* Zapier */}
            <div className="integ-card integ-card-zapier" style={{
              padding: "24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,109,45,0.2)",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="integ-icon integ-icon-zapier" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: "rgba(255,80,10,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s, background 0.2s" }}>
                  <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
                    <path fill="#FF4F00" d="M19.18 16.005a8.59 8.59 0 0 1-.563 3.063 8.6 8.6 0 0 1-3.061.564h-.022a8.6 8.6 0 0 1-3.062-.563 8.6 8.6 0 0 1-.564-3.061v-.012a8.6 8.6 0 0 1 .564-3.062 8.6 8.6 0 0 1 3.061-.564h.012a8.6 8.6 0 0 1 3.062.564 8.6 8.6 0 0 1 .564 3.062v.011zm10.55-2.044h-8.45l5.97-5.97a14.06 14.06 0 0 0-2.227-2.804v-.002a14.1 14.1 0 0 0-2.802-2.225l-5.97 5.97V.477A14.2 14.2 0 0 0 16.005.27h-.005a14.2 14.2 0 0 0-2.245.207v8.45L7.785 2.96A14.04 14.04 0 0 0 4.984 5.19l-.005.005a14.1 14.1 0 0 0-2.221 2.8l5.971 5.97H.270s-.207 1.475-.207 2.24v.005c0 .76.07 1.504.205 2.226h8.45l-5.97 5.97a14.13 14.13 0 0 0 5.025 5.029l5.97-5.97v8.45c.722.135 1.464.205 2.222.207h.027c.758-.002 1.5-.072 2.222-.207v-8.45l5.971 5.97a14.1 14.1 0 0 0 2.802-2.222l.003-.002a14.1 14.1 0 0 0 2.222-2.802l-5.97-5.97h8.452a14.2 14.2 0 0 0 .206-2.218v-.022a14.2 14.2 0 0 0-.207-2.226z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Zapier</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Grenzenlose Freiheit. Verbinden Sie WebsiteFix mit über 5.000 Apps wie HubSpot oder Salesforce.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="integ-pulse integ-pulse-zapier" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,109,45,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(217,119,6,0.15)", color: "#D97706", letterSpacing: "0.06em" }}>DEMNÄCHST VERFÜGBAR</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "9px 14px", borderRadius: 8, textAlign: "center" as const, background: "rgba(255,80,10,0.1)", border: "1px solid rgba(255,109,45,0.3)", color: "rgba(255,109,45,0.9)", cursor: "pointer" }}>
                  Auf Warteliste
                </button>
              </div>
            </div>

          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ROI CALCULATOR */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            textAlign: "center", paddingTop: 40,
            zIndex: 1, pointerEvents: "none",
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(141,243,211,0.7)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Berechnen Sie Ihr zusätzliches monatliches Potenzial
            </p>
          </div>
          <RoiCalculator />
        </div>

        {/* PROBLEMS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,107,107,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Bekannte Probleme</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
            Drei Effizienz-Killer, die Ihre Marge fressen.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: "0 0 48px", maxWidth: 560, lineHeight: 1.7 }}>
            Situationen, die jede Agentur kennt — und die website-fix systematisch eliminiert.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([
              {
                IconEl: LayersIcon,
                glow: "rgba(122,166,255,0.20)",
                border: "rgba(122,166,255,0.25)",
                iconColor: "#a5c1ff",
                title: "Manuelle Reports fressen Ihr Wochenende",
                desc: "20 Kunden, 20 individuelle Reports. Recherche, Screenshots, Formatierung, versenden. Jede Stunde, die Sie dafür aufwenden, können Sie nicht verkaufen.",
                quote: `\u201ESamstag, 14 Uhr. Ich sitze wieder an Reports statt mit meiner Familie.\u201C`,
              },
              {
                IconEl: BellAlertIcon,
                glow: "rgba(251,191,36,0.16)",
                border: "rgba(251,191,36,0.25)",
                iconColor: "#fcd34d",
                title: "Fehler bemerken Sie, wenn der Kunde anruft",
                desc: "SSL abgelaufen. Website offline. Google-Index verschwunden. Sie erfahren es nicht als Erste — der Kunde schon. Das kostet Vertrauen, das Sie in Monaten aufgebaut haben.",
                quote: `\u201EWarum habt ihr das nicht gesehen? Ihr betreut ja unsere Website.\u201C`,
              },
              {
                IconEl: Zap,
                glow: "rgba(192,132,252,0.16)",
                border: "rgba(192,132,252,0.25)",
                iconColor: "#c084fc",
                title: "Jeder Fix braucht Senior-Know-how — oder?",
                desc: "Alt-Text vergessen. Formular-Label fehlt. 404-Link tracken. Aufgaben, die einfach klingen, enden als Stunden-Tickets beim Senior-Entwickler. Mit dem Smart-Fix Drawer erledigt das Ihr Junior — in 5 Minuten, ohne Rückfragen.",
                quote: `\u201EBis der Senior das gefixt hat, hätte ich es dreimal erklärt.\u201C`,
              },
            ] as const).map((p, i) => (
              <div key={i} className="wf-problem-card" style={{
                padding: "24px 28px",
                border: "1px solid rgba(255,107,107,0.10)",
                borderRadius: 14,
                background: "rgba(255,107,107,0.03)",
                display: "flex", gap: 20, alignItems: "flex-start",
              }}>
                {/* Icon circle */}
                <div className="wf-problem-icon" style={{
                  flexShrink: 0,
                  width: 44, height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${p.border}`,
                  boxShadow: `0 0 20px ${p.glow}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p.IconEl size={20} color={p.iconColor} strokeWidth={1.5} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 680 }}>{p.desc}</div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>{p.quote}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHITE-LABEL HIGHLIGHT */}
        <section className="wf-wl-section" style={{ background: "#0d1520", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Badge */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 16px", borderRadius: 20,
                background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
                fontSize: 12, color: "#7aa6ff", fontWeight: 700, letterSpacing: "0.06em",
                marginBottom: 20,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                KAUFARGUMENT NR. 1 FÜR AGENTUREN
              </div>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Ihr Tool. Ihr Branding. Ihre Marge.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.75 }}>
                Versenden Sie professionelle PDF-Reports mit Ihrem Agentur-Logo und in Ihren Markenfarben. WebsiteFix bleibt im Hintergrund – Sie sind der Experte für Ihre Kunden.
              </p>
            </div>

            <div className="wf-wl-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", maxWidth: 960, margin: "0 auto" }}>
              {/* Left: feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
                    bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.25)",
                    title: "Einmalig einrichten",
                    desc: "Logo & Primärfarbe in den Einstellungen hinterlegen — fertig. Alle künftigen Reports werden automatisch gebrandert.",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                    bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.25)",
                    title: "Automatisierte Management-Zusammenfassungen",
                    desc: "Professioneller Agentur-Ton, auf Deutsch, mit konkreten Handlungsempfehlungen — vollautomatisch.",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                    bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.25)",
                    title: "Report wird automatisch versendet",
                    desc: "Am 1. jeden Monats landet der PDF-Report direkt beim Kunden — mit Ihrem Absender, Ihrem Branding.",
                  },
                ].map(f => (
                  <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: f.bg, border: `1px solid ${f.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}

                <CheckoutButton
                  plan="agency"
                  label="Agentur-Power freischalten →"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(90deg,#007BFF,#0057b8)",
                    color: "#fff", border: "none", marginTop: 8,
                    boxShadow: "0 3px 14px rgba(0,123,255,0.3)",
                    width: "fit-content",
                  }}
                />
              </div>

              {/* Right: report preview */}
              <div className="wf-wl-mockup" style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", inset: "-30px",
                  background: "radial-gradient(ellipse at 50% 50%, rgba(0,123,255,0.1) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "relative",
                  background: "#fff", borderRadius: 14, overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                }}>
                  <div className="wf-wl-mockup-header" style={{
                    background: "linear-gradient(135deg, #007BFF, #0057b8)",
                    padding: "18px 22px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>M</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Muster Agentur GmbH</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Monatlicher Website-Report</div>
                      </div>
                    </div>
                    <div className="wf-wl-mockup-header-right" style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>April 2026</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>Müller & Söhne Sanitär</div>
                    </div>
                  </div>
                  <div style={{ padding: "18px 22px" }}>
                    <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(0,123,255,0.05)", border: "1px solid rgba(0,123,255,0.15)", marginBottom: 14 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#007BFF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Management-Zusammenfassung</div>
                      <p style={{ margin: 0, fontSize: 11, color: "#444", lineHeight: 1.75 }}>
                        Im April 2026 haben wir alle vereinbarten Leistungen erbracht. Durch proaktive WCAG-Audits und KI-gestützte Fehlerbehebung wurde die Rechtssicherheit kontinuierlich gewährleistet.
                      </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
                      {[{ label: "Uptime", value: "98%" }, { label: "Scans", value: "4" }, { label: "Gelöst", value: "9" }].map(k => (
                        <div key={k.label} style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#007BFF" }}>{k.value}</div>
                          <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{k.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ paddingTop: 10, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: "#ccc" }}>Erstellt am 01.05.2026</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(0,123,255,0.08)", color: "#007BFF" }}>Muster Agentur GmbH</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  position: "absolute", top: -12, right: 12,
                  padding: "4px 12px", borderRadius: 20,
                  background: "#0b0c10", border: "1px solid rgba(122,166,255,0.3)",
                  fontSize: 11, fontWeight: 600, color: "#7aa6ff",
                }}>
                  ← Ihre Farbe & Ihr Logo
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE DEEP-DIVE */}
        <section className="wf-feat-section" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Feature Deep-Dive</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Gebaut für WordPress-Agenturen, die skalieren.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                WordPress-spezifische Audits, Plugin-Erkennung (Elementor, WP Rocket, Yoast, WooCommerce) und /wp-admin-Security-Checks — alles unter deiner Marke.
              </p>
            </div>

            <div className="wf-feat-grid">
              {/* Karte 1: Profitabilität */}
              <div className="wf-feat-card wf-feat-card-blue" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(37,99,235,0.12)", color: "#7aa6ff", letterSpacing: "0.06em" }}>Profitabilität</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Höhere Marge pro Projekt</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    Automatisierte Audits auf SEO, Technik und Qualität rechtfertigen höhere Wartungspauschalen — ohne Mehraufwand. Jeder Scan liefert messbare Verbesserungen, die Sie Ihren Kunden direkt präsentieren können.
                  </p>
                  <ul style={{ margin: "auto 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["SEO-Score pro Seite — Ranking-Potenzial sichtbar", "Fehler-Priorisierung nach Schweregrad", "Smart-Fix Drawer für Gutenberg, Elementor & Divi", "Junior-freundliche Fix-Anleitungen — kein Senior nötig"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b === "Junior-freundliche Fix-Anleitungen — kein Senior nötig" ? <strong style={{ color: "#a5c1ff", fontWeight: 700 }}>{b}</strong> : b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Karte 2: Effizienz */}
              <div className="wf-feat-card wf-feat-card-green" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(22,163,74,0.12)", color: "#4ade80", letterSpacing: "0.06em" }}>Effizienz</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Null manueller Aufwand</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    Am 1. jeden Monats wird automatisch ein professioneller PDF-Report mit Ihrem Logo, Ihrer Farbe und einer KI-generierten Management-Zusammenfassung an jeden Kunden versendet.
                  </p>
                  <ul style={{ margin: "auto 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["Agentur-Logo & Primärfarbe", "KI-Zusammenfassung auf Agentur-Niveau", "PDF-Export + direkter E-Mail-Versand", "Kein WebsiteFix-Branding sichtbar"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b === "Kein WebsiteFix-Branding sichtbar" ? <strong style={{ color: "#86efac", fontWeight: 700 }}>{b}</strong> : b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Karte 3: Loyalität */}
              <div className="wf-feat-card wf-feat-card-amber" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(217,119,6,0.12)", color: "#fbbf24", letterSpacing: "0.06em" }}>Loyalität</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Kunden langfristig binden</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    Befunde werden direkt als Jira-Tickets, Trello-Karten oder Asana-Tasks erstellt. Slack meldet sich sofort. Ihr Team arbeitet immer am aktuellen Stand — ohne Copy-Paste.
                  </p>
                  <ul style={{ margin: "auto 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["Jira · Trello · Asana Integration", "Slack-Alerts in Echtzeit", "Auto-Pilot Scan-Intervall", "Lückenloser Audit-Trail"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LEAD-MAGNET WIDGET ── */}
        <section style={{ background: "#0a0f1a", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

              {/* Left: Text */}
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "5px 16px", borderRadius: 20, marginBottom: 24,
                  background: "linear-gradient(90deg, rgba(234,179,8,0.15), rgba(251,191,36,0.08))",
                  border: "1px solid rgba(234,179,8,0.5)",
                  boxShadow: "0 0 16px rgba(234,179,8,0.2)",
                  fontSize: 12, color: "#FBBF24", fontWeight: 800, letterSpacing: "0.08em",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24", boxShadow: "0 0 8px #FBBF24", flexShrink: 0 }} />
                  ★ NUR IM AGENCY-PLAN
                </div>
                <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fff" }}>
                  Das Lead-Magnet Widget — Neukunden auf Autopilot.
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: "0 0 28px" }}>
                  Binden Sie ein kleines Scan-Widget direkt in die Website Ihrer Kunden oder in Ihre eigene Agentur-Website ein. Besucher können ihre URL kostenlos scannen — und landen direkt in Ihrem Funnel.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { color: "#4ade80", text: "Widget läuft unter Ihrem Branding — kein Hinweis auf website-fix" },
                    { color: "#7aa6ff", text: "Scan-Ergebnis zeigt Fehler → Ihre Agentur als Lösung" },
                    { color: "#c084fc", text: "Leads landen automatisch in Ihrem Dashboard" },
                    { color: "#fbbf24", text: "Einmalig einbinden, dauerhaft neue Anfragen generieren" },
                  ].map(item => (
                    <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Widget Mockup */}
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", inset: "-40px",
                  background: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.10) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "relative",
                  background: "rgba(8,10,20,0.9)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 16,
                  padding: "28px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                }}>
                  {/* Widget header */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                      Muster Agentur GmbH — Kostenloser Website-Check
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                      Wie gesund ist Ihre WordPress-Website?
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                      Kostenloser Scan — Ergebnis in 60 Sekunden
                    </div>
                  </div>
                  {/* URL Input Mockup */}
                  <div style={{
                    display: "flex", gap: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "10px 14px",
                    marginBottom: 14,
                    alignItems: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>https://ihre-website.de</span>
                  </div>
                  <div style={{
                    background: "linear-gradient(90deg, #16a34a, #15803d)",
                    borderRadius: 9, padding: "11px 0",
                    textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff",
                    boxShadow: "0 3px 14px rgba(34,197,94,0.3)",
                  }}>
                    Jetzt kostenlos scannen →
                  </div>
                  {/* Trust line */}
                  <div style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                    Kein Login · Keine Installation · DSGVO-konform
                  </div>
                </div>
                <div style={{
                  position: "absolute", top: -12, right: 12,
                  padding: "4px 12px", borderRadius: 20,
                  background: "#0b0c10", border: "1px solid rgba(74,222,128,0.3)",
                  fontSize: 11, fontWeight: 600, color: "#4ade80",
                }}>
                  ← Ihr Branding, Ihr Logo
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DEEP-SCAN TECHNOLOGIE */}
        <section style={{ padding: "0 24px 80px" }}>

          <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
            <div style={{
              padding: "36px 40px", borderRadius: 20,
              border: "1px solid rgba(122,166,255,0.20)",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 0 40px rgba(0,123,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Radial glow right */}
              <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(0,123,255,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />

              {/* Crawl scan line animation */}
              <div className="wf-scan-line" />

              <div style={{ position: "relative" }}>
                {/* Badge */}
                <div className="wf-scan-badge" style={{
                  display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18,
                  padding: "5px 14px", borderRadius: 20, fontSize: 11,
                  background: "rgba(122,166,255,0.08)",
                  border: "1px solid rgba(122,166,255,0.25)",
                  color: "#7aa6ff", fontWeight: 700, letterSpacing: "0.06em",
                  backdropFilter: "blur(8px)",
                }}>
                  🔬 Deep-Scan Technologie
                </div>

                <h3 className="wf-scan-headline" style={{ margin: "0 0 16px", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.25 }}>
                  Wir prüfen nicht nur die Oberfläche,<br />
                  <span style={{ color: "#a5c1ff", fontWeight: 900 }}>sondern jede einzelne Unterseite.</span>
                </h3>
                <p style={{ margin: "0 0 24px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 640 }}>
                  Unser Crawler analysiert automatisch <strong style={{ color: "rgba(255,255,255,0.85)" }}>jede Unterseite</strong> der Kundendomain — nicht nur die Startseite. Die KI findet dabei ca. <strong style={{ color: "rgba(255,255,255,0.85)" }}>50% der technischen Barrieren vollautomatisch</strong>. Während andere Tools nur die Oberfläche kratzen, erkennt unsere Engine auch dynamische Barrieren in komplexen Menüstrukturen und interaktiven Elementen. Ihr Team erhält fertige Code-Snippets zur Behebung — kein langes Suchen im Quelltext mehr.
                </p>
                <div className="wf-scan-features">
                  {[
                    "Sitemap + BFS-Crawl",
                    "JavaScript-Rendering (SPA Support)",
                    "Modals, Flyouts & Formulare",
                    "Shadow DOM & iFrame-Elemente",
                    "Seitentyp-Klassifikation",
                    "Aggregierte Fehler-Reports",
                    "Fertige Code-Snippets",
                    "KI-Batch-Analyse",
                  ].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                {/* Stack badge */}
                <div style={{ marginTop: 18, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
                  Optimiert für:&nbsp;
                  {["WordPress", "Elementor", "Divi", "Custom JS Frameworks"].map((s, i, arr) => (
                    <span key={s}>
                      <span style={{ color: "rgba(122,166,255,0.6)", fontWeight: 600 }}>{s}</span>
                      {i < arr.length - 1 && <span style={{ margin: "0 4px" }}>·</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TECH STACK */}
        <section style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{
              padding: "36px 40px", borderRadius: 20,
              border: "1px solid rgba(61,211,152,0.15)",
              background: "rgba(0,0,0,0.30)",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 0 40px rgba(61,211,152,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "radial-gradient(ellipse at 20% 50%, rgba(61,211,152,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>

                {/* Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "5px 14px", borderRadius: 20, fontSize: 11,
                    background: "rgba(61,211,152,0.08)", border: "1px solid rgba(61,211,152,0.22)",
                    color: "#3dd398", fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    <Zap size={11} style={{ flexShrink: 0 }} /> Cloud-Analyse · Edge Computing
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "5px 14px", borderRadius: 20, fontSize: 11,
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.28)",
                    color: "#818cf8", fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    {/* WordPress "W" Icon */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" stroke="#818cf8" strokeWidth="1.8"/>
                      <path d="M3 12c0 3.8 2.2 7.1 5.4 8.7L3.8 9.2A9 9 0 0 0 3 12z" fill="#818cf8"/>
                      <path d="M17.7 11.6c0-1.2-.4-2-.8-2.6-.5-.8-1-1.5-1-2.3 0-.9.7-1.7 1.7-1.7h.1A9 9 0 0 0 12 3a9 9 0 0 0-7.6 4.2h.5c1.1 0 2.8-.1 2.8-.1.6 0 .6.8 0 .9 0 0-.6.1-1.2.1l3.8 11.3 2.3-6.8-1.6-4.5c-.6 0-1.1-.1-1.1-.1-.6 0-.5-.9 0-.9 0 0 1.7.1 2.8.1 1.1 0 2.8-.1 2.8-.1.6 0 .6.8 0 .9 0 0-.6.1-1.2.1l3.7 11.1.9-3.1c.5-1.5.8-2.6.8-3.5z" fill="#818cf8"/>
                      <path d="m13.1 12.9-3.1 9A9 9 0 0 0 12 21a9 9 0 0 0 5.4-1.8l-.1-.2-4.2-8.1z" fill="#818cf8"/>
                      <path d="M19.8 7.8a9 9 0 0 1 .2 2 8.2 8.2 0 0 1-.7 3.3l-2.9 8.4A9 9 0 0 0 19.8 7.8z" fill="#818cf8"/>
                    </svg>
                    WordPress · Native Integration
                  </div>
                  {/* Demnächst-Verfügbar-Badge — Plugin ist im Aufbau, nicht released */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 20, fontSize: 10,
                    background: "rgba(217,119,6,0.15)", border: "1px solid rgba(217,119,6,0.35)",
                    color: "#D97706", fontWeight: 800, letterSpacing: "0.08em",
                  }}>
                    DEMNÄCHST VERFÜGBAR
                  </div>
                </div>

                <h3 style={{ margin: "0 0 14px", fontWeight: 800, fontSize: "clamp(20px, 2.8vw, 28px)", letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.2 }}>
                  Analyse in der Cloud.{" "}
                  <span style={{ color: "#3dd398" }}>Heilung im Backend.</span>
                </h3>

                <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 620 }}>
                  Scanne Kundenprojekte in Sekunden{" "}
                  <strong style={{ color: "rgba(255,255,255,0.8)" }}>ohne Hosting-Zugriff</strong>.
                  {" "}Nutze den exklusiven Agency-Auto-Fixer, um hunderte Fehler{" "}
                  <strong style={{ color: "rgba(255,255,255,0.8)" }}>vollautomatisch direkt in WordPress</strong>{" "}
                  zu beheben.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                  {([
                    { Icon: Globe,       title: "Edge Computing",        desc: "Scans laufen auf globalen Edge-Nodes — latenzarm, ausfallsicher",     color: "#007BFF", glow: "rgba(0,123,255,0.10)",   border: "rgba(0,123,255,0.18)" },
                    { Icon: ShieldCheck, title: "Maximale Sicherheit",   desc: "Kein Hosting-Zugang nötig — keine Credentials deiner Kunden bei uns", color: "#3dd398", glow: "rgba(61,211,152,0.08)",  border: "rgba(61,211,152,0.18)" },
                    { Icon: Zap,         title: "Vom Scanner zum Fixer", desc: "Agency-Plugin übernimmt Alt-Texte, Metadaten & SEO-Blocker per API — du berechnest die Leistung", color: "#f59e0b", glow: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.2)" },
                    { Icon: Server,      title: "DSGVO by Design",       desc: "Server in Deutschland, TLS-verschlüsselt, AVV inklusive",              color: "#818cf8", glow: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.2)" },
                  ] as const).map(({ Icon, title, desc, color, glow, border }) => (
                    <div key={title} style={{
                      padding: "16px 18px", borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: glow,
                    }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 34, height: 34, borderRadius: 9,
                          background: `${color}18`,
                          boxShadow: `0 0 12px ${color}40`,
                        }}>
                          <Icon size={16} color={color} strokeWidth={1.8} />
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Zeit-Hebel — Full-width highlight card */}
                <div style={{
                  padding: "20px 24px", borderRadius: 12, marginBottom: 20,
                  background: "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.03) 100%)",
                  border: "1px solid rgba(245,158,11,0.22)",
                  display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Zap size={18} color="#f59e0b" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                      Vom Scanner zum Fixer — Der Zeit-Hebel
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>
                      Warum händisch korrigieren, wenn man skalieren kann? Unser Agency-Plugin übernimmt die Drecksarbeit.
                      Alt-Texte, Metadaten und SEO-Blocker werden per API-Befehl aus deinem Dashboard korrigiert.{" "}
                      <strong style={{ color: "rgba(255,255,255,0.7)" }}>Du berechnest die Leistung, wir liefern die Technik.</strong>
                    </div>
                  </div>
                </div>

                {/* Hybrid-Freiheit — Einwandvorbehandlung */}
                <div style={{
                  padding: "16px 20px", borderRadius: 10, marginBottom: 24,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 6, flexShrink: 0, alignSelf: "stretch",
                    borderRadius: 3, background: "rgba(61,211,152,0.4)", marginTop: 2,
                  }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#3dd398", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Maximale Freiheit: Kein Zwang.
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.75 }}>
                      Für den Erst-Check brauchst du keinen Zugriff und keine Installation.
                      Das Plugin ist dein optionaler Turbo für die Umsetzung.{" "}
                      <strong style={{ color: "rgba(255,255,255,0.6)" }}>Professionell, schlank, sicher.</strong>
                    </div>
                  </div>
                </div>

                {/* Stack Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11 }}>
                  {["Next.js 15", "React 19", "Edge Runtime", "Neon Serverless DB", "Vercel Edge Network", "WordPress Plugin", "TypeScript"].map(tag => (
                    <span key={tag} style={{
                      padding: "4px 10px", borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${tag === "WordPress Plugin" ? "rgba(129,140,248,0.22)" : "rgba(255,255,255,0.08)"}`,
                      color: tag === "WordPress Plugin" ? "rgba(129,140,248,0.85)" : "rgba(61,211,152,0.7)",
                      fontWeight: 600,
                    }}>{tag}</span>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(74,222,128,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)" }}>
                Keine versteckten Kosten. Monatlich kündbar. DSGVO-konform.
              </p>
            </div>

            <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, alignItems: "stretch" }}>
              {PLANS.map(plan => {
                type F = { text: string; highlight: boolean; key?: boolean; locked?: boolean };
                const isAgency      = plan.planKey === "agency";
                const isRecommended = plan.recommended;            // Daten-getrieben: Agency Pro = empfohlen auf /fuer-agenturen
                const accentColor   = plan.accent;                 // Indigo bei Agency, Emerald bei Pro, Blau bei Starter
                // RGB-Werte fuer Box-Shadow-Glow ohne harte Hex-Werte
                const accentRgb = isAgency ? "124,58,237" : plan.planKey === "professional" ? "16,185,129" : "96,165,250";
                return (
                <div key={plan.name} style={{
                  background: isRecommended ? `rgba(${accentRgb},0.06)` : "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: isRecommended ? `2px solid rgba(${accentRgb},0.55)` : `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: isRecommended
                    ? `0 0 60px rgba(${accentRgb},0.20), 0 8px 40px rgba(${accentRgb},0.14), 0 0 0 1px rgba(${accentRgb},0.12)`
                    : "0 2px 20px rgba(0,0,0,0.3)",
                  transform: isRecommended ? "scale(1.025)" : "scale(1)",
                  zIndex: isRecommended ? 1 : 0,
                  position: "relative" as const,
                }}>
                  {/* Top stripe — "Empfohlen für Profis"-Badge nur auf der recommended Card */}
                  {isRecommended && (
                    <div style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}DD)`, padding: "9px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>EMPFOHLEN FÜR PROFIS</span>
                    </div>
                  )}
                  {!isRecommended && (
                    <div style={{ height: 4, background: `rgba(${accentRgb},0.20)` }} />
                  )}

                  <div style={{ padding: "28px 28px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: accentColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{plan.price}€</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{plan.per}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{plan.desc}</p>
                    </div>

                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => {
                        const ff = f as F;
                        const isLocked = ff.locked;
                        return (
                        <div key={ff.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: isLocked
                              ? "rgba(255,255,255,0.03)"
                              : ff.key
                                ? `${accentColor}22`
                                : ff.highlight
                                  ? (isRecommended ? accentColor : "rgba(255,255,255,0.12)")
                                  : "rgba(255,255,255,0.07)",
                            border: isLocked ? "1px solid rgba(255,255,255,0.06)" : ff.key ? `1px solid ${accentColor}40` : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isLocked ? (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ff.key ? accentColor : ff.highlight ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: ff.key ? 700 : ff.highlight ? 600 : 400,
                            color: isLocked ? "rgba(255,255,255,0.2)" : ff.key ? accentColor : ff.highlight ? "#fff" : "rgba(255,255,255,0.4)",
                            textDecoration: isLocked ? "line-through" : "none",
                          }}>
                            {ff.text}
                          </span>
                        </div>
                        );
                      })}
                    </div>

                    <div style={{ paddingBottom: 24 }}>
                      <CheckoutButton
                        plan={plan.planKey}
                        label={plan.cta}
                        style={{
                          display: "block", textAlign: "center", width: "100%",
                          padding: "13px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                          textDecoration: "none",
                          background: isRecommended
                            ? `linear-gradient(90deg, ${accentColor}, ${accentColor}DD)`
                            : isAgency ? "#7C3AED" : "rgba(255,255,255,0.06)",
                          color: isRecommended || isAgency ? "#fff" : "rgba(255,255,255,0.55)",
                          border: isRecommended || isAgency ? "none" : "1px solid rgba(255,255,255,0.1)",
                          boxShadow: isRecommended ? `0 4px 18px rgba(${accentRgb},0.40)` : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
              {["Upgrade jederzeit möglich", "Jederzeit kündbar", "DSGVO-konform", "Daten in Deutschland"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", color: "#fff" }}>
              Häufige Fragen
            </h2>
            <p style={{ margin: "0 0 40px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              Alles, was Agentur-Inhaber vor dem Start wissen wollen.
            </p>
            {/* Card wrapper */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              overflow: "hidden",
              padding: "0 28px",
            }}>
              <FaqAccordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* BLOG TEASER */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Agentur-Wissen</p>
              <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                Wissen, das Ihre Agentur weiterbringt.
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                Strategien zu WordPress-Exzellenz, Workflow-Automatisierung und technischer Qualität.
              </p>
            </div>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Alle Artikel →
            </Link>
          </div>

          <div className="wf-agency-blog-grid">
            {/* Card 1 */}
            <Link href="/blog/bfsg-2025-agenturen" style={{ textDecoration: "none", display: "block" }}>
              <div className="wf-blog-card" style={{
                padding: "24px 26px", height: "100%", boxSizing: "border-box",
                border: "1px solid rgba(122,166,255,0.15)", borderRadius: 14,
                background: "rgba(122,166,255,0.04)",
                display: "flex", flexDirection: "column", gap: 12,
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: "rgba(122,166,255,0.12)", border: "1px solid rgba(122,166,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: "rgba(122,166,255,0.12)", color: "#7aa6ff", border: "1px solid rgba(122,166,255,0.2)", letterSpacing: "0.05em" }}>BFSG · WCAG</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>5 Min.</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.35 }}>
                  Das BFSG 2025 – Warum WordPress-Agenturen jetzt handeln müssen
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, flex: 1 }}>
                  Wie Sie das Thema Barrierefreiheit als Qualitätsmerkmal positionieren und damit Premium-Wartungspauschalen rechtfertigen.
                </p>
                <span style={{ fontSize: 13, color: "#7aa6ff", fontWeight: 600 }}>Jetzt lesen →</span>
              </div>
            </Link>

            {/* Card 2 */}
            <Link href="/blog/white-label-strategien" style={{ textDecoration: "none", display: "block" }}>
              <div className="wf-blog-card" style={{
                padding: "24px 26px", height: "100%", boxSizing: "border-box",
                border: "1px solid rgba(141,243,211,0.12)", borderRadius: 14,
                background: "rgba(141,243,211,0.03)",
                display: "flex", flexDirection: "column", gap: 12,
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: "rgba(141,243,211,0.10)", border: "1px solid rgba(141,243,211,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: "rgba(141,243,211,0.10)", color: "#8df3d3", border: "1px solid rgba(141,243,211,0.18)", letterSpacing: "0.05em" }}>White-Label</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>4 Min.</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.35 }}>
                  White-Label Reports: So positionieren Sie sich als Premium-Agentur
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, flex: 1 }}>
                  Wie automatisierte, gebrandete Reports Ihre Kundenbindung erhöhen und höhere Wartungspauschalen rechtfertigen.
                </p>
                <span style={{ fontSize: 13, color: "#8df3d3", fontWeight: 600 }}>Jetzt lesen →</span>
              </div>
            </Link>

            {/* Card 3 */}
            <Link href="/blog/wartungsvertrag-automatisieren" style={{ textDecoration: "none", display: "block" }}>
              <div className="wf-blog-card" style={{
                padding: "24px 26px", height: "100%", boxSizing: "border-box",
                border: "1px solid rgba(192,132,252,0.12)", borderRadius: 14,
                background: "rgba(192,132,252,0.03)",
                display: "flex", flexDirection: "column", gap: 12,
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: "rgba(192,132,252,0.10)", border: "1px solid rgba(192,132,252,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: "rgba(192,132,252,0.10)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.18)", letterSpacing: "0.05em" }}>Automatisierung</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>6 Min.</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.35 }}>
                  Wartungsverträge automatisieren: Von 10 auf 50 Kunden ohne Mehraufwand
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, flex: 1 }}>
                  Welche Prozesse sich vollständig automatisieren lassen und wie Sie damit Ihre Marge pro Kunde verdoppeln.
                </p>
                <span style={{ fontSize: 13, color: "#c084fc", fontWeight: 600 }}>Jetzt lesen →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ─── AGENCY-PARTNERSCHAFT — Premium Section ───────────────────── */}
        <section style={{ padding: "80px 24px 96px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
          {/* Edler Hintergrund-Glow — violett mit feinem Goldakzent */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 60%), " +
              "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(251,191,36,0.05) 0%, transparent 70%)",
          }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

            {/* Section-Heading */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                color: "#A78BFA", padding: "5px 12px", borderRadius: 20,
                background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.32)",
                marginBottom: 16,
              }}>
                <Crown size={12} strokeWidth={2.4} />
                Agency-Partnerschaft
              </span>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.12, color: "#fff" }}>
                Werde zur <span style={{ background: "linear-gradient(90deg, #A78BFA, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>&bdquo;Technical SEO&ldquo;-Instanz</span> für deine Kunden.
              </h2>
              <p style={{ margin: "0 auto", maxWidth: 680, fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                Verkaufe keine hübschen Websites, sondern messbare Ergebnisse. Nutze unser Audit-Tool als White-Label-Lösung und schließe Wartungsverträge schneller ab.
              </p>
            </div>

            {/* Premium-Card */}
            <div className="wf-agency-card" style={{
              padding: "clamp(36px, 4vw, 56px) clamp(28px, 4vw, 56px)",
              borderRadius: 22,
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(15,15,20,0.85) 50%, rgba(0,0,0,0.92) 100%)",
              border: "1px solid rgba(124,58,237,0.40)",
              boxShadow:
                "0 0 0 1px rgba(167,139,250,0.10), " +
                "0 0 80px rgba(124,58,237,0.18), " +
                "0 24px 60px rgba(0,0,0,0.55), " +
                "inset 0 1px 0 rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Innerer Gold-/Violett-Akzent oben rechts */}
              <div aria-hidden="true" style={{
                position: "absolute", top: -120, right: -80, width: 280, height: 280, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(251,191,36,0.10) 0%, rgba(124,58,237,0.18) 40%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Preis-Header */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 36, position: "relative" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
                    <span style={{
                      fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 900, letterSpacing: "-0.04em",
                      background: "linear-gradient(135deg, #fff 0%, #A78BFA 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      lineHeight: 1,
                    }}>
                      249&nbsp;€
                    </span>
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                      / Monat
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)",
                      padding: "2px 8px", borderRadius: 6,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
                      letterSpacing: "0.04em",
                    }}>
                      zzgl. MwSt.
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 460 }}>
                    Reines B2B-Angebot · Monatlich kündbar · Keine Mindestlaufzeit
                  </p>
                </div>

                {/* Top-right ROI-Kalk-Badge */}
                <div style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.30)",
                  maxWidth: 320,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>
                    Kostenrechnung
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
                    Bei 50 Kunden-Audits/Monat: <strong style={{ color: "#10B981" }}>unter 5&nbsp;€ pro Audit</strong>.
                    Ein einziger verkaufter Wartungsvertrag deckt die Jahresgebühr.
                  </div>
                </div>
              </div>

              {/* Drei Kern-Features */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  {
                    Icon: Palette,
                    accent: "#A78BFA",
                    accentBg: "rgba(167,139,250,0.10)",
                    accentBd: "rgba(167,139,250,0.32)",
                    title: "White-Label Reporting",
                    body: "Berichte komplett im Agentur-Design — dein Logo, deine Farben, deine Domain. Kein WebsiteFix-Schriftzug, kein Hinweis aufs Tool.",
                  },
                  {
                    Icon: Headphones,
                    accent: "#FBBF24",
                    accentBg: "rgba(251,191,36,0.08)",
                    accentBd: "rgba(251,191,36,0.30)",
                    title: "Priority Support",
                    body: "Direkter Draht für technische Fragen. Onboarding-Call beim Start, schnelle Antwortzeiten, exklusiver Slack-Channel für Agency-Partner.",
                  },
                  {
                    Icon: Magnet,
                    accent: "#10B981",
                    accentBg: "rgba(16,185,129,0.08)",
                    accentBd: "rgba(16,185,129,0.28)",
                    title: "Lead-Generator Widget",
                    body: "Einbindbares Widget für deine Agentur-Website. Sammelt vollautomatisch qualifizierte SEO-Anfragen — die Email-Adresse landet direkt in deinem Dashboard.",
                  },
                ].map(f => (
                  <div key={f.title} style={{
                    padding: "20px 22px", borderRadius: 14,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                      background: f.accentBg, border: `1px solid ${f.accentBd}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <f.Icon size={18} strokeWidth={1.8} color={f.accent} />
                    </div>
                    <h3 style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                      {f.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                      {f.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Inkludierte Kernpunkte als kompakte Zeile */}
              <div style={{
                padding: "14px 18px", borderRadius: 12, marginBottom: 28,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexWrap: "wrap" as const, gap: 14, alignItems: "center", justifyContent: "center",
              }}>
                {[
                  "Unlimitierte Scans",
                  "API-Zugriff",
                  "Eigene Subdomain (portal.agentur.de)",
                  "SMTP-Versand mit eigenem Absender",
                  "Onboarding-Call",
                ].map(p => (
                  <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    <Check size={12} strokeWidth={2.6} color="#A78BFA" />
                    {p}
                  </span>
                ))}
              </div>

              {/* CTA — Premium Button */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12, position: "relative" }}>
                <div style={{ width: "100%", maxWidth: 480 }}>
                  <CheckoutButton
                    plan="agency"
                    label="Jetzt Agency-Partnerschaft starten"
                    style={{
                      width: "100%",
                      padding: "16px 32px", borderRadius: 12, fontWeight: 800, fontSize: 15,
                      background: "linear-gradient(90deg, #5B21B6 0%, #7C3AED 50%, #A78BFA 100%)",
                      color: "#fff", border: "none",
                      boxShadow:
                        "0 6px 28px rgba(124,58,237,0.45), " +
                        "0 0 0 1px rgba(167,139,250,0.30), " +
                        "inset 0 1px 0 rgba(255,255,255,0.18)",
                      letterSpacing: "0.005em",
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.42)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ArrowRight size={11} strokeWidth={2.4} color="rgba(255,255,255,0.55)" />
                  Sofortiger Zugriff auf alle Pro-Features &amp; unlimitierte Scans
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <SiteFooter />
    </>
  );
}
