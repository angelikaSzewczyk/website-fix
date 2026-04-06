import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website wird nicht gefunden? Ursache & Lösung | WebsiteFix",
  description:
    "Deine Website wird nicht gefunden — von Google oder Besuchern? Wir analysieren die Ursache: DNS, Hosting, Indexierung oder technischer Fehler. Fix in 24–72h.",
  alternates: { canonical: "/website-wird-nicht-gefunden" },
};

export default function WebsiteWirdNichtGefundenPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              Website Problem lösen • 24–72h • systemunabhängig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Website wird nicht gefunden?
              <br />
              Wir finden den Grund.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              Ob Besucher eine Fehlermeldung sehen oder Google deine Seite
              ignoriert — beides hat eine konkrete technische Ursache. Wir
              analysieren das Problem und beheben es zuverlässig.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Website jetzt prüfen lassen
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Typische Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>DNS-Fehler</div>
              <div>•</div>
              <div>Hosting-Problem</div>
              <div>•</div>
              <div>Google-Indexierung</div>
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
              title: "Besucher sehen eine Fehlermeldung",
              text: "\"Diese Seite ist nicht erreichbar\" oder \"Server nicht gefunden\" — Besucher kommen gar nicht erst auf deine Seite.",
            },
            {
              title: "Google findet deine Seite nicht",
              text: "Deine Website ist online, aber in den Suchergebnissen taucht sie nicht auf — kein Traffic, keine Anfragen.",
            },
            {
              title: "Nur du siehst das Problem",
              text: "Manchmal funktioniert die Seite für dich, aber Besucher bekommen Fehler — ein klassisches DNS- oder Cache-Problem.",
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
              Warum wird eine Website nicht gefunden?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Die Ursachen sind technisch unterschiedlich — je nachdem ob
              Besucher die Seite nicht erreichen oder Google sie nicht anzeigt.
              Wir unterscheiden das und lösen das richtige Problem.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "DNS nicht korrekt eingerichtet",
              "Domain abgelaufen oder nicht verlängert",
              "Hosting-Paket pausiert oder gesperrt",
              "Google-Indexierung deaktiviert (WordPress-Einstellung)",
              "Sitemap fehlt oder nicht eingereicht",
              "Technische Fehler auf der Website (500, 404)",
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
              Wir prüfen systematisch warum deine Website nicht gefunden wird.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Statt Raten gehen wir die Ursachen strukturiert durch: DNS,
              Hosting, technische Fehler und Google-Indexierung — bis wir das
              Problem gefunden und behoben haben.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "Erreichbarkeit prüfen",
                text: "Wir testen ob deine Website technisch erreichbar ist — von verschiedenen Standorten und Geräten aus.",
              },
              {
                step: "02",
                title: "Ursache eingrenzen",
                text: "DNS, Domain, Hosting oder technischer Fehler — wir identifizieren wo genau das Problem liegt.",
              },
              {
                step: "03",
                title: "Problem beheben",
                text: "Wir setzen die Lösung um: ob DNS-Korrektur, Hosting-Kontakt, WordPress-Einstellung oder technischer Fix.",
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
              Kritisch für alle, deren Kunden sie über die Website finden sollen.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Unternehmenswebsites",
              "Dienstleister & Handwerk",
              "Online-Shops",
              "Freiberufler & Coaches",
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
                Wenn deine Website nicht gefunden wird, verlierst du aktiv potenzielle Kunden.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Lass die Ursache analysieren und schnell beheben — bevor dir
                weiterer Traffic und weitere Anfragen entgehen.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt Website-Problem lösen
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
