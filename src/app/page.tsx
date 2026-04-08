import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebsiteFix — Website-Diagnose & Monitoring für Agenturen",
  description: "WCAG, SEO und Performance-Scan für jede Website. Automatisches Monitoring und White-Label Reports für Web-Agenturen.",
};

const CHECKS = [
  { label: "WCAG 2.1 Barrierefreiheit", desc: "Alle Accessibility-Fehler auf Deutsch erklärt" },
  { label: "SEO Grundlagen", desc: "Title, Meta, Headings, Sitemap, robots.txt" },
  { label: "Performance", desc: "Core Web Vitals, Ladezeit, PageSpeed Score" },
  { label: "SSL & Sicherheit", desc: "Zertifikat-Status, Security Headers, HTTPS" },
  { label: "Technische Fehler", desc: "HTTP-Status, Weiterleitungen, Erreichbarkeit" },
  { label: "Plattform-Erkennung", desc: "WordPress, Shopify, Wix, Custom — automatisch" },
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
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px 80px", textAlign: "center" }}>
          <div style={{
            display: "inline-block", marginBottom: 24,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(141,243,211,0.2)",
            fontSize: 12, color: "#8df3d3", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            WCAG · SEO · Performance · Monitoring
          </div>

          <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 700, lineHeight: 1.08, margin: "0 0 24px", letterSpacing: "-0.03em", maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
            Website-Diagnose.<br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Automatisch. Auf Deutsch.</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 40px", fontWeight: 400 }}>
            WebsiteFix scannt jede Website auf WCAG, SEO und Performance — erklärt jeden Fehler auf Deutsch und liefert den Code-Fix.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scan" style={{
              padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Website jetzt scannen
            </Link>
            <Link href="/fuer-agenturen" style={{
              padding: "13px 28px", borderRadius: 10, fontSize: 15,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
            }}>
              Für Agenturen
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            Kostenlos · Keine Installation · Ergebnis in unter 60 Sekunden
          </p>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* CHECKS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Was geprüft wird</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Ein Scan. Sechs Prüfbereiche.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            {CHECKS.map((check, i) => (
              <div key={i} style={{ padding: "28px 28px", background: "#0b0c10" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8df3d3", marginBottom: 16 }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: "#fff" }}>{check.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{check.desc}</div>
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
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
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
