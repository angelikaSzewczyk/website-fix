"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const EMAIL = "hello.websitefix.team@web.de";
const FORMSPREE_ACTION = "https://formspree.io/f/xgoznqno";

// ✅ Fix-Auswahl (DE/EN)
const FIX_OPTIONS_DE = [
  "Kontaktformular reparieren",
  "Website schneller machen",
  "Mobile Darstellung reparieren",
  "Tracking & Analytics einrichten",
  "Kleine Änderungen & Bugs (bis 60 Minuten)",
] as const;

const FIX_OPTIONS_EN = [
  "Fix contact form",
  "Speed up website",
  "Fix mobile layout",
  "Set up tracking & analytics",
  "Small changes & bugs (up to 60 minutes)",
] as const;

type FixOptionDe = (typeof FIX_OPTIONS_DE)[number];
type FixOptionEn = (typeof FIX_OPTIONS_EN)[number];

type Lang = "de" | "en";
type SubmitState = "idle" | "sending" | "success" | "error";

type FieldErrors = Partial<{
  website: string;
  fix: string;
  email: string;
}>;

type SectionId = "fixes" | "bundles" | "ablauf" | "beispiele" | "faq" | "book";
type FixKey = "form" | "speed" | "mobile" | "tracking" | "small";

type FixCard = {
  key: FixKey;
  title: string;
  eta: string;
  price: string;
  sub: string;
  list: string[];
};

export default function Page() {
  const [lang, setLang] = useState<Lang>("de");

  const [openFix, setOpenFix] = useState(false);
  const [fix, setFix] = useState<FixOptionDe | FixOptionEn | "">("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  // ✅ optional: aktiver Nav-Link beim Scrollen
  const [activeSection, setActiveSection] = useState<SectionId>("fixes");

  const selectRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const fixBtnId = useId();
  const fixListId = useId();

  const fixOptions = useMemo(() => (lang === "de" ? FIX_OPTIONS_DE : FIX_OPTIONS_EN), [lang]);

  const mailto = useMemo(() => {
    const subject = "WebsiteFix Anfrage";
    const body =
      "Website-URL:\n" +
      "Welcher Fix?\n" +
      "Kurzbeschreibung (optional):\n" +
      "E-Mail:\n\n" +
      "Danke!";
    return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, []);

  const mapDe = {
  form: "Kontaktformular reparieren",
  speed: "Website schneller machen",
  mobile: "Mobile Darstellung reparieren",
  tracking: "Tracking & Analytics einrichten",
  small: "Kleine Änderungen & Bugs (bis 60 Minuten)",
} as const satisfies Record<FixKey, FixOptionDe>;

const mapEn = {
  form: "Fix contact form",
  speed: "Speed up website",
  mobile: "Fix mobile layout",
  tracking: "Set up tracking & analytics",
  small: "Small changes & bugs (up to 60 minutes)",
} as const satisfies Record<FixKey, FixOptionEn>;


  const t = useMemo(() => {
    const isDE = lang === "de";

    const fixes: FixCard[] = [
      {
        key: "form",
        title: isDE ? "Fix #1 – Kontaktformular reparieren" : "Fix #1 – Contact form repair",
        eta: isDE ? "24h" : "24h",
        price: isDE ? "129 €" : "€129",
        sub: isDE
          ? "Wenn Anfragen nicht ankommen, verlierst du Geld. Wir prüfen Versand, Validierung und Zustellung – und testen final."
          : "If leads don’t arrive, you lose money. We check delivery, validation and sending — and test the full flow.",
        list: isDE
          ? ["Formular & Mailversand prüfen", "Fix + Testversand", "Kurzbericht: Ursache & Lösung"]
          : ["Check form & email delivery", "Fix + end-to-end test", "Short note: cause & solution"],
      },
      {
        key: "speed",
        title: isDE ? "Fix #2 – Website schneller machen" : "Fix #2 – Speed up website",
        eta: isDE ? "48h" : "48h",
        price: isDE ? "179 €" : "€179",
        sub: isDE
          ? "Schnelle Quick-Wins für Ladezeit. Kein Relaunch – wir entfernen die größten Bremsen."
          : "Quick wins for loading speed. No redesign — we remove the biggest bottlenecks.",
        list: isDE
          ? ["Performance-Check", "3–5 Quick-Wins umsetzen", "Basic Vorher/Nachher-Check"]
          : ["Performance check", "Implement 3–5 quick wins", "Basic before/after check"],
      },
      {
        key: "mobile",
        title: isDE ? "Fix #3 – Mobile Darstellung reparieren" : "Fix #3 – Fix mobile layout",
        eta: isDE ? "48h" : "48h",
        price: isDE ? "159 €" : "€159",
        sub: isDE
          ? "Wenn mobil etwas kaputt ist, springen Besucher ab. Wir beheben die wichtigsten Layout- und Klick-Probleme."
          : "If mobile is broken, users bounce. We fix the key layout and tap-target issues.",
        list: isDE
          ? ["Abstände, Typo, Buttons", "Tests auf 2–3 Viewports", "Fixliste + Umsetzung"]
          : ["Spacing, typography, buttons", "Test on 2–3 viewports", "Fix list + implementation"],
      },
      {
        key: "tracking",
        title: isDE ? "Fix #4 – Tracking & Analytics einrichten" : "Fix #4 – Set up tracking & analytics",
        eta: isDE ? "24–48h" : "24–48h",
        price: isDE ? "129 €" : "€129",
        sub: isDE
          ? "Ohne Daten keine Entscheidungen. Wir richten Analytics ein und prüfen, ob alles sauber erfasst."
          : "No data, no decisions. We set up analytics and verify tracking is working properly.",
        list: isDE
          ? ["Einrichtung & Test", "CTA/Kontakt Event (basic)", "Kurz erklärt: Was du jetzt siehst"]
          : ["Setup & test", "CTA/contact event (basic)", "Short explainer: what you can see now"],
      },
      {
        key: "small",
        title: isDE ? "Fix #5 – Kleine Änderungen & Bugs" : "Fix #5 – Small changes & bugs",
        eta: isDE ? "bis 60 Min" : "up to 60 min",
        price: isDE ? "89 €" : "€89",
        sub: isDE
          ? "Für kleine Website-Probleme: Text/Buttons/Spacing/Bugs – ein klarer Änderungsblock, schnell erledigt."
          : "For small website issues: text/buttons/spacing/bugs — one clear change block, done fast.",
        list: isDE
          ? ["Bis 60 Minuten Arbeitszeit", "1 klarer Änderungsblock", "Kurzer Abschluss-Check"]
          : ["Up to 60 minutes work", "1 clear change block", "Quick final check"],
      },
    ];

    return {
      brand: "WebsiteFix",
      domain: "websitefix.io", // später echte Domain einsetzen
      nav: {
        fixes: isDE ? "Fixes" : "Fixes",
        bundles: isDE ? "Bundles" : "Bundles",
        how: isDE ? "Ablauf" : "How it works",
        examples: isDE ? "Beispiele" : "Examples",
        faq: "FAQ",
        book: isDE ? "Fix buchen" : "Book a fix",
      },
      hero: {
        badge: isDE ? "Fixpreise · 24–72h · Systemunabhängig" : "Fixed prices · 24–72h · Platform-agnostic",
        h1: isDE ? "Website kaputt? Wir fixen das." : "Website broken? We fix it.",
        sub: isDE
          ? "Schnelle Hilfe für konkrete Website-Probleme – ohne Agenturprojekt."
          : "Fast fixes for common website issues — without an agency project.",
        bullets: isDE
          ? ["Kontaktformular sendet nicht", "Website lädt zu langsam", "Mobile Ansicht verschoben", "Tracking fehlt"]
          : ["Form not sending", "Site loads too slow", "Mobile layout broken", "No tracking"],
        cta: isDE ? "Fix buchen" : "Book a fix",
        ghost: isDE ? "Lieber per E-Mail" : "Prefer email",
        trust: isDE
          ? "Kein Abo · Fixpreis · Start nach Machbarkeits-Check · Geld-zurück, wenn nicht umsetzbar"
          : "No subscription · Fixed price · Start after feasibility check · Money-back if not feasible",
      },
      fixesTitle: isDE ? "Die 5 Fixes" : "The 5 fixes",
      fixesIntro: isDE
        ? "Wähle den passenden Fix. Klarer Scope = schnellere Umsetzung."
        : "Pick the right fix. Clear scope = faster delivery.",
      scopeTitle: isDE ? "Scope & Sicherheit" : "Scope & safety",
      scopeText: isDE
        ? "Wir prüfen vorab, ob der Fix sinnvoll umsetzbar ist. Wenn nicht: Geld zurück. 1 Fix = 1 klar definiertes Problem."
        : "We verify feasibility first. If it’s not feasible: refund. 1 fix = 1 clearly defined problem.",
      bundlesTitle: isDE ? "Beliebte Bundles" : "Popular bundles",
      bundlesSub: isDE
        ? "Wenn du zwei Dinge auf einmal lösen willst, ist ein Bundle oft effizienter."
        : "If you want to solve two issues at once, a bundle is often more efficient.",
      bundles: isDE
        ? [
            {
              title: "Lead-Ready Bundle",
              meta: "Fix #1 + Fix #4 · 229 €",
              text: "Formular läuft + Tracking ist aktiv. Ideal, wenn du sofort messbar Leads einsammeln willst.",
              preset: "form",
            },
            {
              title: "Speed & Mobile Bundle",
              meta: "Fix #2 + Fix #3 · 299 €",
              text: "Schneller laden + sauber mobil. Ideal, wenn Nutzer abspringen oder mobil alles „wackelt“.",
              preset: "speed",
            },
          ]
        : [
            {
              title: "Lead-Ready Bundle",
              meta: "Fix #1 + Fix #4 · €229",
              text: "Form works + tracking is live. Great if you want measurable lead flow quickly.",
              preset: "form",
            },
            {
              title: "Speed & Mobile Bundle",
              meta: "Fix #2 + Fix #3 · €299",
              text: "Faster load + clean mobile experience. Great if users bounce or mobile looks off.",
              preset: "speed",
            },
          ],
      howTitle: isDE ? "Ablauf" : "How it works",
      steps: isDE
        ? [
            { n: "1", title: "Fix auswählen", text: "Fix auswählen und kurz beschreiben, was kaputt ist." },
            { n: "2", title: "Machbarkeits-Check", text: "Wir prüfen Scope & Machbarkeit – ohne Überraschungen." },
            { n: "3", title: "Umsetzung", text: "Umsetzung in 24–72h (je nach Fix/Bündel)." },
            { n: "4", title: "Übergabe", text: "Kurzes Update: Was geändert wurde & was du beachten solltest." },
          ]
        : [
            { n: "1", title: "Pick a fix", text: "Choose a fix and describe what’s broken." },
            { n: "2", title: "Feasibility check", text: "We confirm scope and feasibility — no surprises." },
            { n: "3", title: "Implementation", text: "Implementation in 24–72h depending on the fix/bundle." },
            { n: "4", title: "Handover", text: "Short update: what changed and what to keep in mind." },
          ],
      examplesTitle: isDE ? "Beispiele (anonymisiert)" : "Examples (anonymized)",
      examplesSub: isDE ? "Typische Situationen vor dem Fix" : "Common situations before a fix",
      examples: isDE
        ? [
            { q: "„Wir haben Besucher, aber kaum Anfragen.“", t: "Formular/CTA geprüft → Fix #1 + kurze CTA-Korrektur.", m: "Lokaler Dienstleister · DE" },
            { q: "„Mobil ist alles verschoben.“", t: "Spacing/Buttons korrigiert → Fix #3.", m: "Handwerk · DE" },
            { q: "„Wir wissen nicht, was Marketing bringt.“", t: "Analytics + Event gesetzt → Fix #4.", m: "KMU · DE" },
          ]
        : [
            { q: "“We get traffic but hardly any leads.”", t: "Checked form/CTA → Fix #1 + small CTA improvement.", m: "Local business · EU" },
            { q: "“Mobile layout is broken.”", t: "Fixed spacing/buttons → Fix #3.", m: "Small business · EU" },
            { q: "“We don’t know what marketing does.”", t: "Set up analytics + event → Fix #4.", m: "SMB · EU" },
          ],
      faqTitle: "FAQ",
      faq: isDE
        ? [
            { q: "Welche Systeme unterstützt ihr?", a: "WordPress, Baukästen, Custom-Websites. Wir sagen dir vorab, ob es sinnvoll umsetzbar ist." },
            { q: "Wie läuft die Bezahlung?", a: "Du fragst über das Formular an. Danach bekommst du Rechnung/Zahlungsinfo. Checkout kann später ergänzt werden." },
            { q: "Was, wenn das Problem größer ist?", a: "Dann sagen wir das vor Umsetzung. Du entscheidest, ob du weitergehst." },
            { q: "Gibt es ein Abo?", a: "Nein. Optional später: monatliche Betreuung." },
          ]
        : [
            { q: "Which systems do you support?", a: "WordPress, builders, custom sites. We tell you upfront if it’s feasible." },
            { q: "How does payment work?", a: "Request via the form, then you receive invoice/payment details. Checkout can be added later." },
            { q: "What if it’s bigger than expected?", a: "We’ll tell you before implementing. You decide how to proceed." },
            { q: "Is there a subscription?", a: "No. Optional monthly care later." },
          ],
      bookTitle: isDE ? "Fix buchen" : "Book a fix",
      bookSub: isDE
        ? "Wähle den Fix und gib kurz die URL + das Problem an. Wir melden uns schnell mit dem nächsten Schritt."
        : "Choose a fix and share URL + issue. We’ll reply quickly with next steps.",
      form: {
        website: isDE ? "Website-URL *" : "Website URL *",
        fix: isDE ? "Welcher Fix? *" : "Which fix? *",
        desc: isDE ? "Kurzbeschreibung (optional)" : "Short description (optional)",
        email: isDE ? "Deine E-Mail *" : "Your email *",
        submitIdle: isDE ? "Fix anfragen" : "Request fix",
        submitSending: isDE ? "Wird gesendet…" : "Sending…",
        success: isDE ? "✅ Danke! Deine Anfrage ist eingegangen. Wir melden uns schnell zurück." : "✅ Thanks! Your request is in. We’ll get back to you shortly.",
        error: isDE ? "❌ Senden hat nicht geklappt. Bitte versuch es nochmal oder schreib an" : "❌ Sending failed. Please try again or email",
        micro: isDE ? "Kein Spam · Kein Abo · Nur für deine Anfrage" : "No spam · No subscription · Only for your request",
      },
      footer: isDE ? "© 2026 · WebsiteFix" : "© 2026 · WebsiteFix",
      fixes,
    };
  }, [lang]);

  // Dropdown schließen: Outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!openFix) return;
      const target = e.target as Node;
      if (selectRef.current && !selectRef.current.contains(target)) setOpenFix(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openFix]);

  // Dropdown schließen: ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenFix(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // UX: Erfolg/Fehler nach X Sekunden zurücksetzen
  useEffect(() => {
    if (submitState === "success" || submitState === "error") {
      const tmr = window.setTimeout(() => setSubmitState("idle"), 8000);
      return () => window.clearTimeout(tmr);
    }
  }, [submitState]);

  // ✅ Active section highlighting via IntersectionObserver
  useEffect(() => {
    const ids: SectionId[] = ["fixes", "bundles", "ablauf", "beispiele", "faq", "book"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActiveSection(visible.target.id as SectionId);
      },
      { root: null, rootMargin: "-25% 0px -65% 0px", threshold: [0.1, 0.2, 0.35] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function validate(form: HTMLFormElement): FieldErrors {
    const fd = new FormData(form);
    const website = String(fd.get("website") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    const next: FieldErrors = {};

    if (!website) next.website = lang === "de" ? "Bitte gib deine Website-URL an." : "Please enter your website URL.";
    else {
      try {
        // eslint-disable-next-line no-new
        new URL(website);
      } catch {
        next.website =
          lang === "de"
            ? "Bitte gib eine gültige URL an (z. B. https://deine-website.de)."
            : "Please enter a valid URL (e.g. https://your-site.com).";
      }
    }

    if (!fix) next.fix = lang === "de" ? "Bitte wähle einen Fix aus." : "Please choose a fix.";

    if (!email) next.email = lang === "de" ? "Bitte gib deine E-Mail an." : "Please enter your email.";
    else {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!ok) next.email = lang === "de" ? "Bitte gib eine gültige E-Mail-Adresse an." : "Please enter a valid email.";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    const nextErrors = validate(formRef.current);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.website) formRef.current.querySelector<HTMLInputElement>('input[name="website"]')?.focus();
      else if (nextErrors.fix) {
        setOpenFix(true);
        (document.getElementById(fixBtnId) as HTMLButtonElement | null)?.focus();
      } else if (nextErrors.email) formRef.current.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }

    setSubmitState("sending");

    try {
      const formData = new FormData(formRef.current);
      formData.set("fix", String(fix));
      formData.set("lang", lang);
      formData.set("_subject", `WebsiteFix Anfrage (${lang.toUpperCase()})`);

      const res = await fetch(FORMSPREE_ACTION, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setSubmitState("error");
        return;
      }

      formRef.current.reset();
      setFix("");
      setOpenFix(false);
      setErrors({});
      setSubmitState("success");
      if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
  (window as any).gtag("event", "fix_request_submitted", {
    fix_type: fix,
    language: lang,
  });
}

    } catch {
      setSubmitState("error");
    }
  }

  const canSubmit = !!fix && submitState !== "sending";
  const navLinkClass = (id: SectionId) => `navLink ${activeSection === id ? "isActive" : ""}`;

  function presetFix(key: FixKey) {
  if (lang === "de") setFix(mapDe[key]);
  else setFix(mapEn[key]);

  setOpenFix(false);
}


  return (
    <main>
      {/* NAVBAR */}
      <header className="nav">
        <div className="brand">{t.brand}</div>

        <nav className="navLinks" aria-label="Hauptnavigation">
          <a className={navLinkClass("fixes")} href="#fixes">
            {t.nav.fixes}
          </a>
          <a className={navLinkClass("bundles")} href="#bundles">
            {t.nav.bundles}
          </a>
          <a className={navLinkClass("ablauf")} href="#ablauf">
            {t.nav.how}
          </a>
          <a className={navLinkClass("beispiele")} href="#beispiele">
            {t.nav.examples}
          </a>
          <a className={navLinkClass("faq")} href="#faq">
            {t.nav.faq}
          </a>
          <a className={navLinkClass("book")} href="#book">
            {t.nav.book}
          </a>
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="langToggle"
            onClick={() => setLang((p) => (p === "de" ? "en" : "de"))}
            aria-label="Sprache wechseln"
            title="DE / EN"
          >
            {lang.toUpperCase()}
          </button>

          <a className="navCta" href="#book">
            {t.hero.cta}
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <p className="badge">{t.hero.badge}</p>

        <h1>{t.hero.h1}</h1>

        <p className="heroText">{t.hero.sub}</p>

        <ul className="list" style={{ maxWidth: 820 }}>
          {t.hero.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="heroActions">
          <a className="cta" href="#book">
            {t.hero.cta}
          </a>

          <a className="ghost" href={mailto}>
            {t.hero.ghost}
          </a>
        </div>

        <p className="trustStrip">{t.hero.trust}</p>
      </section>

      {/* FIXES */}
      <section className="section" id="fixes">
        <h2>{t.fixesTitle}</h2>
        <p className="muted">{t.fixesIntro}</p>

        <div className="cards">
          {t.fixes.map((fx) => (
            <div key={fx.key} className="card cardPricing">
              <div>
                <h3>{fx.title}</h3>

                {/* ✅ meta pills */}
                <div className="metaRow">
                  <span className="pill">{fx.eta}</span>
                  <span className="pill pillStrong">{fx.price}</span>
                </div>

                <p className="cardSub">{fx.sub}</p>
                <ul className="list">
                  {fx.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              </div>

              <a
                className="cta ctaSmall"
                href="#book"
                onClick={() => presetFix(fx.key)}
              >
                {lang === "de" ? "Fix buchen" : "Book this fix"}
              </a>
            </div>
          ))}
        </div>

        <div className="card cardNote">
          <h3>{t.scopeTitle}</h3>
          <p className="muted">{t.scopeText}</p>
        </div>
      </section>

      {/* BUNDLES */}
      <section className="section" id="bundles">
        <h2>{t.bundlesTitle}</h2>
        <p className="muted">{t.bundlesSub}</p>

        <div className="cards" style={{ marginTop: 18 }}>
          {t.bundles.map((b) => (
            <div key={b.title} className="card cardPricing">
              <div>
                <h3>{b.title}</h3>
                <p className="cardMeta">
                  <strong>{b.meta}</strong>
                </p>
                <p className="cardSub">{b.text}</p>
                <ul className="list">
                  <li>{lang === "de" ? "Klare Priorität: schnell sichtbares Ergebnis" : "Clear priority: fast visible outcome"}</li>
                  <li>{lang === "de" ? "Besserer Preis als einzeln" : "Better price vs. separate fixes"}</li>
                </ul>
              </div>

              <a
                className="cta ctaSmall"
                href="#book"
                onClick={() => presetFix(b.preset as FixKey)}
              >
                {lang === "de" ? "Bundle anfragen" : "Request bundle"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ABLAUF */}
      <section className="section" id="ablauf">
        <h2>{t.howTitle}</h2>
        <div className="steps">
          {t.steps.map((s) => (
            <div className="step" key={s.n}>
              <div className="stepNum">{s.n}</div>
              <div>
                <div className="stepTitle">{s.title}</div>
                <div className="muted">{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="section" id="beispiele">
        <h2>{t.examplesTitle}</h2>
        <p className="muted">{t.examplesSub}</p>

        <div className="proofGrid">
          {t.examples.map((ex) => (
            <div className="proofCard" key={ex.q}>
              <p className="proofQuote">{ex.q}</p>
              <p className="proofText">{ex.t}</p>
              <p className="proofMeta">{ex.m}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <h2>{t.faqTitle}</h2>

        <div className="card cardInfo" style={{ marginTop: 16 }}>
          {t.faq.map((item) => (
            <div key={item.q} style={{ marginBottom: 16 }}>
              <h3>{item.q}</h3>
              <p className="muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOOK */}
      <section className="section" id="book">
        <h2>{t.bookTitle}</h2>
        <p className="muted">{t.bookSub}</p>

        <div className="contactBox" style={{ marginTop: 16 }}>
          <form ref={formRef} onSubmit={handleSubmit} className="form" noValidate>
            <input type="text" name="_gotcha" className="hp" tabIndex={-1} autoComplete="off" />

            <label className="field">
              <span className="fieldLabel">{t.form.website}</span>
              <input
                name="website"
                type="url"
                placeholder={lang === "de" ? "z. B. https://deine-website.de" : "e.g. https://your-site.com"}
                required
                className="input"
                autoComplete="url"
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "err-website" : undefined}
                onChange={() => errors.website && setErrors((p) => ({ ...p, website: undefined }))}
              />
              {errors.website && (
                <span id="err-website" className="fieldError">
                  {errors.website}
                </span>
              )}
            </label>

            <label className="field">
              <span className="fieldLabel">{t.form.fix}</span>

              <div className="cSelect" ref={selectRef}>
                <input type="hidden" name="fix" value={fix} />

                <button
                  id={fixBtnId}
                  type="button"
                  className="cSelectBtn"
                  aria-haspopup="listbox"
                  aria-expanded={openFix}
                  aria-controls={fixListId}
                  aria-invalid={!!errors.fix}
                  onClick={() => {
                    setOpenFix((v) => !v);
                    if (errors.fix) setErrors((p) => ({ ...p, fix: undefined }));
                  }}
                >
                  <span className={fix ? "" : "cSelectPlaceholder"}>{fix || (lang === "de" ? "Bitte wählen…" : "Select…")}</span>
                  <span className="cSelectChevron" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {openFix && (
                  <div id={fixListId} className="cSelectMenu" role="listbox">
                    {fixOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cSelectOption ${fix === opt ? "isActive" : ""}`}
                        role="option"
                        aria-selected={fix === opt}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setFix(opt);
                          setOpenFix(false);
                          setErrors((p) => ({ ...p, fix: undefined }));
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {!fix && <span className="fieldHint muted">{lang === "de" ? "Bitte wähle den passenden Fix." : "Please choose a fix."}</span>}
                {errors.fix && <span className="fieldError">{errors.fix}</span>}
              </div>
            </label>

            <label className="field">
              <span className="fieldLabel">{t.form.desc}</span>
              <textarea
                name="beschreibung"
                rows={4}
                placeholder={lang === "de" ? "Was genau ist kaputt / was soll geändert werden? (optional)" : "What’s broken / what should change? (optional)"}
                className="input"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">{t.form.email}</span>
              <input
                name="email"
                type="email"
                placeholder={lang === "de" ? "name@firma.de" : "name@company.com"}
                required
                className="input"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
                onChange={() => errors.email && setErrors((p) => ({ ...p, email: undefined }))}
              />
              {errors.email && (
                <span id="err-email" className="fieldError">
                  {errors.email}
                </span>
              )}
            </label>

            <button
              type="submit"
              className="cta"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              title={!fix ? (lang === "de" ? "Bitte Fix auswählen" : "Please choose a fix") : undefined}
            >
              {submitState === "sending" ? t.form.submitSending : t.form.submitIdle}
            </button>

            {submitState === "success" && <div className="formMsg formMsgSuccess">{t.form.success}</div>}

            {submitState === "error" && (
              <div className="formMsg formMsgError">
                {t.form.error}{" "}
                <a className="contactLink" href={mailto}>
                  {EMAIL}
                </a>
                .
              </div>
            )}

            <p className="microNote">{t.form.micro}</p>

            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              {lang === "de" ? "Deine Daten nutze ich ausschließlich zur Bearbeitung deiner Anfrage." : "Your data is only used to handle your request."}
            </p>

            <p className="muted" style={{ marginTop: 10 }}>
              {lang === "de" ? "Lieber direkt per E-Mail?" : "Prefer email?"}{" "}
              <a className="contactLink" href={mailto}>
                {EMAIL}
              </a>
            </p>
          </form>
        </div>

        <footer className="footer muted">
          {t.footer} · {t.domain}
        </footer>
      </section>

      {/* ✅ Sticky CTA (mobile) */}
      <div className="stickyCta" aria-hidden="false">
        <a className="stickyCtaBtn" href="#book">
          {t.hero.cta}
        </a>
      </div>
    </main>
  );
}
