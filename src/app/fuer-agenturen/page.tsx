import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebsiteFix für Agenturen — Automatisches Reporting & Monitoring",
  description: "Hol dir deine Wochenenden zurück. Automatisches Monitoring, KI-gestützte Fehlerbehebung und White-Label Reports für deine Wartungskunden.",
};

const PROBLEMS = [
  {
    icon: "📋",
    title: "Manuelle Reports fressen dein Wochenende",
    desc: "20 Kunden, 20 individuelle Reports. Recherche, Screenshots, Formatierung, versenden. Jede Stunde die du dafür ausgibst, kannst du nicht verkaufen — und kein Kunde dankt es dir explizit.",
    quote: `„Samstag, 14 Uhr. Ich sitze wieder an Reports statt mit meiner Familie."`,
  },
  {
    icon: "📞",
    title: "Fehler bemerkst du, wenn der Kunde anruft",
    desc: "SSL abgelaufen. Website offline. Google-Index verschwunden. Du erfährst es nicht als Erster — der Kunde schon. Das kostet Vertrauen, das du in Monaten aufgebaut hast.",
    quote: `„Warum habt ihr das nicht gesehen? Ihr betreut ja unsere Website."`,
  },
  {
    icon: "⚖️",
    title: "WCAG-Haftung: du haftest, nicht der Kunde",
    desc: "Das Barrierefreiheitsstärkungsgesetz (BFSG) gilt seit Juni 2025. Wer die Website wartet, trägt Mitverantwortung. Ein manuelles WCAG-Audit kostet 4–8h pro Website — unmöglich skalierbar.",
    quote: `„Wir brauchen eine WCAG-konforme Website. Kannst du das garantieren?"`,
  },
];

const HOW = [
  {
    num: "01",
    title: "Kunden-Websites eintragen",
    desc: "URL eingeben — fertig. Kein Plugin, kein Hosting-Zugang, kein Code. WebsiteFix erkennt automatisch die Plattform: WordPress, Shopify, Wix, Custom.",
  },
  {
    num: "02",
    title: "Automatisches tägliches Monitoring",
    desc: "SSL-Ablauf, Uptime, Security Headers, WCAG, SEO, Performance — täglich geprüft für alle Kunden-Websites gleichzeitig.",
  },
  {
    num: "03",
    title: "Alert bevor der Kunde anruft",
    desc: "Sobald etwas kritisch wird, bekommst du eine E-Mail mit klarer Diagnose. Du löst das Problem — der Kunde merkt es nie.",
  },
  {
    num: "04",
    title: "Monatsbericht automatisch versendet",
    desc: "Jeder Kunde bekommt automatisch einen gebranderten PDF-Report mit deinem Logo. Du richtest es einmalig ein — danach läuft es von alleine.",
  },
];

const FEATURES = [
  { title: "Universeller Scan", desc: "WCAG 2.1, SEO, Performance, Security — für jede Website-Plattform" },
  { title: "Plattform-Erkennung", desc: "WordPress, Shopify, Wix, TYPO3, Custom — automatisch erkannt" },
  { title: "SSL-Monitoring", desc: "Alert 30 Tage vor Ablauf — nie wieder abgelaufene Zertifikate" },
  { title: "White-Label Reports", desc: "PDF mit deinem Logo, deinem Namen — kein WebsiteFix-Branding" },
  { title: "Team-Zugang", desc: "Bis zu 3 Seats — Kollegen haben Zugang zum selben Account" },
  { title: "KI-Diagnose auf Deutsch", desc: "Jeder Fehler erklärt, mit Priorität und konkretem Code-Fix" },
  { title: "Kunden-Übersicht", desc: "Alle Websites auf einen Blick — Status, letzter Scan, Probleme" },
  { title: "BFSG-konform", desc: "Barrierefreiheitsstärkungsgesetz seit Juni 2025 — wir prüfen die relevanten Kriterien" },
];

const FAQ = [
  {
    q: "Für welche Website-Plattformen funktioniert das?",
    a: "Für jede öffentlich erreichbare Website — WordPress, WooCommerce, Shopify, Wix, Squarespace, Webflow, TYPO3, Joomla, Drupal und Custom-Entwicklungen. Kein Plugin nötig.",
  },
  {
    q: "Muss ich Hosting-Zugang oder WordPress-Login teilen?",
    a: "Nein. Nur die URL reicht. WebsiteFix scannt extern — ohne Zugang zu Server, FTP oder CMS.",
  },
  {
    q: "Wann kommen Monitoring und automatische Monatsberichte?",
    a: "Monitoring und automatische Berichte sind in aktiver Entwicklung. Agentur-Kunden die jetzt starten werden als erste informiert und erhalten Zugang sobald es live geht.",
  },
  {
    q: "Kann ich den Plan jederzeit kündigen?",
    a: "Ja. Monatliche Kündigung, keine Mindestlaufzeit. Abrechnung über Stripe.",
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
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/scan" className="hide-sm" style={{
              fontSize: 13, padding: "7px 16px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}>
              Kostenlos testen
            </Link>
            <Link href="/login" style={{
              fontSize: 13, padding: "7px 16px", borderRadius: 8, fontWeight: 600,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Jetzt starten
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* HERO */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px 80px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(122,166,255,0.25)",
            background: "rgba(122,166,255,0.06)",
            fontSize: 12, color: "#7aa6ff", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7aa6ff", boxShadow: "0 0 6px #7aa6ff" }} />
            Für Web-Agenturen mit Wartungskunden
          </div>

          <h1 style={{ fontSize: "clamp(34px, 5vw, 62px)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 10px", letterSpacing: "-0.035em", maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
            Hol dir deine Wochenenden zurück.
          </h1>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 34px)", fontWeight: 600, lineHeight: 1.2, margin: "0 0 26px", letterSpacing: "-0.02em", color: "rgba(255,255,255,0.35)", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
            Automatisches Reporting für deine Wartungskunden.
          </h2>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 40px" }}>
            WebsiteFix überwacht alle Kunden-Websites rund um die Uhr, behebt Fehler per KI-Assistent und sendet jeden Monat einen professionellen White-Label Report — automatisch, mit deinem Logo.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.35)",
            }}>
              Jetzt Wartung automatisieren →
            </Link>
            <Link href="/scan" style={{
              padding: "14px 28px", borderRadius: 10, fontSize: 15,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
            }}>
              Erst kostenlos testen
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: "0.02em" }}>
            149€/Monat · Keine Mindestlaufzeit · BFSG-konform
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* PROBLEMS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,107,107,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Das Problem</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
            Warum Agenturen Zeit verlieren.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: "0 0 48px", maxWidth: 560, lineHeight: 1.7 }}>
            Drei Situationen, die du kennst. Und die dich jeden Monat Stunden und Vertrauen kosten.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{
                padding: "28px 32px",
                border: "1px solid rgba(255,107,107,0.12)",
                borderRadius: 14,
                background: "rgba(255,107,107,0.03)",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px 40px",
                alignItems: "start",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{p.title}</div>
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 580 }}>{p.desc}</div>
                </div>
                <div style={{
                  fontSize: 13, color: "rgba(255,150,150,0.5)", fontStyle: "italic",
                  lineHeight: 1.6, maxWidth: 260, flexShrink: 0,
                  borderLeft: "2px solid rgba(255,107,107,0.15)",
                  paddingLeft: 16, alignSelf: "center",
                  display: "none", // shown via CSS on wide screens
                }}>
                  {p.quote}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* WHITE-LABEL SYSTEM */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div className="grid-1-sm gap-sm-32" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

            {/* Left: explanation */}
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Die Lösung</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Dein Logo.<br />Deine Farben.<br />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>Kein WebsiteFix-Branding.</span>
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 28 }}>
                Du lädst einmalig dein Agentur-Logo hoch und wählst deine Primärfarbe. Danach erscheint auf jedem Monatsbericht <strong style={{ color: "#fff" }}>dein Name, dein Logo, deine Farbe</strong> — der Kunde sieht nie, dass WebsiteFix dahinter steckt.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  { icon: "🎨", text: "Logo & Primärfarbe hinterlegen — einmalig in den Einstellungen" },
                  { icon: "🤖", text: "KI schreibt die Management-Zusammenfassung auf Agentur-Niveau" },
                  { icon: "📤", text: "Report wird automatisch am Monatsende an den Kunden gesendet" },
                  { icon: "🔒", text: "Kein WebsiteFix-Branding außer einem dezenten Pflichthinweis im Footer" },
                ].map(item => (
                  <div key={item.text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/login" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600,
                background: "linear-gradient(90deg,#007BFF,#0057b8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 3px 14px rgba(0,123,255,0.3)",
              }}>
                Jetzt Wartung automatisieren →
              </Link>
            </div>

            {/* Right: Report preview card */}
            <div style={{ position: "relative" }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: "-30px",
                background: "radial-gradient(ellipse at 50% 50%, rgba(0,123,255,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{
                position: "relative",
                background: "#fff", borderRadius: 14, overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}>
                {/* Agency header — shows with custom brand color */}
                <div style={{
                  background: "linear-gradient(135deg, #007BFF, #0057b8)",
                  padding: "20px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: "#fff",
                    }}>
                      M
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Muster Agentur GmbH</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Monatlicher Website-Report</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>April 2026</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Müller & Söhne Sanitär</div>
                  </div>
                </div>

                <div style={{ padding: "20px 24px" }}>
                  {/* Executive summary */}
                  <div style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "rgba(0,123,255,0.05)", border: "1px solid rgba(0,123,255,0.15)",
                    marginBottom: 18,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#007BFF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Management-Zusammenfassung
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#444", lineHeight: 1.8 }}>
                      Im April 2026 haben wir alle vereinbarten Leistungen erbracht. Durch proaktive WCAG-Audits und sofortige KI-gestützte Fehlerbehebung wurde die Rechtssicherheit Ihrer Website kontinuierlich gewährleistet.
                    </p>
                  </div>

                  {/* KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Uptime", value: "98%", color: "#007BFF" },
                      { label: "Scans", value: "3",   color: "#007BFF" },
                      { label: "Gelöst", value: "7",  color: "#007BFF" },
                    ].map(k => (
                      <div key={k.label} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>{k.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{
                    paddingTop: 14, borderTop: "1px solid #f0f0f0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#ccc" }}>
                      Erstellt am 01.05.2026 für Müller & Söhne Sanitär
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(0,123,255,0.08)", color: "#007BFF" }}>
                      Muster Agentur GmbH
                    </span>
                  </div>
                </div>
              </div>

              {/* Label badge */}
              <div style={{
                position: "absolute", top: -12, right: 16,
                padding: "4px 12px", borderRadius: 20,
                background: "#0b0c10", border: "1px solid rgba(122,166,255,0.3)",
                fontSize: 11, fontWeight: 600, color: "#7aa6ff",
              }}>
                ← deine Farbe & dein Logo
              </div>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* HOW IT WORKS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>So funktioniert es</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Einmal einrichten. Dann läuft es.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            {HOW.map((step, i) => (
              <div key={i} style={{
                padding: "28px 32px",
                borderBottom: i < HOW.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                display: "flex", gap: 28, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", paddingTop: 4, flexShrink: 0, width: 24 }}>{step.num}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: "#fff" }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* FEATURES */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Was enthalten ist</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Alles in einem Tool.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: "24px 28px", background: "#0b0c10" }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#fff" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* PRICING */}
        <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Preise</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Agentur-Plan.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 40px" }}>
            Eine Agentur mit 30 Kunden-Websites spart damit 100+ Stunden pro Monat.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, maxWidth: 860 }}>

            {/* PRO */}
            <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Pro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>29€</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/Monat</span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>Für Freelancer & kleine Teams</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                {["Unlimitierte Scans", "WCAG + SEO + Performance", "KI-Diagnose + Code-Fixes", "PDF-Export", "Scan-Historie"].map(f => (
                  <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                    <span style={{ color: "#8df3d3" }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/login" style={{
                display: "block", textAlign: "center",
                padding: "11px 20px", borderRadius: 9, fontSize: 14,
                border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Pro starten
              </Link>
            </div>

            {/* AGENTUR */}
            <div style={{ padding: "28px", border: "1px solid rgba(122,166,255,0.3)", borderRadius: 12, background: "rgba(122,166,255,0.03)", position: "relative" }}>
              <div style={{
                position: "absolute", top: -1, right: 24,
                padding: "3px 10px", borderRadius: "0 0 8px 8px",
                background: "#7aa6ff", color: "#0b0c10",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              }}>
                EMPFOHLEN
              </div>
              <div style={{ fontSize: 13, color: "#7aa6ff", marginBottom: 12 }}>Agentur</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>149€</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/Monat</span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>Für Web-Agenturen</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                {[
                  "Alles aus Pro",
                  "Bis zu 30 Kunden-Domains",
                  "White-Label Reports",
                  "Team-Zugang (3 Seats)",
                  "Kunden-Übersicht Dashboard",
                  "Automatische Monatsberichte",
                  "Prioritäts-Support",
                ].map(f => (
                  <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                    <span style={{ color: "#7aa6ff" }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/login" style={{
                display: "block", textAlign: "center",
                padding: "12px 20px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(90deg,#007BFF,#0057b8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 3px 12px rgba(0,123,255,0.3)",
              }}>
                Jetzt Wartung automatisieren →
              </Link>
            </div>

          </div>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* FAQ */}
        <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
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
            padding: "56px 48px", borderRadius: 16,
            border: "1px solid rgba(122,166,255,0.15)",
            background: "rgba(122,166,255,0.03)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24,
          }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Erst testen — dann entscheiden.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                Scanne eine Kunden-Website kostenlos. Kein Account nötig.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/scan" style={{
                padding: "13px 24px", borderRadius: 10, fontSize: 14,
                border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Kostenlos scannen
              </Link>
              <Link href="/login" style={{
                padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: "linear-gradient(90deg,#007BFF,#0057b8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 3px 12px rgba(0,123,255,0.3)",
              }}>
                Jetzt Wartung automatisieren →
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            {`© ${new Date().getFullYear()} website-fix.com`}
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/impressum" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
            <Link href="/datenschutz" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
            <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Startseite</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
