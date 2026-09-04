import type { StoredScan } from "@/lib/scan-storage";
import type {
  DiagnosisFinding,
  DiagnosisViewModel,
  PageSummary,
  RawScanEvidence,
} from "@/types/diagnosis";

const FEED_URL_PATTERN =
  /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|\.(xml|txt|json)(\?|#|$)/i;

function toPath(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

function toDomain(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function buildPages(scan: StoredScan): PageSummary[] {
  const homeAltMissing =
    scan.altMissingCount > 0 ? Math.min(scan.altMissingCount, 1) : 0;

  const homeFindingsCount =
    (!scan.hasTitle ? 1 : 0) +
    (!scan.hasMeta ? 1 : 0) +
    (!scan.hasH1 ? 1 : 0) +
    (homeAltMissing > 0 ? 1 : 0) +
    (scan.noIndex ? 1 : 0);

  return [
    {
      path: toPath(scan.url),
      fullUrl: scan.url,
      findingsCount: homeFindingsCount,
      reachable: true,
      status: 200,
      skipped: false,
      altMissing: homeAltMissing,
      noindex: scan.noIndex,
      missingTitle: !scan.hasTitle,
      missingMeta: !scan.hasMeta,
      missingH1: !scan.hasH1,
      inputsWithoutLabel: 0,
      buttonsWithoutText: 0,
    },
    ...scan.unterseiten
      .filter((page) => !FEED_URL_PATTERN.test(page.url))
      .map((page) => {
        const missingTitle = !page.title || page.title === "(kein Title)";
        const missingH1 = !page.h1 || page.h1 === "(kein H1)";
        const missingMeta = !page.metaDescription;

        const findingsCount =
          (page.altMissing > 0 ? 1 : 0) +
          (!page.erreichbar ? 1 : 0) +
          (page.noindex ? 1 : 0) +
          (missingTitle ? 1 : 0) +
          (missingH1 ? 1 : 0) +
          (missingMeta ? 1 : 0) +
          ((page.inputsWithoutLabel ?? 0) > 0 ? 1 : 0) +
          ((page.buttonsWithoutText ?? 0) > 0 ? 1 : 0);

        return {
          path: toPath(page.url),
          fullUrl: page.url,
          findingsCount,
          reachable: page.erreichbar,
          status:
            typeof (page as { status?: unknown }).status === "number"
              ? ((page as { status?: number }).status ?? null)
              : null,
          skipped: false,
          altMissing: page.altMissing,
          noindex: page.noindex,
          missingTitle,
          missingMeta,
          missingH1,
          inputsWithoutLabel: page.inputsWithoutLabel ?? 0,
          buttonsWithoutText: page.buttonsWithoutText ?? 0,
        };
      }),
    ...(scan.skippedUrls ?? []).map((url) => ({
      path: toPath(url),
      fullUrl: url,
      findingsCount: 0,
      reachable: true,
      status: null,
      skipped: true,
      altMissing: 0,
      noindex: false,
      missingTitle: false,
      missingMeta: false,
      missingH1: false,
      inputsWithoutLabel: 0,
      buttonsWithoutText: 0,
    })),
  ];
}

function uniqueUrls(
  pages: PageSummary[],
  predicate: (page: PageSummary) => boolean,
): string[] {
  return pages
    .filter((page) => !page.skipped && predicate(page))
    .map((page) => page.fullUrl);
}

function statusCause(status: number): string {
  if (status === 0) {
    return "Das Ziel hat innerhalb des Prüfzeitfensters keine verwertbare HTTP-Antwort geliefert. Möglich sind Timeout, DNS-/Netzwerkfehler oder eine blockierte Anfrage.";
  }
  if (status === 404 || status === 410) {
    return "Das Linkziel wurde wahrscheinlich entfernt, verschoben oder die gespeicherte URL ist nicht mehr aktuell.";
  }
  if (status === 401 || status === 403) {
    return "Das Ziel verweigert den Zugriff. Möglich sind Zugriffsschutz, Firewall-Regeln oder ein bewusst geschützter Bereich.";
  }
  if (status >= 500) {
    return "Das Ziel antwortet mit einem Serverfehler. Die Ursache liegt wahrscheinlich auf der Zielseite oder ihrer Server-/WordPress-Konfiguration.";
  }
  if (status >= 400) {
    return `Das Ziel liefert HTTP ${status}. Der Link führt damit nicht auf eine erfolgreich abrufbare Ressource.`;
  }
  return "Das Ziel hat beim Scan keine erfolgreiche Antwort geliefert.";
}

const PRIORITY_ORDER: Record<string, number> = {
  availability: 100,
  indexing: 95,
  "broken-links": 90,
  h1: 55,
  metadata: 50,
  forms: 40,
  alt: 25,
};

export function buildDiagnosis(
  scan: StoredScan,
  raw?: RawScanEvidence | null,
): DiagnosisViewModel {
  const pages = buildPages(scan);
  const checkedPages = pages.filter((page) => !page.skipped);
  const findings: DiagnosisFinding[] = [];

  const unreachablePages = checkedPages.filter((page) => !page.reachable);
  if (unreachablePages.length > 0) {
    findings.push({
      key: "availability",
      priority: "critical",
      title: "Seiten nicht erreichbar",
      summary: `${unreachablePages.length} ${
        unreachablePages.length === 1 ? "Seite liefert" : "Seiten liefern"
      } keine erfolgreiche Antwort.`,
      evidence: unreachablePages.slice(0, 10).map((page) => ({
        label: page.path,
        value:
          page.status && page.status > 0
            ? `HTTP ${page.status}`
            : "keine Antwort",
        url: page.fullUrl,
        status: page.status ?? 0,
      })),
      affectedUrls: unreachablePages.map((page) => page.fullUrl),
      possibleCauses: [
        "Die Seite wurde entfernt oder ihre URL geändert.",
        "Eine Weiterleitung, Firewall oder Serverregel verhindert den erfolgreichen Abruf.",
        "Bei Status 5xx kann ein Fehler in WordPress, PHP, Plugin, Theme oder Serverkonfiguration vorliegen.",
      ],
      nextSteps: [
        "Die betroffenen URLs direkt im Browser und anschließend den tatsächlichen HTTP-Status prüfen.",
        "Bei 404/410 interne Links auf die aktuelle Zielseite ändern oder entfernen.",
        "Bei 5xx Server-/PHP-Log und die letzten WordPress-Änderungen prüfen.",
      ],
    });
  }

  const noindexPages = checkedPages.filter((page) => page.noindex);
  if (noindexPages.length > 0 || scan.robotsBlocked) {
    const evidence = noindexPages.slice(0, 10).map((page) => ({
      label: page.path,
      value: "meta robots: noindex",
      url: page.fullUrl,
    }));

    if (scan.robotsBlocked) {
      evidence.unshift({
        label: "robots.txt",
        value: "Crawler-Sperre für / erkannt",
      });
    }

    findings.push({
      key: "indexing",
      priority: "critical",
      title: "Indexierung eingeschränkt",
      summary: scan.robotsBlocked
        ? "Die robots.txt enthält eine umfassende Crawl-Sperre."
        : `${noindexPages.length} ${
            noindexPages.length === 1 ? "Seite ist" : "Seiten sind"
          } mit noindex markiert.`,
      evidence,
      affectedUrls: noindexPages.map((page) => page.fullUrl),
      possibleCauses: [
        "Eine WordPress-Sichtbarkeitseinstellung oder ein SEO-Plugin setzt noindex.",
        "Die Seite ist absichtlich von Suchmaschinen ausgeschlossen.",
        "Eine robots.txt-Regel kann Crawler vom Abruf ausschließen.",
      ],
      nextSteps: [
        "Zuerst klären, ob der Ausschluss beabsichtigt ist.",
        "Bei unbeabsichtigtem noindex die Einstellung im SEO-Plugin, Theme oder WordPress prüfen.",
        "Nach der Änderung erneut scannen und anschließend die URL in der Google Search Console prüfen.",
      ],
    });
  }

  const rawBrokenLinks = raw?.audit?.brokenLinks ?? [];
  const brokenCount = rawBrokenLinks.length || scan.brokenLinksCount;

  if (brokenCount > 0) {
    const evidence =
      rawBrokenLinks.length > 0
        ? rawBrokenLinks.slice(0, 12).map((link) => {
            const sourceText =
              link.sourceUrls && link.sourceUrls.length > 0
                ? link.sourceUrls.map(toPath).slice(0, 3).join(", ")
                : undefined;

            return {
              label: toPath(link.url),
              value:
                link.status > 0 ? `HTTP ${link.status}` : "keine Antwort",
              detail: sourceText
                ? `Gefunden auf: ${sourceText}`
                : undefined,
              url: link.url,
              status: link.status,
            };
          })
        : [
            {
              label: "Interne Links",
              value: `${brokenCount} Linkziele ohne erfolgreiche Antwort`,
              detail:
                "Für dieses gespeicherte Ergebnis liegen noch keine Herkunftsseiten vor. Starte einen frischen V2-Scan.",
            },
          ];

    const firstStatus = rawBrokenLinks[0]?.status ?? 0;

    findings.push({
      key: "broken-links",
      priority: "high",
      title: "Defekte Linkziele erkannt",
      summary: `${brokenCount} ${
        brokenCount === 1 ? "internes Linkziel liefert" : "interne Linkziele liefern"
      } keine erfolgreiche Antwort.`,
      evidence,
      affectedUrls: [
        ...new Set(rawBrokenLinks.flatMap((link) => link.sourceUrls ?? [])),
      ],
      possibleCauses: [
        statusCause(firstStatus),
        "Ein interner Link kann noch auf einen alten Slug oder eine gelöschte WordPress-Seite zeigen.",
        "Weiterleitungs- oder Permalink-Änderungen können bestehende interne Links ungültig gemacht haben.",
      ],
      nextSteps: [
        "Die Herkunftsseite öffnen und den dort gesetzten Link prüfen.",
        "Wenn das Ziel verschoben wurde, den Link direkt auf die aktuelle URL ändern.",
        "Wenn das Ziel nicht mehr benötigt wird, den Link entfernen. Danach erneut scannen.",
      ],
    });
  }

  const h1Pages = checkedPages.filter((page) => page.missingH1);
  if (h1Pages.length > 0) {
    findings.push({
      key: "h1",
      priority: "medium",
      title: "H1-Struktur prüfen",
      summary: `${h1Pages.length} ${
        h1Pages.length === 1 ? "Seite hat" : "Seiten haben"
      } keine erkennbare H1.`,
      evidence: h1Pages.slice(0, 10).map((page) => ({
        label: page.path,
        value: "keine H1 erkannt",
        url: page.fullUrl,
      })),
      affectedUrls: h1Pages.map((page) => page.fullUrl),
      possibleCauses: [
        "Die sichtbare Hauptüberschrift wird im Theme oder Page Builder nicht als H1 ausgegeben.",
        "Die Seite besitzt nur kleinere Heading-Tags oder grafischen Text.",
      ],
      nextSteps: [
        "Im WordPress-Editor bzw. Page Builder die Hauptüberschrift der Seite prüfen.",
        "Eine inhaltlich passende Hauptüberschrift als H1 auszeichnen und danach erneut scannen.",
      ],
    });
  }

  const titlePages = checkedPages.filter((page) => page.missingTitle);
  const metaPages = checkedPages.filter((page) => page.missingMeta);

  if (titlePages.length > 0 || metaPages.length > 0) {
    const affected = [
      ...new Set([...titlePages, ...metaPages].map((page) => page.fullUrl)),
    ];

    const evidence = affected.slice(0, 10).map((url) => {
      const page = checkedPages.find((candidate) => candidate.fullUrl === url)!;
      const missing = [
        page.missingTitle ? "Title" : "",
        page.missingMeta ? "Meta-Description" : "",
      ]
        .filter(Boolean)
        .join(" + ");

      return {
        label: page.path,
        value: `${missing} fehlt`,
        url,
      };
    });

    findings.push({
      key: "metadata",
      priority: "medium",
      title: "Seitendaten unvollständig",
      summary: `${affected.length} ${
        affected.length === 1 ? "Seite hat" : "Seiten haben"
      } unvollständige Seitendaten.`,
      evidence,
      affectedUrls: affected,
      possibleCauses: [
        "Title oder Meta-Description wurden im SEO-Plugin bzw. Seitentemplate nicht gesetzt.",
        "Ein Theme-/Plugin-Template kann die erwarteten Tags nicht ausgeben.",
      ],
      nextSteps: [
        "Die betroffenen Seiten im SEO-Plugin oder WordPress-Editor öffnen.",
        "Fehlende Seitentitel bzw. Meta-Descriptions ergänzen und den Quelltext anschließend erneut prüfen.",
      ],
    });
  }

  const formPages = checkedPages.filter(
    (page) => page.inputsWithoutLabel > 0 || page.buttonsWithoutText > 0,
  );
  const formElements = formPages.reduce(
    (sum, page) =>
      sum + page.inputsWithoutLabel + page.buttonsWithoutText,
    0,
  );

  if (formElements > 0) {
    findings.push({
      key: "forms",
      priority: "medium",
      title: "Bedienelemente ohne eindeutige Beschriftung",
      summary: `${formElements} ${
        formElements === 1 ? "Element wurde" : "Elemente wurden"
      } ohne eindeutige Beschriftung erkannt.`,
      evidence: formPages.slice(0, 10).map((page) => ({
        label: page.path,
        value: [
          page.inputsWithoutLabel > 0
            ? `${page.inputsWithoutLabel} Feld(er) ohne Label`
            : "",
          page.buttonsWithoutText > 0
            ? `${page.buttonsWithoutText} Button(s) ohne Text`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
        url: page.fullUrl,
      })),
      affectedUrls: formPages.map((page) => page.fullUrl),
      possibleCauses: [
        "Formularfelder besitzen weder ein zugeordnetes label noch eine geeignete ARIA-Beschriftung.",
        "Icon-Buttons können ohne sichtbaren Text und ohne aria-label ausgegeben werden.",
      ],
      nextSteps: [
        "Die betroffenen Felder und Buttons im Formular-/Page-Builder prüfen.",
        "Echte Labels bzw. geeignete zugängliche Namen ergänzen und erneut scannen.",
      ],
    });
  }

  const altAudit = raw?.audit?.altTexte;
  const uniqueAltCount =
    altAudit?.eindeutigFehlend ??
    altAudit?.fehlend ??
    scan.altMissingCount ??
    0;
  const occurrenceCount = altAudit?.vorkommenFehlend;
  const altPages = checkedPages.filter((page) => page.altMissing > 0);
  const affectedAltPages =
    altAudit?.betroffeneSeiten ?? altPages.length;

  if (uniqueAltCount > 0) {
    const summary =
      occurrenceCount && occurrenceCount !== uniqueAltCount
        ? `${uniqueAltCount} eindeutige Bild-URLs ohne Alt-Text; ${occurrenceCount} Vorkommen auf ${affectedAltPages} Seiten.`
        : `${uniqueAltCount} ${
            uniqueAltCount === 1
              ? "eindeutige Bild-URL"
              : "eindeutige Bild-URLs"
          } ohne Alt-Text auf ${affectedAltPages} Seiten.`;

    const evidence =
      altAudit?.missingImages && altAudit.missingImages.length > 0
        ? altAudit.missingImages.slice(0, 10).map((image) => ({
            label: toPath(image),
            value: "Alt-Text fehlt",
            url: image,
          }))
        : altPages.slice(0, 10).map((page) => ({
            label: page.path,
            value: `${page.altMissing} Vorkommen`,
            url: page.fullUrl,
          }));

    findings.push({
      key: "alt",
      priority: "low",
      title: "Bilder ohne Alternativtext",
      summary,
      evidence,
      affectedUrls: altPages.map((page) => page.fullUrl),
      possibleCauses: [
        "Bilder wurden in der WordPress-Mediathek oder im Page Builder ohne Alternativtext eingefügt.",
        "Wiederkehrende Bilder wie Logos können auf vielen Seiten erscheinen und dadurch mehrere Vorkommen erzeugen.",
      ],
      nextSteps: [
        "Zuerst inhaltlich relevante Bilder prüfen; dekorative Bilder nicht automatisch mit künstlichen Beschreibungen versehen.",
        "Alt-Texte in Mediathek oder Page Builder ergänzen und wiederkehrende Bilder nur einmal sauber pflegen.",
      ],
    });
  }

  findings.sort(
    (a, b) =>
      (PRIORITY_ORDER[b.key] ?? 0) - (PRIORITY_ORDER[a.key] ?? 0),
  );

  const affectedPages = checkedPages.filter(
    (page) => page.findingsCount > 0,
  ).length;

  const affectedPlaces = checkedPages.reduce(
    (sum, page) => sum + Math.max(0, page.findingsCount),
    0,
  );

  return {
    domain: toDomain(scan.url),
    pagesChecked: checkedPages.length,
    affectedPages,
    affectedPlaces,
    discoveredUrls: scan.entdeckteUrls ?? checkedPages.length,
    skippedUrls: (scan.skippedUrls ?? []).length,
    findings,
    primaryFinding: findings[0] ?? null,
    pages,
  };
}
