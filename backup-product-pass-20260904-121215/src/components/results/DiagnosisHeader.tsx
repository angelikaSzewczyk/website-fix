import type { DiagnosisViewModel } from "@/types/diagnosis";

export default function DiagnosisHeader({
  diagnosis,
}: {
  diagnosis: DiagnosisViewModel;
}) {
  const count = diagnosis.findings.length;

  return (
    <header className="wf-results-header">
      <div className="wf-results-status">
        <span className="wf-results-status-dot" aria-hidden="true" />
        Scan abgeschlossen
      </div>

      <h1>
        {count > 0
          ? `${count} ${
              count === 1 ? "technische Auffälligkeit" : "technische Auffälligkeiten"
            } gefunden.`
          : "Keine akuten technischen Auffälligkeiten gefunden."}
      </h1>

      <p className="wf-results-lead">
        Diagnose für <strong>{diagnosis.domain}</strong>.{" "}
        {diagnosis.pagesChecked}{" "}
        {diagnosis.pagesChecked === 1 ? "Seite wurde" : "Seiten wurden"} geprüft
        {diagnosis.affectedPages > 0
          ? ` · ${diagnosis.affectedPages} ${
              diagnosis.affectedPages === 1 ? "Seite mit Hinweis" : "Seiten mit Hinweisen"
            }`
          : ""}
        .
      </p>
    </header>
  );
}
