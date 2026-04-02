"use client";

import { track } from "@/lib/track";
import { useState } from "react";

type Lang = "de" | "en";
type SubmitState = "idle" | "sending" | "success" | "error";

const WAITLIST_FORM = "https://formspree.io/f/mwvwkkgj";

const copy = {
  de: {
    nav: {
      logo: "WebsiteFix",
      forUsers: "Für Privatnutzer",
      cta: "Zur Warteliste",
    },
    hero: {
      badge: "Für Agenturen — kommt bald",
      h1a: "Ihr Kunde meldet seinen Website-Fehler —",
      h1b: "bevor WebsiteFix es tut?",
      sub: "WebsiteFix überwacht alle Kunden-Websites automatisch, meldet Fehler sofort — und behebt sie direkt. Kein manuelles Prüfen. Kein überraschter Kunde.",
      cta: "Frühen Zugang sichern",
      trust: "Kostenlos in der Beta · Keine Kreditkarte · Beta startet April 2026",
    },
    example: {
      label: "Zum Beispiel",
      text: "Kunden-Website down seit 3 Uhr nachts → WebsiteFix erkennt es sofort → KI repariert automatisch → du siehst es im Dashboard. Der Kunde merkt nichts.",
    },
    problems: {
      h2: "Drei Probleme, die jede Agentur kennt.",
      items: [
        {
          icon: "📞",
          title: "Du erfährst es vom Kunden",
          desc: "Kunde schreibt um 9 Uhr: 'Meine Website ist seit gestern down.' Das schadet der Beziehung — und deiner Reputation.",
        },
        {
          icon: "📊",
          title: "Reports kosten Stunden",
          desc: "Monatliche Status-Reports für 20 Kunden-Websites manuell zu erstellen ist Zeit die du nicht hast — und die kein Kunde bezahlt.",
        },
        {
          icon: "🔍",
          title: "Kein Überblick über alle Sites",
          desc: "30 Kunden, 30 Websites — du kannst nicht alle gleichzeitig im Blick haben. Bis ein Fehler auffällt, ist er längst sichtbar.",
        },
      ],
    },
    solution: {
      h2: "Ein Dashboard für alle Kunden-Websites.",
      sub: "WebsiteFix überwacht automatisch, meldet sofort, repariert direkt — und erstellt den Report für dich.",
      steps: [
        { num: "1", title: "Alle Websites eintragen", desc: "Einmal alle Kunden-URLs hinterlegen. Kein Plugin, kein Zugang nötig." },
        { num: "2", title: "KI überwacht rund um die Uhr", desc: "Fehler, Speed, SEO, kaputte Links, Formulare — für jede Website gleichzeitig." },
        { num: "3", title: "Alert & automatisch behoben", desc: "Du wirst sofort informiert — und die KI behebt den Fehler direkt. Bevor der Kunde es merkt." },
      ],
    },
    features: {
      h2: "Was Agenturen bekommen",
      items: [
        { icon: "🏷️", label: "White-Label Reports", desc: "Fertige Reports unter Ihrem Logo — direkt an den Kunden." },
        { icon: "👥", label: "Agentur-Dashboard", desc: "Alle Kunden-Websites in einer Übersicht mit Status und Score." },
        { icon: "🔔", label: "Frühwarnsystem", desc: "Alert bevor der Kunde anruft — immer einen Schritt voraus." },
        { icon: "📅", label: "Automatische Monatsberichte", desc: "Für jeden Kunden automatisch generiert — kein manueller Aufwand." },
        { icon: "🔧", label: "KI-Reparatur", desc: "Fehler direkt behoben — kein Ticket, kein Aufwand, kein Entwickler." },
        { icon: "📈", label: "Score-Verlauf", desc: "Zeig dem Kunden wie du seinen Website-Score Monat für Monat verbesserst." },
      ],
    },
    waitlist: {
      h2: "Beta startet April 2026 — jetzt eintragen",
      sub: "Agenturen auf der Waitlist bekommen dauerhaften Rabatt und als Erste Zugang zum Agentur-Dashboard.",
      emailPlaceholder: "ihre@agentur.de",
      agencyPlaceholder: "Name Ihrer Agentur",
      urlPlaceholder: "https://ihre-agentur.de (optional)",
      btn: "Jetzt eintragen",
      sending: "Wird eingetragen …",
      success: "Sie sind dabei! Wir melden uns sobald die Beta startet.",
      error: "Etwas ist schiefgelaufen. Bitte versuch es nochmal oder schreib uns.",
      privacy: "Kein Spam. Nur eine E-Mail wenn die Beta startet.",
    },
    faq: {
      h2: "Häufige Fragen",
      items: [
        {
          q: "Was kostet das?",
          a: "Die Beta ist kostenlos. Danach ab 99€/Monat pro Agentur. Waitlist-Mitglieder bekommen dauerhaften Rabatt.",
        },
        {
          q: "Wie viele Kunden-Websites kann ich hinzufügen?",
          a: "Das Agentur-Paket ist für mehrere Websites ausgelegt. Genaue Limits werden vor Beta-Start kommuniziert.",
        },
        {
          q: "Gibt es White-Label?",
          a: "Ja. Reports erscheinen unter Ihrem Logo — fertig für den Kunden, ohne WebsiteFix-Branding.",
        },
        {
          q: "Funktioniert das nur für WordPress?",
          a: "Zunächst für WordPress. Shopify, Wix und Custom-Sites folgen direkt nach der Beta.",
        },
      ],
    },
    footer: {
      imprint: "Impressum",
      privacy: "Datenschutz",
    },
  },
  en: {
    nav: {
      logo: "WebsiteFix",
      forUsers: "For individuals",
      cta: "Join Waitlist",
    },
    hero: {
      badge: "For agencies — coming soon",
      h1a: "Your client reports their website error —",
      h1b: "before WebsiteFix does?",
      sub: "WebsiteFix monitors all client websites automatically, alerts you instantly — and fixes errors directly. No manual checking. No surprised clients.",
      cta: "Get early access",
      trust: "Free in beta · No credit card · Beta launches April 2026",
    },
    example: {
      label: "For example",
      text: "Client website down since 3am → WebsiteFix detects it immediately → AI fixes automatically → you see it in the dashboard. The client never notices.",
    },
    problems: {
      h2: "Three problems every agency knows.",
      items: [
        {
          icon: "📞",
          title: "You hear it from the client",
          desc: "Client messages at 9am: 'My website has been down since yesterday.' That damages the relationship — and your reputation.",
        },
        {
          icon: "📊",
          title: "Reports take hours",
          desc: "Manually creating monthly status reports for 20 client websites takes time you don't have — and no client pays for.",
        },
        {
          icon: "🔍",
          title: "No overview of all sites",
          desc: "30 clients, 30 websites — you can't watch them all at once. By the time an error shows up, it's been visible for hours.",
        },
      ],
    },
    solution: {
      h2: "One dashboard for all client websites.",
      sub: "WebsiteFix monitors automatically, alerts instantly, fixes directly — and creates the report for you.",
      steps: [
        { num: "1", title: "Add all websites", desc: "Enter all client URLs once. No plugin or access needed." },
        { num: "2", title: "AI monitors 24/7", desc: "Errors, speed, SEO, broken links, forms — for every website simultaneously." },
        { num: "3", title: "Alert & automatically fixed", desc: "You're notified instantly — and AI fixes the error directly. Before the client notices." },
      ],
    },
    features: {
      h2: "What agencies get",
      items: [
        { icon: "🏷️", label: "White-label reports", desc: "Finished reports under your logo — ready for the client." },
        { icon: "👥", label: "Agency dashboard", desc: "All client websites in one overview with status and score." },
        { icon: "🔔", label: "Early warning system", desc: "Alert before the client calls — always one step ahead." },
        { icon: "📅", label: "Automatic monthly reports", desc: "Generated automatically for each client — no manual effort." },
        { icon: "🔧", label: "AI repair", desc: "Errors fixed directly — no ticket, no effort, no developer." },
        { icon: "📈", label: "Score history", desc: "Show clients how you've improved their website score month by month." },
      ],
    },
    waitlist: {
      h2: "Beta launches April 2026 — sign up now",
      sub: "Agencies on the waitlist get a permanent discount and first access to the agency dashboard.",
      emailPlaceholder: "your@agency.com",
      agencyPlaceholder: "Your agency name",
      urlPlaceholder: "https://your-agency.com (optional)",
      btn: "Join waitlist",
      sending: "Signing up…",
      success: "You're in! We'll reach out as soon as the beta launches.",
      error: "Something went wrong. Please try again or contact us.",
      privacy: "No spam. One email when beta starts.",
    },
    faq: {
      h2: "FAQ",
      items: [
        {
          q: "What does it cost?",
          a: "Beta is free. After: from €99/month per agency. Waitlist members get a permanent discount.",
        },
        {
          q: "How many client websites can I add?",
          a: "The agency plan is designed for multiple websites. Exact limits will be communicated before beta launch.",
        },
        {
          q: "Is there white-label?",
          a: "Yes. Reports appear under your logo — ready for the client, without WebsiteFix branding.",
        },
        {
          q: "Does it only work for WordPress?",
          a: "WordPress first. Shopify, Wix and custom sites follow right after beta.",
        },
      ],
    },
    footer: {
      imprint: "Imprint",
      privacy: "Privacy",
    },
  },
};

export default function AgencyPage() {
  const [lang, setLang] = useState<Lang>("de");
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");
  const [url, setUrl] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const t = copy[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || submitState !== "idle") return;

    setSubmitState("sending");
    track("agency_waitlist_submit", { language: lang });

    try {
      const res = await fetch(WAITLIST_FORM, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, agency, website: url, type: "agency", _subject: "Neue Agentur-Waitlist-Anmeldung" }),
      });

      if (res.ok) {
        setSubmitState("success");
        track("agency_waitlist_success", { language: lang });
      } else {
        setSubmitState("error");
      }
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <>
      {/* ===== NAV ===== */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 750, fontSize: 18, letterSpacing: "-0.3px" }}>
            {t.nav.logo}
          </span>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>{t.nav.forUsers}</a>
            <a href="/blog" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>Blog</a>
            <a href="#faq" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>FAQ</a>
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer" }}
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <a href="#waitlist" className="cta ctaSmall">{t.nav.cta}</a>
          </div>
        </div>
      </nav>

      <main>
        {/* ===== HERO ===== */}
        <section className="hero">
          <div className="badge">{t.hero.badge}</div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.1, margin: "0 0 20px" }}>
            {t.hero.h1a}<br />
            <span style={{ background: "linear-gradient(90deg, #8df3d3, #7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.hero.h1b}
            </span>
          </h1>
          <p className="heroText" style={{ maxWidth: 580 }}>{t.hero.sub}</p>
          <div className="heroActions">
            <a href="#waitlist" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              {t.hero.cta}
            </a>
          </div>
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>{t.hero.trust}</p>
        </section>

        {/* ===== EXAMPLE ===== */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px 32px" }}>
          <div style={{
            background: "rgba(141,243,211,0.06)",
            border: "1px solid rgba(141,243,211,0.2)",
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            gap: 12,
            alignItems: "baseline",
          }}>
            <span style={{ fontSize: 13, color: "#8df3d3", fontWeight: 650, whiteSpace: "nowrap" }}>{t.example.label}:</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{t.example.text}</span>
          </div>
        </div>

        {/* ===== PAIN POINTS ===== */}
        <section className="section" id="problems">
          <h2>{t.problems.h2}</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {t.problems.items.map((item) => (
              <div key={item.title} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 28 }}>{item.icon}</div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{item.title}</h3>
                <p className="cardSub" style={{ margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SOLUTION ===== */}
        <section className="section" id="solution">
          <h2>{t.solution.h2}</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 28 }}>{t.solution.sub}</p>
          <div className="steps">
            {t.solution.steps.map((step) => (
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

        {/* ===== FEATURES ===== */}
        <section className="section" id="features">
          <h2>{t.features.h2}</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 22 }}>
            {t.features.items.map((item) => (
              <div key={item.label} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 22 }}>{item.icon}</div>
                <div style={{ fontWeight: 650, fontSize: 15 }}>{item.label}</div>
                <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== WAITLIST ===== */}
        <section className="section" id="waitlist">
          <h2>{t.waitlist.h2}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{t.waitlist.sub}</p>

          {submitState === "success" ? (
            <div className="card" style={{ maxWidth: 480, padding: "24px 20px", borderColor: "rgba(141,243,211,0.3)", background: "rgba(141,243,211,0.08)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{t.waitlist.success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.waitlist.emailPlaceholder}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none", width: "100%" }}
              />
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder={t.waitlist.agencyPlaceholder}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none", width: "100%" }}
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.waitlist.urlPlaceholder}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none", width: "100%" }}
              />
              <button
                type="submit"
                className="cta"
                disabled={submitState === "sending"}
                style={{ fontSize: 15, padding: "14px 28px", alignSelf: "flex-start" }}
              >
                {submitState === "sending" ? t.waitlist.sending : t.waitlist.btn}
              </button>
              {submitState === "error" && (
                <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0 }}>{t.waitlist.error}</p>
              )}
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>{t.waitlist.privacy}</p>
            </form>
          )}
        </section>

        {/* ===== FAQ ===== */}
        <section className="section" id="faq">
          <h2>{t.faq.h2}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            {t.faq.items.map((item) => (
              <div key={item.q} className="card">
                <p style={{ margin: "0 0 6px", fontWeight: 650 }}>{item.q}</p>
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 20px", textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          {" · "}
          <a href="/impressum" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{t.footer.imprint}</a>
          {" · "}
          <a href="/datenschutz" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{t.footer.privacy}</a>
        </p>
      </footer>
    </>
  );
}
