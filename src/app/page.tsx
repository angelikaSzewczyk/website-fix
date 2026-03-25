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
      badge: "KI-Diagnose für deine Website — kommt bald",
      h1a: "Website kaputt oder bringt keine Kunden?",
      h1b: "Die KI sagt dir warum — und wie du es fixst.",
      sub: "Ein Scan. Zwei Antworten: Was technisch kaputt ist — und warum deine Website keine Anfragen bringt. Konkret, verständlich, ohne Vorkenntnisse umsetzbar.",
      cta: "Frühen Zugang sichern",
      trust: "Kostenlos in der Beta · Keine Kreditkarte · Warteliste",
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
          icon: "🔍",
          title: "Kein Plan wo anfangen",
          desc: "Google, Agentur, Plugin, Design? Zu viele Baustellen, zu wenig Zeit. Du brauchst Prioritäten, keine To-do-Listen.",
        },
      ],
    },
    solution: {
      h2: "Ein Scan — vollständiger Report",
      sub: "URL eingeben, fertig. Die KI prüft alles gleichzeitig und erklärt dir auf Deutsch was zu tun ist — ohne Fachjargon.",
      steps: [
        { num: "1", title: "URL eingeben", desc: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang nötig." },
        { num: "2", title: "KI scannt alles", desc: "Fehler, Speed, SEO, kaputte Links, Formulare, Conversion-Schwächen — unter 60 Sekunden." },
        { num: "3", title: "Reparaturplan erhalten", desc: "Priorisierte Liste: 🔴 Kritisch → 🟡 Wichtig → 🟢 Okay. Mit konkreten Schritten zum selbst umsetzen." },
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
    waitlist: {
      h2: "Frühen Zugang sichern",
      sub: "Trag dich ein — kostenlos in der Beta. Wartelisten-Mitglieder erhalten dauerhaften Rabatt.",
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
          a: "Nein. Nur die URL eingeben — kein Plugin, kein WordPress-Login, kein FTP.",
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
      badge: "AI website diagnosis — coming soon",
      h1a: "Website broken or not getting customers?",
      h1b: "AI tells you why — and how to fix it.",
      sub: "One scan. Two answers: what's technically broken — and why your site isn't converting. Clear, actionable, no technical knowledge needed.",
      cta: "Get early access",
      trust: "Free in beta · No credit card · Waitlist",
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
          icon: "🔍",
          title: "No idea where to start",
          desc: "Google, agency, plugin, design? Too many issues, too little time. You need priorities, not to-do lists.",
        },
      ],
    },
    solution: {
      h2: "One scan — complete report",
      sub: "Enter URL, done. AI checks everything at once and explains what to do — in plain language, no jargon.",
      steps: [
        { num: "1", title: "Enter URL", desc: "Just type your website address. No plugin or access needed." },
        { num: "2", title: "AI scans everything", desc: "Errors, speed, SEO, broken links, forms, conversion issues — under 60 seconds." },
        { num: "3", title: "Get repair plan", desc: "Prioritized list: 🔴 Critical → 🟡 Important → 🟢 Good. With concrete steps to fix yourself." },
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
    waitlist: {
      h2: "Secure early access",
      sub: "Sign up — free during beta. Waitlist members get a permanent discount.",
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
          a: "No. Just enter the URL — no plugin, no WordPress login, no FTP.",
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
