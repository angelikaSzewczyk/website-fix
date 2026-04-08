import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion from "./components/faq-accordion";
import RoiCalculator from "./components/roi-calculator";

export const metadata: Metadata = {
  title: "WebsiteFix — Das Betriebssystem für deine Website-Wartung",
  description: "Automatisierte Überwachung, KI-gestützte Fehlerbehebung und professionelle White-Label-Reports für Web-Agenturen. WCAG, SEO, Performance & Monitoring in einem Tool.",
};

const STEPS = [
  {
    num: "01",
    label: "Überwachen",
    title: "Monitoring & WCAG",
    desc: "Alle Kunden-Websites werden täglich automatisch auf Uptime, SSL, Performance und WCAG-Verstöße geprüft. Du erfährst von Problemen, bevor der Kunde anruft.",
    color: "#7aa6ff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    pills: ["Uptime-Check", "SSL-Monitoring", "WCAG 2.1 AA", "Sofort-Alert"],
  },
  {
    num: "02",
    label: "Lösen",
    title: "KI-Assistent & Jira",
    desc: "Für jeden gefundenen Fehler generiert die KI sofort einen konkreten Code-Fix. Komplexe Issues werden als Jira-Ticket delegiert — direkt aus dem Dashboard.",
    color: "#8df3d3",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    pills: ["KI-Code-Fix", "Jira-Integration", "Slack-Alerts", "Audit-Trail"],
  },
  {
    num: "03",
    label: "Beweisen",
    title: "White-Label Reports",
    desc: "Am Monatsende wird automatisch ein professioneller Report mit deinem Logo, deiner Farbe und KI-generierter Management-Zusammenfassung an jeden Kunden versendet.",
    color: "#c084fc",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    pills: ["Agentur-Branding", "KI-Zusammenfassung", "PDF-Export", "Auto-Versand"],
  },
];

const BENTO = [
  {
    title: "24/7 Monitoring",
    desc: "SSL, Uptime, Security Headers — für alle Kunden-Websites gleichzeitig. Täglich automatisch, ohne manuellen Aufwand.",
    color: "#7aa6ff",
    pill: "Automatisch",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    wide: true,
  },
  {
    title: "Sofort-Alert",
    desc: "Du weißt von Problemen, bevor der Kunde anruft. Klare Diagnose, sofort per E-Mail.",
    color: "#ffd93d",
    pill: "Proaktiv",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    wide: true,
  },
  {
    title: "Auto-Monatsbericht",
    desc: "PDF mit deinem Logo wird am 1. jeden Monats automatisch an jeden Kunden gesendet.",
    color: "#8df3d3",
    pill: "White-Label",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    wide: false,
  },
  {
    title: "KI-Code-Fix",
    desc: "Jeder Fehler kommt mit einem konkreten, sofort einsetzbaren Code-Fix auf Deutsch.",
    color: "#c084fc",
    pill: "KI-gestützt",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    wide: false,
  },
];

const PLANS = [
  {
    name: "Freelancer",
    price: "29",
    per: "/Monat",
    desc: "Für Solo-Freelancer mit ersten Kunden",
    badge: null,
    accent: "#475569",
    accentBg: "#F1F5F9",
    accentBorder: "#E2E8F0",
    features: [
      { text: "Bis zu 3 Projekte", highlight: false },
      { text: "Manuelle Scans", highlight: false },
      { text: "WCAG · SEO · Performance", highlight: false },
      { text: "KI-Diagnose auf Deutsch", highlight: false },
      { text: "Einfache PDF-Berichte", highlight: false },
      { text: "E-Mail-Support", highlight: false },
    ],
    cta: "Kostenlos starten",
    href: "/login",
    recommended: false,
    enterprise: false,
  },
  {
    name: "Agency Core",
    price: "149",
    per: "/Monat",
    desc: "Für wachsende Agenturen mit Wartungskunden",
    badge: "BESTSELLER",
    accent: "#2563EB",
    accentBg: "#EFF6FF",
    accentBorder: "#BFDBFE",
    features: [
      { text: "Bis zu 20 Projekte", highlight: true },
      { text: "Wöchentliche Deep-Scans", highlight: true },
      { text: "White-Label (Dein Logo)", highlight: true },
      { text: "Jira / Trello / Asana", highlight: true },
      { text: "Auto-Monatsberichte", highlight: false },
      { text: "3 Team-Seats", highlight: false },
      { text: "Prio-Support", highlight: false },
    ],
    cta: "Agency-Account erstellen",
    href: "/login",
    recommended: true,
    enterprise: false,
  },
  {
    name: "Agency Scale",
    price: "299",
    per: "/Monat",
    desc: "Für Agenturen, die skalieren wollen",
    badge: "SCALE",
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentBorder: "#DDD6FE",
    features: [
      { text: "Bis zu 50 Projekte", highlight: true },
      { text: "Vollautomatische Scans", highlight: true },
      { text: "Reports direkt an Endkunden", highlight: true },
      { text: "BFSG Haftungsschutz-Monitor", highlight: true },
      { text: "Unbegrenzte Team-Seats", highlight: false },
      { text: "Priorisierter Support", highlight: false },
      { text: "Custom Branding", highlight: false },
    ],
    cta: "Scale-Account erstellen",
    href: "/login",
    recommended: false,
    enterprise: false,
    scale: true,
  },
  {
    name: "Enterprise",
    price: "Individuell",
    per: "",
    desc: "Für große Agenturen & Reseller",
    badge: "ENTERPRISE",
    accent: "#0F172A",
    accentBg: "#F8FAFC",
    accentBorder: "#E2E8F0",
    features: [
      { text: "Unbegrenzte Projekte", highlight: true },
      { text: "Täglicher Security-Puls", highlight: true },
      { text: "API-Zugriff & Webhooks", highlight: true },
      { text: "Custom Branding & Domain", highlight: true },
      { text: "SLA & Dedicated Support", highlight: false },
      { text: "SSO / SAML", highlight: false },
      { text: "On-Premise Option", highlight: false },
    ],
    cta: "Kontakt aufnehmen",
    href: "mailto:support@website-fix.com?subject=Enterprise",
    recommended: false,
    enterprise: true,
  },
];

const FAQ = [
  {
    q: "Für welche Websites funktioniert das?",
    a: "Für jede öffentlich erreichbare Website — WordPress, Shopify, Wix, Squarespace, TYPO3, Custom-Entwicklungen. Kein Plugin, kein Hosting-Zugang nötig.",
  },
  {
    q: "Was ist der Unterschied zwischen Pro und Agentur?",
    a: "Pro ist für einzelne Websites. Der Agentur-Plan bietet White-Label Reports, automatische Monatsberichte, Team-Zugang und eine Kunden-Übersicht für bis zu 30 Domains.",
  },
  {
    q: "Muss ich etwas installieren?",
    a: "Nein. Einfach URL eingeben. Kein Plugin, kein FTP-Zugang, kein Code.",
  },
  {
    q: "Was ist BFSG und bin ich betroffen?",
    a: "Das Barrierefreiheitsstärkungsgesetz gilt seit Juni 2025 für bestimmte B2C-Dienstleistungen (u.a. Online-Shops, Banking, Telekommunikation). Unser WCAG-Scan prüft die relevanten Kriterien.",
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
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #007BFF, #0057b8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(0,123,255,0.35)",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
              Website<span style={{ color: "#007BFF" }}>Fix</span>
            </span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div className="hide-sm" style={{ display: "flex", gap: 24 }}>
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Für Agenturen</Link>
              <Link href="/blog" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Blog</Link>
              <Link href="#pricing" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Preise</Link>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/login" className="hide-sm" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Anmelden
              </Link>
              <Link href="/scan" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8, fontWeight: 600,
                background: "#fff", color: "#0b0c10", textDecoration: "none",
              }}>
                Kostenlos scannen
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>

        {/* HERO */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px 72px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(122,166,255,0.25)",
            background: "rgba(122,166,255,0.06)",
            fontSize: 12, color: "#7aa6ff", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7aa6ff", boxShadow: "0 0 6px #7aa6ff" }} />
            Monitoring · KI-Fix · White-Label Reports
          </div>

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
            Verdiene mehr mit automatisierten<br />Wartungsverträgen.
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 640, margin: "0 auto 40px", fontWeight: 400 }}>
            WebsiteFix ist das White-Label Dashboard für Agenturen. Scanne Kunden-Websites vollautomatisch, erstelle Profi-Reports und integriere alles in Jira, Trello oder Asana.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
            }}>
              Jetzt Agentur-Account erstellen →
            </Link>
            <Link href="#pricing" style={{
              padding: "14px 28px", borderRadius: 10, fontSize: 15,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}>
              Preise ansehen
            </Link>
          </div>

          <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
            Keine Kreditkarte · Keine Installation · Ergebnis in unter 60 Sekunden
          </p>

          {/* ── DASHBOARD PREVIEW MOCKUP ── */}
          <div style={{
            marginTop: 64, position: "relative",
            maxWidth: 860, marginLeft: "auto", marginRight: "auto",
          }}>
            {/* Glow behind mockup */}
            <div style={{
              position: "absolute", inset: "-40px -60px",
              background: "radial-gradient(ellipse at 50% 60%, rgba(0,123,255,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Browser frame */}
            <div style={{
              position: "relative", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0d0f14",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
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
              <div style={{ display: "flex", height: 360 }}>

                {/* Sidebar */}
                <div style={{
                  width: 160, flexShrink: 0,
                  background: "#0A192F",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  padding: "16px 10px",
                  display: "flex", flexDirection: "column", gap: 3,
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
                      background: item.active ? "rgba(0,123,255,0.15)" : "transparent",
                      borderLeft: item.active ? "2px solid #007BFF" : "2px solid transparent",
                      fontWeight: item.active ? 600 : 400,
                    }}>
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main content: White-Label Report preview */}
                <div style={{ flex: 1, padding: "16px", overflowY: "hidden", background: "#0d0f14" }}>
                  {/* Report card */}
                  <div style={{
                    background: "#fff", borderRadius: 10, overflow: "hidden",
                    fontSize: 0, /* collapse whitespace */
                  }}>
                    {/* Report header */}
                    <div style={{
                      background: "linear-gradient(135deg, #007BFF, #0057b8)",
                      padding: "12px 16px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>M</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Muster Agentur GmbH</div>
                          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>Monatlicher Website-Report</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>April 2026</div>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>Müller & Söhne Sanitär</div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 16px" }}>
                      {/* Executive summary box */}
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(0,123,255,0.06)", border: "1px solid rgba(0,123,255,0.15)", marginBottom: 10 }}>
                        <div style={{ fontSize: 7, fontWeight: 700, color: "#007BFF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Management-Zusammenfassung</div>
                        <div style={{ fontSize: 8, color: "#444", lineHeight: 1.6 }}>
                          Im April 2026 haben wir alle vereinbarten Leistungen erbracht und den reibungslosen Betrieb Ihrer Website sichergestellt. Durch proaktive WCAG-Audits und sofortige Fehlerbehebung per KI-Assistent wurde die Rechtssicherheit Ihrer Online-Präsenz kontinuierlich gewährleistet.
                        </div>
                      </div>

                      {/* KPI row */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                        {[
                          { label: "Uptime", value: "98%", color: "#007BFF" },
                          { label: "Ladezeit", value: "420ms", color: "#007BFF" },
                          { label: "Scans", value: "3", color: "#007BFF" },
                          { label: "Aktionen", value: "7", color: "#007BFF" },
                        ].map(k => (
                          <div key={k.label} style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #e5e7eb", textAlign: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
                            <div style={{ fontSize: 7, color: "#999", marginTop: 1 }}>{k.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Activity rows */}
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
                            <span style={{ flex: 1, fontSize: 8, color: "#333" }}>{a.label}</span>
                            <span style={{ fontSize: 7, color: "#bbb" }}>{a.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Caption */}
            <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              White-Label Report — mit deinem Logo, deiner Farbe, deinem Namen
            </p>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* 3 STEPS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center" }}>
            So funktioniert es
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 56px", letterSpacing: "-0.02em", textAlign: "center" }}>
            Drei Schritte zu mehr Marge.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
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
                  fontSize: 64, fontWeight: 900, color: `${step.color}08`,
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

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* AGENCY BENTO */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Für Agenturen</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                30 Websites.<br />Null manuelle Reports.
              </h2>
            </div>
            <Link href="/fuer-agenturen" style={{
              padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(122,166,255,0.25)", color: "#7aa6ff",
              textDecoration: "none", background: "rgba(122,166,255,0.06)", whiteSpace: "nowrap",
            }}>
              Mehr erfahren →
            </Link>
          </div>

          {/* Bento grid: 2 wide top, 2 narrow bottom */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {BENTO.map((item, i) => (
              <div key={i} style={{
                padding: item.wide ? "28px 28px" : "22px 24px",
                border: `1px solid ${item.color}18`,
                borderRadius: 14,
                background: `${item.color}07`,
                position: "relative", overflow: "hidden",
              }}>
                {/* watermark */}
                <div style={{
                  position: "absolute", right: 16, bottom: 10,
                  fontSize: 52, fontWeight: 900, color: `${item.color}06`,
                  lineHeight: 1, pointerEvents: "none", userSelect: "none",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: `${item.color}15`, border: `1px solid ${item.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}22`,
                    letterSpacing: "0.06em",
                  }}>
                    {item.pill}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, maxWidth: 340 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AGENTUR FEATURES ── */}
        <section style={{ background: "#F0F4F8", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.12em" }}>Agentur-Features</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#0F172A" }}>
                Gebaut für Agenturen, die skalieren.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "#64748B", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Jedes Feature ist darauf ausgelegt, deinen Agentur-Workflow zu automatisieren und deine Kunden zu beeindrucken.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  ),
                  iconBg: "#EFF6FF",
                  iconBorder: "#BFDBFE",
                  title: "White-Label PDF",
                  desc: "Reports mit deinem Logo, deiner Farbe und KI-generierter Management-Zusammenfassung — automatisch am Monatsende versendet.",
                  tag: "Branding",
                  tagColor: "#2563EB",
                  tagBg: "#EFF6FF",
                  bullets: ["Agentur-Logo & Farben", "KI-Zusammenfassung", "Auto-Versand an Kunden"],
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                  iconBg: "#F0FDF4",
                  iconBorder: "#A7F3D0",
                  title: "Multi-User Support",
                  desc: "Lade Kollegen ein, vergib Rollen und lass dein Team zusammen an Kunden-Projekten arbeiten — ohne Chaos.",
                  tag: "Teamwork",
                  tagColor: "#16A34A",
                  tagBg: "#F0FDF4",
                  bullets: ["Bis zu 5 Team-Seats", "Rollen & Berechtigungen", "Gemeinsame Kunden-Übersicht"],
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                  iconBg: "#FFFBEB",
                  iconBorder: "#FDE68A",
                  title: "Automatischer Workflow",
                  desc: "Befunde werden direkt als Jira-Tickets, Trello-Karten oder Asana-Tasks erstellt. Slack meldet sich, bevor der Kunde anruft.",
                  tag: "Automation",
                  tagColor: "#D97706",
                  tagBg: "#FFFBEB",
                  bullets: ["Jira · Trello · Asana", "Slack-Alerts in Echtzeit", "Auto-Pilot Scan-Intervall"],
                },
              ].map(f => (
                <div key={f.title} style={{
                  background: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: "28px 26px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  display: "flex", flexDirection: "column", gap: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: f.iconBg, border: `1px solid ${f.iconBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {f.icon}
                    </div>
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                        background: f.tagBg, color: f.tagColor, letterSpacing: "0.06em",
                      }}>{f.tag}</span>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>{f.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {f.bullets.map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <RoiCalculator />

        {/* PRICING */}
        <section id="pricing" style={{ background: "#ffffff", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#0F172A" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "#64748B" }}>
                Keine versteckten Kosten. Monatlich kündbar. DSGVO-konform.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, alignItems: "stretch" }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: "#ffffff",
                  border: plan.recommended ? `2px solid #2563EB` : `1px solid #E2E8F0`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: plan.recommended
                    ? "0 8px 40px rgba(37,99,235,0.15)"
                    : plan.enterprise
                      ? "0 4px 24px rgba(0,0,0,0.08)"
                      : "0 2px 12px rgba(0,0,0,0.05)",
                  position: "relative",
                }}>

                  {/* Top stripe / badge */}
                  {plan.recommended && (
                    <div style={{
                      background: "#2563EB", padding: "8px 24px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>
                        ★ BESTSELLER
                      </span>
                    </div>
                  )}
                  {"scale" in plan && plan.scale && (
                    <div style={{
                      background: "#7C3AED", padding: "8px 24px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>
                        SCALE
                      </span>
                    </div>
                  )}
                  {plan.enterprise && (
                    <div style={{
                      background: "#0F172A", padding: "8px 24px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em" }}>
                        ENTERPRISE
                      </span>
                    </div>
                  )}
                  {!plan.recommended && !("scale" in plan && plan.scale) && !plan.enterprise && (
                    <div style={{ height: 4, background: "#F1F5F9" }} />
                  )}

                  <div style={{ padding: "28px 28px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Plan name + desc */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: plan.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {plan.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        {plan.enterprise ? (
                          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>Auf Anfrage</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#0F172A" }}>{plan.price}€</span>
                            <span style={{ fontSize: 13, color: "#94A3B8" }}>{plan.per}</span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>{plan.desc}</p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "#F1F5F9", marginBottom: 20 }} />

                    {/* Feature list */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: f.highlight
                              ? (plan.recommended ? "#2563EB" : plan.enterprise ? "#0F172A" : "#475569")
                              : "#F1F5F9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "#fff" : "#94A3B8"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: f.highlight ? 600 : 400,
                            color: f.highlight ? "#0F172A" : "#64748B",
                          }}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA button */}
                    <div style={{ paddingBottom: 28 }}>
                      <Link href={plan.href} style={{
                        display: "block", textAlign: "center",
                        padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        textDecoration: "none",
                        background: plan.recommended
                          ? "#2563EB"
                          : plan.enterprise
                            ? "#0F172A"
                            : "#F8FAFC",
                        color: plan.recommended || plan.enterprise ? "#ffffff" : "#475569",
                        border: plan.recommended || plan.enterprise ? "none" : "1px solid #E2E8F0",
                        boxShadow: plan.recommended
                          ? "0 4px 14px rgba(37,99,235,0.35)"
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
              {["Keine Kreditkarte nötig", "Jederzeit kündbar", "DSGVO-konform", "Daten in Deutschland"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94A3B8" }}>
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

        {/* TESTIMONIALS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Kundenstimmen
            </p>
            <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Vertraut von führenden Agenturen
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
            {/* Testimonial 1 — Profit */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "28px 28px 24px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                "Seit wir website-fix.com nutzen, fakturieren wir den BFSG-Report als eigene Position — <strong style={{ color: "#fff", fontStyle: "normal" }}>+400€ Zusatzumsatz pro Wartungskunde</strong>. Das Tool hat sich im ersten Monat amortisiert."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>M</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Markus T.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Geschäftsführer, Pixelwerk Agentur</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 — Effizienz */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "28px 28px 24px",
              display: "flex", flexDirection: "column", gap: 20,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 20, right: 20,
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                background: "rgba(37,99,235,0.15)", color: "#7aa6ff",
                border: "1px solid rgba(37,99,235,0.25)", letterSpacing: "0.04em",
              }}>Jira-Integration</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                "Die <strong style={{ color: "#fff", fontStyle: "normal" }}>Jira-Integration ist ein Game-Changer</strong>. Scan läuft, Tickets landen automatisch beim Entwickler — ohne Copy-Paste. Wir sparen locker 3 Stunden pro Woche."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #059669 0%, #0891B2 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>S</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Sarah K.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Projektleiterin, Studio Nord GmbH</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 — Sicherheit */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "28px 28px 24px",
              display: "flex", flexDirection: "column", gap: 20,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 20, right: 20,
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                background: "rgba(5,150,105,0.15)", color: "#34D399",
                border: "1px solid rgba(5,150,105,0.25)", letterSpacing: "0.04em",
              }}>BFSG-Report</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                "Kein Kunde hat uns nach dem BFSG-Inkrafttreten um Schadenersatz gebeten — weil wir durch den <strong style={{ color: "#fff", fontStyle: "normal" }}>automatischen BFSG-Report schon Monate vorher</strong> alle Lücken geschlossen hatten."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #D97706 0%, #DC2626 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>T</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Tobias M.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Inhaber, Webagentur Rheinland</div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo band */}
          <div style={{ marginTop: 56, paddingBottom: 64 }}>
            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 28 }}>
              Agenturen, die uns vertrauen
            </p>
            <div style={{
              display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", alignItems: "center",
            }}>
              {[
                "Pixelwerk Agentur",
                "Studio Nord GmbH",
                "Webagentur Rheinland",
                "Digitalhaus München",
                "Kreativbüro Berlin",
                "WebFactory Hamburg",
              ].map(name => (
                <div key={name} style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  fontSize: 13, fontWeight: 600,
                  color: "rgba(255,255,255,0.22)",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* FAQ ACCORDION */}
        <section id="faq" style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 40px", letterSpacing: "-0.025em" }}>
            Häufige Fragen
          </h2>
          <FaqAccordion items={FAQ} />
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* BLOG TEASER */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Neu im Blog</p>
              <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                Bist du bereit für das BFSG 2025?
              </h2>
            </div>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Alle Artikel →
            </Link>
          </div>

          <Link href="/blog/bfsg-2025-agenturen" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              padding: "28px 32px",
              border: "1px solid rgba(122,166,255,0.15)",
              borderRadius: 14,
              background: "rgba(122,166,255,0.04)",
              display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "rgba(122,166,255,0.12)", border: "1px solid rgba(122,166,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                    background: "rgba(122,166,255,0.12)", color: "#7aa6ff",
                    border: "1px solid rgba(122,166,255,0.2)", letterSpacing: "0.05em",
                  }}>
                    Recht & WCAG
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>5 Min. Lesezeit</span>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                  Das BFSG 2025 – Warum Agenturen jetzt handeln müssen (oder haften)
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  Ab dem 28. Juni 2025 greift das Barrierefreiheitsstärkungsgesetz. Was das für Agenturen mit Wartungskunden bedeutet — und wie du die Pflicht in ein Profit-Center verwandelst.
                </p>
              </div>
              <span style={{ fontSize: 13, color: "#7aa6ff", fontWeight: 600, whiteSpace: "nowrap", alignSelf: "center" }}>
                Jetzt lesen →
              </span>
            </div>
          </Link>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* CTA BANNER */}
        <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{
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
              background: "radial-gradient(ellipse, rgba(0,123,255,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Deine erste Website<br />scannt du kostenlos.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Keine Kreditkarte. Keine Installation.<br />Ergebnis in unter 60 Sekunden.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", position: "relative" }}>
              <Link href="/scan" style={{
                padding: "15px 36px", borderRadius: 11, fontWeight: 800, fontSize: 16,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 24px rgba(0,123,255,0.4)",
                letterSpacing: "-0.01em",
              }}>
                Jetzt kostenlos scannen →
              </Link>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingLeft: 4 }}>
                Danach: Agentur-Plan für 149€/Monat
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            {`© ${new Date().getFullYear()} website-fix.com`}
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/impressum" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
            <Link href="/datenschutz" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Blog</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
