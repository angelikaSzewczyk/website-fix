import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion from "./components/faq-accordion";

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
    name: "Free",
    price: "0",
    desc: "Zum Ausprobieren",
    features: ["3 Scans/Monat", "WCAG · SEO · Performance", "KI-Diagnose auf Deutsch"],
    cta: "Kostenlos scannen",
    href: "/scan",
    highlight: false,
    glow: false,
  },
  {
    name: "Pro",
    price: "29",
    desc: "Freelancer & kleine Teams",
    features: ["Unlimitierte Scans", "Alle Scan-Typen", "KI-Code-Fix", "Scan-Vergleich", "PDF-Export"],
    cta: "Pro starten",
    href: "/login",
    highlight: true,
    glow: false,
  },
  {
    name: "Agentur",
    price: "149",
    desc: "Web-Agenturen mit Wartungskunden",
    features: ["Alles aus Pro", "30 Kunden-Domains", "White-Label PDF", "3 Team-Seats", "Auto-Monatsberichte", "Prio-Support"],
    cta: "Jetzt Wartung automatisieren",
    href: "/fuer-agenturen",
    highlight: false,
    glow: true,
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

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px", letterSpacing: "-0.035em", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Sichern. Optimieren. Reporten.
          </h1>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 40px)", fontWeight: 700, lineHeight: 1.2, margin: "0 0 26px", letterSpacing: "-0.025em", color: "rgba(255,255,255,0.35)", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Das Betriebssystem für deine Website-Wartung.
          </h1>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 40px", fontWeight: 400 }}>
            Automatisierte Überwachung, KI-gestützte Fehlerbehebung und professionelle White-Label-Reports in einem Tool.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scan" style={{
              padding: "13px 30px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.35)",
            }}>
              Jetzt kostenlos testen →
            </Link>
            <Link href="/fuer-agenturen" style={{
              padding: "13px 28px", borderRadius: 10, fontSize: 15,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}>
              Für Agenturen
            </Link>
          </div>

          <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
            Kostenlos · Keine Installation · Ergebnis in unter 60 Sekunden
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

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* PRICING */}
        <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 48px", letterSpacing: "-0.025em" }}>
            Einfach. Transparent.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                padding: "24px",
                border: plan.highlight
                  ? "1px solid rgba(141,243,211,0.3)"
                  : plan.glow
                    ? "1px solid rgba(0,123,255,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 13,
                display: "flex", flexDirection: "column", gap: 18,
                background: plan.highlight
                  ? "rgba(141,243,211,0.03)"
                  : plan.glow
                    ? "rgba(0,123,255,0.04)"
                    : "#13151a",
                boxShadow: plan.glow ? "0 0 40px rgba(0,123,255,0.12)" : "none",
                position: "relative",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -1, right: 20,
                    padding: "3px 10px", borderRadius: "0 0 8px 8px",
                    background: "#8df3d3", color: "#0b0c10",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    BELIEBT
                  </div>
                )}
                {plan.glow && (
                  <div style={{
                    position: "absolute", top: -1, right: 20,
                    padding: "3px 10px", borderRadius: "0 0 8px 8px",
                    background: "linear-gradient(90deg,#007BFF,#0057b8)", color: "#fff",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    FÜR AGENTUREN
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {plan.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em" }}>{plan.price}€</span>
                    {plan.price !== "0" && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/Monat</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{plan.desc}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ color: plan.glow ? "#7aa6ff" : "#8df3d3", flexShrink: 0, fontSize: 12 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link href={plan.href} style={{
                  display: "block", textAlign: "center",
                  padding: "11px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", marginTop: "auto",
                  background: plan.glow
                    ? "#fff"
                    : plan.highlight
                      ? "rgba(141,243,211,0.12)"
                      : "transparent",
                  color: plan.glow
                    ? "#0b0c10"
                    : plan.highlight
                      ? "#8df3d3"
                      : "rgba(255,255,255,0.5)",
                  border: plan.glow
                    ? "none"
                    : plan.highlight
                      ? "1px solid rgba(141,243,211,0.25)"
                      : "1px solid rgba(255,255,255,0.1)",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
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
