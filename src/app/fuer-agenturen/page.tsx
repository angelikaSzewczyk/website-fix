import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, BellDot, ShieldAlert } from "lucide-react";
import FaqAccordion from "../components/faq-accordion";
import RoiCalculator from "../components/roi-calculator";
import CheckoutButton from "../components/checkout-button";
import AutoCheckout from "../components/auto-checkout";
import BrandLogo from "../components/BrandLogo";
import MobileNav from "../components/MobileNav";
import AgencyStats from "../components/agency-stats";

const LayersIcon = Layers;
const BellAlertIcon = BellDot;
const ShieldAlertIcon = ShieldAlert;

export const metadata: Metadata = {
  title: "WebsiteFix für Agenturen — Automatische Wartungsverträge & BFSG",
  description: "Verwandeln Sie Ihre Wartung in eine Profit-Maschine. White-Label Reports, BFSG-Compliance und Jira-Integration für Web-Agenturen.",
};

const PLANS = [
  {
    name: "Agency Starter",
    price: "99",
    per: "/Monat",
    desc: "Für Agenturen mit bis zu 10 Projekten",
    accent: "#2563EB",
    features: [
      { text: "10 Projekt-Slots", highlight: true },
      { text: "Neutrales Branding", highlight: true },
      { text: "Kunden-Management-Dashboard", highlight: true },
      { text: "Team-Initialen in der Matrix", highlight: true },
      { text: "PDF-Berichte & Score-Historie", highlight: false },
      { text: "24/7 Live-Monitoring", highlight: false },
    ],
    cta: "Agency-Account erstellen",
    href: "/register",
    recommended: false,
    scale: false,
    enterprise: false,
  },
  {
    name: "Agency Pro",
    price: "199",
    per: "/Monat",
    desc: "Full White-Label für professionelle Agenturen",
    accent: "#7C3AED",
    features: [
      { text: "Unlimitierte Projekte (∞)", highlight: true, key: false },
      { text: "Full White-Label (Logo & Farben)", highlight: true, key: true },
      { text: "Eigene Subdomain (portal.ihre-agentur.de)", highlight: true, key: true },
      { text: "Automatischer Report-Versand an Kunden", highlight: true, key: false },
      { text: "Kunden-Login-Bereich", highlight: true, key: true },
      { text: "E-Mail Absendername konfigurierbar", highlight: false, key: false },
    ],
    cta: "Agency-Account erstellen",
    href: "/register",
    recommended: true,
    scale: false,
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
    q: "Bietet WebsiteFix Schutz vor dem BFSG 2025?",
    a: "Ja. Unser System überwacht Ihre Projekte kontinuierlich auf WCAG 2.1-Richtlinien und liefert den notwendigen Audit-Trail für Ihre Haftungsfreistellung. Ab Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) für die meisten kommerziellen Websites — Agenturen, die Websites betreuen, tragen Mitverantwortung.",
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
              <Link href="/register" className="hide-sm" style={{
                fontSize: 13, padding: "7px 18px", borderRadius: 8, fontWeight: 700,
                background: "#007BFF", color: "#fff", textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,123,255,0.4)",
              }}>
                Kostenlos starten →
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
              Exklusiv für Web-Agenturen &amp; Freelancer
            </div>

            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
              Skalieren Sie Ihre Agentur mit automatisierten Wartungsumsätzen
            </h1>

            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 640, margin: "0 auto 40px", fontWeight: 400 }}>
              Generieren Sie monatlich wiederkehrende Erlöse (MRR) durch vollautomatisierte BFSG-&amp; Sicherheits-Audits. Schützen Sie Ihre Kunden und steigern Sie Ihre Marge – ohne eine einzige Stunde Mehrarbeit.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <CheckoutButton
                plan="agency_core"
                label="Jetzt Agency-Account erstellen →"
                style={{
                  padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: "linear-gradient(90deg, #007BFF, #0057b8)",
                  color: "#fff", border: "none",
                  boxShadow: "0 4px 32px rgba(0,123,255,0.60), 0 0 64px rgba(0,123,255,0.25)",
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
              Exklusive Agency-Konditionen · Keine Mindestlaufzeit · DSGVO-konform
            </p>

            {/* Animated trust stats */}
            <AgencyStats />
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
                          { label: "BFSG-Check", value: "100%" },
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
                desc: "Verknüpfen Sie Ihre Kunden-Websites und Ihre Workflow-Tools (Jira, Trello, Asana) in Sekunden. Kein Plugin, kein Hosting-Zugang — einfach URL eintragen und los.",
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
                desc: "Die KI scannt täglich oder wöchentlich auf BFSG-Konformität, Technik-Fehler und Performance. Fehler landen automatisch als Ticket — direkt wo Ihr Team arbeitet.",
                color: "#8df3d3",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                ),
                pills: ["BFSG-Konformität", "Performance-Scan", "Täglich · Wöchentlich", "Haftungsschutz inklusive"],
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
                  <svg width="22" height="22" viewBox="0 0 24 24"><g fill="#c084fc"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></g></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Slack</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Echtzeit-Alerts für Ihr Team. Wissen, wenn es brennt, bevor der Kunde anruft.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="integ-pulse integ-pulse-slack" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(192,132,252,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Nicht verbunden</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 7, background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)", color: "rgba(192,132,252,0.9)", cursor: "pointer" }}>
                  Verknüpfen →
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#7aa6ff"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Jira</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Automatisierte Tickets. Fehler werden ohne manuelles Kopieren direkt zu Entwickler-Tasks.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="integ-pulse integ-pulse-jira" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(122,166,255,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Nicht verbunden</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 7, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(122,166,255,0.3)", color: "rgba(122,166,255,0.9)", cursor: "pointer" }}>
                  Verknüpfen →
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#5bb8fa"><path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Trello</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Kanban für Wartungs-Tasks</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="integ-pulse integ-pulse-trello" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(91,184,250,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Nicht verbunden</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 7, background: "rgba(0,121,191,0.1)", border: "1px solid rgba(91,184,250,0.3)", color: "rgba(91,184,250,0.9)", cursor: "pointer" }}>
                  Verknüpfen →
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff6d2d"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.83 14.5H13.5v4.33a1.5 1.5 0 0 1-3 0V14.5H6.17a1.5 1.5 0 0 1 0-3H10.5V7.17a1.5 1.5 0 0 1 3 0V11.5h4.33a1.5 1.5 0 0 1 0 3z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Zapier</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Grenzenlose Freiheit. Verbinden Sie WebsiteFix mit über 5.000 Apps wie HubSpot oder Salesforce.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="integ-pulse integ-pulse-zapier" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,109,45,0.4)", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Nicht verbunden</span>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 7, background: "rgba(255,80,10,0.1)", border: "1px solid rgba(255,109,45,0.3)", color: "rgba(255,109,45,0.9)", cursor: "pointer" }}>
                  Verknüpfen →
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
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,107,107,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Das Problem</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
            Warum Agenturen Zeit verlieren.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: "0 0 48px", maxWidth: 560, lineHeight: 1.7 }}>
            Drei Situationen, die Sie kennen. Und die Sie jeden Monat Stunden und Vertrauen kosten.
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
                IconEl: ShieldAlertIcon,
                glow: "rgba(255,107,107,0.16)",
                border: "rgba(255,107,107,0.25)",
                iconColor: "#fca5a5",
                title: "BFSG-Haftung: Sie haften, nicht der Kunde",
                desc: "Das Barrierefreiheitsstärkungsgesetz gilt seit Juni 2025. Wer die Website wartet, trägt Mitverantwortung. Ein manuelles WCAG-Audit kostet 4–8h pro Website — unmöglich skalierbar.",
                quote: `\u201EWir brauchen eine WCAG-konforme Website. Können Sie das garantieren?\u201C`,
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
                  plan="agency_core"
                  label="Jetzt White-Label einrichten →"
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
                Gebaut für Agenturen, die skalieren.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Jedes Feature ist darauf ausgelegt, Ihren Workflow zu automatisieren und Ihre Kunden zu begeistern.
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
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Neue Umsatzpotenziale</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    Verwandeln Sie Ihre Wartungsleistungen in monatlich wiederkehrende Umsätze. Automatisierte BFSG-Audits und Sicherheits-Checks rechtfertigen höhere Wartungspauschalen – ohne zusätzlichen Aufwand.
                  </p>
                  <ul style={{ margin: "auto 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["WCAG 2.1 AA vollständig", "Audit-Trail als Nachweis", "Automatische Meldung bei Verstoß", "BFSG Haftungsschutz-Monitor"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b === "BFSG Haftungsschutz-Monitor" ? <strong style={{ color: "#a5c1ff", fontWeight: 700 }}>{b}</strong> : b}
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

                {/* Badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18,
                  padding: "5px 14px", borderRadius: 20, fontSize: 11,
                  background: "rgba(61,211,152,0.08)", border: "1px solid rgba(61,211,152,0.22)",
                  color: "#3dd398", fontWeight: 700, letterSpacing: "0.06em",
                }}>
                  ⚡ Powered by Next.js &amp; Edge Computing
                </div>

                <h3 style={{ margin: "0 0 14px", fontWeight: 800, fontSize: "clamp(18px, 2.5vw, 24px)", letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.3 }}>
                  Keine WordPress-Abhängigkeit.<br />
                  <span style={{ color: "#3dd398" }}>Kein Plugin. Kein Risiko. Maximale Performance.</span>
                </h3>

                <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 620 }}>
                  WebsiteFix ist eine <strong style={{ color: "rgba(255,255,255,0.8)" }}>reine SaaS-Cloud-Lösung</strong>, gebaut auf Next.js und globalen Edge-Servern —
                  kein Plugin, das Sie bei Ihren Kunden installieren müssen, kein Zugriff auf deren Hosting-Server,
                  keine Sicherheitslücken durch veraltete Drittanbieter-Module.
                  Das Scanning läuft in Echtzeit auf unserer Infrastruktur — Ihre Kunden-Server werden dabei
                  in keiner Weise belastet.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                  {[
                    { icon: "🌍", title: "Edge Computing", desc: "Scans laufen auf globalen Edge-Nodes — latenzarm, ausfallsicher" },
                    { icon: "🔒", title: "Maximale Sicherheit", desc: "Kein Hosting-Zugang nötig — keine Credentials Ihrer Kunden bei uns" },
                    { icon: "⚡", title: "Echtzeit-Scanning", desc: "Ergebnisse in unter 60 Sekunden — ohne Wartezeiten oder Queues" },
                    { icon: "🇩🇪", title: "DSGVO by Design", desc: "Server in Deutschland, TLS-verschlüsselt, AVV inklusive" },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} style={{
                      padding: "16px 18px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Stack Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.03em" }}>
                  {["Next.js 15", "React 19", "Edge Runtime", "Neon Serverless DB", "Vercel Edge Network", "TypeScript"].map(tag => (
                    <span key={tag} style={{
                      padding: "4px 10px", borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(61,211,152,0.7)", fontWeight: 600,
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
              {PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: plan.recommended ? `2px solid #2563EB` : `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: plan.recommended
                    ? "0 0 60px rgba(37,99,235,0.22), 0 8px 40px rgba(37,99,235,0.18), 0 0 0 1px rgba(37,99,235,0.15)"
                    : "0 2px 20px rgba(0,0,0,0.3)",
                }}>
                  {/* Top stripe */}
                  {plan.recommended && (
                    <div style={{ background: "#2563EB", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>★ BESTSELLER</span>
                    </div>
                  )}
                  {plan.scale && (
                    <div style={{ background: "#7C3AED", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>SCALE</span>
                    </div>
                  )}
                  {plan.enterprise && (
                    <div style={{ background: "#0F172A", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em" }}>ENTERPRISE</span>
                    </div>
                  )}
                  {!plan.recommended && !plan.scale && !plan.enterprise && (
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)" }} />
                  )}

                  <div style={{ padding: "28px 28px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: plan.recommended ? "#7aa6ff" : plan.enterprise ? "rgba(255,255,255,0.5)" : plan.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        {plan.enterprise ? (
                          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>Auf Anfrage</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{plan.price}€</span>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{plan.per}</span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{plan.desc}</p>
                    </div>

                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: (f as {text:string;highlight:boolean;key?:boolean}).key
                              ? "rgba(122,166,255,0.2)"
                              : f.highlight
                                ? (plan.recommended ? "#2563EB" : plan.scale ? "#7C3AED" : plan.enterprise ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.12)")
                                : "rgba(255,255,255,0.07)",
                            border: (f as {text:string;highlight:boolean;key?:boolean}).key ? "1px solid rgba(122,166,255,0.35)" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={(f as {text:string;highlight:boolean;key?:boolean}).key ? "#a5c1ff" : f.highlight ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: (f as {text:string;highlight:boolean;key?:boolean}).key ? 700 : f.highlight ? 600 : 400, color: (f as {text:string;highlight:boolean;key?:boolean}).key ? "#a5c1ff" : f.highlight ? "#fff" : "rgba(255,255,255,0.4)" }}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ paddingBottom: 24 }}>
                      <CheckoutButton
                        plan={plan.enterprise ? "enterprise" : plan.scale ? "agency_scale" : plan.recommended ? "agency_core" : "freelancer"}
                        label={plan.cta}
                        href={plan.enterprise ? plan.href : undefined}
                        style={{
                          display: "block", textAlign: "center", width: "100%",
                          padding: "13px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                          textDecoration: "none",
                          background: plan.recommended ? "#2563EB" : plan.scale ? "#7C3AED" : plan.enterprise ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
                          color: plan.recommended || plan.scale ? "#ffffff" : "rgba(255,255,255,0.7)",
                          border: plan.recommended || plan.scale ? "none" : "1px solid rgba(255,255,255,0.1)",
                          boxShadow: plan.recommended ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                Strategien zu Barrierefreiheit, Workflow-Optimierung und Haftungsschutz.
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
                  Erfahren Sie, wie Sie Ihre Kunden vor Abmahnungen schützen und die neue Gesetzgebung als Umsatz-Chance nutzen.
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

        {/* CTA BANNER */}
        <section style={{ padding: "60px 24px 80px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="wf-agency-cta-banner" style={{
              padding: "clamp(40px, 5vw, 64px) clamp(28px, 5vw, 56px)",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(0,123,255,0.07) 0%, rgba(0,0,0,0.35) 100%)",
              border: "1px solid rgba(0,123,255,0.2)",
              boxShadow: "0 0 80px rgba(0,123,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "50%", height: "200%", background: "radial-gradient(ellipse, rgba(0,123,255,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div className="wf-agency-cta-text" style={{ position: "relative" }}>
                <h2 style={{ margin: "0 0 10px", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  Starten Sie jetzt —<br />erste Website kostenlos.
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Keine Installation. Ergebnis in unter 60 Sekunden.
                </p>
              </div>
              <div className="wf-agency-cta-actions" style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", alignItems: "flex-start" }}>
                <div className="wf-agency-cta-btn">
                  <CheckoutButton
                    plan="agency_core"
                    label="Jetzt Agency-Account erstellen →"
                    style={{
                      padding: "14px 32px", borderRadius: 11, fontWeight: 800, fontSize: 15,
                      background: "linear-gradient(90deg, #007BFF, #0057b8)",
                      color: "#fff", border: "none", whiteSpace: "nowrap",
                      boxShadow: "0 4px 24px rgba(0,123,255,0.4)",
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingLeft: 4 }}>
                  Agency Starter ab 99€/Monat · Monatlich kündbar. Keine Mindestlaufzeit.
                </span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", marginTop: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            {`© ${new Date().getFullYear()} website-fix.com`}
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Startseite</Link>
            <Link href="/fuer-agenturen" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 600 }}>Für Agenturen</Link>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Blog</Link>
            <Link href="/impressum" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
            <Link href="/datenschutz" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
