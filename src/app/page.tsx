// src/app/page.tsx
"use client";

import { track } from "@/lib/track";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";


const EMAIL = "support@website-fix.com";
const FORMSPREE_ACTION = "https://formspree.io/f/xgoznqno";

/** ✅ LIVE Stripe Payment Links (Fix #1 → #5) + TODO Fix #6 */
type FixKey = "form" | "speed" | "mobile" | "tracking" | "small" | "down";

/**
 * ✅ Stripe Links
 * Fix #6 (down) trägst du später ein.
 * Tipp (für Tracking): setze in Stripe Payment Links eine success_url wie:
 * https://website-fix.com/?success=1&fix=down
 */
const STRIPE_FIX_LINKS: Record<Exclude<FixKey, "down">, string> &
  Partial<Record<"down", string>> = {
  form: "https://buy.stripe.com/14AcN5ckE2hYgkGfcxgMw00",
  speed: "https://buy.stripe.com/dRm00jbgAe0Gd8u4xTgMw01",
  mobile: "https://buy.stripe.com/8x25kD0BWbSy0lIaWhgMw02",
  tracking: "https://buy.stripe.com/dRm8wP70k7Cid8u5BXgMw03",
  small: "https://buy.stripe.com/eVqbJ184oe0G6K6d4pgMw04",

  // ✅ TODO: Stripe Payment Link ergänzen:
  // down: "https://buy.stripe.com/....",
} as const;

// ✅ Fix-Auswahl (DE/EN) — erweitert um Fix #6
const FIX_OPTIONS_DE = [
  "Kontaktformular reparieren",
  "Website schneller machen",
  "Mobile Darstellung reparieren",
  "Tracking & Analytics einrichten",
  "Kleine Änderungen & Bugs (bis 60 Minuten)",
  "Website down / Critical Error fixen",
] as const;

const FIX_OPTIONS_EN = [
  "Fix contact form",
  "Speed up website",
  "Fix mobile layout",
  "Set up tracking & analytics",
  "Small changes & bugs (up to 60 minutes)",
  "Fix website down / critical error",
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

type SectionId =
  | "fixes"
  | "about"
  | "bundles"
  | "ablauf"
  | "beispiele"
  | "faq"
  | "blog"
  | "book";

type FixCard = {
  key: FixKey;
  title: string;
  eta: string;
  price: string;
  sub: string;
  list: string[];
  note?: string;
};

type ApiPost = {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    category: string | null;
    tags?: string[];
  };
};

export default function Page() {
  const [lang, setLang] = useState<Lang>("de");

  const [openFix, setOpenFix] = useState(false);
  const [fix, setFix] = useState<FixOptionDe | FixOptionEn | "">("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  // ✅ Upload UI state
  const [fileName, setFileName] = useState<string>("");

  // ✅ aktiver Nav-Link beim Scrollen
  const [activeSection, setActiveSection] = useState<SectionId>("fixes");

  // ✅ Banner nach Stripe success_url
  const [purchaseBanner, setPurchaseBanner] = useState<null | { fix?: string }>(
    null
  );

  const navRef = useRef<HTMLElement | null>(null);
  const selectRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const fixBtnId = useId();
  const fixListId = useId();

  const fixOptions = useMemo(
    () => (lang === "de" ? FIX_OPTIONS_DE : FIX_OPTIONS_EN),
    [lang]
  );

  // ✅ Blog preview state (API)
  const [latestPosts, setLatestPosts] = useState<ApiPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/posts?limit=3", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setLatestPosts(Array.isArray(data?.posts) ? data.posts : []);
      } catch {
        if (!alive) return;
        setLatestPosts([]);
      } finally {
        if (!alive) return;
        setPostsLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const mailto = useMemo(() => {
    const subject = "WebsiteFix Anfrage";
    const body =
      "Website-URL:\n" +
      "Welcher Fix?\n" +
      "Kurzbeschreibung (optional):\n" +
      "E-Mail:\n\n" +
      "Danke!";
    return `mailto:${EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, []);

  // ✅ Mapping FixKey -> FixOption (DE/EN)
  const mapDe = {
    form: "Kontaktformular reparieren",
    speed: "Website schneller machen",
    mobile: "Mobile Darstellung reparieren",
    tracking: "Tracking & Analytics einrichten",
    small: "Kleine Änderungen & Bugs (bis 60 Minuten)",
    down: "Website down / Critical Error fixen",
  } as const satisfies Record<FixKey, FixOptionDe>;

  const mapEn = {
    form: "Fix contact form",
    speed: "Speed up website",
    mobile: "Fix mobile layout",
    tracking: "Set up tracking & analytics",
    small: "Small changes & bugs (up to 60 minutes)",
    down: "Fix website down / critical error",
  } as const satisfies Record<FixKey, FixOptionEn>;

  function presetFix(key: FixKey) {
    if (lang === "de") setFix(mapDe[key]);
    else setFix(mapEn[key]);
    setOpenFix(false);
  }

  /**
   * ✅ Stripe success_url tracking (minimal & robust)
   * Wenn du in Stripe Payment Links success_url auf:
   *   https://website-fix.com/?success=1&fix=down
   * setzt, dann:
   * - zeigen wir oben ein Success-Banner
   * - feuern einmalig ein Event (purchase_intent_confirmed)
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const success = url.searchParams.get("success");
    const fixParam = url.searchParams.get("fix") ?? undefined;

    if (success === "1") {
      setPurchaseBanner({ fix: fixParam });

      // fire event (once) - guard with sessionStorage
      try {
        const key = `wf_purchase_banner_${success}_${fixParam ?? "unknown"}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");

          track("purchase_intent_confirmed", {
            source: "stripe_success_url",
            fix_key: fixParam,
            language: lang,
          });
        }
      } catch {
        // ignore
      }

      // Clean URL (nice UX)
      try {
        url.searchParams.delete("success");
        url.searchParams.delete("fix");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // ignore
      }

      // Optionally scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const t = useMemo(() => {
    const isDE = lang === "de";

    const fixes: FixCard[] = [
      {
        key: "form",
        title: isDE ? "Fix #1 – Kontaktformular reparieren" : "Fix #1 – Contact form repair",
        eta: "24h",
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
        eta: "48h",
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
        eta: "48h",
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
        eta: "24–48h",
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
        note: isDE
          ? "Beispiele: Button/CTA anpassen, Spacing fixen, Text ändern, Menü-Problem, kleiner CSS-Bug. (1 Thema, 1 Block — keine lange Liste)"
          : "Examples: tweak CTA/button, fix spacing, edit text, menu issue, small CSS bug. (1 topic, 1 block — no long list)",
      },
      {
        key: "down",
        title: isDE ? "Fix #6 – Website down / Critical Error" : "Fix #6 – Website down / critical error",
        eta: "24h",
        price: isDE ? "199 €" : "€199",
        sub: isDE
          ? "Wenn deine Website plötzlich nicht mehr lädt (White Screen, 500/502/503, „Critical Error“) bringen wir sie schnell wieder online — ohne Relaunch, ohne Drama."
          : "If your website suddenly won’t load (white screen, 500/502/503, “critical error”), we’ll get it back online fast — no redesign, no drama.",
        list: isDE
          ? [
              "Fehleranalyse (Logs, Plugin/Theme, Update-Konflikte)",
              "Wiederherstellung: Seite wieder online (Rollback/Fix)",
              "Kurzbericht: Ursache + was du künftig vermeiden solltest",
            ]
          : [
              "Root-cause check (logs, plugin/theme, update conflicts)",
              "Recovery: bring the site back online (rollback/fix)",
              "Short note: what caused it + how to prevent it",
            ],
        note: isDE
          ? "Scope: Wir beheben typische WordPress/Builder/Custom-Konflikte. Reine Hosting-Ausfälle (Provider down) oder DNS-Propagation sind extern — wir helfen aber beim Einordnen und geben klare Next Steps."
          : "Scope: We fix common WordPress/builder/custom conflicts. Pure hosting outages (provider down) or DNS propagation are external — we’ll still help you identify it and advise next steps.",
      },
    ];

    const about = isDE
      ? {
          title: "Über WebsiteFix",
          bullets: [
            "Sitz/Support: Deutschland (EU)",
            "Antwortzeit: meist innerhalb von 24h (Mo–Fr)",
            "Fixpreise & klarer Scope – keine versteckten Kosten",
          ],
          text:
            "WebsiteFix ist ein kleiner, fokussierter Fix-Service für typische Website-Probleme. Du wählst einen Fix zum Festpreis – wir prüfen kurz die Machbarkeit und legen los. Nicht umsetzbar? → 100% Erstattung.",
        }
      : {
          title: "About WebsiteFix",
          bullets: [
            "Based/support: Germany (EU)",
            "Response time: usually within 24h (Mon–Fri)",
            "Fixed prices & clear scope – no hidden costs",
          ],
          text:
            "WebsiteFix is a small, focused service for common website issues. Pick a fix at a fixed price — we quickly verify feasibility and start. Not feasible? → 100% refund.",
        };

    const faq = isDE
      ? [
          {
            q: "Welche Systeme unterstützt ihr?",
            a: "WordPress, Baukästen, Custom-Websites. Nach Zahlung prüfen wir kurz, ob der Fix in deinem Setup sauber umsetzbar ist.",
          },
          {
            q: "Welche Zugänge braucht ihr?",
            a: "Für viele Fixes reicht ein Admin-Zugang (z. B. WordPress). Bei Speed/Down-Fixes kann zusätzlich Hosting/FTP/Server-Zugriff nötig sein. Du bekommst nach Zahlung eine kurze Mail mit genau den Infos, die wir brauchen.",
          },
          {
            q: "Wie schnell startet ihr?",
            a: "Meist am selben oder nächsten Werktag. Du bekommst nach Zahlung sofort eine E-Mail – einfach antworten (Zugänge/Details) und wir starten.",
          },
          {
            q: "Was ist NICHT enthalten?",
            a: "Kein Redesign/Relaunch, keine umfangreichen neuen Features. Jeder Fix hat einen klaren Scope. Wenn es größer wird, sagen wir es transparent – du kannst dann entscheiden.",
          },
          {
            q: "Geht das auch ohne Zugang?",
            a: "Manchmal ja (z. B. Tracking via Tag Manager, einfache Frontend-Themen). Für die meisten Fixes brauchen wir aber mindestens Admin-Zugriff, damit wir sauber testen und final fixen können.",
          },
          { q: "Wie läuft die Bezahlung?", a: "Du klickst auf einen Fix und bezahlst online. Danach kurzer Machbarkeits-Check, dann Start." },
          { q: "Was, wenn es nicht umsetzbar ist?", a: "Dann erstatten wir 100% und sagen dir kurz warum." },
          { q: "Gibt es ein Abo?", a: "Nein. Optional später: monatliche Betreuung." },
        ]
      : [
          {
            q: "Which systems do you support?",
            a: "WordPress, builders, custom sites. After payment we quickly verify feasibility for your setup.",
          },
          {
            q: "What access do you need?",
            a: "Often an admin login is enough (e.g., WordPress). For speed/down fixes we may also need hosting/FTP/server access. After payment you’ll get a short email listing exactly what we need.",
          },
          {
            q: "How fast do you start?",
            a: "Usually the same or next business day. Right after payment you’ll get an email — reply with details/access and we start.",
          },
          {
            q: "What’s NOT included?",
            a: "No redesign/relaunch, no large new features. Each fix has a clear scope. If it’s bigger, we’ll tell you transparently — you decide next.",
          },
          {
            q: "Can it work without access?",
            a: "Sometimes yes (e.g., Tag Manager tracking or simple frontend items). For most fixes we need at least admin access to test and deliver properly.",
          },
          { q: "How does payment work?", a: "Click a fix and pay online. Then a quick feasibility check and we start." },
          { q: "What if it’s not feasible?", a: "We refund 100% and tell you briefly why." },
          { q: "Is there a subscription?", a: "No. Optional monthly care later." },
        ];

    return {
      brandLeft: "Website",
      brandRight: "Fix",
      domain: "website-fix.com",
      nav: {
        fixes: "Fixes",
        about: isDE ? "Über uns" : "About",
        bundles: "Bundles",
        how: isDE ? "Ablauf" : "How it works",
        examples: isDE ? "Beispiele" : "Examples",
        faq: "FAQ",
        blog: "Blog",
        book: isDE ? "Anfrage" : "Request",
      },
      hero: {
        badge: isDE ? "Fixpreise · 24–72h · Systemunabhängig" : "Fixed prices · 24–72h · Platform-agnostic",
        h1: isDE ? "Website kaputt? Wir fixen das." : "Website broken? We fix it.",
        sub: isDE
          ? "Wähle einen Fix, bezahle zum Fixpreis – wir prüfen kurz die Machbarkeit und starten sofort."
          : "Pick a fix, pay the fixed price — we verify feasibility quickly and start right away.",
        bullets: isDE
          ? ["Kontaktformular sendet nicht", "Website lädt zu langsam", "Mobile Ansicht verschoben", "Tracking fehlt", "Website down / Error"]
          : ["Form not sending", "Site loads too slow", "Mobile layout broken", "No tracking", "Website down / error"],
        cta: isDE ? "Fix auswählen" : "Choose a fix",
        ghost: isDE ? "Lieber per E-Mail" : "Prefer email",
        trust: isDE
          ? "Kein Abo · Fixpreis · Machbarkeits-Check inklusive · Nicht umsetzbar = 100% Erstattung"
          : "No subscription · Fixed price · Feasibility check included · Not feasible = 100% refund",
      },
      purchaseBanner: isDE
        ? {
            title: "✅ Zahlung erfolgreich",
            text:
              "Danke! Du bekommst gleich eine E-Mail mit den nächsten Schritten. Bitte antworte kurz mit den benötigten Zugängen/Infos – dann starten wir sofort.",
          }
        : {
            title: "✅ Payment successful",
            text:
              "Thanks! You’ll receive an email with the next steps shortly. Please reply with the required access/details — then we start right away.",
          },
      fixesTitle: isDE ? "Die Fixes" : "The fixes",
      fixesIntro: isDE
        ? "Klicke auf den passenden Fix. Du landest direkt bei der sicheren Zahlung."
        : "Click the fix you need. You’ll go straight to secure checkout.",
      refundLine: isDE
        ? "Nach Zahlung: du bekommst sofort eine kurze E-Mail mit den nächsten Schritten. Nicht umsetzbar? → 100% Erstattung."
        : "After payment: you’ll get a short email with next steps. Not feasible? → 100% refund.",
      scopeTitle: isDE ? "Scope & Sicherheit" : "Scope & safety",
      scopeText: isDE
        ? "Du zahlst online zum Fixpreis. Danach prüfen wir kurz Scope & Machbarkeit. Wenn der Fix so nicht umsetzbar ist: 100% Erstattung."
        : "You pay the fixed price online. Then we quickly verify scope & feasibility. If it’s not feasible: 100% refund.",
      about,
      bundlesTitle: isDE ? "Beliebte Bundles" : "Popular bundles",
      bundlesSub: isDE
        ? "Bundles bleiben bewusst auf Anfrage (kurzer Check), damit Scope & Kombination wirklich passen."
        : "Bundles stay request-only (quick check) so scope & combinations match.",
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
            { n: "1", title: "Fix auswählen", text: "Passenden Fix auswählen." },
            { n: "2", title: "Bezahlen", text: "Sicher online zum Fixpreis bezahlen." },
            { n: "3", title: "Kurz-Check", text: "Wir prüfen kurz Machbarkeit/Scope. Nicht machbar = 100% Erstattung." },
            { n: "4", title: "Umsetzung", text: "Umsetzung in 24–72h (je nach Fix)." },
          ]
        : [
            { n: "1", title: "Pick a fix", text: "Choose the fix you need." },
            { n: "2", title: "Pay", text: "Pay securely at the fixed price." },
            { n: "3", title: "Quick check", text: "We verify feasibility/scope. Not feasible = 100% refund." },
            { n: "4", title: "Delivery", text: "Delivery in 24–72h depending on the fix." },
          ],
      examplesTitle: isDE ? "Beispiele (anonymisiert)" : "Examples (anonymized)",
      examplesSub: isDE ? "Typische Situationen vor dem Fix" : "Common situations before a fix",
      examples: isDE
        ? [
            { q: "„Wir haben Besucher, aber kaum Anfragen.“", t: "Formular geprüft → Fix #1 + kleine CTA-Korrektur.", m: "Lokaler Dienstleister · DE" },
            { q: "„Mobil ist alles verschoben.“", t: "Spacing/Buttons korrigiert → Fix #3.", m: "Handwerk · DE" },
            { q: "„Plötzlich nur noch Error 500.“", t: "Rollback + Konfliktfix → Fix #6.", m: "KMU · DE" },
          ]
        : [
            { q: "“We get traffic but hardly any leads.”", t: "Fixed form → Fix #1 + small CTA improvement.", m: "Local business · EU" },
            { q: "“Mobile layout is broken.”", t: "Fixed spacing/buttons → Fix #3.", m: "Small business · EU" },
            { q: "“Suddenly a 500 error.”", t: "Rollback + conflict fix → Fix #6.", m: "SMB · EU" },
          ],
      faqTitle: "FAQ",
      faq,
      blogTitle: "Blog",
      blogSub: isDE
        ? "Kurze Fix-Guides: typische Website-Probleme schneller lösen — und mehr Anfragen bekommen."
        : "Short fix guides: solve common website issues faster — and get more leads.",
      blogAll: isDE ? "Alle Beiträge ansehen" : "View all posts",
      blogLoading: isDE ? "Lade Beiträge…" : "Loading posts…",
      blogEmpty: isDE ? "Noch keine Beiträge veröffentlicht." : "No posts published yet.",
      blogRead: isDE ? "Weiterlesen →" : "Read more →",
      blogCta: isDE ? "Fix auswählen" : "Choose a fix",
      bookTitle: isDE ? "Anfrage (optional)" : "Request (optional)",
      bookSub: isDE
        ? "Wenn du vorab kurz abklären möchtest, ob der Fix in deinem Setup passt, nutze das Formular. Für die schnellste Umsetzung: Fix auswählen & direkt bezahlen."
        : "Want a quick feasibility check before paying? Use the form below. For fastest delivery: choose a fix and pay instantly.",
      form: {
        website: isDE ? "Website-URL *" : "Website URL *",
        fix: isDE ? "Welcher Fix? *" : "Which fix? *",
        desc: isDE ? "Kurzbeschreibung (optional)" : "Short description (optional)",
        email: isDE ? "Deine E-Mail *" : "Your email *",
        submitIdle: isDE ? "Kurz-Check anfragen" : "Request quick check",
        submitSending: isDE ? "Wird gesendet…" : "Sending…",
        success: isDE
          ? "✅ Danke! Deine Anfrage ist eingegangen. Wir melden uns schnell zurück."
          : "✅ Thanks! Your request is in. We’ll get back to you shortly.",
        error: isDE
          ? "❌ Senden hat nicht geklappt. Bitte versuch es nochmal oder schreib an"
          : "❌ Sending failed. Please try again or email",
        micro: isDE ? "Kein Spam · Kein Abo · Nur für deine Anfrage" : "No spam · No subscription · Only for your request",
      },
      legalLine: isDE
        ? "Mit Absenden bestätigst du, dass du unsere Hinweise in Datenschutz & Impressum gelesen hast."
        : "By submitting you confirm you’ve read our Privacy Policy & Imprint.",
      footer: isDE ? "© 2026 · WebsiteFix" : "© 2026 · WebsiteFix",
      fixes,
    };
  }, [lang]);

  // Dropdown schließen: Outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!openFix) return;
      const target = e.target as Node;
      if (selectRef.current && !selectRef.current.contains(target))
        setOpenFix(false);
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

  /**
   * ✅ Active section highlighting (robust)
   * Strategy: choose section whose top is closest to the nav bottom.
   */
  useEffect(() => {
    const ids: SectionId[] = [
      "fixes",
      "about",
      "bundles",
      "ablauf",
      "beispiele",
      "faq",
      "blog",
      "book",
    ];

    const getNavOffset = () => {
      const navH = navRef.current?.getBoundingClientRect().height ?? 0;
      return navH + 12;
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;

        const offset = getNavOffset();
        const anchorY = offset;

        let best: { id: SectionId; score: number } | null = null;

        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;

          const r = el.getBoundingClientRect();
          const dist = Math.abs(r.top - anchorY);
          const onScreen =
            r.bottom > anchorY + 40 && r.top < window.innerHeight - 80;

          const score = onScreen ? dist : dist + 9999;
          if (!best || score < best.score) best = { id, score };
        }

        if (best?.id) setActiveSection(best.id);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  function validate(form: HTMLFormElement): FieldErrors {
    const fd = new FormData(form);
    const website = String(fd.get("website") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    const next: FieldErrors = {};

    if (!website)
      next.website =
        lang === "de"
          ? "Bitte gib deine Website-URL an."
          : "Please enter your website URL.";
    else {
      try {
        new URL(website);
      } catch {
        next.website =
          lang === "de"
            ? "Bitte gib eine gültige URL an (z. B. https://deine-website.de)."
            : "Please enter a valid URL (e.g. https://your-site.com).";
      }
    }

    if (!fix)
      next.fix = lang === "de" ? "Bitte wähle einen Fix aus." : "Please choose a fix.";

    if (!email)
      next.email =
        lang === "de" ? "Bitte gib deine E-Mail an." : "Please enter your email.";
    else {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!ok)
        next.email =
          lang === "de"
            ? "Bitte gib eine gültige E-Mail-Adresse an."
            : "Please enter a valid email.";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    const nextErrors = validate(formRef.current);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.website)
        formRef.current
          .querySelector<HTMLInputElement>('input[name="website"]')
          ?.focus();
      else if (nextErrors.fix) {
        setOpenFix(true);
        (document.getElementById(fixBtnId) as HTMLButtonElement | null)?.focus();
      } else if (nextErrors.email)
        formRef.current
          .querySelector<HTMLInputElement>('input[name="email"]')
          ?.focus();
      return;
    }

    setSubmitState("sending");

    // ✅ Important: snapshot selected fix before we reset state
    const selectedFix = fix;

    try {
      const formData = new FormData(formRef.current);
      formData.set("fix", String(selectedFix));
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
      setFileName("");
      setSubmitState("success");

      // ✅ Conversion event (consent-safe via track())
      track("fix_request_submitted", {
        fix_type: selectedFix,
        language: lang,
      });
    } catch {
      setSubmitState("error");
    }
  }

  const canSubmit = !!fix && submitState !== "sending";
  const navLinkClass = (id: SectionId) =>
    `navLink ${activeSection === id ? "isActive" : ""}`;

  return (
    <main>
      {/* Purchase success banner (from Stripe success_url) */}
      {purchaseBanner ? (
        <div className="card cardNote" style={{ margin: "14px auto 0", maxWidth: 1100 }}>
          <h3 style={{ marginTop: 0 }}>{t.purchaseBanner.title}</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {t.purchaseBanner.text}
          </p>
        </div>
      ) : null}

      {/* NAVBAR */}
      <header className="nav" ref={navRef}>
        <div className="brand">
          {t.brandLeft}
          <span className="brandSpace"> </span>
          <span className="brandAccent">{t.brandRight}</span>
        </div>

        <nav className="navLinks" aria-label="Hauptnavigation">
          <a className={navLinkClass("fixes")} href="#fixes">{t.nav.fixes}</a>
          <a className={navLinkClass("about")} href="#about">{t.nav.about}</a>
          <a className={navLinkClass("bundles")} href="#bundles">{t.nav.bundles}</a>
          <a className={navLinkClass("ablauf")} href="#ablauf">{t.nav.how}</a>
          <a className={navLinkClass("beispiele")} href="#beispiele">{t.nav.examples}</a>
          <a className={navLinkClass("faq")} href="#faq">{t.nav.faq}</a>
          <a className={navLinkClass("blog")} href="#blog">{t.nav.blog}</a>
          <a className={navLinkClass("book")} href="#book">{t.nav.book}</a>
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Language Segmented Control */}
          <div className="langSeg" role="group" aria-label="Language">
            <button
              type="button"
              className={`langSegBtn ${lang === "de" ? "isActive" : ""}`}
              onClick={() => setLang("de")}
              aria-pressed={lang === "de"}
            >
              DE
            </button>
            <button
              type="button"
              className={`langSegBtn ${lang === "en" ? "isActive" : ""}`}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          <a className="navCta" href="#fixes">{t.hero.cta}</a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <p className="badge">{t.hero.badge}</p>
        <h1>{t.hero.h1}</h1>
        <p className="heroText">{t.hero.sub}</p>

        <ul className="list" style={{ maxWidth: 820 }}>
          {t.hero.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>

        <div className="heroActions">
          <a className="cta" href="#fixes">{t.hero.cta}</a>
          <a className="ghost" href={mailto}>{t.hero.ghost}</a>
        </div>

        <p className="trustStrip">{t.hero.trust}</p>
      </section>

      {/* FIXES */}
      <section className="section" id="fixes">
        <h2>{t.fixesTitle}</h2>
        <p className="muted">{t.fixesIntro}</p>

        <p className="muted" style={{ marginTop: 8 }}>
          <strong>{t.refundLine}</strong>
        </p>

        <div className="cards">
          {t.fixes.map((fx) => (
            <div key={fx.key} className="card cardPricing">
              <div>
                <h3>{fx.title}</h3>

                <div className="metaRow">
                  <span className="pill">{fx.eta}</span>
                  <span className="pill pillStrong">{fx.price}</span>
                </div>

                <p className="cardSub">{fx.sub}</p>
                <ul className="list">
                  {fx.list.map((li) => <li key={li}>{li}</li>)}
                </ul>

                {fx.note ? (
                  <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{fx.note}</p>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <a
                  className="cta ctaSmall"
                  href={STRIPE_FIX_LINKS[fx.key] ?? "#book"}
                  target={STRIPE_FIX_LINKS[fx.key] ? "_blank" : undefined}
                  rel={STRIPE_FIX_LINKS[fx.key] ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    // ✅ Track click (consent-safe)
                    track("fix_click", { fix_key: fx.key, language: lang });

                    presetFix(fx.key);

                    if (STRIPE_FIX_LINKS[fx.key]) {
                      track("begin_checkout", {
                        item_type: "fix",
                        fix_key: fx.key,
                        language: lang,
                      });
                    } else {
                      track("begin_request", {
                        item_type: "fix",
                        fix_key: fx.key,
                        language: lang,
                      });
                    }
                  }}
                >
                  {fx.key === "down"
                    ? lang === "de"
                      ? "Notfall-Fix starten"
                      : "Start emergency fix"
                    : lang === "de"
                      ? "Fix jetzt bezahlen"
                      : "Pay now"}
                </a>

                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  {STRIPE_FIX_LINKS[fx.key]
                    ? lang === "de"
                      ? "Nach der Zahlung bekommst du eine E-Mail von uns mit allen nächsten Schritten - einfach antworten & wir legen los."
                      : "After payment, you will receive an email with the next steps. You can simply reply directly to it."
                    : lang === "de"
                      ? "Fix #6: Stripe-Link kommt gleich — bis dahin kurz anfragen → wir starten sofort."
                      : "Fix #6: Stripe link coming — for now request it and we’ll start right away."}
                </p>

                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  {lang === "de" ? "Nicht umsetzbar? → 100% Erstattung." : "Not feasible? → 100% refund."}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="card cardNote">
          <h3>{t.scopeTitle}</h3>
          <p className="muted">{t.scopeText}</p>
        </div>
      </section>

      {/* ABOUT / TRUST */}
      <section className="section" id="about">
        <h2>{t.about.title}</h2>
        <div className="card cardInfo" style={{ marginTop: 16 }}>
          <p className="muted" style={{ marginTop: 0 }}>{t.about.text}</p>
          <ul className="list" style={{ marginTop: 12 }}>
            {t.about.bullets.map((b: string) => <li key={b}>{b}</li>)}
          </ul>
          <p className="muted" style={{ marginBottom: 0, marginTop: 12, fontSize: 13 }}>
            {lang === "de"
              ? "Transparenz-Hinweis: Betreiber-/Firmenangaben findest du im Impressum."
              : "Transparency note: operator/company details are available in the Imprint."}
          </p>
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
                <p className="cardMeta"><strong>{b.meta}</strong></p>
                <p className="cardSub">{b.text}</p>
                <ul className="list">
                  <li>{lang === "de" ? "Kurzer Check, damit’s wirklich passt" : "Quick check to ensure it fits"}</li>
                  <li>{lang === "de" ? "Mehr Wert als einzeln" : "More value vs separate fixes"}</li>
                </ul>
              </div>

              <a className="cta ctaSmall" href="#book" onClick={() => presetFix(b.preset as FixKey)}>
                {lang === "de" ? "Bundle anfragen (kurzer Check)" : "Request bundle (quick check)"}
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
          {t.faq.map((item: { q: string; a: string }) => (
            <div key={item.q} style={{ marginBottom: 16 }}>
              <h3>{item.q}</h3>
              <p className="muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG (preview via API) */}
      <section className="section" id="blog">
        <div className="blogHeadRow">
          <div>
            <h2>{t.blogTitle}</h2>
            <p className="muted">{t.blogSub}</p>
          </div>

          <Link className="ghostBtn" href="/blog">
            {t.blogAll} →
          </Link>
        </div>

        {postsLoading ? (
          <div className="card cardNote">
            <p className="muted" style={{ margin: 0 }}>{t.blogLoading}</p>
          </div>
        ) : latestPosts.length === 0 ? (
          <div className="card cardNote">
            <p className="muted" style={{ margin: 0 }}>{t.blogEmpty}</p>
          </div>
        ) : (
          <div className="blogGrid">
            {latestPosts.map((p) => {
              const fm = p.frontmatter;
              return (
                <article key={p.slug} className="blogCard">
                  <div className="blogMetaRow">
                    {fm.category ? <span className="chip chipStrong">{fm.category}</span> : <span />}
                    <time className="mutedSmall" dateTime={fm.date}>{fm.date}</time>
                  </div>

                  <h3 className="blogTitle">
                    <Link className="blogLink" href={`/blog/${p.slug}`}>
                      {fm.title}
                    </Link>
                  </h3>

                  {fm.description ? <p className="blogExcerpt">{fm.description}</p> : null}

                  {!!fm.tags?.length && (
                    <div className="chipRow">
                      {fm.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="chip">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="blogCardFooter">
                    <Link className="readMore" href={`/blog/${p.slug}`}>
                      {t.blogRead}
                    </Link>

                    <a className="ghostBtnSmall" href="#fixes">
                      {t.blogCta}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BOOK (optional Anfrage) */}
      <section className="section" id="book">
        <h2>{t.bookTitle}</h2>
        <p className="muted">{t.bookSub}</p>

        <div className="contactBox" style={{ marginTop: 16 }}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="form"
            noValidate
            encType="multipart/form-data"
          >
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
              {errors.website && <span id="err-website" className="fieldError">{errors.website}</span>}
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
                  <span className={fix ? "" : "cSelectPlaceholder"}>
                    {fix || (lang === "de" ? "Bitte wählen…" : "Select…")}
                  </span>
                  <span className="cSelectChevron" aria-hidden="true">▾</span>
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

                {!fix && (
                  <span className="fieldHint muted">
                    {lang === "de" ? "Bitte wähle den passenden Fix." : "Please choose a fix."}
                  </span>
                )}
                {errors.fix && <span className="fieldError">{errors.fix}</span>}
              </div>
            </label>

            <label className="field">
              <span className="fieldLabel">{t.form.desc}</span>
              <textarea
                name="beschreibung"
                rows={4}
                placeholder={
                  lang === "de"
                    ? "Was genau ist kaputt / was soll geändert werden? (optional)"
                    : "What’s broken / what should change? (optional)"
                }
                className="input"
              />
            </label>

            {/* Upload (optional) */}
            <label className="field">
              <span className="fieldLabel">{lang === "de" ? "Screenshot (optional)" : "Screenshot (optional)"}</span>

              <div className="uploadBox">
                <div className="uploadHead">
                  <div className="uploadTitle">
                    <strong>{lang === "de" ? "UI-/Bug-Screenshot" : "UI / bug screenshot"}</strong>
                    <span className="uploadMeta">
                      {lang === "de"
                        ? "PNG / JPG / WebP · max. 8 MB · hilft uns, schneller zu fixen."
                        : "PNG / JPG / WebP · max. 8 MB · helps us fix it faster."}
                    </span>
                  </div>

                  <label className="uploadBtn">
                    {fileName
                      ? (lang === "de" ? "Anderes Bild wählen" : "Choose another")
                      : (lang === "de" ? "Bild auswählen" : "Choose file")}

                    <input
                      name="attachment"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="uploadInput"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];

                        if (!file) {
                          setFileName("");
                          return;
                        }

                        if (file.size > 8 * 1024 * 1024) {
                          alert(lang === "de" ? "Datei ist zu groß (maximal 8 MB)." : "File is too large (max 8 MB).");
                          e.currentTarget.value = "";
                          setFileName("");
                          return;
                        }

                        setFileName(file.name);
                      }}
                    />
                  </label>
                </div>

                {fileName && (
                  <div className="filePillRow">
                    <span className="filePill">
                      {fileName}
                      <button
                        type="button"
                        className="fileRemove"
                        aria-label={lang === "de" ? "Datei entfernen" : "Remove file"}
                        onClick={() => {
                          const input = formRef.current?.querySelector<HTMLInputElement>('input[name="attachment"]');
                          if (input) input.value = "";
                          setFileName("");
                        }}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}

                {!fileName && (
                  <span className="fieldHint muted">
                    {lang === "de"
                      ? "Hinweis: iPhone-Fotos ggf. als JPG exportieren."
                      : "Note: iPhone photos may need to be exported as JPG."}
                  </span>
                )}
              </div>
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
              {errors.email && <span id="err-email" className="fieldError">{errors.email}</span>}
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

            <p className="microNote microNoteCenter">
              {lang === "de" ? "Antwort meist innerhalb von 24h (Mo–Fr)" : "Usually replies within 24h (Mon–Fri)."}
            </p>

            <p className="microNote" style={{ marginTop: 6 }}>
              {t.legalLine}{" "}
              <a className="contactLink" href="/datenschutz">Datenschutz</a> ·{" "}
              <a className="contactLink" href="/impressum">Impressum</a>
            </p>

            {submitState === "success" && <div className="formMsg formMsgSuccess">{t.form.success}</div>}
            {submitState === "error" && (
              <div className="formMsg formMsgError">
                {t.form.error}{" "}
                <a className="contactLink" href={mailto}>{EMAIL}</a>.
              </div>
            )}

            <p className="microNote">{t.form.micro}</p>

            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              {lang === "de"
                ? "Deine Daten nutze ich ausschließlich zur Bearbeitung deiner Anfrage."
                : "Your data is only used to handle your request."}
            </p>

            <p className="muted" style={{ marginTop: 10 }}>
              {lang === "de" ? "Lieber direkt per E-Mail?" : "Prefer email?"}{" "}
              <a className="contactLink" href={mailto}>{EMAIL}</a>
            </p>
          </form>
        </div>

        <footer className="footer muted">
          {t.footer} · {t.domain} ·{" "}
          <a className="contactLink" href="/impressum">Impressum</a> ·{" "}
          <a className="contactLink" href="/datenschutz">Datenschutz</a>
        </footer>
      </section>

      {/* Sticky CTA (mobile) */}
      <div className="stickyCta" aria-hidden="false">
        <a className="stickyCtaBtn" href="#fixes">{t.hero.cta}</a>
      </div>
    </main>
  );
}
