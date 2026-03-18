import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontaktformular funktioniert nicht? Schnell fixen lassen | Website-Fix",
  description:
    "Dein Kontaktformular sendet keine Anfragen mehr? Wir finden die Ursache und beheben Formular-, E-Mail- oder SMTP-Probleme schnell und zuverlässig.",
};

export default function KontaktformularFunktioniertNichtPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70">
              Website Problem lösen • 24–72h • systemunabhängig
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Kontaktformular funktioniert nicht?
              <br />
              Wir beheben das schnell.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
              Wenn dein Kontaktformular keine Anfragen versendet, verlierst du
              potenzielle Kunden – oft ohne es direkt zu merken. Wir prüfen die
              Ursache und beheben Formular-, E-Mail- und Zustellungsprobleme
              zuverlässig.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/#kontakt"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Problem jetzt prüfen lassen
              </Link>

              <a
                href="#ursachen"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Typische Ursachen ansehen
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div>Anfragen kommen nicht an</div>
              <div>•</div>
              <div>SMTP / Hosting / Plugin-Fehler</div>
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
              title: "E-Mails kommen nicht an",
              text: "Das Formular scheint zu funktionieren, aber Anfragen landen nie im Postfach oder im Spam.",
            },
            {
              title: "Absenden endet mit Fehler",
              text: "Nutzer klicken auf Senden, aber das Formular lädt endlos oder gibt eine Fehlermeldung aus.",
            },
            {
              title: "Du verlierst Anfragen",
              text: "Wenn dein Formular still ausfällt, verlierst du Leads, ohne es direkt zu merken.",
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
              Warum funktioniert ein Kontaktformular plötzlich nicht mehr?
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Die Ursache liegt oft nicht im sichtbaren Formular selbst, sondern
              in der Zustellung, Konfiguration oder technischen Umgebung.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              "SMTP ist falsch eingerichtet oder fehlt",
              "Formular-Plugin nach Update fehlerhaft",
              "Spam-Schutz blockiert legitime Anfragen",
              "Hosting oder Mailserver lehnt Zustellung ab",
              "Pflichtfelder oder Validierung sind defekt",
              "Weiterleitungen an falsche Empfängeradresse",
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
              Wir prüfen die Ursache und beheben das Problem zuverlässig.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Statt langem Herumprobieren analysieren wir Formular, Zustellung
              und technische Umgebung gezielt – und setzen den Fix sauber um.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              {
                step: "01",
                title: "Formular testen",
                text: "Wir prüfen, ob das Formular technisch korrekt absendet und ob Fehler im Frontend oder Backend auftreten.",
              },
              {
                step: "02",
                title: "Zustellung prüfen",
                text: "Wir analysieren, warum E-Mails nicht ankommen – z. B. SMTP, Spam-Filter oder Mailserver-Konfiguration.",
              },
              {
                step: "03",
                title: "Fix umsetzen",
                text: "Wir beheben die Ursache und testen die Zustellung erneut, bis das Formular zuverlässig funktioniert.",
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
              Besonders kritisch für Websites, die regelmäßig Anfragen generieren sollen.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Dienstleister",
              "Agenturen",
              "Coachings & Beratungen",
              "lokale Unternehmen",
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
                Wenn dein Kontaktformular nicht funktioniert, verlierst du möglicherweise bereits Anfragen.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Lass das Problem prüfen und beheben, bevor dir weitere Anfragen
                entgehen.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/#kontakt"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-[#0b0c10] transition hover:opacity-90"
              >
                Jetzt Fix anfragen
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