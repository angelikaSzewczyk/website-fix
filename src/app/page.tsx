// ✅ Änderungen: Nav-Link "Beispiele" + bessere Reihenfolge + optionales Active-Scrolling (leicht, ohne Lib)
// Kopiere dieses page.tsx komplett ODER übernimm nur die NAV-Änderungen + optional Active-Link-Logik.

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const EMAIL = "hello.websitefix.team@web.de";
const FORMSPREE_ACTION = "https://formspree.io/f/xgoznqno";

const ZIEL_OPTIONS = ["Mehr Anfragen", "Mehr Termine", "Mehr Verkäufe"] as const;
type ZielOption = (typeof ZIEL_OPTIONS)[number];

type SubmitState = "idle" | "sending" | "success" | "error";

type FieldErrors = Partial<{
  website: string;
  ziel: string;
  email: string;
}>;

type SectionId = "angebot" | "ablauf" | "beispiele" | "faq" | "kontakt";

export default function Page() {
  const [openZiel, setOpenZiel] = useState(false);
  const [ziel, setZiel] = useState<ZielOption | "">("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  // ✅ optional: aktiver Nav-Link beim Scrollen
  const [activeSection, setActiveSection] = useState<SectionId>("angebot");

  const selectRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const zielBtnId = useId();
  const zielListId = useId();

  const LIMITED_TEXT =
    "Begrenzte Plätze – aktuell nur für lokale Unternehmen & Handwerk";
  const CHECK_RESPONSE_TIME = "Rückmeldung in 24h";

  const mailto = useMemo(() => {
    const subject = "Mini-Website-Check Anfrage";
    const body =
      "Website-URL:\n" +
      "Ziel (Mehr Anfragen/Termine/Verkäufe):\n" +
      "Branche/Gewerbe:\n" +
      "Ort/Region:\n" +
      "Kurzbeschreibung (optional):\n" +
      "E-Mail:\n\n" +
      "Danke!";
    return `mailto:${EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, []);

  // Dropdown schließen: Outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!openZiel) return;
      const target = e.target as Node;
      if (selectRef.current && !selectRef.current.contains(target)) {
        setOpenZiel(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openZiel]);

  // Dropdown schließen: ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenZiel(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // UX: Erfolg/Fehler nach X Sekunden zurücksetzen
  useEffect(() => {
    if (submitState === "success" || submitState === "error") {
      const t = window.setTimeout(() => setSubmitState("idle"), 8000);
      return () => window.clearTimeout(t);
    }
  }, [submitState]);

  // ✅ optional: Active section highlighting via IntersectionObserver
  useEffect(() => {
    const ids: SectionId[] = ["angebot", "ablauf", "beispiele", "faq", "kontakt"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // nehme die am stärksten sichtbare Section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id as SectionId);
        }
      },
      {
        root: null,
        // früher aktiv werden (oben im Viewport)
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0.1, 0.2, 0.35],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function validate(form: HTMLFormElement): FieldErrors {
    const fd = new FormData(form);
    const website = String(fd.get("website") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    const next: FieldErrors = {};

    if (!website) next.website = "Bitte gib deine Website-URL an.";
    else {
      try {
        // eslint-disable-next-line no-new
        new URL(website);
      } catch {
        next.website =
          "Bitte gib eine gültige URL an (z. B. https://deine-website.de).";
      }
    }

    if (!ziel) next.ziel = "Bitte wähle das wichtigste Ziel aus.";

    if (!email) next.email = "Bitte gib deine E-Mail an.";
    else {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!ok) next.email = "Bitte gib eine gültige E-Mail-Adresse an.";
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
      else if (nextErrors.ziel) {
        setOpenZiel(true);
        (document.getElementById(zielBtnId) as HTMLButtonElement | null)?.focus();
      } else if (nextErrors.email)
        formRef.current
          .querySelector<HTMLInputElement>('input[name="email"]')
          ?.focus();
      return;
    }

    setSubmitState("sending");

    try {
      const formData = new FormData(formRef.current);
      formData.set("ziel", String(ziel));

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
      setZiel("");
      setOpenZiel(false);
      setErrors({});
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  const canSubmit = ziel && submitState !== "sending";

  // Helper for active nav class
  const navLinkClass = (id: SectionId) =>
    `navLink ${activeSection === id ? "isActive" : ""}`;

  return (
    <main>
      {/* NAVBAR */}
      <header className="nav">
        <div className="brand">Website-Anfragen-Fix</div>

        <nav className="navLinks" aria-label="Hauptnavigation">
          {/* ✅ Reihenfolge: Angebot → Ablauf → Beispiele → FAQ → Kontakt */}
          <a className={navLinkClass("angebot")} href="#angebot">
            Angebot
          </a>
          <a className={navLinkClass("ablauf")} href="#ablauf">
            Ablauf
          </a>
          <a className={navLinkClass("beispiele")} href="#beispiele">
            Beispiele
          </a>
          <a className={navLinkClass("faq")} href="#faq">
            FAQ
          </a>
          <a className={navLinkClass("kontakt")} href="#kontakt">
            Kontakt
          </a>
        </nav>

        <a className="navCta" href="#kontakt">
          Mini-Check sichern
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <p className="badge">{LIMITED_TEXT}</p>

        <h1>
          Ihre Website ist online – <br />
          aber bringt kaum Anfragen?
        </h1>

        <p className="heroText">
          Für <strong>lokale Dienstleister & Handwerksbetriebe</strong> mit
          bestehender Website: Ich prüfe <strong>Klarheit</strong>,{" "}
          <strong>CTA</strong>, <strong>Mobile</strong> und{" "}
          <strong>Vertrauen</strong> – und zeige dir konkret,{" "}
          <strong>warum Besucher nicht anfragen</strong>. Wenn es passt, behebe
          ich die wichtigsten Conversion-Fehler innerhalb von{" "}
          <strong>48 Stunden</strong> (Fixpreis).
        </p>

        <div className="heroActions">
          <a className="cta" href="#kontakt">
            Kostenlosen Mini-Website-Check sichern
          </a>

          <a className="ghost" href={mailto}>
            Lieber per E-Mail
          </a>
        </div>

        <p className="trustStrip">
          {CHECK_RESPONSE_TIME} · Kein Abo · Kein Vertrag · Fixpreis · Kein
          Verkaufsgespräch
        </p>
      </section>

      {/* ANGEBOT */}
      <section className="section" id="angebot">
        <h2>Das Angebot</h2>
        <p className="muted">
          Kein Relaunch, keine langen Abstimmungen. Ich mache deine Website{" "}
          <strong>klar</strong>, <strong>handlungsorientiert</strong> und{" "}
          <strong>anfragefähig</strong> – damit Interessenten in Sekunden
          verstehen, was du anbietest und was der nächste Schritt ist.
        </p>

        <div className="cards">
          <div className="card cardPricing">
            <div>
              <h3>Kostenloser Mini-Website-Check</h3>
              <p className="cardMeta">
                Kurz & konkret · <strong>kostenlos</strong>
              </p>

              <p className="cardSub">
                Ergebnis: Du weißt klar, warum deine Website aktuell keine
                Anfragen bringt – und welcher nächste Schritt sinnvoll ist.
              </p>

              <ul className="list">
                <li>Check: Hero / Nutzen / CTA (Above-the-Fold)</li>
                <li>Check: Kontaktweg & Formular (Barrieren, Klarheit)</li>
                <li>Check: Mobile (Lesbarkeit, Klickpfade)</li>
                <li>Check: Vertrauen (Beweise, „Warum du?“, nächste Schritte)</li>
                <li>Kurzfazit + Empfehlung (Fix reicht / Alternative sinnvoll)</li>
              </ul>

              <p className="muted" style={{ marginTop: 12 }}>
                <strong>Wichtig:</strong> Der Mini-Check enthält keine Umsetzung
                – nur eine ehrliche Einschätzung.
              </p>
            </div>

            <a className="cta ctaSmall" href="#kontakt">
              Mini-Check sichern
            </a>
          </div>

          <div className="card cardPricing">
            <div>
              <h3>Website-Anfragen-Fix (48h)</h3>
              <p className="cardMeta">
                48 Stunden · <strong>799 € Fixpreis</strong>
              </p>

              <p className="cardSub">
                Ergebnis: Die wichtigsten Conversion-Fehler sind behoben –
                Besucher verstehen dein Angebot schneller und fragen eher an.
              </p>

              <ul className="list">
                <li>Analyse + Priorisierung (was bringt am meisten?)</li>
                <li>Hero-Optimierung (Value Proposition + CTA)</li>
                <li>Kontakt-Conversion (Formular/Buttons/Click-to-Call)</li>
                <li>Mobile-Optimierung (Typo, Abstände, Klickpfade)</li>
                <li>
                  Vertrauens-Booster (z. B. Referenzen, Beweise, klare „Nächste
                  Schritte“)
                </li>
                <li>Kurze Übergabe: „Was geändert wurde & warum“</li>
              </ul>

              <div className="muted" style={{ marginTop: 12 }}>
                <strong>Bezahlung:</strong> Rechnung / Überweisung (kein Checkout
                auf der Seite nötig).
              </div>
            </div>

            <a className="cta ctaSmall" href="#kontakt">
              Fix anfragen
            </a>
          </div>
        </div>

        <div className="card cardNote">
          <h3>Was nicht enthalten ist</h3>
          <p className="cardMeta">Damit es schnell & klar bleibt.</p>

          <ul className="list">
            <li>Kompletter Website-Neubau / Relaunch</li>
            <li>Unbegrenzte Revisionen</li>
            <li>Wochenlange Design-Diskussionen</li>
            <li>SEO-Langzeitprojekt</li>
            <li>Komplette Website-Migration</li>
          </ul>

          <p className="muted" style={{ marginTop: 12 }}>
            Klarer Scope = Tempo = Ergebnis.
          </p>
        </div>

        <p className="muted" style={{ marginTop: 16 }}>
          Nicht sicher, was sinnvoller ist? Im kostenlosen Mini-Check sage ich
          dir ehrlich, ob ein Fix an der bestehenden Seite reicht – oder ob ein
          anderer Schritt sinnvoller wäre.
        </p>
      </section>

      {/* ABLAUF */}
      <section className="section" id="ablauf">
        <h2>Ablauf</h2>
        <div className="steps">
          <div className="step">
            <div className="stepNum">1</div>
            <div>
              <div className="stepTitle">Mini-Check anfragen</div>
              <div className="muted">
                Du schickst URL + Ziel + Branche + Region (1 Minute).
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">2</div>
            <div>
              <div className="stepTitle">Ehrliche Einschätzung</div>
              <div className="muted">
                Du bekommst eine kurze Rückmeldung + die 1–2 wichtigsten Hebel.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">3</div>
            <div>
              <div className="stepTitle">Umsetzung (48h)</div>
              <div className="muted">
                Die wichtigsten Fixes an Hero, CTA, Kontakt & Mobile – fokussiert
                in 48 Stunden.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">4</div>
            <div>
              <div className="stepTitle">Übergabe</div>
              <div className="muted">
                Kurze Doku: was geändert wurde & warum – damit du es halten
                kannst.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <h2>FAQ</h2>

        <div className="card cardInfo" style={{ marginTop: 16 }}>
          <h3>Ist der Mini-Check wirklich kostenlos?</h3>
          <p className="muted">
            Ja – aktuell ist er kostenlos und bewusst kurz. So bekommst du
            schnell Klarheit, ob ein 48h-Fix sinnvoll ist.
          </p>

          <h3 style={{ marginTop: 16 }}>Muss ich dafür ein Gespräch buchen?</h3>
          <p className="muted">
            Nein. Du bekommst erst eine Einschätzung. Wenn du willst, klären wir
            danach kurz Scope, Timing und Zugang.
          </p>

          <h3 style={{ marginTop: 16 }}>Für wen ist das nicht geeignet?</h3>
          <p className="muted">
            Wenn du einen kompletten Relaunch, Branding-Projekt oder
            SEO-Langzeitbetreuung brauchst, ist das nicht der richtige Rahmen.
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="section" id="beispiele">
        <h2>Was andere lokale Unternehmen vor dem Check gedacht haben</h2>
        <p className="muted">Anonymisierte Beispiele aus echten Website-Checks</p>

        <div className="proofGrid">
          <div className="proofCard">
            <p className="proofQuote">„Wir hatten Besucher, aber kaum Anfragen.“</p>
            <p className="proofText">
              Nach dem Fix war sofort klar, was wir anbieten – das Kontaktformular wird endlich genutzt.
            </p>
            <p className="proofMeta">Handwerksbetrieb · NRW</p>
          </div>

          <div className="proofCard">
            <p className="proofQuote">„Unsere Website war schön, aber verwirrend.“</p>
            <p className="proofText">
              Durch die neue Struktur wissen Besucher sofort, welchen Schritt sie gehen sollen.
            </p>
            <p className="proofMeta">Lokaler Dienstleister · Süddeutschland</p>
          </div>

          <div className="proofCard">
            <p className="proofQuote">„Mobil war die Seite praktisch unbrauchbar.“</p>
            <p className="proofText">
              Nach den Anpassungen ist sie deutlich übersichtlicher – vor allem auf dem Handy.
            </p>
            <p className="proofMeta">Selbstständige Dienstleistung · Rhein-Main</p>
          </div>
        </div>
      </section>

      {/* KONTAKT */}
      <section className="section" id="kontakt">
        <h2>Kostenloser Mini-Website-Check</h2>
        <p className="muted">
          Beantworte kurz <strong>4 Fragen</strong> – ich melde mich innerhalb
          von <strong>24 Stunden</strong> mit einer ehrlichen Einschätzung.{" "}
          <strong>{LIMITED_TEXT}</strong>
        </p>

        <div className="card cardInfo" style={{ marginTop: 16 }}>
          <h3>Was passiert nach dem Absenden?</h3>
          <ul className="list">
            <li>Ich prüfe deine Website auf Klarheit, CTA, Mobile & Vertrauen.</li>
            <li>Du erhältst eine kurze Einschätzung + die 1–2 wichtigsten Hebel.</li>
            <li>
              Wenn es passt: Website-Anfragen-Fix (48h) zum Fixpreis – oder ich
              sage dir ehrlich, wenn es nicht nötig ist.
            </li>
          </ul>
        </div>

        <div className="contactBox" style={{ marginTop: 16 }}>
          {/* TRUST-LEISTE */}
          <div className="trustBar" role="note" aria-label="Kurzinfo zum Mini-Check">
            <div className="trustItem">
              <span className="trustDot" aria-hidden="true" />
              <span>
                <strong>Rückmeldung in 24h</strong>
                <span className="trustSub">kurz & konkret</span>
              </span>
            </div>

            <div className="trustItem">
              <span className="trustDot" aria-hidden="true" />
              <span>
                <strong>Kein Verkaufsgespräch</strong>
                <span className="trustSub">erst Einschätzung</span>
              </span>
            </div>

            <div className="trustItem">
              <span className="trustDot" aria-hidden="true" />
              <span>
                <strong>Fixpreis (wenn Fix)</strong>
                <span className="trustSub">48h · 799 €</span>
              </span>
            </div>

            <div className="trustItem">
              <span className="trustDot" aria-hidden="true" />
              <span>
                <strong>Begrenzte Plätze</strong>
                <span className="trustSub">für lokale Unternehmen</span>
              </span>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="form" noValidate>
            <input type="hidden" name="_subject" value="Mini-Website-Check Anfrage" />
            <input type="text" name="_gotcha" className="hp" tabIndex={-1} autoComplete="off" />

            <label className="field">
              <span className="fieldLabel">Website-URL *</span>
              <input
                name="website"
                type="url"
                placeholder="z. B. https://deine-website.de"
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
              <span className="fieldLabel">Was soll deine Website aktuell erreichen? *</span>

              <div className="cSelect" ref={selectRef}>
                <input type="hidden" name="ziel" value={ziel} />

                <button
                  id={zielBtnId}
                  type="button"
                  className="cSelectBtn"
                  aria-haspopup="listbox"
                  aria-expanded={openZiel}
                  aria-controls={zielListId}
                  aria-invalid={!!errors.ziel}
                  onClick={() => {
                    setOpenZiel((v) => !v);
                    if (errors.ziel) setErrors((p) => ({ ...p, ziel: undefined }));
                  }}
                >
                  <span className={ziel ? "" : "cSelectPlaceholder"}>
                    {ziel || "Bitte wählen…"}
                  </span>
                  <span className="cSelectChevron" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {openZiel && (
                  <div id={zielListId} className="cSelectMenu" role="listbox">
                    {ZIEL_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cSelectOption ${ziel === opt ? "isActive" : ""}`}
                        role="option"
                        aria-selected={ziel === opt}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setZiel(opt);
                          setOpenZiel(false);
                          setErrors((p) => ({ ...p, ziel: undefined }));
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {!ziel && <span className="fieldHint muted">Bitte wähle das wichtigste Ziel aus.</span>}
                {errors.ziel && <span className="fieldError">{errors.ziel}</span>}
              </div>
            </label>

            <label className="field">
              <span className="fieldLabel">Branche / Gewerbe *</span>
              <input
                name="branche"
                type="text"
                placeholder="z. B. Elektriker, Gebäudereinigung, Praxis, Studio, Malerbetrieb …"
                className="input"
                required
                autoComplete="organization"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Ort / Region *</span>
              <input
                name="region"
                type="text"
                placeholder="z. B. Köln, Düsseldorf, Ruhrgebiet …"
                className="input"
                required
                autoComplete="address-level2"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Kurzbeschreibung (optional)</span>
              <textarea
                name="beschreibung"
                rows={4}
                placeholder="Was bietest du an? 1–2 Sätze reichen völlig."
                className="input"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Deine E-Mail (für meine Rückmeldung) *</span>
              <input
                name="email"
                type="email"
                placeholder="name@firma.de"
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
              title={!ziel ? "Bitte Ziel auswählen" : undefined}
            >
              {submitState === "sending" ? "Wird gesendet…" : "Mini-Check sichern"}
            </button>

            <div className="srOnly" aria-live="polite">
              {submitState === "sending" && "Senden läuft."}
              {submitState === "success" && "Erfolg."}
              {submitState === "error" && "Fehler."}
            </div>

            {submitState === "success" && (
              <div className="formMsg formMsgSuccess">
                ✅ Danke! Deine Anfrage ist eingegangen. Ich melde mich innerhalb von 24 Stunden mit einer kurzen
                Einschätzung bei dir.
              </div>
            )}

            {submitState === "error" && (
              <div className="formMsg formMsgError">
                ❌ Senden hat nicht geklappt. Bitte versuch es nochmal oder schreib an{" "}
                <a className="contactLink" href={mailto}>
                  {EMAIL}
                </a>
                .
              </div>
            )}

            <p className="microNote">Kein Newsletter · Kein Spam · Kein Verkaufsgespräch</p>

            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              Deine Daten nutze ich ausschließlich zur Bearbeitung deiner Anfrage.
            </p>

            <p className="muted" style={{ marginTop: 10 }}>
              Lieber direkt per E-Mail?{" "}
              <a className="contactLink" href={mailto}>
                {EMAIL}
              </a>
            </p>
          </form>
        </div>

        <footer className="footer muted">© 2026 · Website-Anfragen-Fix</footer>
      </section>
    </main>
  );
}
