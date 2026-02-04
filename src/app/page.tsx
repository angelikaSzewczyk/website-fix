"use client";

import { useEffect, useRef, useState } from "react";

const EMAIL = "hello.websitefix.team@web.de";
const FORMSPREE_ACTION = "https://formspree.io/f/xgoznqno";

const ZIEL_OPTIONS = ["Mehr Anfragen", "Termine", "Verkauf"] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

export default function Page() {
  const [openZiel, setOpenZiel] = useState(false);
  const [ziel, setZiel] = useState<string>("");

  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const selectRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    "Website-Check Anfrage"
  )}&body=${encodeURIComponent(
    "Website-URL:\nZiel (Anfragen/Termine/Verkauf):\nZielgruppe:\nKurze Beschreibung des Angebots:\n\nDanke!"
  )}`;

  // Close dropdown on outside click
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

  // Close dropdown on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenZiel(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-reset success state after 8s (UX)
  useEffect(() => {
    if (submitState !== "success") return;

    const t = window.setTimeout(() => {
      setSubmitState("idle");
    }, 8000);

    return () => window.clearTimeout(t);
  }, [submitState]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ziel) {
      setOpenZiel(true);
      return;
    }

    setSubmitState("sending");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const res = await fetch(FORMSPREE_ACTION, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setSubmitState("error");
        return;
      }

      // success: reset all fields (including custom select)
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

        <nav className="navLinks">
          <a href="#angebot">Angebot</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#kontakt">Kontakt</a>
        </nav>

        <a className="navCta" href="#kontakt">
          Check anfordern
        </a>
      </header>

      {/* HERO */}
      <section className="hero">
        <p className="badge">7 Tage · Fixpreis · kein Relaunch</p>

        <h1>
          Zu wenig Anfragen über deine Website? <br />
          Wir machen sie anfragefähig.
        </h1>

        <p className="heroText">
          Für <strong>Dienstleister & Selbstständige</strong> mit bestehender
          Website: Ich schärfe <strong>Message, Struktur und CTA</strong>, damit
          Besucher in Sekunden verstehen,
          <strong> was du anbietest</strong> – und <strong>kontaktieren</strong>.
        </p>

        <a className="cta" href="#kontakt">
          Kostenlosen Website-Check starten
        </a>

        {/* Trust-Pills */}
        <div className="heroTrust" aria-label="Vertrauenshinweise">
          <span className="heroPill">⏱ Rückmeldung in 24h</span>
          <span className="heroPill">✅ Fixpreis & klarer Scope</span>
          <span className="heroPill">🧠 Kein Verkaufsgespräch</span>
        </div>
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
          <div className="card">
            <h3>Website-Anfragen-Fix</h3>
            <p className="cardMeta">
              7 Tage · <strong>1.200 € Fixpreis</strong>
            </p>

            <p className="muted" style={{ marginTop: 6 }}>
              Ergebnis: Besucher verstehen dein Angebot sofort – und klicken den
              nächsten Schritt.
            </p>

            <ul className="list">
              <li>Analyse deiner Website (URL + Ziel)</li>
              <li>Hero-Optimierung (Value Proposition + CTA)</li>
              <li>Struktur & Nutzerführung (Above-the-Fold + 1–2 Sektionen)</li>
              <li>Mobile-Optimierung (Typo, Abstände, Klickpfade)</li>
              <li>Quick Wins für Speed & Vertrauen</li>
              <li>Kurze Übergabe: „Was geändert wurde & warum“</li>
            </ul>

            <a className="cta ctaSmall" href="#kontakt">
              Check starten
            </a>
          </div>

          <div className="card">
            <h3>Conversion-Landingpage-Sprint</h3>
            <p className="cardMeta">
              7 Tage · für EIN Angebot · <strong>1.600 € Fixpreis</strong>
            </p>

            <p className="muted" style={{ marginTop: 6 }}>
              Ergebnis: eine fokussierte Seite, die exakt auf EIN Angebot und EIN
              Ziel optimiert ist.
            </p>

            <ul className="list">
              <li>Struktur & Conversion-Logik für EIN Angebot</li>
              <li>Heldenbereich (Nutzen, Zielgruppe, CTA)</li>
              <li>klare Nutzerführung (Above-the-Fold)</li>
              <li>Mobile-Optimierung</li>
              <li>Technische Umsetzung (eine Seite)</li>
              <li>Kurze Übergabe: „Was & warum“</li>
            </ul>

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
          Nicht sicher, was sinnvoller ist? Im kostenlosen Check sage ich dir
          ehrlich, ob ein Fix an der bestehenden Seite reicht oder eine
          fokussierte Landingpage besser passt.
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
              <div className="muted">
                Du schickst URL + Ziel + 2–3 Sätze Kontext.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">2</div>
            <div>
              <div className="stepTitle">Ehrliche Empfehlung</div>
              <div className="muted">
                Du bekommst eine Mini-Analyse + Vorschlag, welches Paket sinnvoll
                ist.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">3</div>
            <div>
              <div className="stepTitle">Umsetzung</div>
              <div className="muted">
                Hero, CTA, Struktur, Mobile – fokussiert in 7 Tagen.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepNum">4</div>
            <div>
              <div className="stepTitle">Live + Übergabe</div>
              <div className="muted">
                Kurze Doku, damit du es verstehst & halten kannst.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAKT */}
      <section className="section" id="kontakt">
        <h2>Kostenloser Website-Check</h2>
        <p className="muted">
          Fülle kurz das Formular aus – du erhältst innerhalb von{" "}
          <strong>24 Stunden</strong> eine Rückmeldung.
        </p>

        <div className="nextCard">
          <h3>Was passiert nach dem Absenden?</h3>
          <ul className="list">
            <li>Ich prüfe deine Website (Klarheit, CTA, Mobile, Vertrauen).</li>
            <li>Du bekommst eine kurze Einschätzung + den nächsten Schritt.</li>
            <li>Wenn es passt: Sprint-Scope + Fixpreis + Startdatum.</li>
          </ul>
        </div>

        <div className="formDivider" />

        <div className="contactBox">
          <form ref={formRef} onSubmit={handleSubmit} className="form">
            <input type="hidden" name="_subject" value="Website-Check Anfrage" />

            {/* REQUIRED */}
            <label className="field">
              <span className="fieldLabel">Website-URL</span>
              <input
                name="website"
                type="url"
                placeholder="https://..."
                required
                className="input"
              />
            </label>

            {/* REQUIRED (via state + disabled submit) */}
            <label className="field">
              <span className="fieldLabel">Ziel</span>

              <div className="cSelect" ref={selectRef}>
                <input type="hidden" name="ziel" value={ziel} />

                <button
                  type="button"
                  className="cSelectBtn"
                  aria-haspopup="listbox"
                  aria-expanded={openZiel}
                  onClick={() => setOpenZiel((v) => !v)}
                >
                  <span className={ziel ? "" : "cSelectPlaceholder"}>
                    {ziel || "Bitte wählen…"}
                  </span>
                  <span className="cSelectChevron">▾</span>
                </button>

                {openZiel && (
                  <div className="cSelectMenu" role="listbox">
                    {ZIEL_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cSelectOption ${
                          ziel === opt ? "isActive" : ""
                        }`}
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

                {!ziel && (
                  <span className="fieldHint muted">
                    Bitte wähle ein Ziel aus.
                  </span>
                )}
              </div>
            </label>

            {/* OPTIONAL */}
            <label className="field">
              <span className="fieldLabel">Zielgruppe (optional)</span>
              <input
                name="zielgruppe"
                type="text"
                placeholder="z. B. Selbstständige im DACH-Raum…"
                className="input"
              />
            </label>

            {/* OPTIONAL */}
            <label className="field">
              <span className="fieldLabel">Kurzbeschreibung (optional)</span>
              <textarea
                name="beschreibung"
                rows={4}
                placeholder="Worum geht’s, was bietest du an?"
                className="input"
              />
            </label>

            {/* REQUIRED */}
            <label className="field">
              <span className="fieldLabel">Deine E-Mail (für Rückmeldung)</span>
              <input
                name="email"
                type="email"
                placeholder="name@firma.de"
                required
                className="input"
              />
            </label>

            <button
              type="submit"
              className="cta"
              disabled={!ziel || submitState === "sending"}
              aria-disabled={!ziel || submitState === "sending"}
              title={!ziel ? "Bitte Ziel auswählen" : undefined}
            >
              {submitState === "sending" ? "Wird gesendet…" : "Check anfordern"}
            </button>

            {submitState === "success" && (
              <div className="formMsg formMsgSuccess">
                ✅ Danke! Deine Anfrage ist raus. Ich melde mich innerhalb von
                24h zurück.
              </div>
            )}

            {submitState === "error" && (
              <div className="formMsg formMsgError">
                ❌ Senden hat nicht geklappt. Bitte versuch es nochmal oder
                schreib an{" "}
                <a className="contactLink" href={mailto}>
                  {EMAIL}
                </a>
                .
              </div>
            )}

            <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Mit dem Absenden stimmst du der Verarbeitung deiner Daten zur
              Bearbeitung deiner Anfrage zu.
            </p>

            <p className="muted" style={{ marginTop: 10 }}>
              Lieber per E-Mail?{" "}
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
