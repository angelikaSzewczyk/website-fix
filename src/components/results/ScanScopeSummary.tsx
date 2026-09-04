import type { RawScanEvidence } from "@/types/diagnosis";

type DiscoveryAudit = NonNullable<RawScanEvidence["audit"]> & {
  discoveryRawCount?: number;
  discoveryPageCount?: number;
  discoveryCandidateCount?: number;
  verifiedPagesCount?: number;
  discoveryFilteredCount?: number;
  discoveryDuplicateCount?: number;
  scanLimitUnterseiten?: number;
  nichtGepruefteUrls?: number;
};

export default function ScanScopeSummary({
  raw,
  pagesChecked,
}: {
  raw?: RawScanEvidence | null;
  pagesChecked: number;
}) {
  const audit = raw?.audit as DiscoveryAudit | undefined;

  const hasDiscoveryMetrics =
    typeof audit?.discoveryRawCount === "number" ||
    typeof audit?.discoveryCandidateCount === "number" ||
    typeof audit?.discoveryPageCount === "number";

  if (!hasDiscoveryMetrics) {
    return (
      <section className="wf-results-scope-summary wf-results-scope-summary-compact">
        <div className="wf-results-scope-copy">
          <span className="wf-results-eyebrow">Scan-Umfang</span>
          <strong>{pagesChecked} Seiten vollständig geprüft</strong>
          <p>
            Der technische Befund bezieht sich ausschließlich auf diese vollständig
            abgerufenen Seiten.
          </p>
        </div>
      </section>
    );
  }

  const rawCount =
    audit?.discoveryRawCount ??
    audit?.discoveryCandidateCount ??
    audit?.discoveryPageCount ??
    0;

  const candidates =
    audit?.discoveryCandidateCount ??
    audit?.discoveryPageCount ??
    0;

  const duplicates = audit?.discoveryDuplicateCount ?? 0;
  const filtered = audit?.discoveryFilteredCount ?? 0;

  return (
    <section className="wf-results-scope-summary" aria-label="Scan-Umfang">
      <div className="wf-results-scope-copy">
        <span className="wf-results-eyebrow">Scan-Umfang</span>
        <strong>{pagesChecked} Seiten vollständig geprüft</strong>
        <p>
          {rawCount} interne URL-Vorkommen wurden bei der Discovery erfasst.
          Diese Zahl ist keine bestätigte Seitenzahl.
        </p>
      </div>

      <div className="wf-results-scope-metrics">
        <span>
          <b>{rawCount}</b>
          URL-Vorkommen
        </span>
        <span>
          <b>{candidates}</b>
          Kandidaten
        </span>
        {filtered > 0 && (
          <span>
            <b>{filtered}</b>
            gefiltert
          </span>
        )}
        {duplicates > 0 && (
          <span>
            <b>{duplicates}</b>
            Duplikate
          </span>
        )}
        <span>
          <b>{pagesChecked}</b>
          geprüft
        </span>
      </div>

      <p className="wf-results-scope-disclaimer">
        Nur vollständig abgerufene HTML-Seiten fließen in die Diagnose ein.
        Discovery-Kandidaten werden nicht automatisch als echte oder fehlerfreie
        Seiten gewertet.
      </p>
    </section>
  );
}
