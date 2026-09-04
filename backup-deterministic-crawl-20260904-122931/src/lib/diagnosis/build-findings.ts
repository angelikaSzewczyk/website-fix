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
      highestPriority: null,
      findingLabels: [],
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
          highestPriority: null,
          findingLabels: [],
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
      highestPriority: null,
      findingLabels: [],
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
  "page-verification": 92,
  indexing: 95,
  "broken-links": 90,
  "link-verification": 70,
  h1: 55,
  metadata: 50,
  forms: 40,
  alt: 25,
};


const PRIORITY_WEIGHT: Record<DiagnosisFinding["priority"], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const FINDING_LABELS: Record<DiagnosisFinding["key"], string> = {
  availability: "Erreichbarkeit",
  "page-verification": "Erreichbarkeit prüfen",
  indexing: "Indexierung",
  "broken-links": "Defekter Link",
  "link-verification": "Link prüfen",
  h1: "H1",
  metadata: "Seitendaten",
  forms: "Bedienelemente",
  alt: "Alt-Text",
};

function pageMatchesFinding(
  page: PageSummary,
  finding: DiagnosisFinding,
): boolean {
  if (finding.affectedUrls.includes(page.fullUrl)) return true;

  // URL-Normalisierung für slash-/www-Unterschiede.
  const normalize = (value: string) => {
    try {
      const u = new URL(value);
      return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
    } catch {
      return value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();
    }
  };

  const pageKey = normalize(page.fullUrl);
  return finding.affectedUrls.some((url) => normalize(url) === pageKey);
}

export function buildDiagnosis(
  scan: StoredScan,
  raw?: RawScanEvidence | null,
): DiagnosisViewModel {
  const pages = buildPages(scan);
  const checkedPages = pages.filter((page) => !page.skipped);
  const findings: DiagnosisFinding[] = [];

  const pageVerifications = raw?.audit?.pageVerifications ?? [];

  const confirmedUnavailableRaw = pageVerifications.filter(
    (item) =>
      item.classification === "not_found" ||
      item.classification === "client_error",
  );

  // Fallback für alte Scan-Daten ohne neue Klassifikation.
  const legacyUnavailablePages =
    pageVerifications.length === 0
      ? checkedPages.filter((page) => !page.reachable)
      : [];

  if (
    confirmedUnavailableRaw.length > 0 ||
    legacyUnavailablePages.length > 0
  ) {
    const evidence =
      confirmedUnavailableRaw.length > 0
        ? confirmedUnavailableRaw.slice(0, 12).map((item) => ({
            label: toPath(item.url),
            value: item.status > 0 ? `HTTP ${item.status}` : "HTTP-Fehler",
            detail: item.redirected && item.finalUrl
              ? `Weitergeleitet zu: ${toPath(item.finalUrl)}`
              : item.foundVia
                ? `Gefunden über: ${item.foundVia === "sitemap" ? "Sitemap" : toPath(item.foundVia)}`
                : undefined,
            url: item.url,
            status: item.status,
          }))
        : legacyUnavailablePages.slice(0, 12).map((page) => ({
            label: page.path,
            value:
              page.status && page.status > 0
                ? `HTTP ${page.status}`
                : "nicht erfolgreich erreichbar",
            url: page.fullUrl,
            status: page.status ?? 0,
          }));

    const affectedUrls =
      confirmedUnavailableRaw.length > 0
        ? confirmedUnavailableRaw.map((item) => item.url)
        : legacyUnavailablePages.map((page) => page.fullUrl);

    const statuses = confirmedUnavailableRaw.map((item) => item.status);
    const has404 = statuses.some((status) => status === 404);
    const has410 = statuses.some((status) => status === 410);

    findings.push({
      key: "availability",
      priority: "critical",
      title: "Seiten mit bestätigtem HTTP-Fehler",
      summary: `${affectedUrls.length} ${
        affectedUrls.length === 1
          ? "Seite liefert"
          : "Seiten liefern"
      } einen bestätigten Client-Fehler.`,
      evidence,
      affectedUrls,
      possibleCauses: [
        has404 || has410
          ? "Mindestens eine URL liefert 404/410. Die Seite wurde wahrscheinlich entfernt, verschoben oder der gespeicherte Slug ist veraltet."
          : "Die betroffene URL liefert einen eindeutigen 4xx-Fehler und ist für normale Besucher nicht erfolgreich abrufbar.",
        "Eine alte Navigation, Sitemap oder interne Verlinkung kann noch auf die frühere URL zeigen.",
        "Permalink-, Weiterleitungs- oder Routing-Änderungen können vorhandene URLs ungültig gemacht haben.",
      ],
      nextSteps: [
        "Die URL direkt im Browser öffnen und den HTTP-Status gegenprüfen.",
        "Bei 404/410 interne Links, Sitemap und Navigation auf die aktuelle Ziel-URL ändern oder die Seite wiederherstellen.",
        "Danach WebsiteFix erneut ausführen und prüfen, ob der bestätigte HTTP-Fehler verschwunden ist.",
      ],
    });
  }

  const uncertainPageVerifications = pageVerifications.filter(
    (item) =>
      item.classification === "timeout" ||
      item.classification === "network_error" ||
      item.classification === "protected" ||
      item.classification === "rate_limited" ||
      item.classification === "server_error",
  );

  if (uncertainPageVerifications.length > 0) {
    const countBy = (classification: string) =>
      uncertainPageVerifications.filter(
        (item) => item.classification === classification,
      ).length;

    const timeoutCount =
      countBy("timeout") + countBy("network_error");
    const protectedCount = countBy("protected");
    const serverErrorCount = countBy("server_error");
    const rateLimitedCount = countBy("rate_limited");

    findings.push({
      key: "page-verification",
      priority: serverErrorCount > 0 ? "high" : "medium",
      title: "Seiten nicht eindeutig verifizierbar",
      summary: `${uncertainPageVerifications.length} ${
        uncertainPageVerifications.length === 1
          ? "Seite wurde"
          : "Seiten wurden"
      } bewusst nicht als „nicht erreichbar“ gewertet.`,
      evidence: uncertainPageVerifications.slice(0, 12).map((item) => {
        const value =
          item.classification === "timeout"
            ? "Timeout nach Wiederholungsversuch"
            : item.classification === "network_error"
              ? "Netzwerkfehler nach Wiederholungsversuch"
              : item.classification === "protected"
                ? `Zugriff geschützt${item.status ? ` · HTTP ${item.status}` : ""}`
                : item.classification === "rate_limited"
                  ? `Rate Limit${item.status ? ` · HTTP ${item.status}` : ""}`
                  : item.classification === "server_error"
                    ? `Serverfehler${item.status ? ` · HTTP ${item.status}` : ""}`
                    : "nicht eindeutig verifizierbar";

        return {
          label: toPath(item.url),
          value,
          detail: item.foundVia
            ? `Gefunden über: ${item.foundVia === "sitemap" ? "Sitemap" : toPath(item.foundVia)}`
            : undefined,
          url: item.url,
          status: item.status,
        };
      }),
      affectedUrls: uncertainPageVerifications.map((item) => item.url),
      possibleCauses: [
        timeoutCount > 0
          ? "Timeout oder Netzwerkfehler kann durch einen langsamen Server, Bot-Schutz, DNS-Probleme oder eine vorübergehende Störung entstehen."
          : "Der automatische Abruf konnte den Zustand der Seite nicht eindeutig bestätigen.",
        protectedCount > 0
          ? "401/403 bedeutet, dass die URL existieren kann, aber automatischen oder nicht authentifizierten Zugriff verweigert."
          : "Zugriffsschutz ist bei diesen Seiten nicht der einzige mögliche Grund.",
        serverErrorCount > 0
          ? "5xx bedeutet: Der Server hat geantwortet, aber beim Verarbeiten der Anfrage ist ein Fehler entstanden."
          : rateLimitedCount > 0
            ? "429 bedeutet, dass der Zielserver die Scan-Anfragen vorübergehend begrenzt."
            : "Ein späterer Kontrollscan kann den Zustand bestätigen.",
      ],
      nextSteps: [
        "Diese Seiten zuerst manuell im Browser prüfen; sie nicht automatisch löschen oder umleiten.",
        serverErrorCount > 0
          ? "Bei 5xx Server-/PHP-/WordPress-Logs und die letzten Plugin-/Theme-/Deployment-Änderungen prüfen."
          : "Bei Timeout oder Netzwerkfehler später erneut scannen und Hosting-/Firewall-Logs prüfen.",
        protectedCount > 0
          ? "Bei 401/403 klären, ob der Zugriffsschutz beabsichtigt ist."
          : "Nach der Ursachenprüfung erneut verifizieren.",
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
              value: link.status > 0 ? `HTTP ${link.status}` : "kein Status",
              detail: [
                sourceText ? `Gefunden auf: ${sourceText}` : "",
                link.redirected && link.finalUrl
                  ? `Weitergeleitet zu: ${toPath(link.finalUrl)}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || undefined,
              url: link.url,
              status: link.status,
            };
          })
        : [
            {
              label: "Interne Links",
              value: `${brokenCount} bestätigte Linkfehler`,
              detail:
                "Für dieses gespeicherte Ergebnis liegen noch keine V2-Verifikationsdetails vor.",
            },
          ];

    const statuses = [...new Set(rawBrokenLinks.map((link) => link.status))];
    const hasGone = statuses.some((status) => status === 404 || status === 410);

    findings.push({
      key: "broken-links",
      priority: "high",
      title: "Defekte Linkziele bestätigt",
      summary: `${brokenCount} ${
        brokenCount === 1 ? "internes Linkziel wurde" : "interne Linkziele wurden"
      } mit einem eindeutigen HTTP-Fehler bestätigt.`,
      evidence,
      affectedUrls: [
        ...new Set(rawBrokenLinks.flatMap((link) => link.sourceUrls ?? [])),
      ],
      possibleCauses: [
        hasGone
          ? "Mindestens ein Ziel liefert 404/410 und wurde wahrscheinlich entfernt, verschoben oder unter einem neuen Slug veröffentlicht."
          : "Die betroffenen Ziele liefern einen eindeutigen 4xx-Fehler.",
        "Ein interner Link kann noch auf einen alten WordPress-Slug oder eine gelöschte Seite zeigen.",
        "Permalink- oder Navigationsänderungen können vorhandene interne Links veraltet haben.",
      ],
      nextSteps: [
        "Die angegebene Herkunftsseite öffnen und den dort gesetzten Link prüfen.",
        "Wenn das Ziel verschoben wurde, direkt auf die aktuelle URL verlinken; unnötige Links entfernen.",
        "Danach erneut scannen und prüfen, ob der bestätigte HTTP-Fehler verschwunden ist.",
      ],
    });
  }

  const verificationLinks = raw?.audit?.linkVerifications ?? [];
  if (verificationLinks.length > 0) {
    const countBy = (classification: string) =>
      verificationLinks.filter(
        (link) => link.classification === classification,
      ).length;

    const timeoutCount =
      countBy("timeout") + countBy("network_error");
    const protectedCount = countBy("protected");
    const serverErrorCount = countBy("server_error");
    const rateLimitedCount = countBy("rate_limited");

    const parts = [
      timeoutCount > 0 ? `${timeoutCount} ohne verlässliche Antwort` : "",
      protectedCount > 0 ? `${protectedCount} zugriffsgeschützt` : "",
      serverErrorCount > 0 ? `${serverErrorCount} mit Serverfehler` : "",
      rateLimitedCount > 0 ? `${rateLimitedCount} rate-limited` : "",
    ].filter(Boolean);

    findings.push({
      key: "link-verification",
      priority: serverErrorCount > 0 ? "high" : "medium",
      title: "Linkziele nicht eindeutig verifizierbar",
      summary: `${verificationLinks.length} ${
        verificationLinks.length === 1 ? "Linkziel wurde" : "Linkziele wurden"
      } bewusst nicht als defekt gezählt${parts.length ? ` · ${parts.join(" · ")}` : ""}.`,
      evidence: verificationLinks.slice(0, 12).map((link) => {
        const sourceText =
          link.sourceUrls && link.sourceUrls.length > 0
            ? link.sourceUrls.map(toPath).slice(0, 3).join(", ")
            : undefined;

        const value =
          link.classification === "timeout"
            ? "Timeout"
            : link.classification === "network_error"
              ? "Netzwerkfehler"
              : link.classification === "protected"
                ? `Zugriff geschützt${link.status ? ` · HTTP ${link.status}` : ""}`
                : link.classification === "rate_limited"
                  ? `Rate Limit${link.status ? ` · HTTP ${link.status}` : ""}`
                  : link.classification === "server_error"
                    ? `Serverfehler${link.status ? ` · HTTP ${link.status}` : ""}`
                    : link.status
                      ? `HTTP ${link.status}`
                      : "nicht verifizierbar";

        return {
          label: toPath(link.url),
          value,
          detail: sourceText ? `Gefunden auf: ${sourceText}` : undefined,
          url: link.url,
          status: link.status,
        };
      }),
      affectedUrls: [
        ...new Set(verificationLinks.flatMap((link) => link.sourceUrls ?? [])),
      ],
      possibleCauses: [
        "Timeout oder Netzwerkfehler beweisen nicht, dass das Linkziel kaputt ist; der Server kann Scanner blockieren oder vorübergehend langsam reagieren.",
        "HTTP 401/403 bedeutet, dass das Ziel existieren kann, aber den automatischen Zugriff verweigert.",
        "HTTP 5xx weist auf einen Serverfehler am Ziel hin und ist etwas anderes als ein gelöschter 404-Link.",
      ],
      nextSteps: [
        "Diese Ziele nicht automatisch löschen: zuerst manuell im Browser prüfen.",
        "Bei 401/403 klären, ob der Zugriffsschutz beabsichtigt ist.",
        "Bei 5xx Server-/WordPress-Fehler untersuchen; bei Timeout später erneut verifizieren.",
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

  // Seitenstatus wird aus der tatsächlich höchsten Finding-Priorität abgeleitet.
  // Ein reiner Alt-Text-Hinweis färbt eine Seite damit nicht mehr orange wie
  // ein technisches Problem.
  const enrichedPages = pages.map((page) => {
    if (page.skipped) return page;

    const pageFindings = findings.filter((finding) =>
      pageMatchesFinding(page, finding),
    );

    const highest =
      pageFindings
        .map((finding) => finding.priority)
        .sort(
          (a, b) => PRIORITY_WEIGHT[b] - PRIORITY_WEIGHT[a],
        )[0] ?? null;

    return {
      ...page,
      findingsCount: pageFindings.length,
      highestPriority: highest,
      findingLabels: pageFindings.map(
        (finding) => FINDING_LABELS[finding.key],
      ),
    };
  });

  const checkedEnrichedPages = enrichedPages.filter((page) => !page.skipped);
  const affectedPages = checkedEnrichedPages.filter(
    (page) => page.findingsCount > 0,
  ).length;

  const affectedPlaces = checkedEnrichedPages.reduce(
    (sum, page) => sum + page.findingsCount,
    0,
  );

  const criticalCount = findings.filter(
    (finding) => finding.priority === "critical",
  ).length;
  const highCount = findings.filter(
    (finding) => finding.priority === "high",
  ).length;
  const mediumCount = findings.filter(
    (finding) => finding.priority === "medium",
  ).length;
  const lowCount = findings.filter(
    (finding) => finding.priority === "low",
  ).length;
  const infoCount = findings.filter(
    (finding) => finding.priority === "info",
  ).length;

  const overallState: DiagnosisViewModel["overallState"] =
    criticalCount > 0 || highCount > 0
      ? "problem"
      : mediumCount > 0
        ? "warning"
        : lowCount > 0 || infoCount > 0
          ? "optimization"
          : "clear";

  return {
    domain: toDomain(scan.url),
    pagesChecked: checkedEnrichedPages.length,
    affectedPages,
    affectedPlaces,
    discoveredUrls: scan.entdeckteUrls ?? checkedEnrichedPages.length,
    skippedUrls: (scan.skippedUrls ?? []).length,
    findings,
    primaryFinding: findings[0] ?? null,
    pages: enrichedPages,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    overallState,
  };
}
