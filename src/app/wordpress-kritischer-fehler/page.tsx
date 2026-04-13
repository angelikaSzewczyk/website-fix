import type { Metadata } from "next";
import Link from "next/link";
import InlineScan from "../components/inline-scan";

export const metadata: Metadata = {
  title: "WordPress kritischer Fehler beheben — KI findet Ursache sofort",
  description:
    "\"Es gab einen kritischen Fehler auf deiner Website\"? URL eingeben — KI erkennt sofort ob Plugin-Konflikt, Theme-Fehler oder Update-Problem schuld ist. Kostenlos, ohne Anmeldung.",
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
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/scan" style={{ fontSize: 13, fontWeight: 700, color: "#0b0c10", textDecoration: "none", padding: "7px 16px", borderRadius: 8, background: "#fff" }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 56px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
            color: "#8df3d3", border: "1px solid rgba(141,243,211,0.3)", borderRadius: 100,
            padding: "5px 14px", marginBottom: 28,
          }}>
            KI-Diagnose · URL eingeben · kein Entwickler nötig
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
            WordPress kritischer Fehler?<br />
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              KI findet die Ursache sofort.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 40px" }}>
            „Es gab einen kritischen Fehler auf deiner Website" — deine Inhalte sind fast immer noch da.
            URL eingeben, fertig. Die KI zeigt dir in unter 60 Sekunden genau was kaputt ist — in verständlichem Deutsch, kein Entwickler nötig.
          </p>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <InlineScan placeholder="https://deine-wordpress-website.de" />
          </div>
        </section>

        {/* EXAMPLE BAR */}
        <div style={{ maxWidth: 1100, margin: "0 auto 40px", padding: "0 24px" }}>
          <div style={{
            background: "rgba(141,243,211,0.06)", border: "1px solid rgba(141,243,211,0.2)",
            borderRadius: 12, padding: "14px 20px", display: "flex", gap: 12, alignItems: "baseline",
          }}>
            <span style={{ fontSize: 13, color: "#8df3d3", fontWeight: 700, whiteSpace: "nowrap" }}>Zum Beispiel:</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              WordPress Critical Error seit heute Nacht → URL eingeben → KI erkennt Plugin-Konflikt → du siehst genau was zu tun ist. Kein Entwickler nötig.
            </span>
          </div>
        </div>

        {/* PAIN POINTS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, margin: "0 0 28px", letterSpacing: "-0.02em" }}>
            Warum ein kritischer Fehler so gefährlich ist.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {[
              { title: "Website komplett down", desc: "Besucher sehen nur eine Fehlermeldung — kein Zugang, kein Backend, kein Inhalt sichtbar." },
              { title: "Anfragen gehen verloren", desc: "Solange deine WordPress-Website down ist, verlierst du aktiv Kunden — besonders kritisch bei laufenden Kampagnen." },
              { title: "Google bemerkt den Ausfall", desc: "Mehrere Tage Downtime können dein Ranking beeinflussen. Schnelle Diagnose schützt deine Sichtbarkeit." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "24px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CAUSES */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }} id="ursachen">
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Typische Ursachen</p>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Was verursacht einen kritischen Fehler in WordPress?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 560, marginBottom: 24, lineHeight: 1.7 }}>
            In den meisten Fällen ist ein Plugin oder Theme der Auslöser — oft nach einem automatischen Update.
            WebsiteFix erkennt das automatisch und erklärt dir ohne Fachjargon was passiert ist.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CAUSES.map((item) => (
              <div key={item} style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#8df3d3", fontSize: 16, flexShrink: 0, fontWeight: 700 }}>✓</span>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>So funktioniert WebsiteFix</p>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Scan, Diagnose, Fix — fertig.</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 560, marginBottom: 28, lineHeight: 1.7 }}>
            URL eingeben, fertig. Die KI prüft alles gleichzeitig und erklärt was kaputt ist — kein Fachjargon, kein Entwickler, kein Plugin.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(141,243,211,0.1)", border: "1px solid rgba(141,243,211,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#8df3d3", flexShrink: 0 }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ background: "rgba(141,243,211,0.04)", border: "1px solid rgba(141,243,211,0.15)", borderRadius: 16, padding: "48px 40px" }}>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Nie wieder stundenlang googeln wenn WordPress einen kritischen Fehler wirft.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.7, maxWidth: 520 }}>
              URL eingeben — die KI scannt sofort und erklärt dir genau was den Fehler verursacht hat.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/scan" style={{ padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, background: "#fff", color: "#0b0c10", textDecoration: "none" }}>
                Jetzt kostenlos scannen →
              </Link>
              <Link href="/blog/wordpress-critical-error" style={{ padding: "13px 20px", borderRadius: 10, fontSize: 14, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                Selbst lösen — Anleitung lesen
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
