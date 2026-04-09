import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion from "../components/faq-accordion";
import RoiCalculator from "../components/roi-calculator";
import CheckoutButton from "../components/checkout-button";

export const metadata: Metadata = {
  title: "WebsiteFix für Agenturen — Automatische Wartungsverträge & BFSG",
  description: "Verwandle deine Wartung in eine Profit-Maschine. White-Label Reports, BFSG-Compliance und Jira-Integration für Web-Agenturen.",
};

const PLANS = [
  {
    name: "Freelancer",
    price: "29",
    per: "/Monat",
    desc: "Für Solo-Freelancer mit ersten Kunden",
    accent: "#475569",
    features: [
      { text: "Bis zu 3 Projekte", highlight: false },
      { text: "Manuelle Scans", highlight: false },
      { text: "WCAG · SEO · Performance", highlight: false },
      { text: "KI-Diagnose auf Deutsch", highlight: false },
      { text: "Einfache PDF-Berichte", highlight: false },
    ],
    cta: "Kostenlos starten",
    href: "/login",
    recommended: false,
    scale: false,
    enterprise: false,
  },
  {
    name: "Agency Core",
    price: "149",
    per: "/Monat",
    desc: "Für wachsende Agenturen mit Wartungskunden",
    accent: "#2563EB",
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
    scale: false,
    enterprise: false,
  },
  {
    name: "Agency Scale",
    price: "299",
    per: "/Monat",
    desc: "Für Agenturen, die skalieren wollen",
    accent: "#7C3AED",
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
    scale: true,
    enterprise: false,
  },
  {
    name: "Enterprise",
    price: null,
    per: "",
    desc: "Für große Agenturen & Reseller",
    accent: "#0F172A",
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
    scale: false,
    enterprise: true,
  },
];

const FAQ = [
  {
    q: "Kann ich mein eigenes Branding nutzen?",
    a: "Ja, ab dem Agency Core Paket kannst du Logo, Farben und Domain anpassen (White-Labeling). Deine Kunden sehen ausschließlich dein Agentur-Branding — kein WebsiteFix-Logo, kein Hinweis auf das Tool.",
  },
  {
    q: "Wie sicher sind die Daten meiner Kunden?",
    a: "Wir hosten 100% DSGVO-konform in Deutschland. Alle Daten werden verschlüsselt übertragen und gespeichert. Du bleibst Eigentümer deiner Daten — wir verkaufen oder teilen sie nicht.",
  },
  {
    q: "Wann wird Barrierefreiheit Pflicht?",
    a: "Ab Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) für die meisten kommerziellen Websites. Agenturen, die Websites betreuen, tragen Mitverantwortung. WebsiteFix prüft automatisch alle WCAG 2.1 AA-Kriterien und erstellt einen lückenlosen Audit-Trail als Nachweis.",
  },
  {
    q: "Für welche Website-Plattformen funktioniert das?",
    a: "Für jede öffentlich erreichbare Website — WordPress, WooCommerce, Shopify, Wix, Squarespace, Webflow, TYPO3, Joomla, Drupal und Custom-Entwicklungen. Kein Plugin, kein Hosting-Zugang nötig.",
  },
  {
    q: "Wie läuft die Jira / Trello / Asana Integration?",
    a: "Du verbindest dein Projekt-Management-Tool einmalig in den Einstellungen. Sobald ein Scan Probleme findet, wird automatisch ein Ticket mit allen Details (Screenshot, Code-Fix, Priorität) erstellt — ohne manuellen Aufwand.",
  },
  {
    q: "Kann ich den Plan jederzeit kündigen?",
    a: "Ja. Monatliche Kündigung, keine Mindestlaufzeit. Abrechnung über Stripe. Nach der Kündigung hast du noch Zugang bis zum Ende des bezahlten Zeitraums.",
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
              <Link href="/" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Home</Link>
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: "#fff", textDecoration: "none", fontWeight: 600 }}>Für Agenturen</Link>
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
              <Link href="/login" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8, fontWeight: 600,
                background: "#fff", color: "#0b0c10", textDecoration: "none",
              }}>
                Kostenlos starten
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
            Exklusiv für Web-Agenturen & Freelancer
          </div>

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.035em", maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
            Verwandle deine Wartung<br />in eine Profit-Maschine.
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 40px", fontWeight: 400 }}>
            WebsiteFix ist deine automatisierte White-Label Zentrale für BFSG-Compliance &amp; Kundenbindung — mit Jira, Trello und Asana direkt integriert.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <CheckoutButton
              plan="agency_core"
              label="Jetzt Agency-Account erstellen →"
              style={{
                padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", border: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
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
            Keine Kreditkarte · Keine Mindestlaufzeit · DSGVO-konform
          </p>

          {/* Trust stats */}
          <div style={{ marginTop: 52, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { num: "90 Std.", label: "Ø Zeitersparnis/Monat" },
              { num: "+400€", label: "Ø Mehrwert pro Wartungskunde" },
              { num: "BFSG", label: "Automatisch geprüft seit Juni 2025" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{s.num}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
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
              Berechne dein zusätzliches monatliches Potenzial
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
            Drei Situationen, die du kennst. Und die dich jeden Monat Stunden und Vertrauen kosten.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                icon: "📋",
                title: "Manuelle Reports fressen dein Wochenende",
                desc: "20 Kunden, 20 individuelle Reports. Recherche, Screenshots, Formatierung, versenden. Jede Stunde die du dafür ausgibst, kannst du nicht verkaufen.",
                quote: `\u201ESamstag, 14 Uhr. Ich sitze wieder an Reports statt mit meiner Familie.\u201C`,
              },
              {
                icon: "📞",
                title: "Fehler bemerkst du, wenn der Kunde anruft",
                desc: "SSL abgelaufen. Website offline. Google-Index verschwunden. Du erfährst es nicht als Erster — der Kunde schon. Das kostet Vertrauen, das du in Monaten aufgebaut hast.",
                quote: `\u201EWarum habt ihr das nicht gesehen? Ihr betreut ja unsere Website.\u201C`,
              },
              {
                icon: "⚖️",
                title: "BFSG-Haftung: du haftest, nicht der Kunde",
                desc: "Das Barrierefreiheitsstärkungsgesetz gilt seit Juni 2025. Wer die Website wartet, trägt Mitverantwortung. Ein manuelles WCAG-Audit kostet 4–8h pro Website — unmöglich skalierbar.",
                quote: `\u201EWir brauchen eine WCAG-konforme Website. Kannst du das garantieren?\u201C`,
              },
            ].map((p, i) => (
              <div key={i} style={{
                padding: "24px 28px",
                border: "1px solid rgba(255,107,107,0.12)",
                borderRadius: 14,
                background: "rgba(255,107,107,0.03)",
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 680 }}>{p.desc}</div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,150,150,0.5)", fontStyle: "italic" }}>{p.quote}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHITE-LABEL HIGHLIGHT */}
        <section style={{ background: "#0d1520", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                Dein Logo. Deine Farben.<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>Kein WebsiteFix-Branding.</span>
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.75 }}>
                Lade einmalig dein Agentur-Logo hoch und wähle deine Primärfarbe. Danach erscheint auf jedem Monatsbericht dein Name — der Kunde sieht nie, dass WebsiteFix dahinter steckt.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", maxWidth: 960, margin: "0 auto" }}>
              {/* Left: feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
                    bg: "#EFF6FF", border: "#BFDBFE",
                    title: "Einmalig einrichten",
                    desc: "Logo & Primärfarbe in den Einstellungen hinterlegen — fertig. Alle künftigen Reports werden automatisch gebrandert.",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                    bg: "#F5F3FF", border: "#DDD6FE",
                    title: "KI schreibt die Management-Zusammenfassung",
                    desc: "Professioneller Agentur-Ton, auf Deutsch, mit konkreten Handlungsempfehlungen — vollautomatisch.",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                    bg: "#F0FDF4", border: "#A7F3D0",
                    title: "Report wird automatisch versendet",
                    desc: "Am 1. jeden Monats landet der PDF-Report direkt beim Kunden — mit deinem Absender, deinem Branding.",
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
                  label="White-Label jetzt einrichten →"
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
              <div style={{ position: "relative" }}>
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
                  <div style={{
                    background: "linear-gradient(135deg, #007BFF, #0057b8)",
                    padding: "18px 22px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>M</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Muster Agentur GmbH</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Monatlicher Website-Report</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
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
                  ← deine Farbe & dein Logo
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE DEEP-DIVE */}
        <section style={{ background: "#080c12", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.12em" }}>Feature Deep-Dive</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Gebaut für Agenturen, die skalieren.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                Jedes Feature ist darauf ausgelegt, deinen Workflow zu automatisieren und deine Kunden zu begeistern.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {/* BFSG Deep-Dive */}
              <div style={{ background: "#FAFBFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 26px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#EFF6FF", color: "#2563EB", letterSpacing: "0.06em" }}>BFSG 2025</span>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>Barrierefreiheits-Prüfung</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                    Das Barrierefreiheitsstärkungsgesetz (BFSG) ist seit Juni 2025 in Kraft. Agenturen, die B2C-Websites betreuen, tragen Mitverantwortung. WebsiteFix prüft automatisch alle WCAG 2.1 AA-Kriterien und dokumentiert die Ergebnisse lückenlos.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["WCAG 2.1 AA vollständig", "Audit-Trail als Nachweis", "Automatische Meldung bei Verstoß", "BFSG Haftungsschutz-Monitor"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* White-Label Report Deep-Dive */}
              <div style={{ background: "#FAFBFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 26px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#F0FDF4", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#F0FDF4", color: "#16A34A", letterSpacing: "0.06em" }}>White-Label</span>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>Automatische Monatsberichte</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                    Am 1. jeden Monats wird automatisch ein professioneller PDF-Report mit deinem Logo, deiner Farbe und einer KI-generierten Management-Zusammenfassung an jeden Kunden versendet.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["Agentur-Logo & Primärfarbe", "KI-Zusammenfassung auf Agentur-Niveau", "PDF-Export + direkter E-Mail-Versand", "Kein WebsiteFix-Branding sichtbar"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Workflow Automation Deep-Dive */}
              <div style={{ background: "#FAFBFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 26px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#FFFBEB", color: "#D97706", letterSpacing: "0.06em" }}>Automation</span>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>Automatischer Workflow</h3>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                    Befunde werden direkt als Jira-Tickets, Trello-Karten oder Asana-Tasks erstellt. Slack meldet sich sofort. Dein Team arbeitet immer am aktuellen Stand — ohne Copy-Paste.
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {["Jira · Trello · Asana Integration", "Slack-Alerts in Echtzeit", "Auto-Pilot Scan-Intervall", "Lückenloser Audit-Trail"].map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
        <section style={{ background: "#080c12", padding: "0 24px 72px", borderTop: "none" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{
              padding: "32px 36px", borderRadius: 18,
              border: "1px solid rgba(122,166,255,0.15)",
              background: "rgba(0,123,255,0.04)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(0,123,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16,
                  padding: "4px 12px", borderRadius: 20, fontSize: 11,
                  background: "rgba(122,166,255,0.1)", border: "1px solid rgba(122,166,255,0.2)",
                  color: "#7aa6ff", fontWeight: 700, letterSpacing: "0.06em",
                }}>
                  🔬 Deep-Scan Technologie
                </div>
                <h3 style={{ margin: "0 0 14px", fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.2 }}>
                  Wir prüfen nicht nur die Oberfläche,<br />
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>sondern jede einzelne Unterseite.</span>
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 640 }}>
                  Unser Crawler analysiert automatisch <strong style={{ color: "rgba(255,255,255,0.85)" }}>jede Unterseite</strong> der Kundendomain — nicht nur die Startseite. Die KI findet dabei ca. <strong style={{ color: "rgba(255,255,255,0.85)" }}>50% der technischen Barrieren vollautomatisch</strong>. Den Rest erledigt dein Team mit unseren präzisen, seiten-genauen Reports — mit exakten URLs, Fehlerbeschreibungen und Code-Fixes.
                </p>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {["Sitemap + BFS-Crawl", "Seitentyp-Klassifikation", "Aggregierte Fehler-Reports", "KI-Batch-Analyse"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ background: "#0b0c10", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: "#fff" }}>
                Einfach. Transparent. Ehrlich.
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)" }}>
                Keine versteckten Kosten. Monatlich kündbar. DSGVO-konform.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, alignItems: "stretch" }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{
                  background: "#ffffff",
                  border: plan.recommended ? `2px solid #2563EB` : `1px solid #E2E8F0`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: plan.recommended
                    ? "0 8px 40px rgba(37,99,235,0.15)"
                    : plan.scale
                      ? "0 4px 20px rgba(124,58,237,0.08)"
                      : "0 2px 12px rgba(0,0,0,0.05)",
                }}>
                  {/* Top stripe */}
                  {plan.recommended && (
                    <div style={{ background: "#2563EB", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>★ BESTSELLER · WHITE-LABEL AB HIER</span>
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
                    <div style={{ height: 4, background: "#F1F5F9" }} />
                  )}

                  <div style={{ padding: "28px 24px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: plan.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                        {plan.enterprise ? (
                          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>Auf Anfrage</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: "#0F172A" }}>{plan.price}€</span>
                            <span style={{ fontSize: 13, color: "#94A3B8" }}>{plan.per}</span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>{plan.desc}</p>
                    </div>

                    <div style={{ height: 1, background: "#F1F5F9", marginBottom: 18 }} />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{
                            width: 17, height: 17, borderRadius: 4, flexShrink: 0,
                            background: f.highlight
                              ? (plan.recommended ? "#2563EB" : plan.scale ? "#7C3AED" : plan.enterprise ? "#0F172A" : "#475569")
                              : "#F1F5F9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "#fff" : "#94A3B8"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: f.highlight ? 600 : 400, color: f.highlight ? "#0F172A" : "#64748B" }}>
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
                          padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                          textDecoration: "none",
                          background: plan.recommended ? "#2563EB" : plan.scale ? "#7C3AED" : plan.enterprise ? "#0F172A" : "#F8FAFC",
                          color: plan.recommended || plan.scale || plan.enterprise ? "#ffffff" : "#475569",
                          border: plan.recommended || plan.scale || plan.enterprise ? "none" : "1px solid #E2E8F0",
                          boxShadow: plan.recommended ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, textAlign: "center", display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {["Keine Kreditkarte nötig", "Jederzeit kündbar", "DSGVO-konform", "Daten in Deutschland"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "#0b0c10", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.12em" }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", color: "#fff" }}>
              Häufige Fragen
            </h2>
            <p style={{ margin: "0 0 40px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              Alles, was Agentur-Inhaber vor dem Start wissen wollen.
            </p>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* CTA BANNER */}
        <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "60px 24px 0" }}>
          <div style={{
            padding: "clamp(40px, 5vw, 64px) clamp(28px, 5vw, 56px)",
            borderRadius: 20,
            background: "linear-gradient(135deg, #0d1520 0%, #0b0c10 50%, #0a0f1a 100%)",
            border: "1px solid rgba(0,123,255,0.2)",
            boxShadow: "0 0 80px rgba(0,123,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "50%", height: "200%", background: "radial-gradient(ellipse, rgba(0,123,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Deine erste Website<br />scannst du kostenlos.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Keine Kreditkarte. Keine Installation.<br />Ergebnis in unter 60 Sekunden.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
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
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingLeft: 4 }}>
                Agency Core ab 149€/Monat · Jederzeit kündbar
              </span>
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
