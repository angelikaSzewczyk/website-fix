import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion from "./components/faq-accordion";
import BrandLogo from "./components/BrandLogo";
import NavAuthLink from "./components/nav-auth-link";
import MobileNav from "./components/MobileNav";
import InlineScan from "./components/inline-scan";

export const metadata: Metadata = {
  title: "WebsiteFix — Das Betriebssystem für deine Website-Wartung",
  description: "Automatisierte Überwachung, KI-gestützte Fehlerbehebung und professionelle White-Label-Reports für Web-Agenturen. WCAG, SEO, Performance & Monitoring in einem Tool.",
};

const STEPS = [
  {
    num: "01",
    label: "Schritt 01",
    title: "Externer Deep Scan",
    desc: "Trage deine URL ein. Unsere Engine crawlt bis zu 25 Unterseiten und identifiziert Barrierefreiheits-Fehler und technische SEO-Blocker – ohne Installation.",
    color: "#7aa6ff",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    pills: ["Kein Login", "BFSG-Check", "Live-Analyse"],
  },
  {
    num: "02",
    label: "Schritt 02",
    title: "Plugin-Deep-Insight",
    desc: "Verbinde unser Read-only Plugin für eine Tiefenprüfung deiner Plugins, Themes und Datenbank-Health. Maximale Sicherheit ohne Schreibrechte.",
    color: "#8df3d3",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
        <line x1="16" y1="8" x2="2" y2="22"/>
        <line x1="17.5" y1="15" x2="9" y2="15"/>
      </svg>
    ),
    pills: ["Read-only", "Plugin-Audit", "Core-Check"],
  },
  {
    num: "03",
    label: "Schritt 03",
    title: "Reporting & Fix-Anleitungen",
    desc: "Erhalte präzise Anleitungen zur Fehlerbehebung. Aktiviere das 24/7 Monitoring, um bei neuen Fehlern oder Gesetzesänderungen sofort alarmiert zu werden.",
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
    pills: ["Echtzeit-Alarm", "Fix-Guides", "Agentur-Reports"],
  },
];

const BENEFITS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    iconBg: "rgba(37,99,235,0.1)",
    iconBorder: "rgba(37,99,235,0.25)",
    iconColor: "#7aa6ff",
    label: "Expertise",
    title: "Spezialisiert auf WordPress & BFSG",
    desc: "Wir scannen nicht alles – wir scannen WordPress besser als jeder andere. BITV, EN 301 549 und DSGVO sind unser Tagesgeschäft.",
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
    title: "Vollautomatisches Monitoring",
    desc: "Einmal einrichten, nie wieder manuell prüfen. Unsere Engine arbeitet 24/7 im Hintergrund und alarmiert dich bei jedem neuen Befund.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <polyline points="9 13 11 15 15 11"/>
      </svg>
    ),
    iconBg: "rgba(234,179,8,0.08)",
    iconBorder: "rgba(234,179,8,0.22)",
    iconColor: "#EAB308",
    label: "Haftung",
    title: "Haftungsrisiken minimieren",
    desc: "Wir liefern die lückenlose Dokumentation, die du für deine Kunden brauchst – revisionssicher, exportierbar, gerichtsfest.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    per: "/Monat",
    desc: "Ideal für den ersten Website-Check",
    badge: null,
    accent: "#475569",
    accentBg: "#F1F5F9",
    accentBorder: "#E2E8F0",
    features: [
      { text: "3 Scans pro Monat", highlight: false },
      { text: "Basis-Check: Recht, Speed, Technik", highlight: false },
      { text: "KI-Diagnose auf Deutsch", highlight: false },
      { text: "Manuelle Fix-Guides", highlight: false },
      { text: "Dashboard-Übersicht", highlight: false },
      { text: "1 Website", highlight: false },
    ],
    cta: "Kostenlos starten",
    href: "/register",
    recommended: false,
    enterprise: false,
    scale: false,
  },
  {
    name: "Smart-Guard",
    price: "39",
    per: "/Monat",
    desc: "Automatischer Schutz für eine Website",
    badge: "BESTSELLER",
    accent: "#2563EB",
    accentBg: "#EFF6FF",
    accentBorder: "#BFDBFE",
    features: [
      { text: "Alles aus Free", highlight: false },
      { text: "24/7 Live-Monitoring", highlight: true },
      { text: "Score-Historie (7 Tage)", highlight: true },
      { text: "PDF-Berichte inklusive", highlight: true },
      { text: "'Erledigt'-Checkbox für Fehler", highlight: true },
      { text: "Unbegrenzte Scans", highlight: false },
    ],
    cta: "Smart-Guard starten",
    href: "/register",
    recommended: true,
    enterprise: false,
    scale: false,
  },
  {
    name: "Agency Starter",
    price: "99",
    per: "/Monat",
    desc: "Multi-Projekt-Dashboard für Agenturen",
    badge: null,
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentBorder: "#DDD6FE",
    features: [
      { text: "Alles aus Smart-Guard", highlight: false },
      { text: "Bis zu 10 Projekte", highlight: true },
      { text: "Neutrales Branding (White-Label Light)", highlight: true },
      { text: "Kunden-Matrix Übersicht", highlight: true },
      { text: "Team-Initialen in der Matrix", highlight: false },
      { text: "Multi-Projekt-Dashboard", highlight: false },
    ],
    cta: "Agency-Account erstellen",
    href: "/register",
    recommended: false,
    enterprise: false,
    scale: false,
  },
  {
    name: "Agency Pro",
    price: "199",
    per: "/Monat",
    desc: "Full White-Label für professionelle Agenturen",
    badge: null,
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentBorder: "#DDD6FE",
    features: [
      { text: "Alles aus Agency Starter", highlight: false },
      { text: "Unlimitierte Projekte (∞)", highlight: true },
      { text: "Full White-Label (Logo & Farben)", highlight: true },
      { text: "Eigene Subdomain", highlight: true },
      { text: "Kunden-Login-Bereich", highlight: true },
      { text: "Auto-Report-Versand an Kunden", highlight: true },
    ],
    cta: "Agency-Account erstellen",
    href: "/register",
    recommended: false,
    enterprise: false,
    scale: true,
  },
];

const FAQ = [
  {
    q: "Für welche Websites funktioniert WebsiteFix?",
    a: "WebsiteFix funktioniert für jede öffentlich erreichbare URL – egal ob WordPress, Shopify, Custom Code oder statische Seiten.",
  },
  {
    q: "Muss ich ein Plugin installieren oder Code ändern?",
    a: "Nein. WebsiteFix arbeitet rein extern über Cloud-Scans. Du musst nichts installieren und gefährdest somit nicht die Stabilität deiner Seite.",
  },
  {
    q: "Wie hilft mir das Tool bei der BFSG-Pflicht 2025?",
    a: "Wir scannen deine Seite auf die gesetzlichen Anforderungen der Barrierefreiheit (BFSG) und liefern dir eine lückenlose Dokumentation sowie konkrete Fix-Anleitungen für deine Entwickler.",
  },
  {
    q: "Was passiert, wenn ein Problem gefunden wird?",
    a: "Du wirst sofort per E-Mail oder über deine angebundenen Tools (wie Slack) informiert. Du erhältst einen klaren Bericht, was zu tun ist, um den Fehler zu beheben.",
  },
];

export default function Page() {
  return (
    <>
      {/* MAINTENANCE BANNER */}
      <div style={{
        background: "linear-gradient(90deg, #f59e0b, #f97316)",
        color: "#000",
        textAlign: "center",
        padding: "10px 24px",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}>
        🚧 Diese Seite befindet sich im Aufbau — Tests laufen morgen. Danke für deine Geduld!
      </div>

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
            WordPress · BFSG 2025 · Deep Scan
          </div>

          <h1 style={{ fontSize: "clamp(28px, 4.5vw, 58px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
            Der 360° WordPress-Check für Agenturen &amp; Unternehmen.
          </h1>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 40px", fontWeight: 400 }}>
            Prüfe Barrierefreiheit (BFSG&nbsp;2025), technisches SEO und Formulare. Kostenloser Deep Scan für die ersten&nbsp;25&nbsp;Unterseiten.
          </p>

          {/* URL Input */}
          <div style={{ maxWidth: 580, margin: "0 auto 14px" }}>
            <InlineScan />
          </div>

          {/* ── FEATURE CARDS ── */}
          <div className="wf-feature-grid">

            {/* Card 1 — BFSG 2025 & Recht */}
            <div className="wf-feature-card wf-feature-card--legal">
              <div className="wf-feature-card__icon" style={{
                background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.22)",
                filter: "drop-shadow(0 0 6px rgba(234,179,8,0.3))",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="wf-feature-card__body">
                <div className="wf-feature-card__label">Barrierefreiheit</div>
                <div className="wf-feature-card__title">BFSG 2025 &amp; Recht</div>
                <p className="wf-feature-card__text">Vollständiger Check nach BITV/EN&nbsp;301&nbsp;549 sowie DSGVO-Konformität deiner WordPress-Instanz.</p>
              </div>
            </div>

            {/* Card 2 — Technik & Speed */}
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
                <div className="wf-feature-card__label">Performance</div>
                <div className="wf-feature-card__title">Technik &amp; Speed</div>
                <p className="wf-feature-card__text">Analyse von Render-blocking Ressourcen, DOM-Tiefe und WordPress-spezifischen Ladezeit-Fressern.</p>
              </div>
            </div>

            {/* Card 3 — Core- & Plugin-Health */}
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
                <div className="wf-feature-card__label">Sicherheit</div>
                <div className="wf-feature-card__title">Core- &amp; Plugin-Health</div>
                <p className="wf-feature-card__text">Tiefenprüfung auf veraltete Plugins, bekannte Sicherheitslücken (CVE) und technische Konflikte im Code.</p>
              </div>
            </div>

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
            In drei Schritten zur BFSG-konformen Website.
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
                Maximaler Schutz für Ihre WordPress-Projekte.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.75 }}>
                Mehr Marge, weniger Risiko, glücklichere Kunden. Das ist kein Versprechen — das ist das System.
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
                  {/* Slack */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 54 54" fill="none">
                      <path d="M19.7 33.3c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4h4v4z" fill="#E01E5A"/>
                      <path d="M21.7 33.3c0-2.2 1.8-4 4-4s4 1.8 4 4v10c0 2.2-1.8 4-4 4s-4-1.8-4-4v-10z" fill="#E01E5A"/>
                      <path d="M25.7 19.7c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4v4h-4z" fill="#36C5F0"/>
                      <path d="M25.7 21.7c2.2 0 4 1.8 4 4s-1.8 4-4 4h-10c-2.2 0-4-1.8-4-4s1.8-4 4-4h10z" fill="#36C5F0"/>
                      <path d="M39.3 25.7c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4h-4v-4z" fill="#2EB67D"/>
                      <path d="M37.3 25.7c0 2.2-1.8 4-4 4s-4-1.8-4-4v-10c0-2.2 1.8-4 4-4s4 1.8 4 4v10z" fill="#2EB67D"/>
                      <path d="M33.3 39.3c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4v-4h4z" fill="#ECB22E"/>
                      <path d="M33.3 37.3c-2.2 0-4-1.8-4-4s1.8-4 4-4h10c2.2 0 4 1.8 4 4s-1.8 4-4 4h-10z" fill="#ECB22E"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Slack</span>
                  </div>
                  {/* Jira */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <defs>
                        <linearGradient id="jg1" x1="17.8" y1="15.4" x2="10.9" y2="22.3" gradientUnits="userSpaceOnUse"><stop offset=".18" stopColor="#0052cc"/><stop offset="1" stopColor="#2684ff"/></linearGradient>
                        <linearGradient id="jg2" x1="14.2" y1="16.6" x2="21.1" y2="9.7" gradientUnits="userSpaceOnUse"><stop offset=".18" stopColor="#0052cc"/><stop offset="1" stopColor="#2684ff"/></linearGradient>
                      </defs>
                      <path d="M15.9 2.1L2.1 15.9a1.4 1.4 0 000 2l6.1 6.1 7.7-7.7L22.7 10l-6.8-7.9z" fill="url(#jg1)"/>
                      <path d="M16.1 29.9L29.9 16.1a1.4 1.4 0 000-2l-6.1-6.1-7.7 7.7-6.8 6.4 6.8 7.8z" fill="url(#jg2)"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Jira</span>
                  </div>
                  {/* Trello */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#0079BF"/>
                      <rect x="5" y="5" width="9" height="19" rx="2" fill="white"/>
                      <rect x="18" y="5" width="9" height="13" rx="2" fill="white"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Trello</span>
                  </div>
                  {/* Asana */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="10" r="6" fill="#F06A6A"/>
                      <circle cx="7" cy="22" r="6" fill="#F06A6A"/>
                      <circle cx="25" cy="22" r="6" fill="#F06A6A"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Asana</span>
                  </div>
                </div>

                {/* Flow status */}
                <div style={{
                  marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 999,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0, animation: "wf-pulse 2s ease-in-out infinite" }} />
                  Scan → Ticket → Team informiert
                </div>
              </div>
            </div>

            {/* ── Text column ── */}
            <div className="wf-integration-text">
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.65)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                Schnittstellen
              </p>
              <h2 style={{ margin: "0 0 16px", fontSize: "clamp(22px, 2.8vw, 34px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Nahtlose Anbindung an Ihr WordPress-System.
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>
                WebsiteFix arbeitet nicht isoliert. Unsere Engine integriert sich direkt in Ihre bestehende Infrastruktur, um präzise Daten aus dem Core, den Plugins und dem Frontend zu korrelieren.
              </p>
              <ul className="wf-integration-bullets">
                {[
                  "Automatisierte WordPress-Schnittstelle",
                  "Live-Abgleich mit BFSG & WCAG Richtlinien",
                  "Deep-Scan über Cloud-Crawler-Technologie",
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

        {/* ── ALLES IM GRIFF ── */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(234,179,8,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Dein Vorteil</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Alles im Griff.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Für jeden, der eine Website betreibt — ob Selbstständiger, KMU oder Agentur.
              </p>
            </div>

            <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                    </svg>
                  ),
                  iconBg: "rgba(37,99,235,0.12)",
                  iconBorder: "rgba(37,99,235,0.25)",
                  title: "KI-Experte an deiner Seite",
                  tag: "KI-Analyse",
                  tagColor: "#7aa6ff",
                  tagBg: "rgba(37,99,235,0.12)",
                  desc: "Automatische Erkennung von Sicherheitslücken und Performance-Fressern, bevor sie zum Problem werden.",
                  bullets: ["Täglich automatisch gescannt", "Sofort-Benachrichtigung", "Verständliche Ergebnisse"],
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  ),
                  iconBg: "rgba(22,163,74,0.12)",
                  iconBorder: "rgba(22,163,74,0.25)",
                  title: "Rechtssicherheit 2025",
                  tag: "BFSG",
                  tagColor: "#4ade80",
                  tagBg: "rgba(22,163,74,0.12)",
                  desc: "Volle Überwachung der BFSG-Konformität inkl. lückenloser Dokumentation — automatisch und ohne Aufwand.",
                  bullets: ["BFSG 2025 überwacht", "Audit-Dokumentation", "Keine manuelle Prüfung"],
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                  iconBg: "rgba(217,119,6,0.12)",
                  iconBorder: "rgba(217,119,6,0.25)",
                  title: "Einfachheit",
                  tag: "Setup",
                  tagColor: "#fbbf24",
                  tagBg: "rgba(217,119,6,0.12)",
                  desc: "Kein Plugin, kein Code-Wissen nötig. Einmal einrichten, dauerhaft geschützt sein.",
                  bullets: ["URL eingeben & fertig", "Keine technischen Kenntnisse", "Dauerhaft aktiv"],
                },
              ].map(f => (
                <div key={f.title} style={{
                  background: "rgba(8,10,20,0.7)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20,
                  padding: "28px 26px",
                  boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: f.iconBg, border: `1px solid ${f.iconBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {f.icon}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                      background: f.tagBg, color: f.tagColor, letterSpacing: "0.06em",
                    }}>{f.tag}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{f.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                  <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {f.bullets.map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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


        {/* PRICING */}
        <section id="pricing" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
                Keine versteckten Kosten. Monatlich kündbar. DSGVO-konform.
              </p>
            </div>

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

                  {/* Top stripe — uniform height across all cards */}
                  <div style={{
                    padding: "8px 24px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: plan.recommended
                      ? "#2563EB"
                      : ("scale" in plan && plan.scale)
                        ? "#7C3AED"
                        : "rgba(255,255,255,0.04)",
                    borderBottom: (plan.recommended || ("scale" in plan && plan.scale))
                      ? "none"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                      color: (plan.recommended || ("scale" in plan && plan.scale))
                        ? "#fff"
                        : "rgba(255,255,255,0.2)",
                    }}>
                      {plan.recommended
                        ? "★ BESTSELLER"
                        : ("scale" in plan && plan.scale)
                          ? "FULL WHITE-LABEL"
                          : plan.name === "Free"
                            ? "KOSTENLOS TESTEN"
                            : "FÜR AGENTUREN"}
                    </span>
                  </div>

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

                    {/* Feature list */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: f.highlight
                              ? (plan.recommended ? "#2563EB" : ("scale" in plan && plan.scale) ? "#7C3AED" : plan.enterprise ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.12)")
                              : "rgba(255,255,255,0.07)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: f.highlight ? 600 : 400,
                            color: f.highlight ? "#fff" : "rgba(255,255,255,0.4)",
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

        {/* TESTIMONIALS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Kundenstimmen
            </p>
            <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Was unsere Kunden sagen
            </h2>
          </div>

          <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
            {/* Testimonial 1 — Sicherheit */}
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
                "Das Thema BFSG 2025 hat mir schlaflose Nächte bereitet. Mit WebsiteFix habe ich jetzt die Gewissheit, dass meine Seite <strong style={{ color: "#fff", fontStyle: "normal" }}>rechtssicher ist, ohne dass ich selbst zum IT-Experten werden musste</strong>."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>M</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Michael R.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Inhaber, Online-Shop für Bio-Feinkost</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 — Einfachheit */}
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
                "Endlich ein Tool, das keine komplizierte Installation braucht. <strong style={{ color: "#fff", fontStyle: "normal" }}>URL eingegeben, Scan läuft</strong> – und die wöchentlichen Reports geben mir das gute Gefühl, dass technisch alles perfekt ist."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #059669 0%, #0891B2 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>J</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Julia S.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Marketing-Leitung, Mittelstands-GmbH</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 — Zeitersparnis */}
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
                "Ich habe früher Stunden damit verbracht, Fehler auf meiner Seite zu suchen. <strong style={{ color: "#fff", fontStyle: "normal" }}>WebsiteFix findet sie sofort und informiert mich per E-Mail</strong>. Absolute Empfehlung für jeden, der sich auf sein Kerngeschäft konzentrieren will."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #D97706 0%, #DC2626 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>T</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Dr. Thomas W.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Betreiber einer Gemeinschaftspraxis</div>
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
                  Das BFSG 2025 – Warum Webseitenbetreiber jetzt handeln müssen
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  Ab dem 28. Juni 2025 greift das Gesetz. Erfahre, was das für deine Haftung bedeutet.
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
                Deine erste Website<br />scannst du kostenlos.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Keine Installation. Ergebnis in unter 60 Sekunden.
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
                Danach: Flexibler Schutz ab 19€/Monat
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
