import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WordPress kritischer Fehler? KI findet die Ursache automatisch | WebsiteFix",
  description:
    "\"Es gab einen kritischen Fehler auf deiner Website\" — WebsiteFix analysiert deine WordPress-Website automatisch per KI und zeigt dir genau was kaputt ist. Kein Entwickler nötig.",
  alternates: { canonical: "/wordpress-kritischer-fehler" },
};

const CAUSES = [
  "Plugin-Konflikt nach Update",
  "WordPress-Core-Update fehlgeschlagen",
  "Theme inkompatibel mit neuer WordPress-Version",
  "PHP-Speicherlimit überschritten",
  "Beschädigte Plugin- oder Theme-Dateien",
  "Datenbankfehler oder fehlende Tabellen",
];

const STEPS = [
  {
    num: "1",
    title: "URL eingeben",
    desc: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang, keine technischen Kenntnisse nötig.",
  },
  {
    num: "2",
    title: "KI scannt alles",
    desc: "WebsiteFix prüft Fehler-Logs, Plugins, Theme und WordPress-Konfiguration — in unter 60 Sekunden.",
  },
  {
    num: "3",
    title: "Klare Diagnose auf Deutsch",
    desc: "Du siehst genau was den kritischen Fehler verursacht hat — priorisiert, verständlich, ohne Fachjargon.",
  },
];

export default function WordpressKritischerFehlerPage() {
  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/#waitlist" className="cta ctaSmall">
            Frühen Zugang sichern
          </Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="badge">KI-Diagnose · URL eingeben · kein Entwickler nötig</div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 20px" }}>
            WordPress kritischer Fehler?<br />
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              KI findet die Ursache sofort.
            </span>
          </h1>
          <p className="heroText" style={{ maxWidth: 580 }}>
            „Es gab einen kritischen Fehler auf deiner Website" — deine Inhalte sind fast immer noch da.
            WebsiteFix scannt deine WordPress-Website automatisch und zeigt dir in unter 60 Sekunden was kaputt ist — in verständlichem Deutsch.
          </p>
          <div className="heroActions">
            <Link href="/#waitlist" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              Frühen Zugang sichern
            </Link>
            <a href="#ursachen" className="ghost" style={{ fontSize: 15 }}>
              Typische Ursachen ansehen
            </a>
          </div>
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            Kostenlos in der Beta · Keine Kreditkarte · Beta startet April 2026
          </p>
        </section>

        {/* EXAMPLE BAR */}
        <div style={{
          background: "rgba(141,243,211,0.06)",
          border: "1px solid rgba(141,243,211,0.2)",
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex",
          gap: 12,
          alignItems: "baseline",
          marginBottom: 32,
        }}>
          <span style={{ fontSize: 13, color: "#8df3d3", fontWeight: 650, whiteSpace: "nowrap" }}>Zum Beispiel:</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            WordPress Critical Error seit heute Nacht → URL eingeben → KI erkennt Plugin-Konflikt → du siehst genau was zu tun ist. Kein Entwickler nötig.
          </span>
        </div>

        {/* PAIN POINTS */}
        <section className="section">
          <h2>Warum ein kritischer Fehler so gefährlich ist.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { icon: "🔴", title: "Website komplett down", desc: "Besucher sehen nur eine Fehlermeldung — kein Zugang, kein Backend, kein Inhalt sichtbar." },
              { icon: "📭", title: "Anfragen gehen verloren", desc: "Solange deine WordPress-Website down ist, verlierst du aktiv Kunden — besonders kritisch bei laufenden Kampagnen." },
              { icon: "📉", title: "Google bemerkt den Ausfall", desc: "Mehrere Tage Downtime können dein Ranking beeinflussen. Schnelle Diagnose schützt deine Sichtbarkeit." },
            ].map((item) => (
              <div key={item.title} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 26 }}>{item.icon}</div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{item.title}</h3>
                <p className="cardSub" style={{ margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CAUSES */}
        <section className="section" id="ursachen">
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Typische Ursachen</p>
          <h2>Was verursacht einen kritischen Fehler in WordPress?</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 24 }}>
            In den meisten Fällen ist ein Plugin oder Theme der Auslöser — oft nach einem automatischen Update.
            WebsiteFix erkennt das automatisch und erklärt dir ohne Fachjargon was passiert ist.
          </p>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {CAUSES.map((item) => (
              <div key={item} className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#8df3d3", fontSize: 18, flexShrink: 0 }}>✓</span>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.88)" }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section">
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>So funktioniert WebsiteFix</p>
          <h2>Scan, Diagnose, Fix — fertig.</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 28 }}>
            URL eingeben, fertig. Die KI prüft alles gleichzeitig und erklärt was kaputt ist — kein Fachjargon, kein Entwickler, kein Plugin.
          </p>
          <div className="steps">
            {STEPS.map((step) => (
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

        {/* CTA SECTION */}
        <section className="section" style={{
          background: "rgba(141,243,211,0.04)",
          border: "1px solid rgba(141,243,211,0.12)",
          borderRadius: 16,
          padding: "48px 32px",
          marginTop: 0,
        }}>
          <h2 style={{ marginBottom: 12 }}>Nie wieder stundenlang googeln wenn WordPress einen kritischen Fehler wirft.</h2>
          <p className="muted" style={{ maxWidth: 520, marginBottom: 28 }}>
            Trag dich jetzt ein — der Frühzugang ist kostenlos, und Wartelisten-Mitglieder bekommen dauerhaften Rabatt.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/#waitlist" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              Frühen Zugang sichern
            </Link>
            <Link href="/blog/wordpress-critical-error" className="ghost" style={{ fontSize: 15 }}>
              Selbst lösen — Anleitung lesen
            </Link>
          </div>
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>Kostenlos in der Beta · Keine Kreditkarte · Beta startet April 2026</p>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 20px", textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Startseite</Link>
          {" · "}
          <Link href="/blog" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Blog</Link>
        </p>
      </footer>
    </>
  );
}
