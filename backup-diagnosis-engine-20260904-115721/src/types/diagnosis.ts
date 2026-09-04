export type FindingPriority = "high" | "check" | "info";

export type FindingKey =
  | "availability"
  | "indexing"
  | "h1"
  | "metadata"
  | "alt"
  | "forms"
  | "broken-links";

export type DiagnosisFinding = {
  key: FindingKey;
  priority: FindingPriority;
  title: string;
  evidence: string;
  meaning: string;
  affectedUrls: string[];
};

export type PageSummary = {
  path: string;
  fullUrl: string;
  findingsCount: number;
  reachable: boolean;
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
