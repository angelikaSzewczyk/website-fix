import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebsiteFix für Agenturen — Automatisches Monitoring & White-Label Reports",
  description: "Alle Kunden-Websites automatisch überwachen, Alerts vor dem Kunden erhalten und monatliche Reports automatisch versenden. Für Web-Agenturen.",
};

const PROBLEMS = [
  {
    title: "Du erfährst Probleme vom Kunden",
    desc: "Der Kunde ruft an. Die Site ist down, das SSL-Zertifikat abgelaufen, Google findet die Seite nicht mehr. Du reagierst — statt zu agieren.",
  },
  {
    title: "Monatsreports kosten Stunden",
    desc: "20 Kunden, 20 manuelle Reports. Recherche, Screenshots, Formatierung, E-Mail. Zeit die kein Kunde bezahlt.",
  },
  {
    title: "WCAG-Audits sind nicht skalierbar",
    desc: "Ein manueller Barrierefreiheits-Audit dauert 4–8 Stunden pro Website. Nicht machbar wenn du 10+ Kunden betreust.",
  },
  {
    title: "Wartungsverträge lassen sich kaum rechtfertigen",
    desc: "Der Kunde fragt was du für die 150€/Monat eigentlich tust. Du kannst es kaum zeigen.",
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
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
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
            display: "inline-block", marginBottom: 24,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(122,166,255,0.25)",
            fontSize: 12, color: "#7aa6ff", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            Für Web-Agenturen
          </div>

          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, lineHeight: 1.08, margin: "0 0 24px", letterSpacing: "-0.03em", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
            30 Kunden-Websites.<br />
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Null manuelle Reports.</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
            WebsiteFix überwacht alle Kunden-Websites automatisch, schlägt Alarm bevor der Kunde anruft — und sendet monatliche Reports direkt in seinem Namen.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Agentur-Plan starten — 99€/Monat
            </Link>
            <Link href="/scan" style={{
              padding: "13px 28px", borderRadius: 10, fontSize: 15,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}>
              Erst kostenlos testen
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
            Keine Mindestlaufzeit · Monatlich kündbar · BFSG-konform
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* PROBLEMS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Das Problem</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Was Agenturen täglich Zeit kostet.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ padding: "28px 28px", background: "#0b0c10" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b6b", marginBottom: 16 }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "#fff" }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            ))}
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
                <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>99€</span>
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
                padding: "11px 20px", borderRadius: 9, fontSize: 14, fontWeight: 600,
                background: "#fff", color: "#0b0c10", textDecoration: "none",
              }}>
                Agentur-Plan starten
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
                background: "#fff", color: "#0b0c10", textDecoration: "none",
              }}>
                Agentur-Plan starten
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
