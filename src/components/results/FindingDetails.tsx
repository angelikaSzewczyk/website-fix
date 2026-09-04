import type { DiagnosisFinding } from "@/types/diagnosis";

function priorityLabel(priority: DiagnosisFinding["priority"]) {
  if (priority === "critical") return "Kritisch";
  if (priority === "high") return "Hohe Priorität";
  if (priority === "medium") return "Prüfen";
  if (priority === "low") return "Niedrigere Priorität";
  return "Hinweis";
}

export default function FindingDetails({
  finding,
  compact = false,
  paid = false,
}: {
  finding: DiagnosisFinding;
  compact?: boolean;
  paid?: boolean;
}) {
  const evidenceLimit = compact ? 4 : paid ? 12 : 4;
  const causeLimit = compact ? 1 : paid ? 3 : 1;
  const stepLimit = compact ? 1 : paid ? 3 : 1;

  return (
    <div className="wf-diagnosis-details">
      <div className="wf-diagnosis-detail-grid">
        <section>
          <span className="wf-results-eyebrow">Evidence</span>
          <div className="wf-diagnosis-evidence-list">
            {finding.evidence.length > 0 ? (
              finding.evidence.slice(0, evidenceLimit).map((item, index) => (
                <div
                  className="wf-diagnosis-evidence-item"
                  key={`${item.label}-${item.value}-${index}`}
                >
                  <div>
                    <code>{item.label}</code>
                    {item.detail && <small>{item.detail}</small>}
                  </div>
                  <span>{item.value}</span>
                </div>
              ))
            ) : (
              <p>Für diesen Befund liegen keine einzelnen Objekte vor.</p>
            )}
          </div>

          {!paid && !compact && finding.evidence.length > evidenceLimit && (
            <small className="wf-results-paid-hint">
              + {finding.evidence.length - evidenceLimit} weitere Evidence-Einträge
              in der vertieften Diagnose
            </small>
          )}
        </section>

        <section>
          <span className="wf-results-eyebrow">Mögliche Ursache</span>
          {finding.possibleCauses.slice(0, causeLimit).map((cause) => (
            <p key={cause}>{cause}</p>
          ))}
          {!paid && !compact && finding.possibleCauses.length > 1 && (
            <small className="wf-results-paid-hint">
              Weitere Ursachen werden in der vertieften Diagnose eingegrenzt.
            </small>
          )}
        </section>

        <section>
          <span className="wf-results-eyebrow">Nächster Schritt</span>
          <ol>
            {finding.nextSteps.slice(0, stepLimit).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {!paid && !compact && finding.nextSteps.length > 1 && (
            <small className="wf-results-paid-hint">
              Vollständiger Prüf- und Reparaturpfad nach Freischaltung.
            </small>
          )}
        </section>
      </div>

      <div className="wf-diagnosis-priority">
        {priorityLabel(finding.priority)}
      </div>
    </div>
  );
}
