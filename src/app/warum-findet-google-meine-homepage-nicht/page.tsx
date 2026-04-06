import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warum findet Google meine Homepage nicht? Ursachen & Lösung | WebsiteFix",
  description:
    "Deine Website ist online, aber Google zeigt sie nicht an? Wir analysieren die Ursache — von der Indexierungssperre bis zur fehlenden Sitemap — und beheben das Problem.",
  alternates: { canonical: "/warum-findet-google-meine-homepage-nicht" },
};

export default function WarumFindetGoogleMeineHomepageNichtPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              SEO & Indexierung • Analyse & Fix • kein Technik-Wissen nötig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Warum findet Google deine
              <br />
              Homepage nicht?
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              Deine Website ist seit Wochen online — aber bei Google taucht sie
              nicht auf. Das ist meist kein großes Problem, aber ein konkreter
              technischer Fehler. Wir finden ihn und beheben ihn.
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
                Häufige Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>Indexierungssperre</div>
              <div>•</div>
              <div>fehlende Sitemap</div>
              <div>•</div>
              <div>technische Fehler</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Kein organischer Traffic",
              text: "Wenn Google deine Homepage nicht findet, bekommst du keine Besucher aus der Suche — egal wie gut deine Seite aussieht.",
            },
            {
              title: "Kein Eintrag bei Google",
              text: "Du suchst nach deinem Firmennamen und siehst dich nicht? Das bedeutet Google hat deine Seite noch nicht indexiert.",
            },
            {
              title: "Oft ein einfacher Fix",
              text: "In vielen Fällen ist eine einzige Einstellung das Problem — z. B. eine aktivierte Suchmaschinen-Sperre in WordPress.",
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
              Häufige Ursachen
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Warum zeigt Google deine Homepage nicht an?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Meistens ist es eine von wenigen bekannten Ursachen — und keine
              davon erfordert Programmierkenntnisse zum Beheben.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Suchmaschinen-Sperre in WordPress aktiviert",
              "Website zu neu — Google noch nicht crawlt",
              "Sitemap fehlt oder nicht bei Google eingereicht",
              "Zu wenig Inhalt — Google hält Seite für wertlos",
              "Technische Fehler (500, 404) blocken den Crawler",
              "Domain hat schlechten Ruf (z. B. Spam-History)",
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
              Wir analysieren warum Google dich nicht findet — und machen es sichtbar.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Statt stundenlanger Recherche in Google-Dokumentationen prüfen
              wir deine Website systematisch und beheben die Ursache direkt.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "Indexierungsstatus prüfen",
                text: "Wir prüfen ob Google deine Seite kennt, crawlt und indexiert — mit konkreten Daten aus der Search Console.",
              },
              {
                step: "02",
                title: "Ursache identifizieren",
                text: "Wir finden heraus ob es eine Einstellung, ein technisches Problem oder fehlender Inhalt ist, der Google blockiert.",
              },
              {
                step: "03",
                title: "Sichtbarkeit herstellen",
                text: "Wir beheben das konkrete Problem und reichen deine Seite bei Google zur Indexierung ein — damit du gefunden wirst.",
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
              Besonders wichtig für alle, die neue Kunden über Google gewinnen wollen.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Neue Websites & Launches",
              "Lokale Unternehmen",
              "Dienstleister & Berater",
              "Shops & Onlineangebote",
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
                Solange Google deine Homepage nicht findet, entgeht dir wertvoller Traffic täglich.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Lass analysieren warum du nicht sichtbar bist — und das Problem
                schnell beheben, damit du in den Suchergebnissen erscheinst.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt Sichtbarkeit prüfen lassen
              </Link>

              <Link
                href="/blog/google-findet-meine-seite-nicht-5-gruende-fuer-fehlenede-indexierung"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Selbst prüfen — Anleitung lesen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
