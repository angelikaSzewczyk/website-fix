import type { DiagnosisFinding } from "@/types/diagnosis";
import FindingDetails from "./FindingDetails";

function eyebrow(priority: DiagnosisFinding["priority"]): string {
  if (priority === "critical" || priority === "high") return "Zuerst prüfen";
  if (priority === "medium") return "Prüfhinweis";
  if (priority === "low") return "Optimierungshinweis";
  return "Hinweis";
}

export default function PrimaryFinding({
  finding,
}: {
  finding: DiagnosisFinding;
}) {
  return (
    <section className="wf-results-primary" data-priority={finding.priority}>
      <div className="wf-results-eyebrow">{eyebrow(finding.priority)}</div>
      <h2>{finding.title}</h2>
      <p className="wf-results-evidence">{finding.summary}</p>

      <FindingDetails finding={finding} compact />

      <a className="wf-results-link" href={`#finding-${finding.key}`}>
        Alle Details ansehen →
      </a>
    </section>
  );
}
