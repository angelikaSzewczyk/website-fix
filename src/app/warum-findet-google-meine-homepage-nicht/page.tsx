import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warum findet Google meine Homepage nicht? KI analysiert es | WebsiteFix",
  description:
    "Deine Website ist online, aber Google zeigt sie nicht an? WebsiteFix analysiert automatisch warum — Indexierungssperre, fehlende Sitemap, technische Fehler. Diagnose in 60 Sekunden.",
  alternates: { canonical: "/warum-findet-google-meine-homepage-nicht" },
};

export default function WarumFindetGoogleMeineHomepageNichtPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              KI-Diagnose • URL eingeben • kein Technik-Wissen nötig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Warum findet Google deine
              <br />
              Homepage nicht?
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              Deine Website ist seit Wochen online — aber bei Google taucht sie
              nicht auf. WebsiteFix scannt deine Seite automatisch und erklärt
              dir in unter 60 Sekunden genau warum Google dich nicht findet —
              und was du dagegen tun kannst.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Frühen Zugang sichern
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Häufige Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>Kostenlos in der Beta</div>
              <div>•</div>
              <div>Keine Kreditkarte</div>
              <div>•</div>
              <div>Beta startet April 2026</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Kein organischer Traffic",
              text: "Wenn Google deine Homepage nicht findet, kommen keine Besucher aus der Suche — egal wie gut deine Seite aussieht.",
            },
            {
              title: "Kein Eintrag bei Google",
              text: "Du suchst nach deinem Firmennamen und siehst dich nicht? Google hat deine Seite noch nicht indexiert.",
            },
            {
              title: "Oft ein einziger Fehler",
              text: "In vielen Fällen ist eine einzige Einstellung das Problem. Die KI findet es in Sekunden.",
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
              Meistens ist es eine von wenigen bekannten Ursachen — und
              WebsiteFix erkennt automatisch welche davon bei dir zutrifft.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Suchmaschinen-Sperre in WordPress aktiviert",
              "Website zu neu — Google noch nicht crawlt",
              "Sitemap fehlt oder nicht bei Google eingereicht",
              "Zu wenig Inhalt — Google hält Seite für wertlos",
              "Technische Fehler (500, 404) blockieren den Crawler",
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
              So funktioniert WebsiteFix
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              URL eingeben — KI erklärt automatisch warum Google dich nicht findet.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Kein Durchklicken durch Google-Dokumentationen, kein Fachjargon,
              kein Entwickler. Du gibst deine URL ein und bekommst eine klare
              Diagnose — was das Problem ist und was als nächstes zu tun ist.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "URL eingeben",
                text: "Einfach deine Website-Adresse eingeben. Kein Plugin, kein Zugang, keine technischen Kenntnisse nötig.",
              },
              {
                step: "02",
                title: "KI prüft Indexierungsstatus",
                text: "WebsiteFix analysiert ob Google deine Seite kennt, was sie blockiert und welche technischen Probleme vorhanden sind.",
              },
              {
                step: "03",
                title: "Klare Diagnose auf Deutsch",
                text: "Du siehst genau warum Google dich nicht findet — priorisiert, verständlich, mit konkreten nächsten Schritten.",
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
              Für alle, die über Google gefunden werden wollen — ohne SEO-Kenntnisse.
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
                Beta startet April 2026
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                Nie wieder stundenlang suchen warum Google deine Homepage nicht anzeigt.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Trag dich jetzt ein — der Frühzugang ist kostenlos, und
                Wartelisten-Mitglieder bekommen dauerhaften Rabatt.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Frühen Zugang sichern
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
