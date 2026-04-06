import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WordPress kritischer Fehler? Ursache finden & beheben | WebsiteFix",
  description:
    "\"Es gab einen kritischen Fehler auf deiner Website\" — wir analysieren die Ursache und beheben WordPress-Fehler schnell und zuverlässig. Kein Entwickler nötig.",
  alternates: { canonical: "/wordpress-kritischer-fehler" },
};

export default function WordpressKritischerFehlerPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              WordPress Fehler beheben • 24–72h • kein Entwickler nötig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              WordPress kritischer Fehler?
              <br />
              Wir beheben ihn schnell.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              „Es gab einen kritischen Fehler auf deiner Website" — dieser Satz
              macht Panik. Aber deine Inhalte sind fast immer noch vollständig
              vorhanden. Wir finden die Ursache und reparieren deine Website
              zuverlässig.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Website jetzt analysieren lassen
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Typische Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>Plugin- oder Theme-Konflikt</div>
              <div>•</div>
              <div>WordPress-Update fehlgeschlagen</div>
              <div>•</div>
              <div>Fix in 24–72h</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Website komplett down",
              text: "Besucher sehen nur eine Fehlermeldung oder weiße Seite — kein Zugang, kein Backend, kein Inhalt sichtbar.",
            },
            {
              title: "Anfragen gehen verloren",
              text: "Solange deine WordPress-Website down ist, verlierst du aktiv Kunden — besonders kritisch bei laufenden Kampagnen.",
            },
            {
              title: "Google bemerkt den Ausfall",
              text: "Mehrere Tage Downtime können das Ranking beeinflussen. Schnelles Handeln schützt deine Sichtbarkeit.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-4 text-base leading-7 text-white/70">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="ursachen"
        className="border-y border-white/10 bg-white/[0.03]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              Typische Ursachen
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Was verursacht einen kritischen Fehler in WordPress?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              In den meisten Fällen ist ein Plugin oder Theme der Auslöser —
              oft nach einem automatischen Update. Diese Ursachen sind häufig
              lösbar, ohne dass du Programmieren können musst.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Plugin-Konflikt nach Update",
              "WordPress-Core-Update fehlgeschlagen",
              "Theme inkompatibel mit neuer WordPress-Version",
              "PHP-Speicherlimit überschritten",
              "Beschädigte Plugin- oder Theme-Dateien",
              "Datenbankfehler oder fehlende Tabellen",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-[#111317] p-5"
              >
                <p className="text-base font-medium text-white/88">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              Unsere Lösung
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Wir analysieren den Fehler und bringen deine WordPress-Website zurück.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Kein stundenlanger Support-Chat, kein Rätselraten. Wir lesen die
              Fehler-Logs, identifizieren die Ursache und beheben das Problem
              strukturiert — inklusive Test danach.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "Fehler-Logs auslesen",
                text: "Wir lesen die Server-Logs und WordPress-Debug-Ausgaben, um die genaue Fehlerursache zu identifizieren.",
              },
              {
                step: "02",
                title: "Ursache isolieren",
                text: "Wir finden das fehlerhafte Plugin, Theme oder die kaputte Konfiguration — ohne Raten, direkt am Problem.",
              },
              {
                step: "03",
                title: "Fix umsetzen & testen",
                text: "Wir beheben den Fehler und prüfen anschließend ob WordPress stabil läuft — Frontend und Backend.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6"
              >
                <div className="text-sm font-semibold text-white/40">
                  {item.step}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              Für wen das relevant ist
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Besonders kritisch für Websites, die täglich Besucher und Anfragen generieren.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              "WordPress-Websites aller Art",
              "Dienstleister & Freelancer",
              "Online-Shops auf WooCommerce",
              "Agenturen mit Kundenseiten",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-[#111317] p-5"
              >
                <p className="text-base font-medium text-white/88">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                Jetzt handeln
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                Ein WordPress-Fehler kostet dich jeden Moment Besucher und Anfragen.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Lass die Ursache analysieren und den Fehler beheben — schnell,
                strukturiert und ohne stundenlange Suche im Internet.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt Fehler beheben lassen
              </Link>

              <Link
                href="/blog/wordpress-critical-error"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Selbst lösen — Anleitung lesen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
