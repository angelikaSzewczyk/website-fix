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
}: {
  finding: DiagnosisFinding;
  compact?: boolean;
}) {
  return (
    <div className="wf-diagnosis-details">
      <div className="wf-diagnosis-detail-grid">
        <section>
          <span className="wf-results-eyebrow">Evidence</span>
          <div className="wf-diagnosis-evidence-list">
            {finding.evidence.length > 0 ? (
              finding.evidence.slice(0, compact ? 4 : 12).map((item, index) => (
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
        </section>

        <section>
          <span className="wf-results-eyebrow">Mögliche Ursache</span>
          <p>{finding.possibleCauses[0]}</p>
          {!compact && finding.possibleCauses.length > 1 && (
            <ul>
              {finding.possibleCauses.slice(1).map((cause) => (
                <li key={cause}>{cause}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <span className="wf-results-eyebrow">Nächster Schritt</span>
          <ol>
            {finding.nextSteps.slice(0, compact ? 1 : 3).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="wf-diagnosis-priority">
        {priorityLabel(finding.priority)}
      </div>
    </div>
  );
}
