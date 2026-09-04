import type { DiagnosisFinding } from "@/types/diagnosis";

const labels = {
  high: "Priorität",
  check: "Prüfen",
  info: "Hinweis",
} as const;

export default function FindingList({
  findings,
}: {
  findings: DiagnosisFinding[];
}) {
  if (findings.length === 0) {
    return (
      <section className="wf-results-section">
        <div className="wf-results-section-head">
          <div>
            <span className="wf-results-eyebrow">Befunde</span>
            <h2>Aktuell keine akuten Befunde</h2>
          </div>
        </div>
        <div className="wf-results-empty">
          Bei den geprüften Signalen wurde kein akuter technischer Blocker erkannt.
          Das ist keine Garantie für vollständige Fehlerfreiheit.
        </div>
      </section>
    );
  }

  return (
    <section className="wf-results-section">
      <div className="wf-results-section-head">
        <div>
          <span className="wf-results-eyebrow">Befunde</span>
          <h2>Was WebsiteFix gefunden hat</h2>
        </div>
        <span className="wf-results-section-count">{findings.length}</span>
      </div>

      <div className="wf-results-findings">
        {findings.map((finding) => (
          <article
            className="wf-results-finding"
            data-priority={finding.priority}
            key={finding.key}
          >
            <div className="wf-results-finding-marker" aria-hidden="true" />

            <div className="wf-results-finding-body">
              <div className="wf-results-finding-title-row">
                <h3>{finding.title}</h3>
                <span>{finding.evidence}</span>
              </div>
              <p>{finding.meaning}</p>
            </div>

            <span className="wf-results-finding-tag">
              {labels[finding.priority]}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
