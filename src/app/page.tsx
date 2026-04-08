import Link from "next/link";
import type { Metadata } from "next";

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

const AGENCY_FEATURES = [
  { num: "01", title: "Monitoring", desc: "Alle Kunden-Websites werden täglich automatisch geprüft. SSL, Uptime, Security — ohne manuellen Aufwand." },
  { num: "02", title: "Sofort-Alert", desc: "Du erfährst von Problemen bevor der Kunde anruft. Per E-Mail, sofort, mit klarer Diagnose." },
  { num: "03", title: "Automatischer Monatsbericht", desc: "Gebrandeter PDF-Report wird automatisch an jeden Kunden gesendet. Du musst nichts tun." },
  { num: "04", title: "White-Label", desc: "Reports erscheinen mit deinem Logo und Namen. Kein WebsiteFix-Branding." },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    desc: "Zum Ausprobieren",
    features: ["3 Scans pro Monat", "WCAG + SEO + Performance", "KI-Diagnose auf Deutsch"],
    cta: "Kostenlos scannen",
    href: "/scan",
    highlight: false,
  },
  {
    name: "Pro",
    price: "29",
    desc: "Für Selbstständige & Freelancer",
    features: ["Unlimitierte Scans", "Alle Scan-Typen", "KI-Diagnose + Code-Fixes", "Scan-Historie & Vergleich", "PDF-Export"],
    cta: "Jetzt starten",
    href: "/login",
    highlight: true,
  },
  {
    name: "Agentur",
    price: "149",
    desc: "Für Web-Agenturen",
    features: ["Alles aus Pro", "Bis zu 30 Kunden-Domains", "White-Label Reports", "Team-Zugang (3 Seats)", "Automatische Monatsberichte", "Prioritäts-Support"],
    cta: "Agentur-Plan starten",
    href: "/fuer-agenturen",
    highlight: false,
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
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
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

        {/* AGENCY SECTION */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <div className="grid-1-sm gap-sm-32" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Für Agenturen</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                30 Kunden-Websites.<br />Null manuelle Reports.
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 32 }}>
                WebsiteFix überwacht alle Kunden-Websites automatisch, schlägt Alarm bevor der Kunde anruft — und sendet jeden Monat einen gebranderten Report direkt an den Kunden.
              </p>
              <Link href="/fuer-agenturen" style={{
                display: "inline-block", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600,
                border: "1px solid rgba(122,166,255,0.3)", color: "#7aa6ff", textDecoration: "none",
                background: "rgba(122,166,255,0.06)",
              }}>
                Agentur-Plan ansehen
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              {AGENCY_FEATURES.map((f, i) => (
                <div key={i} style={{
                  padding: "24px 28px",
                  borderBottom: i < AGENCY_FEATURES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  display: "flex", gap: 20, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", paddingTop: 3, flexShrink: 0 }}>{f.num}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#fff" }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* PRICING */}
        <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Einfach. Transparent.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                padding: "28px 28px",
                border: plan.highlight ? "1px solid rgba(141,243,211,0.3)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 20,
                background: plan.highlight ? "rgba(141,243,211,0.03)" : "transparent",
                position: "relative",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -1, right: 24,
                    padding: "3px 10px", borderRadius: "0 0 8px 8px",
                    background: "#8df3d3", color: "#0b0c10",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                  }}>
                    BELIEBT
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>{plan.price}€</span>
                    {plan.price !== "0" && <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/Monat</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>{plan.desc}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                      <span style={{ color: "#8df3d3", flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link href={plan.href} style={{
                  display: "block", textAlign: "center",
                  padding: "11px 20px", borderRadius: 9, fontSize: 14, fontWeight: 600,
                  textDecoration: "none", marginTop: "auto",
                  background: plan.highlight ? "#fff" : "transparent",
                  color: plan.highlight ? "#0b0c10" : "rgba(255,255,255,0.6)",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* FAQ */}
        <section id="faq" style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 40px", letterSpacing: "-0.02em" }}>
            Häufige Fragen
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{
                padding: "24px 0",
                borderBottom: i < FAQ.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: "#fff" }}>{item.q}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{
            padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24,
          }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Jetzt kostenlos testen.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                Keine Kreditkarte. Keine Installation. Ergebnis in unter 60 Sekunden.
              </p>
            </div>
            <Link href="/scan" style={{
              padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "#fff", color: "#0b0c10", textDecoration: "none", whiteSpace: "nowrap",
            }}>
              Website scannen
            </Link>
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
