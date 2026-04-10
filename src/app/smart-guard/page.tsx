import Link from "next/link";
import type { Metadata } from "next";
import BrandLogo from "../components/BrandLogo";
import NavAuthLink from "../components/nav-auth-link";
import FaqAccordion from "../components/faq-accordion";

export const metadata: Metadata = {
  title: "Smart-Guard — 24/7 Website-Monitoring & BFSG-Check | WebsiteFix",
  description:
    "Automatisches Monitoring, täglicher BFSG-Barrierefreiheits-Check 2025 und sofortige Alarmierung bei Fehlern. Schütze deine Website für 39€/Monat.",
};

const PILLARS = [
  {
    color: "#4ADE80",
    label: "Live-Wächter",
    title: "Stündliche Überwachung rund um die Uhr",
    desc: "Deine Website wird jede Stunde auf Downtime, SSL-Ablauf und kritische Erreichbarkeitsfehler geprüft. Bevor dein Kunde es merkt, bist du schon dabei.",
    pills: ["Downtime-Alarm", "SSL-Überwachung", "Stündlicher Ping"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    color: "#7aa6ff",
    label: "Recht-Check",
    title: "Tägliche BFSG-Prüfung — automatisch",
    desc: "Seit Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz. WebsiteFix prüft täglich alle WCAG 2.1 AA-Kriterien und dokumentiert die Ergebnisse lückenlos — als Nachweis im Ernstfall.",
    pills: ["BFSG 2025", "WCAG 2.1 AA", "Audit-Trail"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    color: "#FBBF24",
    label: "Performance-Historie",
    title: "Sieh genau, wie sich deine Ladezeiten verbessern",
    desc: "7-Tage-Score-Verlauf für Ladezeit, Core Web Vitals und Gesamtperformance. Du siehst auf einen Blick, ob deine Optimierungen wirken — mit konkreten Zahlen statt Bauchgefühl.",
    pills: ["7-Tage-Verlauf", "Core Web Vitals", "PDF-Export"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    per: "/Monat",
    desc: "Ideal für den ersten Website-Check",
    accent: "#475569",
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
  },
  {
    name: "Smart-Guard",
    price: "39",
    per: "/Monat",
    desc: "Automatischer Rund-um-die-Uhr-Schutz für deine Website",
    accent: "#2563EB",
    features: [
      { text: "Alles aus Free", highlight: false },
      { text: "24/7 Live-Monitoring", highlight: true },
      { text: "Score-Historie (7 Tage)", highlight: true },
      { text: "PDF-Berichte inklusive", highlight: true },
      { text: "'Erledigt'-Checkbox für Fehler", highlight: true },
      { text: "Unbegrenzte Scans", highlight: false },
    ],
    cta: "Jetzt meine Website schützen",
    href: "/register",
    recommended: true,
  },
];

const FAQ = [
  {
    q: "Was passiert, wenn meine Website offline geht?",
    a: "Sobald ein Fehler erkannt wird, erhältst du sofort eine E-Mail-Benachrichtigung mit dem Fehlerbericht und einem direkten Link zu deinem Dashboard. Du siehst genau, seit wann das Problem besteht.",
  },
  {
    q: "Was prüft der BFSG-Check konkret?",
    a: "Wir scannen täglich auf alle WCAG 2.1 AA-Kriterien: Kontraste, Alt-Texte, Tastaturnavigation, Formular-Labels und mehr. Die Ergebnisse werden lückenlos dokumentiert — als Nachweis, dass du deiner Sorgfaltspflicht nachkommst.",
  },
  {
    q: "Für welche Website-Plattformen funktioniert das?",
    a: "Für jede öffentlich erreichbare Website — WordPress, Shopify, Wix, Squarespace, TYPO3, Custom-Entwicklungen. Kein Plugin, kein Hosting-Zugang nötig. Einfach URL eintragen.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja, monatliche Kündigung, keine Mindestlaufzeit. Abrechnung über Stripe. Nach der Kündigung hast du noch Zugang bis zum Ende des bezahlten Zeitraums.",
  },
];

export default function SmartGuardPage() {
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
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Für Agenturen</Link>
              <Link href="#pricing" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Preise</Link>
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
              <Link href="/register" style={{
                fontSize: 13, padding: "7px 18px", borderRadius: 8, fontWeight: 700,
                background: "#007BFF", color: "#fff", textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,123,255,0.4)",
              }}>
                Smart-Guard starten →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>

        {/* HERO */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px 72px", textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(74,222,128,0.25)",
            background: "rgba(74,222,128,0.06)",
            fontSize: 12, color: "#4ADE80", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
            Monitoring · BFSG-Check 2025 · Performance-Tracking
          </div>

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
            Deine Website in Sicherheit.{" "}
            <span style={{ color: "#4ADE80" }}>24/7.</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 600, margin: "0 auto 40px", fontWeight: 400 }}>
            Automatisches Monitoring, BFSG-Check 2025 und sofortige Alarmierung bei Fehlern. Alles in einem Dashboard — für 39€.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
            }}>
              Jetzt meine Website schützen →
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

          {/* Dashboard status mockup */}
          <div style={{ marginTop: 64, maxWidth: 720, marginLeft: "auto", marginRight: "auto", position: "relative" }}>
            <div style={{
              position: "absolute", inset: "-40px -60px",
              background: "radial-gradient(ellipse at 50% 60%, rgba(74,222,128,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "relative", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0d0f14",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}>
              {/* Browser chrome */}
              <div style={{ height: 36, background: "#161820", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 16px", gap: 6 }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
                <div style={{ flex: 1, maxWidth: 200, margin: "0 auto", height: 18, borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>app.website-fix.com/dashboard</span>
                </div>
              </div>

              {/* Status cards */}
              <div style={{ padding: "20px 20px 24px" }}>
                {/* Live status row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Letzte Prüfung: vor 12 Minuten
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>Alles in Ordnung</span>
                  </div>
                </div>

                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Uptime", value: "99.9%", color: "#22C55E", sub: "letzte 30 Tage" },
                    { label: "SSL", value: "Gültig", color: "#22C55E", sub: "87 Tage" },
                    { label: "Ladezeit", value: "1.2s", color: "#FBBF24", sub: "Core Web Vitals" },
                    { label: "BFSG", value: "3 Hints", color: "#7aa6ff", sub: "heute geprüft" },
                  ].map(k => (
                    <div key={k.label} style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 3, letterSpacing: "0.05em" }}>{k.label}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Score sparkline placeholder */}
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Performance-Score (7 Tage)</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>↑ +8 Punkte</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 36 }}>
                    {[52, 58, 61, 59, 65, 70, 74].map((h, i) => (
                      <div key={i} style={{
                        flex: 1, borderRadius: 3,
                        background: i === 6 ? "#4ADE80" : "rgba(74,222,128,0.2)",
                        height: `${(h / 80) * 100}%`,
                        transition: "height 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
                      <span key={d} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              Live-Dashboard — du siehst sofort, was mit deiner Website passiert
            </p>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* 3 PILLARS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center" }}>
            Was Smart-Guard für dich tut
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 56px", letterSpacing: "-0.02em", textAlign: "center" }}>
            Drei Säulen. Volle Sicherheit.
          </h2>

          <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {PILLARS.map(p => (
              <div key={p.label} style={{
                padding: "28px 28px 24px",
                border: `1px solid ${p.color}20`,
                borderRadius: 14,
                background: `${p.color}06`,
                display: "flex", flexDirection: "column", gap: 0,
                position: "relative", overflow: "hidden",
              }}>
                {/* Watermark number */}
                <div style={{
                  position: "absolute", right: 20, top: 16,
                  fontSize: 64, fontWeight: 900, color: `${p.color}08`,
                  lineHeight: 1, userSelect: "none", pointerEvents: "none",
                  letterSpacing: "-0.04em",
                }}>
                  {PILLARS.indexOf(p) + 1 < 10 ? `0${PILLARS.indexOf(p) + 1}` : PILLARS.indexOf(p) + 1}
                </div>

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `${p.color}15`, border: `1px solid ${p.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: p.color, marginBottom: 18, flexShrink: 0,
                }}>
                  {p.icon}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  {p.title}
                </div>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, flexGrow: 1 }}>
                  {p.desc}
                </p>

                {/* Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.pills.map(pill => (
                    <span key={pill} style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 16,
                      background: `${p.color}10`, border: `1px solid ${p.color}25`,
                      color: p.color, fontWeight: 500,
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

        {/* HOW IT WORKS */}
        <section style={{ background: "#0a0a0a", padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                So einfach
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
                In 60 Sekunden aktiv.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
                Kein Plugin, kein Hosting-Zugang, kein Code. Einfach URL eintragen und Smart-Guard übernimmt.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  num: "01",
                  color: "#4ADE80",
                  title: "Website eintragen",
                  desc: "Gib die URL deiner Website ein. Fertig. Kein Plugin, kein FTP-Zugang, kein Code-Eingriff nötig.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  ),
                },
                {
                  num: "02",
                  color: "#7aa6ff",
                  title: "KI scannt automatisch",
                  desc: "Smart-Guard prüft stündlich Erreichbarkeit, täglich BFSG-Konformität und trackt deine Performance-Werte über 7 Tage.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  ),
                },
                {
                  num: "03",
                  color: "#FBBF24",
                  title: "Du wirst sofort informiert",
                  desc: "Bei einem Fehler erhältst du sofort eine E-Mail mit Fehlerbericht und direktem Link. Im Dashboard siehst du alles auf einen Blick — mit 'Erledigt'-Checkbox.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  ),
                },
              ].map((step, idx) => (
                <div key={step.num} style={{ display: "flex", gap: 24, alignItems: "flex-start", position: "relative", paddingBottom: idx < 2 ? 36 : 0 }}>
                  {/* Vertical line */}
                  {idx < 2 && (
                    <div style={{ position: "absolute", left: 20, top: 44, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                  )}
                  {/* Step number circle */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: `${step.color}12`, border: `1px solid ${step.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: step.color, position: "relative", zIndex: 1,
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: step.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                      Schritt {step.num}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.015em" }}>
                      {step.title}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 560 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ background: "#0a0a0a", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)" }}>
                Keine versteckten Kosten. Monatlich kündbar. DSGVO-konform.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "stretch" }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: plan.recommended ? `2px solid #2563EB` : `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: plan.recommended ? "0 8px 40px rgba(37,99,235,0.2)" : "0 2px 20px rgba(0,0,0,0.3)",
                  position: "relative",
                }}>

                  {/* Top stripe */}
                  {plan.recommended ? (
                    <div style={{ background: "#2563EB", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>
                        ★ EMPFOHLEN FÜR WEBSITE-BESITZER
                      </span>
                    </div>
                  ) : (
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)" }} />
                  )}

                  <div style={{ padding: "28px 28px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Header */}
                    <div style={{ marginBottom: 20, minHeight: 128 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: plan.recommended ? "#7aa6ff" : plan.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {plan.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{plan.price}€</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{plan.per}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{plan.desc}</p>
                      {plan.name === "Free" && (
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                          Keine Kreditkarte nötig
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

                    {/* Features */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: f.highlight ? (plan.recommended ? "#2563EB" : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.07)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: f.highlight ? 600 : 400, color: f.highlight ? "#fff" : "rgba(255,255,255,0.4)" }}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div style={{ paddingBottom: 28 }}>
                      <Link href={plan.href} style={{
                        display: "block", textAlign: "center",
                        padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        textDecoration: "none",
                        background: plan.recommended ? "#2563EB" : "rgba(255,255,255,0.06)",
                        color: plan.recommended ? "#ffffff" : "rgba(255,255,255,0.7)",
                        border: plan.recommended ? "none" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: plan.recommended ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
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

        {/* FAQ */}
        <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 40px", letterSpacing: "-0.025em" }}>
            Häufige Fragen zu Smart-Guard
          </h2>
          <FaqAccordion items={FAQ} />
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* CTA BANNER */}
        <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{
            padding: "clamp(40px, 6vw, 72px) clamp(28px, 5vw, 64px)",
            borderRadius: 20,
            background: "linear-gradient(135deg, #0d1520 0%, #0b0c10 50%, #061a0e 100%)",
            border: "1px solid rgba(74,222,128,0.15)",
            boxShadow: "0 0 80px rgba(74,222,128,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "50%", height: "200%", background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Deine Website in Sicherheit.<br />
                <span style={{ color: "#4ADE80" }}>Ab heute.</span>
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Keine Installation. Ergebnis in unter 60 Sekunden.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", position: "relative" }}>
              <Link href="/register" style={{
                padding: "15px 36px", borderRadius: 11, fontWeight: 800, fontSize: 16,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 24px rgba(0,123,255,0.4)",
                letterSpacing: "-0.01em",
              }}>
                Jetzt meine Website schützen →
              </Link>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingLeft: 4 }}>
                Smart-Guard für 39€/Monat · Jederzeit kündbar
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
            <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</Link>
            <Link href="/fuer-agenturen" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Für Agenturen</Link>
            <Link href="/impressum" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
            <Link href="/datenschutz" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
            <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Blog</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
