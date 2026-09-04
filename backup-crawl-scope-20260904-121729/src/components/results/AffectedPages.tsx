import type {
  DiagnosisViewModel,
  PageSummary,
} from "@/types/diagnosis";

function pageState(page: PageSummary) {
  if (page.skipped) return "skipped";
  if (page.highestPriority === "critical" || page.highestPriority === "high") {
    return "error";
  }
  if (page.highestPriority === "medium") return "check";
  if (page.highestPriority === "low" || page.highestPriority === "info") {
    return "hint";
  }
  return "ok";
}

function pageStatus(page: PageSummary) {
  if (page.skipped) return "Übersprungen";
  if (page.highestPriority === "critical" || page.highestPriority === "high") {
    return "Handlungsbedarf";
  }
  if (page.highestPriority === "medium") return "Prüfen";
  if (page.highestPriority === "low" || page.highestPriority === "info") {
    return "Hinweis";
  }
  return "Unauffällig";
}

function sectionTitle(
  affectedPages: number,
  overallState: DiagnosisViewModel["overallState"],
) {
  if (affectedPages === 0) return "Keine betroffenen Seiten";

  if (overallState === "optimization") {
    return `${affectedPages} ${
      affectedPages === 1
        ? "Seite mit Optimierungshinweis"
        : "Seiten mit Optimierungshinweisen"
    }`;
  }

  if (overallState === "warning") {
    return `${affectedPages} ${
      affectedPages === 1
        ? "Seite mit Prüfhinweis"
        : "Seiten mit Prüfhinweisen"
    }`;
  }

  return `${affectedPages} ${
    affectedPages === 1 ? "betroffene Seite" : "betroffene Seiten"
  }`;
}

export default function AffectedPages({
  pages,
  pagesChecked,
  affectedPages,
  overallState,
  discoveredUrls,
}: {
  pages: PageSummary[];
  pagesChecked: number;
  affectedPages: number;
  overallState: DiagnosisViewModel["overallState"];
  discoveredUrls: number;
}) {
  const discoveredMore = discoveredUrls > pagesChecked;

  return (
    <section className="wf-results-section" id="betroffene-seiten">
      <div className="wf-results-section-head">
        <div>
          <span className="wf-results-eyebrow">Seitenübersicht</span>
          <h2>{sectionTitle(affectedPages, overallState)}</h2>
          <p>
            {discoveredMore
              ? `${pagesChecked} von ${discoveredUrls} gefundenen Seiten geprüft.`
              : `${pagesChecked} ${
                  pagesChecked === 1 ? "Seite wurde" : "Seiten wurden"
                } geprüft.`}
          </p>
        </div>
      </div>

      <div className="wf-results-pages">
        <div className="wf-results-pages-head">
          <span>Seite</span>
          <span>Status</span>
          <span>Befund</span>
        </div>

        {pages.map((page) => (
          <div
            className="wf-results-page-row"
            data-status={pageState(page)}
            key={page.fullUrl}
          >
            <code title={page.fullUrl}>{page.path}</code>

            <span className="wf-results-page-status">
              {pageStatus(page)}
            </span>

            <span
              className="wf-results-page-findings"
              title={page.findingLabels.join(", ")}
            >
              {page.skipped || page.findingLabels.length === 0
                ? "—"
                : page.findingLabels.slice(0, 2).join(" · ")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
