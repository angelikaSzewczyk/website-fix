import type { DiagnosisFinding } from "@/types/diagnosis";
import FindingDetails from "./FindingDetails";

export default function PrimaryFinding({
  finding,
}: {
  finding: DiagnosisFinding;
}) {
  return (
    <section className="wf-results-primary" data-priority={finding.priority}>
      <div className="wf-results-eyebrow">Zuerst prüfen</div>
      <h2>{finding.title}</h2>
      <p className="wf-results-evidence">{finding.summary}</p>

      <FindingDetails finding={finding} compact />

      <a className="wf-results-link" href={`#finding-${finding.key}`}>
        Alle Details ansehen →
      </a>
    </section>
  );
}
