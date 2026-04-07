import type { Metadata } from "next";
import Link from "next/link";
import InlineScan from "../components/inline-scan";

export const metadata: Metadata = {
  title: "Warum findet Google meine Homepage nicht? Jetzt kostenlos prüfen",
  description:
    "Website online aber Google zeigt sie nicht an? URL eingeben — KI findet sofort ob Indexierungssperre, fehlende Sitemap oder technische Fehler schuld sind. Kostenlos, ohne Anmeldung.",
  alternates: { canonical: "/warum-findet-google-meine-homepage-nicht" },
};

const CAUSES = [
  "Suchmaschinen-Sperre in WordPress aktiviert",
  "Website zu neu — Google noch nicht crawlt",
  "Sitemap fehlt oder nicht bei Google eingereicht",
  "Zu wenig Inhalt — Google hält Seite für wertlos",
  "Technische Fehler (500, 404) blockieren den Crawler",
  "Domain hat schlechten Ruf (z. B. Spam-History)",
];

const STEPS = [
  {
    num: "1",
    title: "URL eingeben",
    desc: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang, keine technischen Kenntnisse nötig.",
  },
  {
    num: "2",
    title: "KI prüft Indexierungsstatus",
    desc: "WebsiteFix analysiert ob Google deine Seite kennt, was sie blockiert und welche technischen Probleme vorhanden sind.",
  },
  {
    num: "3",
    title: "Klare Diagnose auf Deutsch",
    desc: "Du siehst genau warum Google dich nicht findet — priorisiert, verständlich, mit konkreten nächsten Schritten.",
  },
];

export default function WarumFindetGoogleMeineHomepageNichtPage() {
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
          <Link href="/scan" className="cta ctaSmall">
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="badge">KI-Diagnose · URL eingeben · kein Technik-Wissen nötig</div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 20px" }}>
            Warum findet Google deine<br />
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Homepage nicht?
            </span>
          </h1>
          <p className="heroText" style={{ maxWidth: 580 }}>
            Deine Website ist seit Wochen online — aber bei Google taucht sie nicht auf.
            URL eingeben, fertig. Die KI erklärt dir in unter 60 Sekunden genau warum Google dich nicht findet.
          </p>
          <InlineScan placeholder="https://deine-website.de" />
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
            Website seit Monaten online, aber kein Google-Eintrag → URL eingeben → KI erkennt aktivierte Suchmaschinen-Sperre → in 2 Minuten gelöst.
          </span>
        </div>

        {/* PAIN POINTS */}
        <section className="section">
          <h2>Ohne Google-Sichtbarkeit kein Traffic. Kein Traffic, keine Kunden.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { icon: "🔍", title: "Kein organischer Traffic", desc: "Wenn Google deine Homepage nicht findet, kommen keine Besucher aus der Suche — egal wie gut deine Seite aussieht." },
              { icon: "🏢", title: "Kein Eintrag bei Google", desc: "Du suchst nach deinem Firmennamen und siehst dich nicht? Google hat deine Seite noch nicht indexiert." },
              { icon: "⚡", title: "Oft ein einziger Fehler", desc: "In vielen Fällen ist eine einzige Einstellung das Problem. Die KI findet es in Sekunden — ohne Technik-Kenntnisse." },
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
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Häufige Ursachen</p>
          <h2>Warum zeigt Google deine Homepage nicht an?</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 24 }}>
            Meistens ist es eine von wenigen bekannten Ursachen — und WebsiteFix erkennt automatisch welche davon bei dir zutrifft.
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
            URL eingeben, fertig. Die KI prüft alles gleichzeitig und erklärt was Google blockiert — kein Fachjargon, kein Entwickler, kein Plugin.
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
          <h2 style={{ marginBottom: 12 }}>Nie wieder stundenlang suchen warum Google deine Homepage nicht anzeigt.</h2>
          <p className="muted" style={{ maxWidth: 520, marginBottom: 28 }}>
            URL eingeben — die KI scannt sofort und erklärt dir genau was Google blockiert.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/scan" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              Jetzt kostenlos scannen →
            </Link>
            <Link href="/blog/google-findet-meine-seite-nicht-5-gruende-fuer-fehlenede-indexierung" className="ghost" style={{ fontSize: 15 }}>
              Selbst prüfen — Anleitung lesen
            </Link>
          </div>
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
