"use client";

/*
 * ARCHIVED STRIPE LINKS — manual fix service (paused)
 * form:     https://buy.stripe.com/14AcN5ckE2hYgkGfcxgMw00
 * speed:    https://buy.stripe.com/dRm00jbgAe0Gd8u4xTgMw01
 * mobile:   https://buy.stripe.com/8x25kD0BWbSy0lIaWhgMw02
 * tracking: https://buy.stripe.com/dRm8wP70k7Cid8u5BXgMw03
 * small:    https://buy.stripe.com/eVqbJ184oe0G6K6d4pgMw04
 * down:     https://buy.stripe.com/28EfZh3O88GmgkGfcxgMw05
 */

import { track } from "@/lib/track";
import { useState } from "react";

type Lang = "de" | "en";
type SubmitState = "idle" | "sending" | "success" | "error";

// ⚠️ Erstelle ein neues Formspree-Formular für die Waitlist unter formspree.io
// und ersetze diese ID. Die bestehende ID (xgoznqno) ist für den Fix-Service.
const WAITLIST_FORM = "https://formspree.io/f/mwvwkkgj";

const copy = {
  de: {
    nav: {
      logo: "WebsiteFix",
      cta: "Kostenlos scannen",
    },
    hero: {
      badge: "Nicht für Entwickler. Für alle anderen. — jetzt in der Beta",
      h1a: "Website kaputt?",
      h1b: "KI findet den Fehler — und repariert ihn für dich.",
      sub: "Du googelst, verstehst nichts, gibst auf. WebsiteFix scannt deine Website in unter 60 Sekunden — und zeigt dir genau was kaputt ist. Kein Entwickler nötig.",
      cta: "Website jetzt kostenlos scannen",
      ctaSecondary: "Zur Warteliste",
      trust: "Kostenlos · Keine Anmeldung · Ergebnis in unter 60 Sekunden",
    },
    example: {
      label: "Zum Beispiel",
      text: "WordPress Critical Error seit heute Nacht → URL eingeben → KI erkennt Plugin-Konflikt → automatisch behoben. Fertig.",
    },
    problems: {
      h2: "Zwei Probleme, ein Tool.",
      items: [
        {
          icon: "⚠️",
          title: "Technische Fehler",
          desc: 'WordPress kritischer Fehler, weiße Seite, Website down, Formular das nicht sendet — du merkst es oft als Letzter.',
        },
        {
          icon: "📭",
          title: "Keine Anfragen",
          desc: "Die Website läuft — aber das Telefon klingelt nicht. Kein Lead, kein Kunde. Du weißt nicht woran es liegt.",
        },
        {
          icon: "🙋",
          title: "Du bist kein Entwickler",
          desc: "Und das solltest du auch nicht sein müssen. WebsiteFix erklärt dir auf Deutsch was los ist — und was als nächstes zu tun ist.",
        },
      ],
    },
    solution: {
      h2: "Scan, Diagnose, Fix — fertig.",
      sub: "URL eingeben, fertig. Die KI prüft alles gleichzeitig, erklärt was kaputt ist — und repariert es direkt. Kein Fachjargon, kein Entwickler, kein Plugin.",
      steps: [
        { num: "1", title: "URL eingeben", desc: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang nötig." },
        { num: "2", title: "KI scannt alles", desc: "Fehler, Speed, SEO, kaputte Links, Formulare, Conversion-Schwächen — unter 60 Sekunden." },
        { num: "3", title: "KI repariert automatisch", desc: "🔴 Kritisch → 🟡 Wichtig → 🟢 Okay. Die KI verbindet sich mit deiner Website und behebt Fehler direkt — du musst nichts selbst tun." },
      ],
    },
    checks: {
      h2: "Was geprüft wird",
      items: [
        { icon: "🔴", label: "WordPress Fehler", desc: "Critical Error, White Screen, 500er" },
        { icon: "⚡", label: "Ladegeschwindigkeit", desc: "Core Web Vitals, Ladezeit, PageSpeed" },
        { icon: "🔍", label: "SEO Grundlagen", desc: "Title, Meta, Headings, Sitemap, robots.txt" },
        { icon: "🔗", label: "Kaputte Links", desc: "Alle internen Links auf 404 geprüft" },
        { icon: "📋", label: "Formular-Check", desc: "Vorhanden, erreichbar, funktionsfähig" },
        { icon: "💡", label: "Conversion-Analyse", desc: "CTA, Vertrauen, Lesbarkeit, Mobile UX" },
      ],
    },
    monitoring: {
      h2: "Nie wieder selbst merken wenn etwas kaputt geht.",
      sub: "WebsiteFix überwacht deine Website rund um die Uhr — und schlägt Alarm bevor deine Kunden es merken.",
      items: [
        { icon: "👁️", title: "24/7 Überwachung", desc: "Deine Website wird laufend geprüft — nicht nur einmal." },
        { icon: "🔔", title: "Sofort-Alert", desc: "Per E-Mail wenn etwas schiefgeht — du bist immer der Erste." },
        { icon: "🔧", title: "Automatisch behoben", desc: "Nicht nur Alarm — die KI repariert gleich mit." },
      ],
    },
    waitlist: {
      h2: "Beta startet April 2026 — jetzt eintragen",
      sub: "Frühzugang ist kostenlos. Wartelisten-Mitglieder bekommen dauerhaften Rabatt — für immer.",
      betaLabel: "Was die Beta enthält:",
      betaItems: [
        { done: true, text: "Vollständiger Website-Scan" },
        { done: true, text: "Diagnose in Alltagssprache" },
        { done: true, text: "Priorisierter Reparaturplan" },
        { done: false, text: "KI-Reparatur — kommt in Phase 2" },
      ],
      placeholder: "deine@email.de",
      urlPlaceholder: "https://deine-website.de (optional)",
      btn: "Jetzt eintragen",
      sending: "Wird eingetragen …",
      success: "Du bist dabei! Wir melden uns sobald die Beta startet.",
      error: "Etwas ist schiefgelaufen. Bitte versuch es nochmal oder schreib uns.",
      privacy: "Kein Spam. Nur eine E-Mail wenn die Beta startet.",
    },
    faq: {
      h2: "Häufige Fragen",
      items: [
        {
          q: "Was kostet das?",
          a: "Die Beta ist kostenlos. Danach: Free (3 Scans/Monat), Pro ab 29€/Monat, Agentur ab 99€/Monat. Wartelisten-Mitglieder bekommen dauerhaften Rabatt.",
        },
        {
          q: "Für welche Websites funktioniert das?",
          a: "Zunächst für WordPress-Websites. Shopify, Wix und Custom-Websites folgen nach der Beta.",
        },
        {
          q: "Muss ich etwas installieren oder Zugang geben?",
          a: "Für den Scan nur die URL eingeben — kein Plugin, kein FTP. Für das Dashboard brauchst du einen kostenlosen WebsiteFix-Account. Für die automatische KI-Reparatur gibst du einmalig deine WordPress-Zugangsdaten ein — sicher verschlüsselt, jederzeit widerrufbar.",
        },
        {
          q: "Was passiert mit meiner URL?",
          a: "Wir speichern sie nur um dir personalisierten Zugang zu ermöglichen. Kein Verkauf, kein Tracking.",
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
      cta: "Scan for free",
    },
    hero: {
      badge: "Not for developers. For everyone else. — now in beta",
      h1a: "Website broken?",
      h1b: "AI finds the problem — and fixes it for you.",
      sub: "You Google it, understand nothing, give up. WebsiteFix scans your website in under 60 seconds — and shows you exactly what's broken. No developer needed.",
      cta: "Scan your website for free",
      ctaSecondary: "Join waitlist",
      trust: "Free · No sign-up · Results in under 60 seconds",
    },
    example: {
      label: "For example",
      text: "WordPress Critical Error since last night → enter URL → AI detects plugin conflict → automatically fixed. Done.",
    },
    problems: {
      h2: "Two problems, one tool.",
      items: [
        {
          icon: "⚠️",
          title: "Technical errors",
          desc: "WordPress critical error, white screen, site down, form not sending — you're usually the last to know.",
        },
        {
          icon: "📭",
          title: "No inquiries",
          desc: "The site runs fine — but the phone never rings. No lead, no customer. You don't know what's wrong.",
        },
        {
          icon: "🙋",
          title: "You're not a developer",
          desc: "And you shouldn't have to be. WebsiteFix tells you in plain language what's wrong — and what to do next.",
        },
      ],
    },
    solution: {
      h2: "Scan, diagnose, fix — done.",
      sub: "Enter URL, done. AI checks everything at once, explains what's broken — and fixes it directly. No jargon, no developer, no plugin.",
      steps: [
        { num: "1", title: "Enter URL", desc: "Just type your website address. No plugin or access needed." },
        { num: "2", title: "AI scans everything", desc: "Errors, speed, SEO, broken links, forms, conversion issues — under 60 seconds." },
        { num: "3", title: "AI fixes automatically", desc: "🔴 Critical → 🟡 Important → 🟢 Good. AI connects to your site and fixes errors directly — you don't have to do anything." },
      ],
    },
    checks: {
      h2: "What gets checked",
      items: [
        { icon: "🔴", label: "WordPress errors", desc: "Critical Error, White Screen, 500s" },
        { icon: "⚡", label: "Load speed", desc: "Core Web Vitals, load time, PageSpeed" },
        { icon: "🔍", label: "SEO basics", desc: "Title, meta, headings, sitemap, robots.txt" },
        { icon: "🔗", label: "Broken links", desc: "All internal links checked for 404s" },
        { icon: "📋", label: "Form check", desc: "Present, reachable, functional" },
        { icon: "💡", label: "Conversion analysis", desc: "CTA, trust signals, readability, mobile UX" },
      ],
    },
    monitoring: {
      h2: "Never be the last to know when something breaks.",
      sub: "WebsiteFix monitors your website around the clock — and alerts you before your customers notice.",
      items: [
        { icon: "👁️", title: "24/7 monitoring", desc: "Your website is checked continuously — not just once." },
        { icon: "🔔", title: "Instant alert", desc: "Email notification the moment something goes wrong — you're always first." },
        { icon: "🔧", title: "Automatically fixed", desc: "Not just an alert — AI repairs it right away." },
      ],
    },
    waitlist: {
      h2: "Beta launches April 2026 — sign up now",
      sub: "Early access is free. Waitlist members get a permanent discount — forever.",
      betaLabel: "What beta includes:",
      betaItems: [
        { done: true, text: "Full website scan" },
        { done: true, text: "Diagnosis in plain language" },
        { done: true, text: "Prioritized repair plan" },
        { done: false, text: "AI repair — coming in phase 2" },
      ],
      placeholder: "your@email.com",
      urlPlaceholder: "https://your-website.com (optional)",
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
          a: "Beta is free. After: Free (3 scans/month), Pro from €29/month, Agency from €99/month. Waitlist members get a permanent discount.",
        },
        {
          q: "Which websites does it work for?",
          a: "WordPress first. Shopify, Wix and custom sites follow after beta.",
        },
        {
          q: "Do I need to install anything or give access?",
          a: "For the scan, just enter your URL — no plugin, no FTP. For the dashboard you need a free WebsiteFix account. For automatic AI repair, you enter your WordPress credentials once — encrypted securely, revocable at any time.",
        },
        {
          q: "What happens to my URL?",
          a: "We store it only to give you personalized access. No selling, no tracking.",
        },
      ],
    },
    footer: {
      imprint: "Imprint",
      privacy: "Privacy",
    },
  },
};

export default function Page() {
  const [lang, setLang] = useState<Lang>("de");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const t = copy[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || submitState !== "idle") return;

    setSubmitState("sending");
    track("waitlist_submit", { language: lang });

    try {
      const res = await fetch(WAITLIST_FORM, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, website: url, _subject: "Neue Waitlist-Anmeldung" }),
      });

      if (res.ok) {
        setSubmitState("success");
        track("waitlist_success", { language: lang });
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
          <div className="brand">
            <span>Website<span className="brandAccent">Fix</span></span>
          </div>
          <div className="navLinks">
            <a href="/fuer-agenturen" className="navLink">{lang === "de" ? "Für Agenturen" : "For agencies"}</a>
            <a href="/blog" className="navLink">Blog</a>
            <a href="#faq" className="navLink">FAQ</a>
          </div>
          <div className="navActions">
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer" }}
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <a href="/scan" className="cta ctaSmall navCtaDesktop">{t.nav.cta}</a>
            <button
              type="button"
              className={`mobileMenuBtn ${mobileNavOpen ? "isOpen" : ""}`}
              aria-label={mobileNavOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(v => !v)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobileNavOverlay ${mobileNavOpen ? "isOpen" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />

      <nav
        className={`mobileNavDrawer ${mobileNavOpen ? "isOpen" : ""}`}
        aria-label="Mobile Navigation"
      >
        <div className="mobileNavInner">
          <a href="/fuer-agenturen" className="navLink" onClick={() => setMobileNavOpen(false)}>{lang === "de" ? "Für Agenturen" : "For agencies"}</a>
          <a href="/blog" className="navLink" onClick={() => setMobileNavOpen(false)}>Blog</a>
          <a href="#faq" className="navLink" onClick={() => setMobileNavOpen(false)}>FAQ</a>
          <a href="/scan" className="cta mobileNavPrimary" onClick={() => setMobileNavOpen(false)}>{t.nav.cta}</a>
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
            <a href="/scan" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              {t.hero.cta}
            </a>
            <a href="#waitlist" className="ghost" style={{ fontSize: 15 }}>
              {t.hero.ctaSecondary}
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

        {/* ===== CHECKS ===== */}
        <section className="section" id="checks">
          <h2>{t.checks.h2}</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 22 }}>
            {t.checks.items.map((item) => (
              <div key={item.label} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 22 }}>{item.icon}</div>
                <div style={{ fontWeight: 650, fontSize: 15 }}>{item.label}</div>
                <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== MONITORING ===== */}
        <section className="section" id="monitoring" style={{
          background: "rgba(141,243,211,0.04)",
          border: "1px solid rgba(141,243,211,0.12)",
          borderRadius: 16,
          maxWidth: 960,
          margin: "0 auto 0",
          padding: "48px 32px",
        }}>
          <h2 style={{ marginBottom: 12 }}>{t.monitoring.h2}</h2>
          <p className="muted" style={{ maxWidth: 520, marginBottom: 28 }}>{t.monitoring.sub}</p>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {t.monitoring.items.map((item) => (
              <div key={item.title} className="card" style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(141,243,211,0.05)", borderColor: "rgba(141,243,211,0.15)" }}>
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <div style={{ fontWeight: 650, fontSize: 15 }}>{item.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== WAITLIST ===== */}
        <section className="section" id="waitlist">
          <h2>{t.waitlist.h2}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{t.waitlist.sub}</p>

          <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.waitlist.betaLabel}</p>
            {t.waitlist.betaItems.map((item) => (
              <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 15, width: 20 }}>{item.done ? "✅" : "🔜"}</span>
                <span style={{ fontSize: 14, color: item.done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>{item.text}</span>
              </div>
            ))}
          </div>

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
                placeholder={t.waitlist.placeholder}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  width: "100%",
                }}
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.waitlist.urlPlaceholder}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  width: "100%",
                }}
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
