export type FindingPriority = "critical" | "high" | "medium" | "low" | "info";

export type FindingKey =
  | "availability"
  | "page-verification"
  | "indexing"
  | "broken-links"
  | "link-verification"
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
  highestPriority: FindingPriority | null;
  findingLabels: string[];
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
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  overallState: "problem" | "warning" | "optimization" | "clear";
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
    pageVerifications?: Array<{
      url: string;
      status: number;
      classification:
        | "not_found"
        | "client_error"
        | "protected"
        | "server_error"
        | "rate_limited"
        | "timeout"
        | "network_error"
        | string;
      finalUrl?: string;
      redirected?: boolean;
      foundVia?: string;
    }>;
    brokenLinks?: Array<{
      url: string;
      status: number;
      classification?: string;
      finalUrl?: string;
      redirected?: boolean;
      sourceUrls?: string[];
    }>;
    linkVerifications?: Array<{
      url: string;
      status: number;
      classification:
        | "protected"
        | "server_error"
        | "rate_limited"
        | "timeout"
        | "network_error"
        | string;
      finalUrl?: string;
      redirected?: boolean;
      sourceUrls?: string[];
    }>;
  };
};
