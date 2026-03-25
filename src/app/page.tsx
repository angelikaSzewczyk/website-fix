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
      cta: "Zur Warteliste",
    },
    hero: {
      badge: "KI-gestützte Website-Diagnose — kommt bald",
      h1a: "Deine Website hat ein Problem.",
      h1b: "Die KI findet es in Sekunden.",
      sub: "WordPress kritischer Fehler, weiße Seite, keine Anfragen mehr — website-fix.com analysiert deine Website automatisch und liefert einen konkreten Reparaturplan. Kein Techniker, kein Warten.",
      cta: "Frühen Zugang sichern",
      trust: "Kostenlos · Keine Kreditkarte · Warteliste",
    },
    problems: {
      h2: "Kennst du das?",
      items: [
        {
          icon: "⚠️",
          title: "WordPress kritischer Fehler",
          desc: 'Du öffnest deine Website und siehst nur: "Es gab einen kritischen Fehler auf Ihrer Website." Kunden sehen dasselbe.',
        },
        {
          icon: "🔌",
          title: "Website nicht erreichbar",
          desc: "Deine Webseite ist down. Du weißt nicht warum, nicht wie lange schon — und verlierst gerade Kunden.",
        },
        {
          icon: "📭",
          title: "Website bringt keine Anfragen",
          desc: "Deine Seite läuft technisch — aber das Telefon klingelt nicht. Kein Formular, kein Lead, kein Kunde.",
        },
      ],
    },
    solution: {
      h2: "Die Lösung: Automatische KI-Diagnose",
      sub: "Kein teurer Entwickler, kein Support-Ticket. Du gibst deine Website-URL ein — die KI analysiert Fehler, Speed, Formulare und Sichtbarkeit und liefert dir einen priorisierten Reparaturplan.",
      steps: [
        { num: "1", title: "URL eingeben", desc: "Du gibst deine Website-Adresse ein. Fertig." },
        { num: "2", title: "KI analysiert", desc: "Fehler, Ladezeit, Formulare, SEO-Probleme — alles in unter 60 Sekunden." },
        { num: "3", title: "Reparaturplan erhalten", desc: "Konkrete Schritte, priorisiert nach Auswirkung. Umsetzbar ohne Vorkenntnisse." },
      ],
    },
    waitlist: {
      h2: "Frühen Zugang sichern",
      sub: "Trag dich ein und erhalte als Erste*r Zugang — kostenlos in der Beta.",
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
          a: "Die Beta ist kostenlos. Wartelisten-Mitglieder erhalten dauerhaften Rabatt auf alle späteren Pläne.",
        },
        {
          q: "Für welche Websites funktioniert das?",
          a: "Zunächst für WordPress-Websites. Andere Systeme (Shopify, Wix, Custom) folgen nach der Beta.",
        },
        {
          q: "Was passiert mit meiner URL?",
          a: "Wir speichern sie nur um dir personalisierten Zugang zu ermöglichen. Kein Verkauf, kein Tracking.",
        },
      ],
    },
    footer: {
      text: "© 2025 website-fix.com",
      imprint: "Impressum",
      privacy: "Datenschutz",
    },
  },
  en: {
    nav: {
      logo: "WebsiteFix",
      cta: "Join Waitlist",
    },
    hero: {
      badge: "AI-powered website diagnosis — coming soon",
      h1a: "Your website has a problem.",
      h1b: "AI finds it in seconds.",
      sub: "WordPress critical error, white screen, no leads — website-fix.com automatically scans your site and delivers a concrete repair plan. No developer, no waiting.",
      cta: "Get early access",
      trust: "Free · No credit card · Waitlist",
    },
    problems: {
      h2: "Sound familiar?",
      items: [
        {
          icon: "⚠️",
          title: "WordPress critical error",
          desc: 'You open your site and see: "There has been a critical error on your website." Your customers see the same.',
        },
        {
          icon: "🔌",
          title: "Website down / not reachable",
          desc: "Your site is down. You don't know why, or for how long — and you're losing customers right now.",
        },
        {
          icon: "📭",
          title: "Website brings no leads",
          desc: "Your site runs fine technically — but the phone never rings. No form submission, no inquiry, no customer.",
        },
      ],
    },
    solution: {
      h2: "The fix: Automated AI diagnosis",
      sub: "No expensive developer, no support ticket. Enter your URL — AI scans for errors, speed issues, broken forms and visibility problems and delivers a prioritized repair plan.",
      steps: [
        { num: "1", title: "Enter URL", desc: "Just type in your website address. That's it." },
        { num: "2", title: "AI scans", desc: "Errors, load time, forms, SEO issues — all in under 60 seconds." },
        { num: "3", title: "Get repair plan", desc: "Concrete steps, prioritized by impact. Actionable without technical knowledge." },
      ],
    },
    waitlist: {
      h2: "Secure early access",
      sub: "Sign up and be the first to get access — free during beta.",
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
          a: "Beta is free. Waitlist members get a permanent discount on all future plans.",
        },
        {
          q: "Which websites does it work for?",
          a: "WordPress first. Other platforms (Shopify, Wix, custom) follow after beta.",
        },
        {
          q: "What happens to my URL?",
          a: "We store it only to give you personalized access. No selling, no tracking.",
        },
      ],
    },
    footer: {
      text: "© 2025 website-fix.com",
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
          <span style={{ fontWeight: 750, fontSize: 18, letterSpacing: "-0.3px" }}>
            {t.nav.logo}
          </span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
          {t.footer.text}
          {" · "}
          <a href="/impressum" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{t.footer.imprint}</a>
          {" · "}
          <a href="/datenschutz" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{t.footer.privacy}</a>
        </p>
      </footer>
    </>
  );
}
