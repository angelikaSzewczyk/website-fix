import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website langsam? Ladezeit kostenlos prüfen — KI findet die Ursache",
  description:
    "Deine Website lädt zu langsam? URL eingeben — KI analysiert sofort ob zu große Bilder, Plugins, Hosting oder Code-Ballast schuld sind. Kostenlos, ohne Anmeldung.",
};

export default function WebsiteLangsamPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              Website Problem lösen • 24–72h • systemunabhängig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Website ist langsam?
              <br />
              Wir machen sie wieder schnell.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              Eine langsame Website kostet dich Besucher, Vertrauen und oft auch
              Anfragen. Wir analysieren die Ursachen und optimieren deine
              Website gezielt, damit sie schneller lädt und besser performt.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt kostenlos scannen →
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Typische Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>Lange Ladezeiten</div>
              <div>•</div>
              <div>schlechte Performance</div>
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
              title: "Besucher springen ab",
              text: "Wenn deine Seite zu langsam lädt, verlassen Nutzer sie oft schon, bevor überhaupt Inhalte sichtbar sind.",
            },
            {
              title: "Google bewertet Performance",
              text: "Ladezeit ist ein wichtiger Faktor für Nutzererlebnis und Sichtbarkeit in der Suche.",
            },
            {
              title: "Weniger Anfragen & Umsatz",
              text: "Eine langsame Website kann direkte Auswirkungen auf Conversion, Vertrauen und Verkäufe haben.",
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
              Warum ist eine Website langsam?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Das Problem liegt selten nur an einer Sache. Meist sind es mehrere
              technische Faktoren, die sich negativ auf die Ladezeit auswirken.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "zu große Bilder und Medien",
              "zu viele Plugins oder Skripte",
              "fehlendes oder falsches Caching",
              "langsames Hosting",
              "unnötiger CSS- und JavaScript-Ballast",
              "schlechte mobile Performance",
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
              Wir analysieren die Performance und setzen gezielte Optimierungen um.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Wir schauen nicht nur auf einzelne Werte, sondern auf die
              tatsächlichen Ursachen für langsame Ladezeiten – und beheben sie
              strukturiert.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "Performance prüfen",
                text: "Wir analysieren Ladezeit, PageSpeed, Core Web Vitals und technische Engpässe auf Desktop und mobil.",
              },
              {
                step: "02",
                title: "Bottlenecks finden",
                text: "Wir identifizieren Bilder, Skripte, Plugins, Hosting oder Caching-Probleme, die deine Website ausbremsen.",
              },
              {
                step: "03",
                title: "Optimierung umsetzen",
                text: "Wir verbessern Bilder, Assets, Struktur und technische Performance, damit deine Website spürbar schneller wird.",
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
              Besonders wichtig für Websites, die Leads, Anfragen oder Verkäufe generieren sollen.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Unternehmenswebsites",
              "Dienstleister",
              "Online-Shops",
              "Agenturen & Freelancer",
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
                Wenn deine Website langsam ist, verlierst du möglicherweise bereits Besucher und Kunden.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Lass die Performance prüfen und gezielt optimieren, bevor dir
                weiter Sichtbarkeit und Anfragen entgehen.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt kostenlos scannen →
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
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