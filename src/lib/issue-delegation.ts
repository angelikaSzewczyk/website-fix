/**
 * Junior-Solvable Classifier — Single Source für die Delegations-Logik.
 *
 * Frage, die wir damit beantworten: "Welche Issues kann ein Werkstudent /
 * Junior-Dev mit 3-12 Monaten WordPress-Erfahrung über das Backend lösen,
 * ohne dass ein Senior-Entwickler oder Hosting-Zugang nötig ist?"
 *
 * Diese Klassifizierung treibt:
 *   - Das Delegations-Widget im Agency-Dashboard (Zähler "X von Y Issues
 *     durch Junior lösbar" + Lohnkosten-Ersparnis)
 *   - Die Landingpage-Argumentation (Profit-Center-Narrativ)
 *
 * Konservative Heuristik — wenn unklar, klassifizieren wir als "senior"
 * (False-Negative). Lieber 8/15 als "junior-solvable" zeigen wenn 12/15
 * realistisch wären, als 12/15 versprechen und 4 davon klappen nicht.
 *
 * Wertehaltung:
 *   - Junior-solvable = WP-Backend, Yoast/Rank-Math-Plugin, Medien-Manager,
 *     Editor-Felder, Theme-Customizer, Cookie-Banner-Plugin-Config.
 *   - Senior-required = Code-Edits, Server-Config (.htaccess, nginx),
 *     SSL-Cert-Renew, Plugin-Konflikte mit DB-Änderungen, Performance-
 *     Tuning, Security-Patches, Custom-PHP/JS.
 */

import type { ClassifiableWpIssue } from "./wp-health";

/** Strikt junior-lösbar: WP-Backend, Plugin-Config, Medien-Manager. */
const JUNIOR_KEYWORDS_RE = new RegExp([
  // SEO-Basics — alles im Yoast/Rank-Math UI
  "title.?tag", "kein.*title", "meta.?desc", "meta.?beschreib",
  "h1\\b", "hauptüberschrift", "noindex", "indexier.*ein",
  "doppelt.*title", "doppelt.*meta", "duplicate.*title", "duplicate.*meta",
  // Bilder & Medien
  "alt.?text", "alt.?attribut", "alternativtext", "bilder ohne alt",
  // Formular-Labels
  "formular.?label", "label fehlt", "aria-label", "input.*label",
  // Broken Links — Junior kann via Plugin (Broken Link Checker) o. WP-Editor
  "broken.?link", "tote.?link", "404.?link", "404.?fehler",
  // Sitemap — Yoast/Rank-Math Toggle
  "sitemap.?fehlt", "keine.?sitemap",
  // Cookie-Banner — Plugin-Config (Borlabs/Complianz/Cookiebot)
  "cookie.?banner", "consent.?banner", "borlabs", "complianz", "cookiebot", "cookieyes",
  // Impressum / Datenschutz-Texte — UI-Edit
  "impressum.?fehlt", "datenschutz.?fehlt", "rechtstext.?fehlt",
].join("|"), "i");

/** Klar Senior-only — Code, Server, Security, Performance-Tuning. */
const SENIOR_KEYWORDS_RE = new RegExp([
  // Server / Infrastruktur
  "ssl", "tls", "hsts", "\\.htaccess", "nginx", "ttfb", "server.?antwort",
  // Performance-Tuning (echte Code-Arbeit)
  "lcp", "cls", "fcp", "tbt", "inp\\b", "render.?blocking",
  "unused.?css", "unused.?js", "css.?bloat", "js.?bloat",
  "dom.?tiefe", "dom.?depth", "kb.?ersp", "byte.?ersp",
  // Security / WP-Patches
  "wordpress veraltet", "wordpress.?version", "xmlrpc", "wp.?login.?brute",
  "security.?header", "content-security-policy", "x-frame-options",
  // Plugin-Konflikte & DB
  "plugin.?konflikt", "database.?bloat", "db.?bloat", "cart.?fragment",
  // Caching / Hosting
  "redis", "object.?cache", "page.?cache", "varnish",
  // Code-spezifisch
  "canonical.*custom", "robots\\.txt.*editieren",
].join("|"), "i");

export type DelegationLevel = "junior" | "senior";

/**
 * Klassifiziert ein Issue konservativ.
 *
 * Reihenfolge: SENIOR-Match gewinnt vor JUNIOR-Match (sonst würde "TTFB
 * langsam" über das "title.?tag"-Pattern zufällig junior-true werden via
 * "title" → "ttfbtitle" — kein Match, aber das Risiko illustriert das
 * Defaulting). Bei Mehrdeutigkeit: senior.
 */
export function classifyDelegation(issue: ClassifiableWpIssue): DelegationLevel {
  const text = `${issue.title} ${issue.body ?? ""}`.toLowerCase();
  if (SENIOR_KEYWORDS_RE.test(text)) return "senior";
  if (JUNIOR_KEYWORDS_RE.test(text)) return "junior";
  // Default-by-Severity: yellow + "recht"-Kategorie sind im Schnitt
  // backend-lösbar; alles andere geht im Zweifel an Senior.
  if (issue.severity === "yellow" && issue.category === "recht") return "junior";
  return "senior";
}

export type DelegationStats = {
  totalIssues:          number;
  juniorSolvableCount:  number;
  seniorRequiredCount:  number;
  /** Anteil junior-lösbar (0-1). */
  juniorRatio:          number;
  /** Geschätzte monatliche Lohnkosten-Ersparnis bei Delegation an Junior.
   *  Annahme: 1 h pro Issue, Senior @ €100, Junior @ €35 → €65 Ersparnis. */
  monthlySavingsEur:    number;
};

const SENIOR_HOURLY_EUR = 100;
const JUNIOR_HOURLY_EUR = 35;
const HOURS_PER_ISSUE   = 1;

/**
 * Aggregiert Delegations-Stats über alle Issues hinweg. Verwendet vom
 * Agency-Dashboard-Widget für die Übersichts-Anzeige.
 */
export function computeDelegationStats(issues: ClassifiableWpIssue[]): DelegationStats {
  const total = issues.length;
  let junior = 0;
  for (const i of issues) {
    if (classifyDelegation(i) === "junior") junior++;
  }
  const senior = total - junior;
  return {
    totalIssues:          total,
    juniorSolvableCount:  junior,
    seniorRequiredCount:  senior,
    juniorRatio:          total === 0 ? 0 : junior / total,
    monthlySavingsEur:    junior * HOURS_PER_ISSUE * (SENIOR_HOURLY_EUR - JUNIOR_HOURLY_EUR),
  };
}

/** Konstanten exportiert für UI-Texte / Tooltip-Erklärungen. */
export const DELEGATION_ASSUMPTIONS = {
  seniorHourlyEur: SENIOR_HOURLY_EUR,
  juniorHourlyEur: JUNIOR_HOURLY_EUR,
  hoursPerIssue:   HOURS_PER_ISSUE,
  /** Pro fix → 65 € Ersparnis (Senior-Stundensatz - Junior-Stundensatz). */
  savingsPerIssueEur: SENIOR_HOURLY_EUR - JUNIOR_HOURLY_EUR,
} as const;
