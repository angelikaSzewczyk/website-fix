const EMAIL = "kontakt@deine-mail.de"; // TODO: ersetzen

export default function Page() {
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    "Kostenloser Website-Check"
  )}`;

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

        <a className="navCta" href={mailto}>
          Check anfragen
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <p className="badge">7-Tage Sprint · Fixpreis · faceless</p>

        <h1>
          Deine Website sieht gut aus – <br />
          aber bringt keine Anfragen?
        </h1>

        <p className="heroText">
          Ich optimiere Websites so, dass Besucher in Sekunden verstehen,
          <strong> was du anbietest</strong> – und
          <strong> den nächsten Schritt</strong> gehen.
        </p>

        <a className="cta" href={mailto}>
          Kostenlosen Website-Check anfragen
        </a>
      </section>

      {/* ANGEBOT */}
      <section className="section" id="angebot">
        <h2>Das Angebot</h2>
        <p className="muted">
          Kein kompletter Relaunch. Wir machen deine Website{" "}
          <strong>klar</strong>, <strong>anfragefähig</strong> und{" "}
          <strong>handlungsorientiert</strong>.
        </p>

        <div className="cards">
          <div className="card">
            <h3>Website-Anfragen-Fix</h3>
            <p className="cardMeta">7-Tage Sprint · ab 1.200 € Fixpreis</p>

            <ul className="list">
              <li>Analyse deiner Website (URL + Ziel)</li>
              <li>Hero-Optimierung (Value Proposition + CTA)</li>
              <li>Struktur & Nutzerführung (Above-the-Fold + 1–2 Sektionen)</li>
              <li>Mobile-Optimierung (Typo, Abstände, Klickpfade)</li>
              <li>Quick Wins für Speed & Vertrauen</li>
              <li>Kurze Übergabe: „Was geändert wurde & warum“</li>
            </ul>

            <a className="cta ctaSmall" href={mailto}>
              Check anfragen
            </a>
          </div>

          <div className="card">
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
        </div>
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
              <div className="stepTitle">Fixpreis-Angebot</div>
              <div className="muted">
                Du bekommst Sprint-Scope + Preis + Startdatum.
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
          Schick mir deine URL und dein Ziel – ich antworte mit einer Mini-Analyse
          und dem nächsten Schritt.
        </p>

        <div className="contactBox">
          <div className="contactRow">
            <span className="contactLabel">E-Mail</span>
            <a className="contactLink" href={mailto}>
              {EMAIL}
            </a>
          </div>

          <div className="contactHint muted">
            Betreff: „Kostenloser Website-Check“ · Bitte: URL + Ziel + Branche
          </div>

          <a className="cta" href={mailto} style={{ marginTop: 16 }}>
            Jetzt Check anfragen
          </a>
        </div>

        <footer className="footer muted">
          © {new Date().getFullYear()} · Website-Anfragen-Fix
        </footer>
      </section>
    </main>
  );
}
