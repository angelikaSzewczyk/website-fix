// app/page.tsx (oder die Page-Datei, die du nutzt)
"use client";

import { useEffect, useId, useRef, useState } from "react";

const EMAIL = "hello.websitefix.team@web.de";
const FORMSPREE_ACTION = "https://formspree.io/f/xgoznqno";

const ZIEL_OPTIONS = ["Mehr Anfragen", "Mehr Termine", "Mehr Verkäufe"] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

export default function Page() {
  const [openZiel, setOpenZiel] = useState(false);
  const [ziel, setZiel] = useState<string>("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const selectRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const zielBtnId = useId();
  const zielListId = useId();

  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    "Website-Check Anfrage"
  )}&body=${encodeURIComponent(
    "Website-URL:\nZiel (Mehr Anfragen/Termine/Verkäufe):\nZielgruppe:\nKurzbeschreibung:\nE-Mail:\n\nDanke!"
  )}`;

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

  // UX: Wenn Erfolg/Fehler, nach einiger Zeit zurück auf idle (optional, aber angenehm)
  useEffect(() => {
    if (submitState === "success" || submitState === "error") {
      const t = window.setTimeout(() => setSubmitState("idle"), 8000);
      return () => window.clearTimeout(t);
    }
  }, [submitState]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ziel) {
      setOpenZiel(true);
      // optional: Fokus auf den "Select"
      const btn = document.getElementById(zielBtnId) as HTMLButtonElement | null;
      btn?.focus();
      return;
    }

    setSubmitState("sending");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Safety: falls hidden input nicht gesetzt wäre
      formData.set("ziel", ziel);

      const res = await fetch(FORMSPREE_ACTION, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setSubmitState("error");
        return;
      }

      formRef.current?.reset();
      setZiel("");
      setOpenZiel(false);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <main>
      {/* NAVBAR */}
      <header className="nav">
        <div className="brand">Website-Anfragen-Fix</div>

        <nav className="navLinks" aria-label="Hauptnavigation">
          <a href="#angebot">Angebot</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#kontakt">Kontakt</a>
        </nav>

        <a className="navCta" href="#kontakt">
          Check starten
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <p className="badge">7 Tage · Fixpreis · kein Relaunch</p>

        <h1>
          Zu wenig Anfragen über deine Website? <br />
          Wir machen sie anfragefähig.
        </h1>

        <p className="heroText">
          Für <strong>Dienstleister & Selbstständige</strong> mit bestehender Website:
          Ich schärfe <strong>Message, Struktur und CTA</strong>, damit Besucher in Sekunden verstehen,
          <strong> was du anbietest</strong> – und <strong>kontaktieren</strong>.
        </p>

        <div className="heroActions">
          <a className="cta" href="#kontakt">
            Kostenlosen Website-Check anfordern
          </a>

          <a className="ghost" href={mailto}>
            Lieber per E-Mail
          </a>
        </div>

        <p className="trustStrip">
          Rückmeldung in <strong>24h</strong> · Kein Verkaufsgespräch · Klarer Scope · Fixpreis
        </p>
      </section>

      {/* ANGEBOT */}
      <section className="section" id="angebot">
        <h2>Das Angebot</h2>
        <p className="muted">
          Kein kompletter Neubau. Wir machen deine Website{" "}
          <strong>klar</strong>, <strong>handlungsorientiert</strong> und{" "}
          <strong>anfragefähig</strong>.
        </p>

        <div className="cards">
          <div className="card cardPricing">
            <div>
              <h3>Website-Anfragen-Fix</h3>
              <p className="cardMeta">
                7 Tage · <strong>1.200 € Fixpreis</strong>
              </p>

              <p className="cardSub">
                Ergebnis: Besucher verstehen dein Angebot sofort – und klicken den nächsten Schritt.
              </p>

              <ul className="list">
                <li>Analyse deiner Website (URL + Ziel)</li>
                <li>Hero-Optimierung (Value Proposition + CTA)</li>
                <li>Struktur & Nutzerführung (Above-the-Fold + 1–2 Sektionen)</li>
                <li>Mobile-Optimierung (Typo, Abstände, Klickpfade)</li>
                <li>Quick Wins für Speed & Vertrauen</li>
                <li>Kurze Übergabe: „Was geändert wurde & warum“</li>
              </ul>
            </div>

            <a className="cta ctaSmall" href="#kontakt">
              Check starten
            </a>
          </div>

          <div className="card cardPricing">
            <div>
              <h3>Conversion-Landingpage-Sprint</h3>
              <p className="cardMeta">
                7 Tage · für EIN Angebot · <strong>1.600 € Fixpreis</strong>
              </p>

              <p className="cardSub">
                Ergebnis: eine fokussierte Seite, die exakt auf EIN Angebot und EIN Ziel optimiert ist.
              </p>

              <ul className="list">
                <li>Struktur & Conversion-Logik für EIN Angebot</li>
                <li>Heldenbereich (Nutzen, Zielgruppe, CTA)</li>
                <li>klare Nutzerführung (Above-the-Fold)</li>
                <li>Mobile-Optimierung</li>
                <li>Technische Umsetzung (eine Seite)</li>
                <li>Kurze Übergabe: „Was & warum“</li>
              </ul>
            </div>

            <a className="cta ctaSmall" href="#kontakt">
              Beratung starten
            </a>
          </div>
        </div>

        <div className="card cardNote">
          <h3>Was nicht enthalten ist</h3>
          <p className="cardMeta">Damit der Sprint schnell & klar bleibt.</p>

          <ul className="list">
            <li>Kompletter Website-Neubau</li>
            <li>Unbegrenzte Revisionen</li>
            <li>Wochenlange Design-Diskussionen</li>
            <li>SEO-Langzeitprojekt</li>
          </ul>

          <p className="muted" style={{ marginTop: 12 }}>
            Klarer Scope = Tempo = Ergebnis.
          </p>
        </div>

        <p className="muted" style={{ marginTop: 16 }}>
          Nicht sicher, was sinnvoller ist? Im kostenlosen Check sage ich dir ehrlich,
          ob ein Fix an der bestehenden Seite reicht oder eine fokussierte Landingpage besser passt.
        </p>
      </section>

      {/* ABLAUF */}
      <section className="section" id="ablauf">
        <h2>Ablauf</h2>
        <div className="steps">
          <div className="step">
            <div className="stepNum">1</div>
            <div>
              <div className="stepTitle">Kurz-Check</div>
              <div className="muted">Du schickst URL + Ziel + 2–3 Sätze Kontext.</div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">2</div>
            <div>
              <div className="stepTitle">Ehrliche Empfehlung</div>
              <div className="muted">
                Du bekommst eine Mini-Analyse + den nächsten sinnvollen Schritt.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">3</div>
            <div>
              <div className="stepTitle">Umsetzung</div>
              <div className="muted">Hero, CTA, Struktur, Mobile – fokussiert in 7 Tagen.</div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">4</div>
            <div>
              <div className="stepTitle">Live + Übergabe</div>
              <div className="muted">Kurze Doku, damit du es verstehst & halten kannst.</div>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAKT */}
      <section className="section" id="kontakt">
        <h2>Kostenloser Website-Check</h2>
        <p className="muted">
          Beantworte kurz <strong>4 Fragen</strong> – ich melde mich innerhalb von{" "}
          <strong>24 Stunden</strong> mit einer ehrlichen Einschätzung.
        </p>

        <div className="card cardInfo" style={{ marginTop: 16 }}>
          <h3>Was passiert nach dem Absenden?</h3>
          <ul className="list">
            <li>Ich prüfe deine Website auf Klarheit, CTA, Mobile & Vertrauen.</li>
            <li>Du erhältst eine kurze Einschätzung + den nächsten sinnvollen Schritt.</li>
            <li>Wenn es passt: klarer Sprint-Scope, Fixpreis & mögliches Startdatum.</li>
          </ul>
        </div>

        <div className="contactBox" style={{ marginTop: 16 }}>
          <form ref={formRef} onSubmit={handleSubmit} className="form" noValidate>
            {/* Betreff in Formspree */}
            <input type="hidden" name="_subject" value="Website-Check Anfrage" />
            {/* Anti-Spam Honeypot (Formspree): Feld MUSS leer bleiben */}
            <input type="text" name="_gotcha" className="hp" tabIndex={-1} autoComplete="off" />

            <label className="field">
              <span className="fieldLabel">Website-URL</span>
              <input
                name="website"
                type="url"
                placeholder="z. B. https://deine-website.de"
                required
                className="input"
                autoComplete="url"
              />
            </label>

            {/* Custom Select */}
            <label className="field">
              <span className="fieldLabel">Was soll deine Website aktuell erreichen?</span>

              <div className="cSelect" ref={selectRef}>
                <input type="hidden" name="ziel" value={ziel} />

                <button
                  id={zielBtnId}
                  type="button"
                  className="cSelectBtn"
                  aria-haspopup="listbox"
                  aria-expanded={openZiel}
                  aria-controls={zielListId}
                  onClick={() => setOpenZiel((v) => !v)}
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setZiel(opt);
                          setOpenZiel(false);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {!ziel && <span className="fieldHint muted">Bitte wähle das wichtigste Ziel aus.</span>}
              </div>
            </label>

            <label className="field">
              <span className="fieldLabel">Zielgruppe (optional)</span>
              <input
                name="zielgruppe"
                type="text"
                placeholder="z. B. Selbstständige, Coaches, lokale Dienstleister …"
                className="input"
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Kurzbeschreibung (optional)</span>
              <textarea
                name="beschreibung"
                rows={4}
                placeholder="Worum geht es bei deinem Angebot? 1–2 Sätze reichen völlig."
                className="input"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Deine E-Mail (für meine Rückmeldung)</span>
              <input
                name="email"
                type="email"
                placeholder="name@firma.de"
                required
                className="input"
                autoComplete="email"
              />
            </label>

            <button
              type="submit"
              className="cta"
              disabled={!ziel || submitState === "sending"}
              aria-disabled={!ziel || submitState === "sending"}
              title={!ziel ? "Bitte Ziel auswählen" : undefined}
            >
              {submitState === "sending" ? "Wird gesendet…" : "Kostenlosen Website-Check anfordern"}
            </button>

            {/* Feedback */}
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

            <p className="microNote">
              Kein Newsletter · Kein Spam · Kein Verkaufsgespräch
            </p>

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
