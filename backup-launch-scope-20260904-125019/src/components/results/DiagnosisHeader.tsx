import type { DiagnosisViewModel } from "@/types/diagnosis";

function headerText(diagnosis: DiagnosisViewModel): string {
  if (diagnosis.overallState === "clear") {
    return "Keine akuten technischen Probleme erkannt.";
  }

  if (diagnosis.overallState === "optimization") {
    const count = diagnosis.lowCount + diagnosis.infoCount;
    return `${count} ${
      count === 1 ? "Optimierungshinweis" : "Optimierungshinweise"
    } gefunden.`;
  }

  if (diagnosis.overallState === "warning") {
    const count = diagnosis.mediumCount;
    return `${count} ${
      count === 1 ? "Prüfhinweis" : "Prüfhinweise"
    } gefunden.`;
  }

  const count = diagnosis.criticalCount + diagnosis.highCount;
  return `${count} ${
    count === 1 ? "technisches Problem" : "technische Probleme"
  } mit hoher Priorität gefunden.`;
}

function affectedLabel(diagnosis: DiagnosisViewModel): string {
  if (diagnosis.affectedPages === 0) return "";

  if (diagnosis.overallState === "optimization") {
    return `${diagnosis.affectedPages} ${
      diagnosis.affectedPages === 1
        ? "Seite mit Optimierungshinweis"
        : "Seiten mit Optimierungshinweisen"
    }`;
  }

  if (diagnosis.overallState === "warning") {
    return `${diagnosis.affectedPages} ${
      diagnosis.affectedPages === 1
        ? "Seite mit Prüfhinweis"
        : "Seiten mit Prüfhinweisen"
    }`;
  }

  return `${diagnosis.affectedPages} ${
    diagnosis.affectedPages === 1
      ? "betroffene Seite"
      : "betroffene Seiten"
  }`;
}

export default function DiagnosisHeader({
  diagnosis,
}: {
  diagnosis: DiagnosisViewModel;
}) {
  const discoveredMore =
    diagnosis.discoveredUrls > diagnosis.pagesChecked;

  return (
    <header
      className="wf-results-header"
      data-state={diagnosis.overallState}
    >
      <div className="wf-results-status">
        <span className="wf-results-status-dot" aria-hidden="true" />
        Scan abgeschlossen
      </div>

      <h1>{headerText(diagnosis)}</h1>

      {diagnosis.overallState === "optimization" && (
        <p className="wf-results-assessment">
          Bei den geprüften Signalen wurde kein akuter technischer Blocker erkannt.
        </p>
      )}

      <p className="wf-results-lead">
        Diagnose für <strong>{diagnosis.domain}</strong>.{" "}
        {discoveredMore ? (
          <>
            <strong>{diagnosis.pagesChecked} von {diagnosis.discoveredUrls}</strong>{" "}
            als Seiten klassifizierten URLs geprüft
          </>
        ) : (
          <>
            {diagnosis.pagesChecked}{" "}
            {diagnosis.pagesChecked === 1 ? "Seite wurde" : "Seiten wurden"} geprüft
          </>
        )}
        {diagnosis.affectedPages > 0
          ? ` · ${affectedLabel(diagnosis)}`
          : ""}
        .
      </p>

      {discoveredMore && (
        <p className="wf-results-scope-note">
          Kostenloser Check: Startseite plus ein begrenzter Teil der als Seiten klassifizierten URLs. Nicht geprüfte URLs werden nicht als fehlerfrei bewertet.
        </p>
      )}
    </header>
  );
}
