import type { DiagnosisFinding } from "@/types/diagnosis";

function shortPath(url: string) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

export default function PrimaryFinding({
  finding,
}: {
  finding: DiagnosisFinding;
}) {
  return (
    <section className="wf-results-primary">
      <div className="wf-results-eyebrow">Zuerst prüfen</div>
      <h2>{finding.title}</h2>
      <p className="wf-results-evidence">{finding.evidence}</p>
      <p className="wf-results-copy">{finding.meaning}</p>

      {finding.affectedUrls.length > 0 && (
        <div className="wf-results-primary-urls">
          <span>Betroffene Seiten</span>
          <div>
            {finding.affectedUrls.slice(0, 4).map((url) => (
              <code key={url}>{shortPath(url)}</code>
            ))}
            {finding.affectedUrls.length > 4 && (
              <small>+{finding.affectedUrls.length - 4} weitere</small>
            )}
          </div>
        </div>
      )}

      <a className="wf-results-link" href="#betroffene-seiten">
        Befund ansehen →
      </a>
    </section>
  );
}
