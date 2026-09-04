import type { PageSummary } from "@/types/diagnosis";

export default function AffectedPages({
  pages,
  pagesChecked,
  affectedPages,
}: {
  pages: PageSummary[];
  pagesChecked: number;
  affectedPages: number;
}) {
  return (
    <section className="wf-results-section" id="betroffene-seiten">
      <div className="wf-results-section-head">
        <div>
          <span className="wf-results-eyebrow">Betroffene Seiten</span>
          <h2>
            {affectedPages > 0
              ? `${affectedPages} ${
                  affectedPages === 1 ? "Seite mit Hinweis" : "Seiten mit Hinweisen"
                }`
              : "Keine betroffenen Seiten"}
          </h2>
          <p>
            {pagesChecked}{" "}
            {pagesChecked === 1 ? "Seite wurde geprüft." : "Seiten wurden geprüft."}
          </p>
        </div>
      </div>

      <div className="wf-results-pages">
        <div className="wf-results-pages-head">
          <span>Seite</span>
          <span>Status</span>
          <span>Hinweise</span>
        </div>

        {pages.map((page) => (
          <div
            className="wf-results-page-row"
            data-status={
              page.skipped
                ? "skipped"
                : !page.reachable
                  ? "error"
                  : page.findingsCount > 0
                    ? "check"
                    : "ok"
            }
            key={page.fullUrl}
          >
            <code title={page.fullUrl}>{page.path}</code>

            <span className="wf-results-page-status">
              {page.skipped
                ? "Übersprungen"
                : !page.reachable
                  ? "Nicht erreichbar"
                  : page.findingsCount > 0
                    ? "Prüfen"
                    : "Unauffällig"}
            </span>

            <span className="wf-results-page-count">
              {page.skipped || page.findingsCount === 0
                ? "—"
                : page.findingsCount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
