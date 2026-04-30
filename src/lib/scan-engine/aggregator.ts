/**
 * Aggregator — Site-Wide-Issues + Per-Page-Konsolidierung (Phase A).
 *
 * Operation Unified Core: nimmt N PageAudits + SiteContext und liefert das
 * finale ScanResult mit allen 11 DB-Spalten.
 *
 * Drei Aufgaben in dieser Reihenfolge:
 *   1. Site-Wide-Issues generieren (https, robots, sitemap, wp-stale,
 *      duplicate-titles, duplicate-metas, broken-links, orphaned-pages).
 *      Diese werden NICHT pro-Seite generiert — sind logisch site-weit.
 *   2. Per-Page-Issues konsolidieren (gleicher kind über mehrere URLs →
 *      EIN Issue mit affectedUrls-Liste).
 *   3. ScanResult zusammensetzen — bereit für die DB-Insert (alle 11 Spalten).
 *
 * Subset-Invariante:
 *   - Bei Single-Page-Scan: pages = [root] → root-Page-Issues + site-wide-checks
 *     auf [root] → ScanResult.
 *   - Bei Full-Scan: pages = [root, sub1, …] → root-Page-Issues + sub-Page-Issues
 *     + site-wide-checks auf [root, sub1, …] → ScanResult.
 *   - Da pages.includes(root) in BEIDEN Fällen wahr ist, sind Root-Issues
 *     IMMER in beiden Resultaten — ein Full-Scan kann NIEMALS leerer sein
 *     als ein Single-Scan auf derselben Root-URL.
 */

import type {
  PageAudit, ScanIssue, ScanResult, SiteContext, ScanMetadata, IssueKind,
} from "./types";

// ─── WP-Version-Stale-Detection (1:1 aus scan/route.ts:72 migriert) ─────────
const LATEST_WP_VERSION = "6.7";
const STALE_WP_THRESHOLD_MAJOR = 6;
const STALE_WP_THRESHOLD_MINOR = 5;

function isWpStale(version: string | null | undefined): boolean {
  if (!version) return false;
  const [majStr, minStr] = version.split(".");
  const major = parseInt(majStr ?? "", 10);
  const minor = parseInt(minStr ?? "0", 10);
  if (Number.isNaN(major)) return false;
  if (major < STALE_WP_THRESHOLD_MAJOR) return true;
  if (major === STALE_WP_THRESHOLD_MAJOR && minor < STALE_WP_THRESHOLD_MINOR) return true;
  return false;
}

// ─── Public Function ────────────────────────────────────────────────────────

export type ConsolidateOptions = {
  rootUrl:    string;
  plan:       string;
  /** "website" für Single-Page-Scan, "fullsite" für Full-Crawl. Bestimmt nur
   *  scans.type — Engine-Logik ist identisch. */
  type:       "website" | "fullsite";
  /** Tech-Fingerprint und meta (woo/builder/ttfb) werden separat befüllt
   *  und durchgereicht. Phase B verkabelt die Producer; jetzt sind sie
   *  Pass-Through-Slots. */
  techFingerprint?: unknown | null;
  meta?:            ScanMetadata;
};

/**
 * Hauptfunktion: aus N PageAudits + SiteContext wird ein konsolidiertes
 * ScanResult — bereit für den DB-Insert mit allen 11 Spalten.
 */
export function consolidateScans(
  pages: PageAudit[],
  siteContext: SiteContext,
  options: ConsolidateOptions,
): ScanResult {
  if (pages.length === 0) {
    throw new Error("[aggregator] consolidateScans called with empty pages array");
  }

  // ── 1. Site-Wide-Aggregate berechnen ────────────────────────────────────
  const duplicateTitles = computeDuplicateTitles(pages);
  const duplicateMetas  = computeDuplicateMetas(pages);
  const brokenLinks     = computeBrokenLinks(pages);
  const orphanedPages   = computeOrphanedPages(pages, siteContext.rootUrl);

  // ── 2. Site-Wide-Issues generieren ──────────────────────────────────────
  const siteIssues = buildSiteWideIssues({
    siteContext,
    duplicateTitles,
    duplicateMetas,
    brokenLinks,
    orphanedPages,
  });

  // ── 3. Per-Page-Issues sammeln + konsolidieren ──────────────────────────
  const allPerPageIssues = pages.flatMap(p => p.pageIssues);
  const consolidatedPerPageIssues = consolidatePerPageIssues(allPerPageIssues);

  // ── 4. Final-Issues = site-wide + per-page-konsolidiert ─────────────────
  const intermediate = [...siteIssues, ...consolidatedPerPageIssues];

  // ── 5. Scope-Klassifikation (Säule 1: 80%-Schwellenwert) ────────────────
  const finalIssues = classifyScopes(intermediate, pages.length);

  // ── 6. Speed-Score (Issue-basierte Heuristik) ───────────────────────────
  const speedScore = computeSpeedScore(finalIssues);

  // ── 7. Site-Wide-Metrics (Säule 3: Helikopter-Blick) ────────────────────
  const avgTtfbMs          = computeAvgTtfb(pages);
  const wcagHeuristicScore = computeWcagHeuristic(finalIssues, pages.length);

  return {
    type:               options.type,
    url:                options.rootUrl,
    issues:             finalIssues,
    issueCount:         finalIssues.length,
    unterseiten:        pages,
    totalPages:         pages.length,
    techFingerprint:    options.techFingerprint ?? null,
    speedScore,
    meta:               options.meta ?? {},
    avgTtfbMs,
    wcagHeuristicScore,
    // Phase A2: Disclaimer-String, den UIs zwingend anzeigen sollen.
    // Verhindert dass das Frontend "WCAG-Konformität" suggeriert wo nur
    // strukturelle Heuristik vorliegt. Phase A3 (axe-core/Headless) ersetzt
    // den String mit "WCAG-AA-Audit" oder ähnlich.
    wcagHeuristicLabel: "Heuristische Analyse",
    diagnose:           "",   // Caller füllt nachträglich via Anthropic-API
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// SÄULE 1 — SCOPE-KLASSIFIKATION (80%-Schwellenwert)
// ═════════════════════════════════════════════════════════════════════════════

const GLOBAL_SCOPE_THRESHOLD     = 0.80;  // >= 80% der Pages = "Template-Fehler"
const GLOBAL_SCOPE_MIN_PAGES     = 5;     // bei < 5 Pages: keine Scope-Klassifikation
                                          // (zu wenig Stichprobe für sinnvolle Heuristik)

/** Markiert konsolidierte Issues als "global" oder "local" basierend auf der
 *  Verteilung über alle gecrawlten Pages.
 *
 *  Säule 1 — pragmatischer Ersatz für CSS-Selektor-Tracking: ein Issue, das
 *  auf >= 80% der Seiten auftaucht, ist mit hoher Wahrscheinlichkeit ein
 *  Template-Fehler (Header, Footer, Layout-Komponente). UI rendert es als
 *  "Globales Problem · Eine Korrektur im Template behebt alle X Vorkommen"
 *  statt als 50 lokaler Befunde.
 *
 *  Site-Wide-Issues (https, robots, sitemap) sind per Definition global,
 *  bekommen aber kein scope-Label, weil "global" für sie redundant wäre. */
function classifyScopes(issues: ScanIssue[], totalPages: number): ScanIssue[] {
  // Bei < 5 gecrawlten Seiten ist eine Scope-Heuristik sinnlos —
  // ein einzelner Quick-Scan crawlt nur die Root-Page.
  if (totalPages < GLOBAL_SCOPE_MIN_PAGES) return issues;

  return issues.map(issue => {
    // Kindlose / site-wide Issues: kein scope-Label.
    if (!issue.kind || isInherentlySiteWide(issue.kind)) return issue;

    const affected = issue.affectedUrls?.length ?? (issue.url ? 1 : 0);
    if (affected === 0) return issue;

    const ratio = affected / totalPages;
    return {
      ...issue,
      scope: ratio >= GLOBAL_SCOPE_THRESHOLD ? "global" : "local",
    };
  });
}

/** Issue-Kinds, die per Definition site-wide sind (eines pro Site, nicht pro
 *  Page) — bekommen kein scope-Label, weil "global" hier redundant wäre. */
function isInherentlySiteWide(kind: string): boolean {
  return [
    "no-https",
    "robots-blocks-all",
    "sitemap-missing",
    "wp-stale",
    "duplicate-titles",
    "duplicate-metas",
    "broken-links",
    "orphaned-pages",
  ].includes(kind);
}

// ═════════════════════════════════════════════════════════════════════════════
// SÄULE 3 — SITE-WIDE-METRIKEN
// ═════════════════════════════════════════════════════════════════════════════

/** Mittelwert aller TTFB-Werte über die erreichbaren Pages. Null wenn keine
 *  Page eine Messung lieferte (alte Crawler, Fetch-Failures). */
function computeAvgTtfb(pages: PageAudit[]): number | null {
  const valid = pages.filter(p => p.ok && p.ttfbMs != null && p.ttfbMs > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, p) => s + (p.ttfbMs ?? 0), 0);
  return Math.round(sum / valid.length);
}

/** Heuristischer WCAG-Score 0-100. UI MUSS expliziten Disclaimer rendern:
 *  "Heuristische Analyse · für zertifizierten Bericht: Headless-Audit (Roadmap)".
 *
 *  Formel: 100 minus (gewichteter recht-Issue-Anteil, normalisiert über pages).
 *  Bei 0 recht-Issues = 100. Bei vielen recht-Issues über alle Seiten verteilt
 *  → niedriger Score. */
function computeWcagHeuristic(issues: ScanIssue[], totalPages: number): number {
  if (totalPages === 0) return 100;
  const rechtIssues = issues.filter(i => i.category === "recht");
  if (rechtIssues.length === 0) return 100;

  // Gewichtung: rote Issues 8 Punkte, gelbe 3 Punkte. Pro Page normalisiert.
  const weighted = rechtIssues.reduce((s, i) => {
    const w = i.severity === "red" ? 8 : i.severity === "yellow" ? 3 : 0;
    // Wenn das Issue auf vielen Pages auftaucht: stärker abzuziehen.
    const pageImpact = (i.affectedUrls?.length ?? 1) / totalPages;
    return s + w * pageImpact;
  }, 0);

  return Math.max(0, Math.min(100, Math.round(100 - weighted * 5)));
}

// ═════════════════════════════════════════════════════════════════════════════
// SITE-WIDE AGGREGATE COMPUTATION
// ═════════════════════════════════════════════════════════════════════════════

/** Duplikate-Titles: Gruppen identischer title-Strings über >= 2 Seiten. */
function computeDuplicateTitles(pages: PageAudit[]): { title: string; seiten: string[] }[] {
  const titleMap = new Map<string, string[]>();
  for (const p of pages) {
    if (!p.ok || !p.title) continue; // nicht erreichbar oder kein Title → kein Duplikat
    const key = p.title.trim();
    const arr = titleMap.get(key) ?? [];
    arr.push(p.url);
    titleMap.set(key, arr);
  }
  return Array.from(titleMap.entries())
    .filter(([, urls]) => urls.length >= 2)
    .map(([title, seiten]) => ({ title, seiten }));
}

/** Duplikate-Meta-Descriptions analog zu Titles. */
function computeDuplicateMetas(pages: PageAudit[]): { meta: string; seiten: string[] }[] {
  const metaMap = new Map<string, string[]>();
  for (const p of pages) {
    if (!p.ok || !p.metaDescription) continue;
    const key = p.metaDescription.trim();
    const arr = metaMap.get(key) ?? [];
    arr.push(p.url);
    metaMap.set(key, arr);
  }
  return Array.from(metaMap.entries())
    .filter(([, urls]) => urls.length >= 2)
    .map(([meta, seiten]) => ({ meta, seiten }));
}

/** Broken Links: Pages die crawler-mäßig 4xx/5xx zurückgaben. status=0 ist
 *  Timeout — separat behandeln (zähle nicht als "broken", weil unklar ob die
 *  Seite existiert oder nur langsam ist). */
function computeBrokenLinks(pages: PageAudit[]): { url: string; status: number }[] {
  return pages
    .filter(p => !p.ok && p.status !== 0)
    .map(p => ({ url: p.url, status: p.status }));
}

/** Orphan-Detection: Seiten, auf die KEINE andere Seite per internal Link
 *  zeigt. Root-URL ist nie ein Orphan (sie ist der Eintrag). */
function computeOrphanedPages(pages: PageAudit[], rootUrl: string): string[] {
  // Set aller URLs, auf die mindestens eine Seite linkt
  const linkedTo = new Set<string>();
  for (const p of pages) {
    for (const link of p.internalLinks) {
      linkedTo.add(stripTrailingSlash(link));
    }
  }

  const root = stripTrailingSlash(rootUrl);
  const orphans: string[] = [];
  for (const p of pages) {
    const normalized = stripTrailingSlash(p.url);
    if (normalized === root) continue;
    if (!linkedTo.has(normalized)) orphans.push(p.url);
  }
  return orphans;
}

function stripTrailingSlash(u: string): string {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

// ═════════════════════════════════════════════════════════════════════════════
// SITE-WIDE ISSUE GENERATION
// ═════════════════════════════════════════════════════════════════════════════

function buildSiteWideIssues(input: {
  siteContext:     SiteContext;
  duplicateTitles: { title: string; seiten: string[] }[];
  duplicateMetas:  { meta: string; seiten: string[] }[];
  brokenLinks:     { url: string; status: number }[];
  orphanedPages:   string[];
}): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const { siteContext, duplicateTitles, duplicateMetas, brokenLinks, orphanedPages } = input;
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };

  // ── HTTPS ──
  if (!siteContext.https) {
    issues.push({
      kind:     "no-https",
      severity: "red",
      title:    "Sicherheitsrisiko: Keine verschlüsselte Verbindung (HTTPS fehlt)",
      body:     "Besucher sehen eine Browser-Warnung — Google stuft unverschlüsselte Seiten im Ranking ab und markiert sie als unsicher.",
      category: "technik",
      count:    1,
    });
  }

  // ── robots.txt blockiert alle Crawler ──
  if (siteContext.robotsBlockiertAlles) {
    issues.push({
      kind:     "robots-blocks-all",
      severity: "red",
      title:    "Kritisch: robots.txt blockiert Google komplett",
      body:     "Die gesamte Website ist für alle Suchmaschinen-Crawler gesperrt — kein Seiteninhalt wird indexiert.",
      category: "technik",
      count:    1,
    });
  }

  // ── Sitemap fehlt ──
  if (!siteContext.sitemapVorhanden) {
    issues.push({
      kind:     "sitemap-missing",
      severity: "yellow",
      title:    "Langsame Indexierung: Sitemap.xml fehlt",
      body:     "Ohne Sitemap findet Google neue Inhalte langsamer — besonders kritisch nach Relaunch oder bei neu veröffentlichten Seiten.",
      category: "technik",
      count:    1,
    });
  }

  // ── WordPress-Version veraltet ──
  if (siteContext.wpVersion && isWpStale(siteContext.wpVersion)) {
    issues.push({
      kind:     "wp-stale",
      severity: "yellow",
      title:    `WordPress veraltet: ${siteContext.wpVersion} (aktuell: ${LATEST_WP_VERSION})`,
      body:     `Die installierte WordPress-Version liegt mehrere Minor-Releases hinter ${LATEST_WP_VERSION}. Veraltete Cores sind das #1 Einfallstor für Hack-Versuche und führen zu Plugin-Inkompatibilitäten.`,
      category: "technik",
      count:    1,
    });
  }

  // ── Phase A3: SSL-Cert-Ablauf ──
  // Schwellwert 14 Tage — genug Zeit für Renewal, aber dringlich genug, dass
  // der User es nicht ignoriert. Severity: red bei <= 7 Tagen, sonst yellow.
  if (siteContext.sslExpiresAt) {
    const expiresAt = new Date(siteContext.sslExpiresAt);
    if (!Number.isNaN(expiresAt.getTime())) {
      const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
      if (daysLeft >= 0 && daysLeft <= 14) {
        issues.push({
          kind:     "ssl-expiring-soon",
          severity: daysLeft <= 7 ? "red" : "yellow",
          title:    daysLeft === 0
            ? `SSL-Zertifikat läuft heute ab`
            : `SSL-Zertifikat läuft in ${daysLeft} Tag${daysLeft === 1 ? "" : "en"} ab`,
          body:     `Zertifikat-Ablauf: ${expiresAt.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}. Ab dem Ablaufdatum zeigen Browser sofort eine Sicherheits-Warnung — Besucher kommen nicht mehr durch und Google indexiert die Seite ab. Renewal über Hosting-Provider oder Let's Encrypt.`,
          category: "technik",
          count:    1,
        });
      } else if (daysLeft < 0) {
        // Cert ist bereits abgelaufen — kritisch, immer red.
        issues.push({
          kind:     "ssl-expiring-soon",
          severity: "red",
          title:    `SSL-Zertifikat ist seit ${Math.abs(daysLeft)} Tag${Math.abs(daysLeft) === 1 ? "" : "en"} abgelaufen`,
          body:     `Das Zertifikat ist seit ${expiresAt.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })} ungültig. Browser blockieren die Seite mit einer Sicherheits-Warnung — niemand kommt mehr durch. Sofortiges Renewal nötig.`,
          category: "technik",
          count:    1,
        });
      }
    }
  }

  // ── Duplicate Titles ──
  if (duplicateTitles.length > 0) {
    const affectedUrls = duplicateTitles.flatMap(d => d.seiten);
    issues.push({
      kind:         "duplicate-titles",
      severity:     "red",
      title:        `Google-Verwirrung: ${duplicateTitles.length}× identischer Title-Tag (Ranking-Verlust)`,
      body:         `Doppelte Titles führen zu Duplicate-Content-Problemen bei Google. Betroffen: ${affectedUrls.slice(0, 3).map(toPath).join(", ")}${affectedUrls.length > 3 ? ` (+${affectedUrls.length - 3} weitere)` : ""}`,
      category:     "technik",
      affectedUrls,
      url:          affectedUrls[0],
      count:        duplicateTitles.length,
    });
  }

  // ── Duplicate Metas ──
  if (duplicateMetas.length > 0) {
    const affectedUrls = duplicateMetas.flatMap(d => d.seiten);
    issues.push({
      kind:         "duplicate-metas",
      severity:     "yellow",
      title:        `Schwache Klickrate: ${duplicateMetas.length}× identische Meta-Description`,
      body:         `Identische Vorschautexte bei verschiedenen Seiten — Google ignoriert sie. Betroffen: ${affectedUrls.slice(0, 3).map(toPath).join(", ")}`,
      category:     "technik",
      affectedUrls,
      url:          affectedUrls[0],
      count:        duplicateMetas.length,
    });
  }

  // ── Broken Links ──
  if (brokenLinks.length > 0) {
    const affectedUrls = brokenLinks.map(b => b.url);
    issues.push({
      kind:         "broken-links",
      severity:     "red",
      title:        `Geschäftsschädigend: ${brokenLinks.length} tote Link${brokenLinks.length > 1 ? "s" : ""} (404) führen ins Leere`,
      body:         `Fehlerhafte Links frustrieren Besucher, schaden dem Ranking und kosten Conversions: ${affectedUrls.slice(0, 3).map(toPath).join(", ")}`,
      category:     "technik",
      affectedUrls,
      url:          affectedUrls[0],
      count:        brokenLinks.length,
    });
  }

  // ── Orphaned Pages ──
  if (orphanedPages.length > 0) {
    issues.push({
      kind:         "orphaned-pages",
      severity:     "yellow",
      title:        `Versteckter Content: ${orphanedPages.length} Seite${orphanedPages.length > 1 ? "n" : ""} ohne interne Verlinkung`,
      body:         `Keine internen Links zeigen auf diese Seiten — Google und Besucher finden sie kaum. Betroffen: ${orphanedPages.slice(0, 3).map(toPath).join(", ")}`,
      category:     "technik",
      affectedUrls: orphanedPages,
      url:          orphanedPages[0],
      count:        orphanedPages.length,
    });
  }

  return issues;
}

// ═════════════════════════════════════════════════════════════════════════════
// PER-PAGE ISSUE CONSOLIDATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public re-export: ermöglicht /api/scan, einen weiteren Konsolidierungs-Pass
 * zu fahren, nachdem post-engine WP/Builder/DSGVO-Issues angefügt wurden.
 * Issues ohne kind bleiben ungrouped, kein Crash.
 */
export const consolidatePerPageIssuesPublic = (issues: ScanIssue[]): ScanIssue[] =>
  consolidatePerPageIssues(issues);

export const classifyScopesPublic = (issues: ScanIssue[], totalPages: number): ScanIssue[] =>
  classifyScopes(issues, totalPages);

/**
 * Der KERN-Algorithmus dieses Refactors. Nimmt alle per-page Issues aus
 * allen Seiten und konsolidiert sie nach kind:
 *
 *   Vorher (Roh):
 *     [
 *       { kind: "alt-text-missing", url: "/a", count: 3 },
 *       { kind: "alt-text-missing", url: "/b", count: 5 },
 *       { kind: "alt-text-missing", url: "/c", count: 2 },
 *       { kind: "h1-missing",       url: "/a", count: 1 },
 *       { kind: "h1-missing",       url: "/d", count: 1 },
 *     ]
 *
 *   Nachher (Konsolidiert):
 *     [
 *       { kind: "alt-text-missing",
 *         title: "BFSG-Verstoß: 10 fehlende Alt-Texte auf 3 Seiten",
 *         affectedUrls: ["/a", "/b", "/c"], count: 10 },
 *       { kind: "h1-missing",
 *         title: "SEO-Schwäche: H1 fehlt auf 2 Seiten",
 *         affectedUrls: ["/a", "/d"], count: 2 },
 *     ]
 *
 * Statt 500 Rows mit fast-identischen Issues schreibt die DB nun ~10
 * konsolidierte Issues mit URL-Listen. Die UI-Konsolidierung in
 * dashboard/scans/[id]/page.tsx kann in Phase D entfallen.
 */
function consolidatePerPageIssues(issues: ScanIssue[]): ScanIssue[] {
  // Group-Key: severity + kind. Issues OHNE kind (legacy / Phase B-Migration)
  // bleiben einzeln — keine String-Title-Heuristik, weil das fragil wäre.
  const groups = new Map<string, ScanIssue[]>();
  const ungrouped: ScanIssue[] = [];

  for (const issue of issues) {
    if (!issue.kind) {
      ungrouped.push(issue);
      continue;
    }
    const key = `${issue.severity}|${issue.kind}`;
    const arr = groups.get(key) ?? [];
    arr.push(issue);
    groups.set(key, arr);
  }

  const result: ScanIssue[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      // Nur eine Seite betroffen → keine Konsolidierung nötig, durchreichen.
      // affectedUrls trotzdem setzen für UI-Konsistenz.
      const single = group[0];
      result.push({
        ...single,
        affectedUrls: single.url ? [single.url] : undefined,
      });
      continue;
    }

    // Mehrere Seiten betroffen → konsolidieren.
    const first        = group[0];
    const totalCount   = group.reduce((s, i) => s + i.count, 0);
    const affectedUrls = group.map(i => i.url).filter((u): u is string => !!u);

    result.push({
      kind:         first.kind,
      severity:     first.severity,
      // Konsolidierter Title: nutzt Display-Patterns je nach kind. Body ist
      // generisch, weil pro-Seite-Body individuell wäre — der UI-Drill-Down
      // zeigt die affectedUrls einzeln.
      title:        consolidatedTitleFor(first.kind!, totalCount, affectedUrls.length),
      body:         consolidatedBodyFor(first.kind!, totalCount, affectedUrls),
      category:     first.category,
      url:          affectedUrls[0],
      affectedUrls,
      count:        totalCount,
    });
  }

  return [...result, ...ungrouped];
}

/** Title-Template pro kind. Title hat IMMER die Form
 *  "<Headline>: <count> <thing> auf <pageCount> Seiten". */
function consolidatedTitleFor(kind: IssueKind, totalCount: number, pageCount: number): string {
  const seitenLabel = pageCount === 1 ? "Seite" : "Seiten";
  switch (kind) {
    case "alt-text-missing":
      return `BFSG-Verstoß: ${totalCount} Bilder ohne Alt-Text auf ${pageCount} ${seitenLabel}`;
    case "form-label-missing":
      return `BFSG-Verstoß: ${totalCount} Formularfelder ohne Label auf ${pageCount} ${seitenLabel}`;
    case "form-button-text-missing":
      return `Barrierefreiheit: ${totalCount} Buttons ohne Text auf ${pageCount} ${seitenLabel}`;
    case "title-missing":
      return `Unsichtbar bei Google: Title-Tag fehlt auf ${pageCount} ${seitenLabel}`;
    case "h1-missing":
      return `SEO-Schwäche: H1 fehlt auf ${pageCount} ${seitenLabel}`;
    case "meta-description-missing":
      return `Schlechte Klickrate: Meta-Description fehlt auf ${pageCount} ${seitenLabel}`;
    case "noindex":
      return `Für Google gesperrt: noindex auf ${pageCount} ${seitenLabel}`;
    case "page-not-reachable":
      return `${pageCount} Unterseite${pageCount > 1 ? "n" : ""} geben 4xx/5xx zurück`;
    // ── Phase A2 ──
    case "og-missing":
      return `Schlechte Social-Vorschau: OpenGraph-Tags fehlen auf ${pageCount} ${seitenLabel}`;
    case "twitter-card-missing":
      return `Twitter/X-Vorschau fehlt auf ${pageCount} ${seitenLabel}`;
    case "favicon-missing":
      return `Favicon fehlt auf ${pageCount} ${seitenLabel}`;
    case "html-lang-missing":
      return `Sprache nicht definiert: <html lang="..."> fehlt auf ${pageCount} ${seitenLabel}`;
    case "heading-hierarchy-broken":
      return `Überschriften-Hierarchie falsch auf ${pageCount} ${seitenLabel}`;
    case "security-headers-missing":
      return `Security-Header fehlen auf ${pageCount} ${seitenLabel}`;
    default:
      return `Mehrere Seiten betroffen (${pageCount})`;
  }
}

function consolidatedBodyFor(kind: IssueKind, totalCount: number, urls: string[]): string {
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const sample = urls.slice(0, 3).map(toPath).join(", ");
  const extra  = urls.length > 3 ? ` (+${urls.length - 3} weitere)` : "";

  switch (kind) {
    case "alt-text-missing":
      return `${totalCount} Bilder ohne Alt-Text — Barrierefreiheitsgesetz ab 06/2025 verpflichtend, konkrete Abmahngefahr. Betroffen: ${sample}${extra}`;
    case "form-label-missing":
      return `Formularfelder ohne sichtbares Label — Screen-Reader können sie nicht vorlesen (BFSG §3 Abs. 2). Betroffen: ${sample}${extra}`;
    case "form-button-text-missing":
      return `Buttons ohne Text- oder aria-label sind für Screen-Reader bedeutungslos. Betroffen: ${sample}${extra}`;
    case "title-missing":
      return `Fehlende Title-Tags verhindern Ranking-Snippets — diese Seiten können nicht ranken. Betroffen: ${sample}${extra}`;
    case "h1-missing":
      return `Fehlende H1-Überschriften schwächen das Keyword-Signal. Betroffen: ${sample}${extra}`;
    case "meta-description-missing":
      return `Google wählt zufällige Seitenausschnitte als Vorschautext — Klicks und Conversions sinken. Betroffen: ${sample}${extra}`;
    case "noindex":
      return `Diese Seiten sind für Suchmaschinen komplett unsichtbar. Beabsichtigt? Betroffen: ${sample}${extra}`;
    case "page-not-reachable":
      return `Diese URLs liefern Fehlerseiten — Besucher und Google landen auf 404/5xx. Betroffen: ${sample}${extra}`;
    // ── Phase A2 ──
    case "og-missing":
      return `Ohne OpenGraph zeigen LinkedIn/Facebook/Slack beim Teilen nur die rohe URL — keine Vorschau-Card mit Bild + Titel. Betroffen: ${sample}${extra}`;
    case "twitter-card-missing":
      return `Ohne twitter:card zeigt X/Twitter beim Teilen kein Vorschau-Bild — messbar niedrigere Engagement-Rate. Betroffen: ${sample}${extra}`;
    case "favicon-missing":
      return `Browser-Tabs zeigen ein generisches Default-Icon — Marken-Wiedererkennung leidet, wirkt unprofessionell beim Bookmarken. Betroffen: ${sample}${extra}`;
    case "html-lang-missing":
      return `Screen-Reader können die Sprache nicht erkennen → BFSG-relevant. Plus: Google nutzt das Attribut als Ranking-Signal für lokalisierte Suche. Betroffen: ${sample}${extra}`;
    case "heading-hierarchy-broken":
      return `Screen-Reader navigieren über Überschriften-Levels — gebrochene Reihenfolge frustriert Nutzer mit Behinderungen, BFSG-relevant. Betroffen: ${sample}${extra}`;
    case "security-headers-missing":
      return `Fehlende CSP/HSTS-Header lassen Browser im weichen Modus — XSS, Clickjacking und Protokoll-Downgrade sind nicht hardened. Betroffen: ${sample}${extra}`;
    default:
      return `Betroffen: ${sample}${extra}`;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SPEED-SCORE (deterministische Heuristik, basiert auf finalen Issues)
// ═════════════════════════════════════════════════════════════════════════════

/** Einfache Score-Berechnung basierend auf Issue-Anzahl + Severity.
 *  Phase B kann den echten Speed-Score (PageSpeed-Insights, TTFB) einbinden. */
function computeSpeedScore(issues: ScanIssue[]): number {
  const red    = issues.filter(i => i.severity === "red").length;
  const yellow = issues.filter(i => i.severity === "yellow").length;
  return Math.max(10, Math.min(100, 100 - red * 8 - yellow * 3));
}
