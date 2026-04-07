import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Google Analytics funktioniert nicht? GA4 Problem kostenlos prüfen",
  description:
    "GA4 zeigt keine Daten oder Events funktionieren nicht? URL eingeben — KI prüft sofort ob Tracking-Code, Consent-Banner oder GTM das Problem verursachen. Kostenlos, ohne Anmeldung.",
};

const painPoints = [
  {
    title: "Daten fehlen",
    text: "Du investierst in Website, SEO oder Werbung, kannst aber nicht sauber messen, was wirklich passiert.",
  },
  {
    title: "GA4 ist falsch eingebunden",
    text: "Tracking-Code, Consent, Tag Manager oder Events sind oft unvollständig oder fehlerhaft eingerichtet.",
  },
  {
    title: "Entscheidungen ohne Daten",
    text: "Ohne verlässliches Tracking fehlen dir die Grundlagen für Optimierung, Kampagnen und Conversion-Verbesserung.",
  },
];

const causes = [
  "GA4 Property oder Datenstream falsch eingerichtet",
  "Tracking-Code fehlt oder ist doppelt eingebunden",
  "Consent-Banner blockiert Analytics dauerhaft",
  "Google Tag Manager ist falsch konfiguriert",
  "Events werden nicht ausgelöst oder falsch benannt",
  "Formular- oder CTA-Tracking fehlt komplett",
];

const steps = [
  {
    step: "1",
    title: "Setup prüfen",
    text: "Wir analysieren, ob GA4, Datenstream, Tags und Consent grundsätzlich korrekt eingebunden sind.",
  },
  {
    step: "2",
    title: "Fehler finden",
    text: "Wir prüfen, warum Seitenaufrufe, Events oder Conversions nicht sauber gemessen werden.",
  },
  {
    step: "3",
    title: "Tracking fixen",
    text: "Wir korrigieren die Einbindung und testen danach, ob Daten und Events zuverlässig ankommen.",
  },
];

const included = [
  "GA4 Grundsetup prüfen",
  "Tracking-Code / GTM prüfen",
  "Consent-Blocker erkennen",
  "Event-Tracking prüfen",
  "Formular- oder CTA-Tracking prüfen",
  "sauberer Funktionstest nach dem Fix",
];

export default function GoogleAnalyticsFunktioniertNichtPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              Tracking Fix • GA4 • 24–72h • systemunabhängig
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl lg:text-6xl">
              Google Analytics funktioniert nicht?
              <br />
              Wir fixen dein Tracking.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75 md:text-xl">
              Wenn Google Analytics oder GA4 keine sauberen Daten liefert,
              fehlt dir die Grundlage für Entscheidungen. Wir prüfen dein Setup,
              finden die Ursache und sorgen dafür, dass Tracking und Events
              wieder zuverlässig funktionieren.
            </p>

            <ul className="mt-8 space-y-3 text-lg text-white/90">
              <li>• Keine oder zu wenige Daten in GA4</li>
              <li>• Events / Conversions funktionieren nicht</li>
              <li>• Consent oder GTM blockiert das Tracking</li>
              <li>• Formular- oder CTA-Tracking fehlt</li>
            </ul>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#b9f5df] to-[#8ea2ff] px-6 py-3.5 text-base font-semibold text-[#081019] shadow-[0_10px_30px_rgba(142,162,255,0.18)] transition hover:opacity-95"
              >
                Jetzt kostenlos scannen →
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Typische Ursachen ansehen
              </a>
            </div>

            <p className="mt-5 text-sm text-white/60">
              Kein Abo · kurzer Machbarkeits-Check · sauberer Fix statt Rätselraten
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:px-12 lg:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {painPoints.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                {item.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-white/72">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="ursachen"
        className="border-y border-white/10 bg-white/[0.03]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-18">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              Typische Ursachen
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Warum funktioniert Google Analytics oder GA4 oft nicht richtig?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Tracking-Probleme entstehen oft durch eine fehlerhafte Einbindung,
              Consent-Logik oder fehlende Event-Konfiguration. Von außen sieht
              alles korrekt aus — intern kommen aber keine brauchbaren Daten an.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {causes.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-[#111522] p-5"
              >
                <p className="text-base font-medium leading-7 text-white/88">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-18">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              Unsere Lösung
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Wir prüfen das Setup, finden die Ursache und beheben das Tracking sauber.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Statt stundenlang Tags, Skripte und Events zu vergleichen, prüfen
              wir dein Tracking strukturiert und setzen die nötigen Fixes direkt
              um.
            </p>
          </div>

          <div className="grid gap-5">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-[#b9f5df]/20 to-[#8ea2ff]/20 text-sm font-semibold text-white/90">
                  {item.step}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-white/72">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-18">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                Was wir prüfen
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Typische Punkte, die wir beim Tracking-Fix mit anschauen.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/72">
                Der genaue Scope hängt vom System ab — aber diese Punkte sind in
                der Praxis besonders häufig relevant.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {included.map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/10 bg-[#111522] p-5"
                >
                  <p className="text-base font-medium text-white/88">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                Jetzt handeln
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Wenn dein Tracking nicht funktioniert, optimierst du im Blindflug.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                Lass dein Analytics-Setup prüfen und sauber fixen, bevor dir
                weiter wichtige Daten und Optimierungspotenziale entgehen.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#b9f5df] to-[#8ea2ff] px-6 py-3.5 text-base font-semibold text-[#081019] shadow-[0_10px_30px_rgba(142,162,255,0.18)] transition hover:opacity-95"
              >
                Jetzt kostenlos scannen →
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}