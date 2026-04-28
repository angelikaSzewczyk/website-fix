/**
 * Single Source of Truth für die 4 Anzeige-Kategorien (Phase-3-Refactor).
 *
 * Datenmodell-Kategorien (`recht | speed | technik | shop | builder`) bleiben
 * unangetastet — alte Scans in der DB funktionieren weiter. Diese Datei mappt
 * jedes ScanIssue auf eine der 4 *Display*-Kategorien:
 *
 *   1. performance     — Ladezeit, Core Web Vitals, DOM-Tiefe, KB-Savings
 *   2. seo             — Title/Meta/H1, Indexierung, Sitemap, Canonical
 *   3. bestPractices   — WP-Version, SSL/HSTS, Security-Header, DSGVO/Cookies
 *   4. accessibility   — WCAG/BFSG-Verstöße (Alt-Texte, Form-Labels, ARIA, Kontrast)
 *
 * Klassifizierung erfolgt über Keyword-Matching auf Title+Body — das ist
 * robuster als der Daten-Kategorie-Wert allein, weil "technik" historisch
 * sowohl SEO- als auch Security-Themen enthält.
 */

export type DisplayCategory = "performance" | "seo" | "bestPractices" | "accessibility";

export type ClassifiableIssue = {
  title:    string;
  body?:    string;
  category: string;  // raw data category ("recht" | "speed" | "technik" | "shop" | "builder")
};

// ─── Pattern-Definitionen ────────────────────────────────────────────────────
//
// Reihenfolge ist wichtig: A11Y zuerst, weil "BFSG-Verstoß: 24 Bilder" sonst
// vom SEO-Pattern (würde "Bilder" matchen) abgegriffen würde. Danach Security
// + Compliance vor SEO, weil "WordPress veraltet" sonst auf SEO durchschlüge.

const A11Y_PATTERN     = /alt.?text|alt.?attribut|alternativtext|aria-|formular.?label|fehlt.*label|barriere|bfsg|wcag|screenreader|kontrast|tab.?index|fokus.?reihenfolge/i;
const PERF_PATTERN     = /lcp|cls|fcp|tbt|inp\b|ttfb|ladezeit|pagespeed|core web|render.?blocking|cart.?fragment|plugin.?impact|database.?bloat|db.?bloat|dom.?tiefe|dom.?depth|css.?bloat|stylesheet|webp|bilder.?komprim|caching|\bcache\b|kb.?ersp|byte.?ersp|unused.?css|unused.?js/i;
const SECURITY_PATTERN = /\bhttps\b|\bssl\b|\btls\b|hsts|wp.?login|xmlrpc|wp.?admin|brute.?force|wordpress veraltet|wordpress.?version|security.?header|content-security-policy/i;
const COMPLIANCE_PATTERN = /dsgvo|datenschutz|\bcookie\b|consent|impressum|rechtstext|rechtspflicht|borlabs|complianz|cookiebot|cookieyes|usercentrics|google.?maps|youtube.?embed|google.?fonts|facebook.?pixel|google.?analytics|matomo/i;
const SEO_PATTERN      = /title.?tag|kein.*title|h1\b|hauptüberschrift|meta.?desc|snippet|sitemap|noindex|indexier|canonical|robots\.txt|duplicate|doppelt.*title|doppelt.*meta|broken|tote.?link|verwaist|orphan|verlinkung/i;

// ─── Classifier ──────────────────────────────────────────────────────────────
export function classifyDisplayCategory(issue: ClassifiableIssue): DisplayCategory {
  const text = (issue.title + " " + (issue.body ?? "")).toLowerCase();

  // 1. Accessibility — höchste Spezifität (BFSG/WCAG-Kram ist eindeutig)
  if (A11Y_PATTERN.test(text)) return "accessibility";

  // 2. Best Practices — Security + Compliance vor SEO/Performance,
  //    weil "WordPress veraltet" sonst von SEO_PATTERN nicht erfasst wird
  //    (kein Title/H1/Meta) aber unbeabsichtigt am Default landet
  if (SECURITY_PATTERN.test(text)) return "bestPractices";
  if (COMPLIANCE_PATTERN.test(text)) return "bestPractices";

  // 3. Performance — Keyword-Match ODER Daten-Kategorie speed/shop/builder
  if (PERF_PATTERN.test(text)) return "performance";
  if (issue.category === "speed" || issue.category === "shop" || issue.category === "builder") {
    return "performance";
  }

  // 4. SEO — Keyword-Match
  if (SEO_PATTERN.test(text)) return "seo";

  // 5. Fallbacks: data-Kategorie als letzte Stütze
  if (issue.category === "recht")   return "bestPractices"; // DSGVO/Compliance ohne Keyword
  if (issue.category === "technik") return "seo";           // generisches "technik" → eher SEO

  // 6. Wirklich unklar
  return "seo";
}

// ─── UI-Metadata pro Kategorie ──────────────────────────────────────────────
export type CategoryMeta = {
  label:       string;
  shortLabel:  string;
  description: string;
  /** Hex-Farbe für UI-Akzent (z.B. Score-Ring im Best-State). */
  accent:      string;
};

export const CATEGORY_META: Record<DisplayCategory, CategoryMeta> = {
  performance: {
    label:       "Performance",
    shortLabel:  "Performance",
    description: "Ladezeit, Core Web Vitals, DOM-Tiefe & KB-Savings",
    accent:      "#7aa6ff",
  },
  seo: {
    label:       "SEO-Basics",
    shortLabel:  "SEO",
    description: "Indexierung, Meta-Tags, H1 & Canonical",
    accent:      "#10B981",
  },
  bestPractices: {
    label:       "Best Practices",
    shortLabel:  "Sicherheit",
    description: "WP-Version, SSL, Security-Header & DSGVO",
    accent:      "#FBBF24",
  },
  accessibility: {
    label:       "Barrierefreiheit",
    shortLabel:  "A11y",
    description: "WCAG/BFSG: Alt-Texte, Form-Labels & ARIA",
    accent:      "#A78BFA",
  },
};

export const DISPLAY_CATEGORIES: DisplayCategory[] = [
  "performance", "seo", "bestPractices", "accessibility",
];

// ─── Score-Helper ────────────────────────────────────────────────────────────
//
// Berechnet 0-100 pro Kategorie aus der Issue-Liste. Performance bekommt den
// PSI-Speed-Score als Baseline (genauer als Heuristik). Andere Kategorien
// leiten Punkte ab (red=10, yellow=4 als Default — für genauere Gewichtung
// nutzt der Caller `getCategoryDeductions` mit eigenen Punkten).

type WithSeverity = { severity: "red" | "yellow" | "green"; count?: number };

export function quickCategoryScore<T extends ClassifiableIssue & WithSeverity>(
  issues: T[],
  cat: DisplayCategory,
  /** Baseline: bei Performance = speedScore aus PSI, sonst 100. */
  baseline = 100,
): number {
  const inCat = issues.filter(i => classifyDisplayCategory(i) === cat);
  if (inCat.length === 0) return Math.max(12, baseline);

  let deduction = 0;
  for (const i of inCat) {
    if (i.severity === "red")    deduction += 10;
    else if (i.severity === "yellow") deduction += 4;
  }
  return Math.max(12, Math.min(100, baseline - deduction));
}
