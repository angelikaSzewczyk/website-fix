/**
 * Canonical scan storage — single source of truth.
 *
 * Both inline-scan.tsx and scan/page.tsx MUST call saveScanToStorage().
 * The results page reads via loadScanFromStorage().
 */

export const SCAN_STORAGE_KEY = "wf_scan_result";

// ── Canonical stored shape ───────────────────────────────────────────────────
export type StoredScan = {
  url:                  string;
  pages:                number;          // gescannteSeiten incl. homepage (+1)
  entdeckteUrls:        number;
  gefilterteUrls:       number;
  skippedUrls:          string[];
  unterseiten: Array<{
    url:                string;
    erreichbar:         boolean;
    altMissing:         number;
    noindex:            boolean;
    title:              string;            // "(kein Title)" when absent
    h1:                 string;            // "(kein H1)" when absent
    metaDescription:    string;            // "" when absent
    inputsWithoutLabel: number;
    buttonsWithoutText: number;
    altMissingImages:   string[];
    foundVia?:          string;            // URL of the page that linked here, or "sitemap"
  }>;
  diagnose:             string;
  https:                boolean;
  brokenLinksCount:     number;
  altMissingCount:      number;
  altMissingImages:     string[];
  duplicateTitlesCount: number;
  duplicateMetasCount:  number;
  noIndex:              boolean;
  hasTitle:             boolean;
  hasMeta:              boolean;
  hasH1:                boolean;
  hasSitemap:           boolean;
  robotsBlocked:        boolean;
  hasUnreachable:       boolean;
  orphanedPagesCount:   number;
  wpVersion:            string | null;
  xmlRpcOpen:           boolean;
  sitemapIndexFound:    boolean;
  hasRankMath:          boolean;
  hasYoast:             boolean;
  issueCount:           number;
  techFingerprint:      unknown;
  scanId:               string | null;
};

// ── Shape of the /api/scan response ─────────────────────────────────────────
export type ApiScanResponse = {
  success?: boolean;
  diagnose?: string;
  issueCount?: number;
  scanId?: string | null;
  scanData?: {
    url?: string;
    https?: boolean;
    title?: string;
    metaDescription?: string;
    h1?: string;
    indexierungGesperrt?: boolean;
    sitemapVorhanden?: boolean;
    robotsBlockiertAlles?: boolean;
    wpVersion?: string | null;
    xmlRpcOpen?: boolean;
    sitemapIndexFound?: boolean;
    hasRankMath?: boolean;
    hasYoast?: boolean;
    techFingerprint?: unknown;
    audit?: {
      gescannteSeiten?: number;
      entdeckteUrls?: number;
      gefilterteUrls?: number;
      uebersprungeneUrls?: string[];
      unterseiten?: Array<{
        url:                string;
        erreichbar:         boolean;
        altMissing:         number;
        noindex:            boolean;
        title?:             string;
        h1?:                string;
        metaDescription?:   string;
        inputsWithoutLabel?: number;
        buttonsWithoutText?: number;
        altMissingImages?:  string[];
        foundVia?:          string;
      }>;
      altTexte?: { fehlend?: number; gesamt?: number; missingImages?: string[] };
      duplicateTitles?: unknown[];
      duplicateMetas?: unknown[];
      brokenLinks?: unknown[];
      verwaistSeiten?: string[];
    };
  };
};

// ── Writer ───────────────────────────────────────────────────────────────────
export function saveScanToStorage(url: string, data: ApiScanResponse): void {
  try {
    const audit = data.scanData?.audit ?? {};
    const sd    = data.scanData ?? {};

    const stored: StoredScan = {
      url,
      pages:                audit.gescannteSeiten ?? (audit.unterseiten?.length ?? 0) + 1,
      entdeckteUrls:        audit.entdeckteUrls  ?? 0,
      gefilterteUrls:       audit.gefilterteUrls ?? 0,
      skippedUrls:          (audit.uebersprungeneUrls ?? []) as string[],
      unterseiten:          (audit.unterseiten ?? []).map(p => ({
        url:                p.url,
        erreichbar:         p.erreichbar,
        altMissing:         p.altMissing,
        noindex:            p.noindex,
        title:              p.title ?? "(kein Title)",
        h1:                 p.h1   ?? "(kein H1)",
        metaDescription:    p.metaDescription ?? "",
        inputsWithoutLabel: p.inputsWithoutLabel ?? 0,
        buttonsWithoutText: p.buttonsWithoutText ?? 0,
        altMissingImages:   p.altMissingImages ?? [],
        foundVia:           p.foundVia,
      })),
      diagnose:             data.diagnose ?? "",
      https:                sd.https ?? true,
      brokenLinksCount:     (audit.brokenLinks?.length  ?? 0),
      altMissingCount:      audit.altTexte?.fehlend     ?? 0,
      altMissingImages:     audit.altTexte?.missingImages ?? [],
      duplicateTitlesCount: (audit.duplicateTitles?.length ?? 0),
      duplicateMetasCount:  (audit.duplicateMetas?.length  ?? 0),
      noIndex:              sd.indexierungGesperrt ?? false,
      hasTitle:             !!sd.title,
      hasMeta:              !!sd.metaDescription,
      hasH1:                !!sd.h1,
      hasSitemap:           sd.sitemapVorhanden    ?? false,
      robotsBlocked:        sd.robotsBlockiertAlles ?? false,
      hasUnreachable:       (audit.unterseiten ?? []).some(p => !p.erreichbar),
      orphanedPagesCount:   (audit.verwaistSeiten?.length ?? 0),
      wpVersion:            sd.wpVersion    ?? null,
      xmlRpcOpen:           sd.xmlRpcOpen   ?? false,
      sitemapIndexFound:    sd.sitemapIndexFound ?? false,
      hasRankMath:          sd.hasRankMath  ?? false,
      hasYoast:             sd.hasYoast     ?? false,
      issueCount:           data.issueCount ?? 0,
      techFingerprint:      sd.techFingerprint ?? null,
      scanId:               data.scanId ?? null,
    };

    sessionStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(stored));
  } catch { /* sessionStorage not available (SSR / private mode) */ }
}

// ── Reader ───────────────────────────────────────────────────────────────────
export function loadScanFromStorage(): StoredScan | null {
  try {
    const raw = sessionStorage.getItem(SCAN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredScan;
  } catch { return null; }
}
