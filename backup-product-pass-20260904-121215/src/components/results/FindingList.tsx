import type { DiagnosisFinding } from "@/types/diagnosis";
import FindingDetails from "./FindingDetails";

const labels = {
  critical: "Kritisch",
  high: "Priorität",
  medium: "Prüfen",
  low: "Niedrig",
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
          Bei den geprüften Signalen wurde kein akuter technischer Blocker
          erkannt. Das ist keine Garantie für vollständige Fehlerfreiheit.
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
          <details
            className="wf-results-finding-details"
            data-priority={finding.priority}
            id={`finding-${finding.key}`}
            key={finding.key}
          >
            <summary className="wf-results-finding">
              <div className="wf-results-finding-marker" aria-hidden="true" />

              <div className="wf-results-finding-body">
                <div className="wf-results-finding-title-row">
                  <h3>{finding.title}</h3>
                  <span>{finding.summary}</span>
                </div>
              </div>

              <span className="wf-results-finding-tag">
                {labels[finding.priority]}
              </span>

              <span className="wf-results-finding-chevron" aria-hidden="true">
                +
              </span>
            </summary>

            <FindingDetails finding={finding} />
          </details>
        ))}
      </div>
    </section>
  );
}
