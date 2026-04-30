/**
 * Operation Unified Core — Engine Types (Phase A).
 *
 * Single Source of Truth für alle Scan-Datenstrukturen. Beide Routes
 * (/api/scan + /api/full-scan) und der Aggregator sprechen exakt dieses
 * Schema — sodass DB, UI und API NIE wieder divergieren können.
 */

// ─── Issue-Atom (was am Ende in issues_json landet) ─────────────────────────

/** Stabiler Identifier pro Issue-Typ — nutzt der Aggregator als Group-Key
 *  zum Konsolidieren von gleichartigen Befunden über mehrere Seiten hinweg.
 *
 *  WICHTIG: kind muss STABIL sein (kein dynamic-string mit count/url darin).
 *  Title und body dürfen dynamische Werte enthalten — kind nicht. */
export type IssueKind =
  // ── Site-wide (genau einmal pro Scan) ──
  | "no-https"
  | "robots-blocks-all"
  | "sitemap-missing"
  | "wp-stale"
  | "duplicate-titles"
  | "duplicate-metas"
  | "broken-links"
  | "orphaned-pages"
  | "ssl-expiring-soon"        // Phase A2: Slot für SSL-Cert-Expiry-Check (Phase A3 verkabelt tls.connect)
  // ── Root-Page (oder per-Seite, wird vom Aggregator konsolidiert) ──
  | "root-not-reachable"
  | "page-not-reachable"
  | "title-missing"
  | "h1-missing"
  | "meta-description-missing"
  | "noindex"
  | "alt-text-missing"
  | "form-label-missing"
  | "form-button-text-missing"
  // ── Phase A2: Social/Branding ──
  | "og-missing"
  | "twitter-card-missing"
  | "favicon-missing"
  // ── Phase A2: Deep SEO & Structure ──
  | "html-lang-missing"
  | "heading-hierarchy-broken"
  // ── Phase A2: Security & Connectivity ──
  | "security-headers-missing"
  // ── Builder/Shop (Phase A3) ──
  | "builder-deep-dom"
  | "builder-too-many-fonts"
  | "builder-css-bloat"
  | "shop-cart-broken"
  | "shop-plugin-impact";

export type ScanIssue = {
  /** Stabiler Group-Key für Aggregator-Konsolidierung. Optional für
   *  Backward-Compat mit alten DB-Einträgen ohne kind. */
  kind?:         IssueKind;
  severity:      "red" | "yellow" | "green";
  title:         string;
  body:          string;
  category:      "recht" | "speed" | "technik" | "shop" | "builder";
  /** Single-URL Marker (legacy). Bei konsolidierten Issues ist dies die
   *  ERSTE URL aus affectedUrls — für Backward-Compat mit altem UI-Render. */
  url?:          string;
  /** Liste aller URLs, auf denen dieses Issue auftritt. Vom Aggregator
   *  befüllt. Bei einem Single-Page-Scan = [rootUrl]. Bei einem Full-Scan
   *  Konsolidierung von z.B. 20 Pages mit fehlendem Alt-Text → 20 URLs. */
  affectedUrls?: string[];
  /** Numerische Aggregat-Größe (z.B. "24 Bilder ohne Alt-Text"). Bei
   *  Konsolidierung über N Seiten ist dies die SUMME aller per-page counts. */
  count:         number;
  /**
   * Phase B / Säule 1 — Scope-Klassifikation (vom Aggregator gesetzt):
   *   - "global": Issue tritt auf >= 80% der gecrawlten Seiten auf →
   *     ist mit hoher Wahrscheinlichkeit ein Template-Fehler (Header/Footer/
   *     Layout). UI rendert: "Eine Korrektur im Template behebt alle X Vorkommen."
   *   - "local":  Issue tritt nur auf einzelnen Seiten auf — User muss sie
   *     individuell anschauen.
   *   - undefined bei Single-Page-Scans (Klassifikation braucht totalPages >= 5).
   */
  scope?:        "global" | "local";
};

// ─── Per-Page Input + Output ────────────────────────────────────────────────

export type PageInput = {
  html:    string;
  url:     string;
  /** Standard Headers oder ein Headers-ähnliches Objekt mit get(name).
   *  Wird für detectWordPress genutzt (X-Powered-By, X-Generator, Link). */
  headers: Headers;
  /** HTTP-Status der Page (200, 404, 500, …). 0 = Fetch-Failure (Timeout). */
  status:  number;
  /** Time-to-First-Byte in Millisekunden — vom Crawler gemessen, optional.
   *  Aggregator nutzt das für Site-Wide-Avg-TTFB-Metrik. */
  ttfbMs?: number;
};

/** Was der Auditor pro Seite raus-extrahiert. Wird als Element von
 *  unterseiten_json persistiert UND als Input für den Aggregator genutzt. */
export type PageAudit = {
  // ── Identität + Status ──
  url:                  string;
  status:               number;
  ok:                   boolean;       // status >= 200 && < 400
  // ── DOM-extracted Felder (raw) ──
  title:                string;
  h1:                   string;
  metaDescription:      string;
  noindex:              boolean;
  canonical:            string;
  altMissing:           number;
  altTotal:             number;
  altMissingImages:     string[];      // bis zu 10 src-attribute zur Identifikation
  inputsWithoutLabel:   number;
  inputsWithoutLabelFields: string[];  // bis zu 10 placeholder/name/id
  buttonsWithoutText:   number;
  /** Alle gefundenen internen Links — Aggregator nutzt sie für orphan-Detection. */
  internalLinks:        string[];
  /** TTFB in ms (vom Crawler gemessen) — null wenn nicht erfasst. */
  ttfbMs:               number | null;
  // ── Phase A2: Social & Branding ──
  /** OpenGraph-Tag-Set. False = Tag fehlt → Issue wird generiert. */
  ogTags:               { title: boolean; description: boolean; image: boolean };
  /** Twitter-Card-Tags. */
  twitterCards:         { card: boolean; title: boolean };
  /** Favicon (link rel="icon" oder shortcut icon oder apple-touch-icon). */
  hasFavicon:           boolean;
  // ── Phase A2: Deep SEO & Structure ──
  /** <html lang="..."> Wert oder null wenn nicht gesetzt. */
  htmlLang:             string | null;
  /** Heading-Hierarchie-Validität + Detail (für Issue-Body). */
  headingHierarchy:     { ok: boolean; issue: string | null };
  // ── Phase A2: Security ──
  /** Welche Security-Header fehlen. Aktuell: CSP + HSTS. */
  securityHeadersMissing: string[];
  // ── Per-Seite generierte Issues — bereits mit url, kind, count gefüllt ──
  pageIssues:           ScanIssue[];
};

// ─── Site-Kontext (einmal pro Scan, vom Aggregator gebaut) ──────────────────

export type SiteContext = {
  rootUrl:              string;
  /** True wenn rootUrl mit https:// beginnt. */
  https:                boolean;
  /** True wenn /sitemap.xml einen 2xx-Status liefert. */
  sitemapVorhanden:     boolean;
  /** True wenn /robots.txt "Disallow: /" für User-agent: * enthält. */
  robotsBlockiertAlles: boolean;
  /** Erkannte WordPress-Major-Version (z.B. "6.5"), null wenn nicht WP
   *  oder Generator-Tag versteckt. */
  wpVersion:            string | null;
  /** Phase A2 / Infrastructure-Slot: SSL-Cert-Ablaufdatum als ISO-String.
   *  Aktuell IMMER null — Phase A3 verkabelt tls.connect() für die echte
   *  Cert-Inspection. Existiert hier vorerst nur als Datentyp-Slot, sodass
   *  Aggregator + DB-Schema schon bereit sind. */
  sslExpiresAt:         string | null;
};

// ─── Final Scan-Result (1:1 die 11 DB-Spalten der scans-Tabelle) ────────────

export type ScanMetadata = {
  /** Builder-Audit-Meta — wird in Phase B aus analyzeBuilderHtml migriert. */
  builder_audit?:      BuilderAuditMeta | null;
  /** Woo-Audit-Meta — wird in Phase B migriert. */
  woo_audit?:          WooAuditMeta     | null;
  /** TTFB der Root-Page in Millisekunden. */
  ttfb_ms?:            number           | null;
};

export type BuilderAuditMeta = {
  builder:             string | null;
  maxDomDepth:         number;
  divCount:            number;
  googleFontFamilies:  string[];
  cssBloatHints:       string[];
  stylesheetCount:     number;
};

export type WooAuditMeta = {
  addToCartButtons:    number;
  cartButtonsBlocked:  boolean;
  pluginImpact:        Array<{ name: string; impactScore: number; reason: string }>;
  outdatedTemplates:   boolean;
  revenueRiskPct:      number;
};

/** Was der Aggregator zurückgibt. 1:1 die DB-Spalten der scans-Tabelle. */
export type ScanResult = {
  // ── DB-Identität ──
  type:                "website" | "fullsite";
  url:                 string;
  // ── Issue-Layer (issues_json + issue_count) ──
  issues:              ScanIssue[];
  issueCount:          number;
  // ── Per-Page-Layer (unterseiten_json + total_pages) ──
  unterseiten:         PageAudit[];
  totalPages:          number;
  // ── Audit-Layer (tech_fingerprint + speed_score + meta_json) ──
  techFingerprint:     unknown | null;
  speedScore:          number;
  meta:                ScanMetadata;
  // ── Site-Wide Metrics (Helikopter-Blick, Säule 3) ──
  /** Mittelwert aller TTFB-Werte über erreichbare Pages. Null wenn keine
   *  Page eine TTFB-Messung lieferte. */
  avgTtfbMs:           number | null;
  /** Heuristischer WCAG-Score (0-100) — basiert auf recht-kategorisierten
   *  Issues, NICHT auf echtem axe-core-Audit. UI muss explizit als
   *  "Heuristik · zertifizierter Audit folgt" labeln. */
  wcagHeuristicScore:  number;
  /** Phase A2: expliziter Disclaimer-String, den UIs anzeigen müssen wenn
   *  sie wcagHeuristicScore rendern. Nicht ableiten lassen — kommt direkt
   *  aus dem Aggregator-Output, sodass keine Frontend-Variante "echter
   *  Audit" suggeriert. */
  wcagHeuristicLabel:  string;
  // ── Prosa-Layer (result) ──
  /** Claude-generierter Diagnose-Text. Wird VOM CALLER nach consolidateScans()
   *  per Anthropic-API gefüllt — der Aggregator selbst ruft kein AI auf,
   *  damit er deterministisch + testbar bleibt. */
  diagnose:            string;
};
