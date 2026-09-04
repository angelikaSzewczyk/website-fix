export type FindingPriority = "critical" | "high" | "medium" | "low" | "info";

export type FindingKey =
  | "availability"
  | "indexing"
  | "broken-links"
  | "h1"
  | "metadata"
  | "forms"
  | "alt";

export type EvidenceItem = {
  label: string;
  value: string;
  detail?: string;
  url?: string;
  status?: number;
};

export type DiagnosisFinding = {
  key: FindingKey;
  priority: FindingPriority;
  title: string;
  summary: string;
  evidence: EvidenceItem[];
  affectedUrls: string[];
  possibleCauses: string[];
  nextSteps: string[];
};

export type PageSummary = {
  path: string;
  fullUrl: string;
  findingsCount: number;
  reachable: boolean;
  status: number | null;
  skipped: boolean;
  altMissing: number;
  noindex: boolean;
  missingTitle: boolean;
  missingMeta: boolean;
  missingH1: boolean;
  inputsWithoutLabel: number;
  buttonsWithoutText: number;
};

export type DiagnosisViewModel = {
  domain: string;
  pagesChecked: number;
  affectedPages: number;
  affectedPlaces: number;
  discoveredUrls: number;
  skippedUrls: number;
  findings: DiagnosisFinding[];
  primaryFinding: DiagnosisFinding | null;
  pages: PageSummary[];
};

export type RawScanEvidence = {
  audit?: {
    altTexte?: {
      fehlend?: number;
      eindeutigFehlend?: number;
      vorkommenFehlend?: number;
      betroffeneSeiten?: number;
      gesamt?: number;
      missingImages?: string[];
    };
    brokenLinks?: Array<{
      url: string;
      status: number;
      sourceUrls?: string[];
    }>;
  };
};
