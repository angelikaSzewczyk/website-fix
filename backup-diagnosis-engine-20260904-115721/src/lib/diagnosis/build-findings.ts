import type { StoredScan } from "@/lib/scan-storage";
import type {
  DiagnosisFinding,
  DiagnosisViewModel,
  PageSummary,
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
    scan.altMissingCount > 0 ? Math.min(scan.altMissingCount, 3) : 0;

  const homeFindingsCount =
    (!scan.hasTitle ? 1 : 0) +
    (!scan.hasMeta ? 1 : 0) +
    (!scan.hasH1 ? 1 : 0) +
    (homeAltMissing > 0 ? 1 : 0) +
    (scan.noIndex ? 1 : 0);

  const pages: PageSummary[] = [
    {
      path: toPath(scan.url),
      fullUrl: scan.url,
      findingsCount: homeFindingsCount,
      reachable: true,
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

  return pages;
}

function uniqueUrls(
  pages: PageSummary[],
  predicate: (page: PageSummary) => boolean,
): string[] {
  return pages
    .filter((page) => !page.skipped && predicate(page))
    .map((page) => page.fullUrl);
}

export function buildDiagnosis(scan: StoredScan): DiagnosisViewModel {
  const pages = buildPages(scan);
  const checkedPages = pages.filter((page) => !page.skipped);

  const findings: DiagnosisFinding[] = [];

  const unreachableUrls = uniqueUrls(pages, (page) => !page.reachable);
  if (unreachableUrls.length > 0) {
    findings.push({
      key: "availability",
      priority: "high",
      title: "Seiten nicht erreichbar",
      evidence: `${unreachableUrls.length} ${
        unreachableUrls.length === 1 ? "Seite" : "Seiten"
      } betroffen`,
      meaning:
        "WebsiteFix konnte für diese URLs keine erfolgreiche Antwort feststellen. Prüfe zuerst HTTP-Status, Ziel-URL und Weiterleitungen.",
      affectedUrls: unreachableUrls,
    });
  }

  const noindexUrls = uniqueUrls(pages, (page) => page.noindex);
  if (noindexUrls.length > 0 || scan.robotsBlocked) {
    const evidence = [
      noindexUrls.length > 0
        ? `${noindexUrls.length} ${
            noindexUrls.length === 1 ? "Seite mit noindex" : "Seiten mit noindex"
          }`
        : "",
      scan.robotsBlocked ? "robots.txt blockiert Crawler umfassend" : "",
    ]
      .filter(Boolean)
      .join(" · ");

    findings.push({
      key: "indexing",
      priority: "high",
      title: "Indexierung eingeschränkt",
      evidence,
      meaning:
        "Prüfe, ob die Ausschlüsse beabsichtigt sind. Nur unbeabsichtigte noindex- oder robots-Einstellungen sollten entfernt werden.",
      affectedUrls: noindexUrls,
    });
  }

  const h1Urls = uniqueUrls(pages, (page) => page.missingH1);
  if (h1Urls.length > 0) {
    findings.push({
      key: "h1",
      priority: "check",
      title: "H1-Struktur prüfen",
      evidence: `${h1Urls.length} ${
        h1Urls.length === 1 ? "Seite ohne H1" : "Seiten ohne H1"
      }`,
      meaning:
        "Auf diesen Seiten wurde keine zentrale H1-Überschrift erkannt. Prüfe die Hauptüberschrift im Theme oder Page Builder.",
      affectedUrls: h1Urls,
    });
  }

  const titleUrls = uniqueUrls(pages, (page) => page.missingTitle);
  const metaUrls = uniqueUrls(pages, (page) => page.missingMeta);
  if (titleUrls.length > 0 || metaUrls.length > 0) {
    const evidence = [
      titleUrls.length > 0 ? `${titleUrls.length} ohne Seitentitel` : "",
      metaUrls.length > 0 ? `${metaUrls.length} ohne Meta-Description` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    findings.push({
      key: "metadata",
      priority: "check",
      title: "Seitendaten unvollständig",
      evidence,
      meaning:
        "Prüfe die betroffenen Seiten einzeln auf Title und Meta-Description. WebsiteFix bewertet hier nur, ob die Angaben technisch erkannt wurden.",
      affectedUrls: [...new Set([...titleUrls, ...metaUrls])],
    });
  }

  const altMissingCount =
    scan.altMissingCount ??
    checkedPages.reduce((sum, page) => sum + page.altMissing, 0);

  if (altMissingCount > 0) {
    findings.push({
      key: "alt",
      priority: "check",
      title: "Bilder ohne Alternativtext",
      evidence: `${altMissingCount} ${
        altMissingCount === 1 ? "Bild" : "Bilder"
      } ohne Alternativtext`,
      meaning:
        "Prüfe inhaltlich relevante Bilder und ergänze dort eine passende Textalternative. Dekorative Bilder benötigen nicht zwingend einen beschreibenden Alt-Text.",
      affectedUrls: uniqueUrls(pages, (page) => page.altMissing > 0),
    });
  }

  const formUrls = uniqueUrls(
    pages,
    (page) =>
      page.inputsWithoutLabel > 0 || page.buttonsWithoutText > 0,
  );

  const formElements = checkedPages.reduce(
    (sum, page) =>
      sum + page.inputsWithoutLabel + page.buttonsWithoutText,
    0,
  );

  if (formElements > 0) {
    findings.push({
      key: "forms",
      priority: "check",
      title: "Bedienelemente ohne eindeutige Beschriftung",
      evidence: `${formElements} ${
        formElements === 1 ? "Element" : "Elemente"
      } erkannt`,
      meaning:
        "Formularfelder und Buttons sollten für Nutzer und assistive Technologien eindeutig benannt sein.",
      affectedUrls: formUrls,
    });
  }

  if (scan.brokenLinksCount > 0) {
    findings.push({
      key: "broken-links",
      priority: "high",
      title: "Defekte Links erkannt",
      evidence: `${scan.brokenLinksCount} ${
        scan.brokenLinksCount === 1 ? "Link" : "Links"
      }`,
      meaning:
        "Prüfe die Ziel-URLs und ersetze oder entferne Links, die nicht mehr auf ein gültiges Ziel führen.",
      affectedUrls: [],
    });
  }

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
