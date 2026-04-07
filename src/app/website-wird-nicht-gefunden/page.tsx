import type { Metadata } from "next";
import Link from "next/link";
import InlineScan from "../components/inline-scan";

export const metadata: Metadata = {
  title: "Website wird nicht gefunden? Ursache sofort prüfen — kostenlos",
  description:
    "Website nicht erreichbar oder nicht bei Google? URL eingeben — KI erkennt sofort ob DNS, Hosting, Indexierungssperre oder technische Fehler das Problem sind. Kostenlos, ohne Anmeldung.",
  alternates: { canonical: "/website-wird-nicht-gefunden" },
};

const CAUSES = [
  "DNS nicht korrekt eingerichtet",
  "Domain abgelaufen oder nicht verlängert",
  "Hosting-Paket pausiert oder gesperrt",
  "Google-Indexierung in WordPress deaktiviert",
  "Sitemap fehlt oder nicht bei Google eingereicht",
  "Technische Fehler (500, 404) blockieren den Crawler",
];

const STEPS = [
  {
    num: "1",
    title: "URL eingeben",
    desc: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang, keine technischen Kenntnisse nötig.",
  },
  {
    num: "2",
    title: "KI scannt alles gleichzeitig",
    desc: "Erreichbarkeit, DNS, Hosting-Status, Google-Indexierung, technische Fehler — in unter 60 Sekunden.",
  },
  {
    num: "3",
    title: "Klare Diagnose auf Deutsch",
    desc: "Du siehst genau warum deine Website nicht gefunden wird — priorisiert und verständlich erklärt.",
  },
];

export default function WebsiteWirdNichtGefundenPage() {
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
            Website wird nicht gefunden?<br />
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              KI findet den Grund sofort.
            </span>
          </h1>
          <p className="heroText" style={{ maxWidth: 580 }}>
            Ob Besucher eine Fehlermeldung sehen oder Google deine Seite ignoriert — beides hat eine konkrete Ursache.
            URL eingeben, fertig. Die KI erklärt dir in unter 60 Sekunden warum deine Website nicht gefunden wird.
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
            Besucher sehen „Seite nicht erreichbar" → URL eingeben → KI erkennt abgelaufene Domain → du weißt sofort was zu tun ist.
          </span>
        </div>

        {/* PAIN POINTS */}
        <section className="section">
          <h2>Zwei verschiedene Probleme — eine Diagnose.</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { icon: "🚫", title: "Besucher sehen eine Fehlermeldung", desc: "Diese Seite ist nicht erreichbar — Besucher kommen gar nicht erst auf deine Website und springen sofort ab." },
              { icon: "🔍", title: "Google findet deine Seite nicht", desc: "Deine Website ist online, aber in den Suchergebnissen taucht sie nicht auf. Kein Traffic, keine Anfragen." },
              { icon: "⚡", title: "Oft ein einziger technischer Fehler", desc: "Eine falsche Einstellung, ein DNS-Problem oder eine abgelaufene Domain — die KI findet es in Sekunden." },
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
          <h2>Warum wird eine Website nicht gefunden?</h2>
          <p className="muted" style={{ maxWidth: 560, marginBottom: 24 }}>
            Die Ursachen sind unterschiedlich — je nachdem ob Besucher die Seite nicht erreichen oder Google sie nicht anzeigt.
            WebsiteFix erkennt beides automatisch.
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
          <h2 style={{ marginBottom: 12 }}>Nie wieder stundenlang suchen wenn deine Website nicht gefunden wird.</h2>
          <p className="muted" style={{ maxWidth: 520, marginBottom: 28 }}>
            URL eingeben — die KI scannt sofort und erklärt dir genau was das Problem ist.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/scan" className="cta" style={{ fontSize: 16, padding: "15px 32px" }}>
              Jetzt kostenlos scannen →
            </Link>
            <Link href="/" className="ghost" style={{ fontSize: 15 }}>
              Zur Startseite
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
