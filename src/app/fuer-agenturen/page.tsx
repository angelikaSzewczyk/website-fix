"use client";

import { useState } from "react";
import Link from "next/link";

type CheckoutState = "idle" | "loading" | "error";

async function startCheckout(plan: string, setState: (s: CheckoutState) => void) {
  setState("loading");
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setState("error");
    }
  } catch {
    setState("error");
  }
}

const PROBLEMS = [
  {
    icon: "⏱️",
    title: "WCAG-Audits fressen Zeit",
    desc: "Ein manueller Barrierefreiheits-Audit dauert 4–8 Stunden pro Website. Nicht skalierbar wenn du 10+ Kunden hast.",
  },
  {
    icon: "📞",
    title: "Du erfährst Fehler vom Kunden",
    desc: "Kunde schreibt um 9 Uhr: 'Meine Website ist down.' Das schadet der Beziehung — und deiner Reputation.",
  },
  {
    icon: "📊",
    title: "Reports kosten Stunden",
    desc: "Monatliche Status-Reports für 20 Kunden-Websites manuell erstellen — Zeit die du nicht hast und die kein Kunde bezahlt.",
  },
  {
    icon: "⚖️",
    title: "BFSG seit Juni 2025 Pflicht",
    desc: "Gewerbliche Websites müssen barrierefrei sein. Die meisten Kunden wissen es nicht — und fragen ihre Agentur.",
  },
];

const FEATURES = [
  { icon: "♿", label: "WCAG 2.1 AA Scan", desc: "Kompletter Barrierefreiheits-Scan — jeder Fehler auf Deutsch erklärt mit fertigem Code-Fix." },
  { icon: "🔍", label: "SEO + Technischer Check", desc: "Title, Meta, Canonical, robots.txt, Sitemap, HTTPS — alles in einem Scan." },
  { icon: "🏷️", label: "White-Label Reports", desc: "Fertige Reports unter deinem Logo — direkt an den Kunden schicken." },
  { icon: "👥", label: "Agentur-Dashboard", desc: "Alle Kunden-Websites in einer Übersicht. Kommt in Phase 2." },
  { icon: "🔔", label: "Monitoring + Alerts", desc: "Benachrichtigung bevor der Kunde anruft. Kommt in Phase 2." },
  { icon: "📅", label: "Automatische Monatsberichte", desc: "Für jeden Kunden automatisch generiert. Kommt in Phase 2." },
];

const STEPS = [
  { num: "1", title: "URL eingeben", desc: "Kunden-Website eintragen — kein Plugin, kein Zugang nötig." },
  { num: "2", title: "KI scannt alles", desc: "WCAG 2.1, SEO, Performance, Bugs — in unter 2 Minuten." },
  { num: "3", title: "Report fertig", desc: "Deutschen Report mit Fehlern, Prioritäten und Code-Fixes — direkt an den Kunden." },
];

export default function AgencyPage() {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/scan" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>Tool testen</Link>
            <Link href="/blog" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>Blog</Link>
            <button
              onClick={() => startCheckout("pro", setCheckoutState)}
              className="cta ctaSmall"
              disabled={checkoutState === "loading"}
            >
              {checkoutState === "loading" ? "..." : "Jetzt starten"}
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="badge" style={{ background: "rgba(141,243,211,0.1)", color: "#8df3d3" }}>
            Für Web-Agenturen · WCAG + SEO + Monitoring · BFSG-konform
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.1, margin: "0 0 20px" }}>
            Alle Kunden-Websites.<br />
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Ein Scan. Fertig.
            </span>
          </h1>
          <p className="heroText" style={{ maxWidth: 560 }}>
            WebsiteFix scannt alle Kunden-Websites automatisch auf WCAG, SEO und technische Fehler —
            erklärt jeden Fehler auf Deutsch und liefert den Code-Fix.
            Kein manueller Audit. Kein Entwickler nötig.
          </p>
          <div className="heroActions">
            <button
              onClick={() => startCheckout("pro", setCheckoutState)}
              className="cta"
              disabled={checkoutState === "loading"}
              style={{ fontSize: 16, padding: "15px 32px" }}
            >
              {checkoutState === "loading" ? "Weiterleitung..." : "Jetzt starten — 29€/Monat →"}
            </button>
            <Link href="/scan" className="ghost" style={{ fontSize: 15 }}>
              Erst kostenlos testen
            </Link>
          </div>
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            Keine Kreditkarte für den Test · Cancel jederzeit · WCAG 2.1 AA · BFSG-konform
          </p>
          {checkoutState === "error" && (
            <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>
              Etwas ist schiefgelaufen. Bitte versuche es erneut.
            </p>
          )}
        </section>

        {/* EXAMPLE */}
        <div style={{
          background: "rgba(141,243,211,0.06)",
          border: "1px solid rgba(141,243,211,0.2)",
          borderRadius: 12, padding: "14px 20px",
          display: "flex", gap: 12, alignItems: "baseline", marginBottom: 32,
        }}>
          <span style={{ fontSize: 13, color: "#8df3d3", fontWeight: 650, whiteSpace: "nowrap" }}>Zum Beispiel:</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            Kunden-Website für BFSG-Compliance prüfen → URL eingeben → KI findet 12 WCAG-Verstöße → Report fertig → direkt an Kunden. 5 Minuten statt 6 Stunden.
          </span>
        </div>

        {/* PROBLEMS */}
        <section className="section">
          <h2>Was Agenturen täglich Zeit kostet.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {PROBLEMS.map((item) => (
              <div key={item.title} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 26 }}>{item.icon}</div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
                <p className="cardSub" style={{ margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section">
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>So funktioniert es</p>
          <h2>Scan, Diagnose, Report — fertig.</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 28 }}>
            URL eingeben, fertig. KI prüft WCAG, SEO und technische Fehler gleichzeitig — auf Deutsch, mit Code-Fix.
          </p>
          <div className="steps">
            {STEPS.map((step) => (
              <div key={step.num} className="step">
                <div className="stepNum">{step.num}</div>
                <div>
                  <div className="stepTitle">{step.title}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="section">
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Was du bekommst</p>
          <h2>Ein Tool für alles.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 22 }}>
            {FEATURES.map((item) => (
              <div key={item.label} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 22 }}>{item.icon}</div>
                <div style={{ fontWeight: 650, fontSize: 15 }}>{item.label}</div>
                <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="section" id="pricing">
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Preise</p>
          <h2>Einfach. Transparent. Fair.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 28 }}>

            {/* FREE */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Free</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>0€</div>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Zum Ausprobieren</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
                {["3 Scans pro Monat", "WCAG 2.1 Fehlerliste", "KI-Erklärungen auf Deutsch"].map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#8df3d3" }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/scan" className="ghost" style={{ fontSize: 14, textAlign: "center", padding: "11px 20px" }}>
                Kostenlos testen
              </Link>
            </div>

            {/* PRO */}
            <div className="card" style={{
              display: "flex", flexDirection: "column", gap: 12,
              border: "1px solid rgba(141,243,211,0.35)",
              background: "rgba(141,243,211,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 650, color: "#8df3d3", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pro</div>
                <div style={{ fontSize: 11, background: "rgba(141,243,211,0.15)", color: "#8df3d3", borderRadius: 6, padding: "3px 8px" }}>Beliebt</div>
              </div>
              <div>
                <span style={{ fontSize: 36, fontWeight: 700 }}>29€</span>
                <span className="muted" style={{ fontSize: 14 }}> / Monat</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Für Freelancer & kleine Agenturen</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
                {[
                  "Unlimitierte Scans",
                  "WCAG + SEO + Technischer Check",
                  "KI-Erklärungen + Code-Fixes",
                  "Report exportieren",
                  "E-Mail Support",
                ].map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#8df3d3" }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => startCheckout("pro", setCheckoutState)}
                className="cta"
                disabled={checkoutState === "loading"}
                style={{ fontSize: 14, padding: "12px 20px" }}
              >
                {checkoutState === "loading" ? "..." : "Jetzt starten →"}
              </button>
            </div>

            {/* AGENTUR */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Agentur</div>
              <div>
                <span style={{ fontSize: 36, fontWeight: 700 }}>99€</span>
                <span className="muted" style={{ fontSize: 14 }}> / Monat</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Für Agenturen mit mehreren Kunden</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
                {[
                  "Alles aus Pro",
                  "White-Label Reports",
                  "Bis zu 30 Kunden-Domains",
                  "Team-Zugang (3 Seats)",
                  "Agentur-Dashboard (kommt bald)",
                  "Prioritäts-Support",
                ].map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#8df3d3" }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => startCheckout("agentur", setCheckoutState)}
                className="ghost"
                disabled={checkoutState === "loading"}
                style={{ fontSize: 14, padding: "12px 20px" }}
              >
                {checkoutState === "loading" ? "..." : "Agentur-Plan starten →"}
              </button>
            </div>

          </div>
          {checkoutState === "error" && (
            <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 16 }}>
              Etwas ist schiefgelaufen. Bitte versuche es erneut.
            </p>
          )}
        </section>

        {/* CTA */}
        <section className="section" style={{
          background: "rgba(141,243,211,0.04)",
          border: "1px solid rgba(141,243,211,0.12)",
          borderRadius: 16, padding: "48px 32px", marginTop: 0,
        }}>
          <h2 style={{ marginBottom: 12 }}>Erst testen — dann entscheiden.</h2>
          <p className="muted" style={{ maxWidth: 500, marginBottom: 28 }}>
            Scanne jetzt eine Kunden-Website kostenlos. Überzeuge dich selbst wie viel Zeit du sparst.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/scan" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              Kostenlos scannen →
            </Link>
            <button
              onClick={() => startCheckout("pro", setCheckoutState)}
              className="ghost"
              disabled={checkoutState === "loading"}
              style={{ fontSize: 15 }}
            >
              Direkt starten — 29€/Monat
            </button>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 20px", textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/impressum" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Impressum</Link>
          {" · "}
          <Link href="/datenschutz" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Datenschutz</Link>
        </p>
      </footer>
    </>
  );
}
