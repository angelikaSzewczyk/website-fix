/**
 * WP-Health-Score — WordPress-spezifische Bewertung der Site-Gesundheit.
 *
 * Gegen die Audit-Kritik "Das Dashboard sagt nur 'Da ist ein Fehler'": diese
 * Datei klassifiziert jedes ScanIssue auf einen WordPress-Layer und berechnet
 * einen Sub-Score pro Layer. Damit kann die UI sagen:
 *   "Plugins-Score 71/100 (3 Plugins blockieren das Rendering)"
 *   statt
 *   "Es gibt 12 Issues."
 *
 * Vier Layer, exakt aus dem Pricing-Versprechen:
 *   1. core           — WP-Core-Updates, Login-Sicherheit, XML-RPC, Datei-Strukturen
 *   2. plugins        — Plugin-Impact, Cart-Fragments, WooCommerce-Plugins,
 *                       Render-blocking Scripts
 *   3. themes         — Builder-Bloat (Elementor/Divi/WPBakery), DOM-Tiefe,
 *                       Google-Fonts, CSS-Bloat
 *   4. accessibility  — WCAG/BFSG: Alt-Texte, Form-Labels, ARIA, Kontrast
 *
 * Der Score-Algorithmus ist absichtlich einfach: pro Layer
 *   start = 100
 *   minus 12 pro red-Issue, 5 pro yellow-Issue (mit count-Multiplier-Cap)
 * Das gibt eine Spreizung wie PSI-Scores: 90+ = grün, 70-89 = gelb, <70 = rot.
 *
 * Wichtig: Der Score ist KEIN ML-Modell — er ist deterministisch und in 5
 * Zeilen reproduzierbar. Damit ein Agency-User die Zahl gegenüber dem Kunden
 * verteidigen kann ("Hier ist die Liste der 4 Plugins, die deinen Score
 * runterziehen") und nicht raten muss.
 */

export type WpLayer = "core" | "plugins" | "themes" | "accessibility";

export type ClassifiableWpIssue = {
  title: string;
  body?: string;
  severity: "red" | "yellow" | "green";
  /** Datenmodell-Kategorie (recht | speed | technik | shop | builder). */
  category: string;
  /** Anzahl Vorkommen (z.B. 24 fehlende Alt-Texte). */
  count?: number;
};

export type WpLayerMeta = {
  label: string;
  shortLabel: string;
  description: string;
  /** Hex-Farbe für UI-Akzent. */
  accent: string;
  /** Icon-Hint für SVG-Selector (rendered im UI separat). */
  icon: "core" | "plugin" | "theme" | "a11y";
};

export const WP_LAYER_META: Record<WpLayer, WpLayerMeta> = {
  core: {
    label:       "WordPress Core",
    shortLabel:  "Core",
    description: "WP-Version, Login-Sicherheit, Datei-Struktur",
    accent:      "#0073AA",
    icon:        "core",
  },
  plugins: {
    label:       "Plugins",
    shortLabel:  "Plugins",
    description: "Plugin-Impact, Cart-Fragments, blockierende Scripts",
    accent:      "#46B450",
    icon:        "plugin",
  },
  themes: {
    label:       "Theme & Builder",
    shortLabel:  "Theme",
    description: "Elementor/Divi/Gutenberg-Bloat, DOM-Tiefe, CSS",
    accent:      "#826EB4",
    icon:        "theme",
  },
  accessibility: {
    label:       "Barrierefreiheit",
    shortLabel:  "BFSG",
    description: "WCAG: Alt-Texte, Form-Labels, ARIA, Kontrast",
    accent:      "#A78BFA",
    icon:        "a11y",
  },
};

export const WP_LAYERS: WpLayer[] = ["core", "plugins", "themes", "accessibility"];

// ─── Pattern-Definitionen ────────────────────────────────────────────────────
// Reihenfolge im Classifier: A11Y zuerst (höchste Spezifität), dann Plugins
// (WooCommerce/Cart-Fragments-Strings sind eindeutig), dann Themes (Builder
// + DOM-Tiefe), Core als Fallback für WP-spezifische technische Issues.

const A11Y_PATTERN     = /alt.?text|alt.?attribut|alternativtext|aria-|formular.?label|fehlt.*label|barriere|bfsg|wcag|screenreader|kontrast|tab.?index|fokus.?reihenfolge|button.*ohne.*text/i;

// Plugins: alles was nach Plugin-Impact klingt + WooCommerce-Marker.
// Dies ist die "Plugin-Performance"-Kategorie aus dem Audit.
const PLUGIN_PATTERN   = /plugin.?impact|cart.?fragment|woocommerce|wc-ajax|database.?bloat|db.?bloat|wp-admin|xml-?rpc|wp-?login|brute.?force|render.?blocking|unused.?js|jquery.?duplicate|outdated.?plugin/i;

// Themes & Builder: alles was am Theme/Builder-Layer hängt.
const THEME_PATTERN    = /elementor|divi|gutenberg|astra|wpbakery|beaver|builder|dom.?tiefe|dom.?depth|google.?font|css.?bloat|stylesheet|unused.?css|theme/i;

// Core: WordPress-Version, Sicherheits-Härtung, robots/sitemap, https/ssl.
// Bewusst eng — sonst landet hier zu viel.
const CORE_PATTERN     = /wordpress veraltet|wordpress.?version|wp.?version|core.?outdated|readme\.html|sitemap|robots\.txt|\bhttps\b|\bssl\b|\btls\b|hsts|security.?header|directory.?listing/i;

/**
 * Klassifiziert ein ScanIssue auf einen WP-Layer. Reihenfolge ist signifikant
 * — A11Y > Plugins > Themes > Core. Items, die durch keine der vier Patterns
 * fallen, landen by-default auf "core" (das schwächste Statement, weil Core
 * der breiteste Layer ist).
 */
export function classifyWpLayer(issue: ClassifiableWpIssue): WpLayer {
  const text = (issue.title + " " + (issue.body ?? "")).toLowerCase();

  if (A11Y_PATTERN.test(text)) return "accessibility";

  // Daten-Kategorie "shop" → IMMER Plugins (WooCommerce-Issues).
  if (issue.category === "shop") return "plugins";
  if (PLUGIN_PATTERN.test(text)) return "plugins";

  // Daten-Kategorie "builder" → IMMER Themes (Elementor/Divi-DOM-Bloat).
  if (issue.category === "builder") return "themes";
  if (THEME_PATTERN.test(text)) return "themes";

  // Core ist der Fallback. WP-spezifische Marker kicken hier rein.
  if (CORE_PATTERN.test(text)) return "core";
  if (issue.category === "speed") return "themes"; // Speed ohne Builder-Marker → meist Theme-CSS
  if (issue.category === "recht") return "core";   // DSGVO/Compliance

  return "core";
}

// ─── Score-Berechnung ────────────────────────────────────────────────────────

export type WpHealthScore = {
  /** Gewichteter Mittelwert über alle 4 Layer. */
  overall: number;
  /** Sub-Score pro Layer. Issues = Anzahl Issues IN diesem Layer. */
  layers: Record<WpLayer, { score: number; issues: number; redIssues: number; yellowIssues: number }>;
};

/**
 * Berechnet den WP-Health-Score aus einer Issue-Liste.
 *
 * Pro Layer:
 *   start = 100
 *   minus min(60, sum(red * 12 + yellow * 5))
 *
 * Damit kann ein einzelner kritischer Issue den Layer auf 88 drücken,
 * aber niemals unter 40 (Cap), weil "30 Plugins-Issues" sonst -360 ergäbe.
 *
 * Overall = gewichteter Mittelwert. Plugins+Themes haben höheres Gewicht (1.2),
 * weil die in der Praxis die Geschwindigkeit dominieren; Accessibility
 * (BFSG-Pflicht) bekommt 1.0; Core 0.8 (defensiv, Core-Issues sind selten).
 */
const LAYER_WEIGHTS: Record<WpLayer, number> = {
  core:          0.8,
  plugins:       1.2,
  themes:        1.2,
  accessibility: 1.0,
};

export function computeWpHealthScore<T extends ClassifiableWpIssue>(issues: T[]): WpHealthScore {
  const buckets: Record<WpLayer, T[]> = {
    core: [], plugins: [], themes: [], accessibility: [],
  };
  for (const i of issues) {
    buckets[classifyWpLayer(i)].push(i);
  }

  const layers: WpHealthScore["layers"] = {
    core:          { score: 100, issues: 0, redIssues: 0, yellowIssues: 0 },
    plugins:       { score: 100, issues: 0, redIssues: 0, yellowIssues: 0 },
    themes:        { score: 100, issues: 0, redIssues: 0, yellowIssues: 0 },
    accessibility: { score: 100, issues: 0, redIssues: 0, yellowIssues: 0 },
  };

  for (const layer of WP_LAYERS) {
    const items = buckets[layer];
    let deduction = 0;
    let red = 0;
    let yel = 0;
    for (const item of items) {
      if (item.severity === "red")    { deduction += 12; red++; }
      else if (item.severity === "yellow") { deduction += 5; yel++; }
    }
    layers[layer].issues       = items.length;
    layers[layer].redIssues    = red;
    layers[layer].yellowIssues = yel;
    layers[layer].score        = Math.max(40, 100 - Math.min(60, deduction));
  }

  let weightedSum = 0;
  let weightTotal = 0;
  for (const layer of WP_LAYERS) {
    weightedSum += layers[layer].score * LAYER_WEIGHTS[layer];
    weightTotal += LAYER_WEIGHTS[layer];
  }
  const overall = Math.round(weightedSum / weightTotal);

  return { overall, layers };
}

// ─── Plugin-Diff (für Live-Monitor) ──────────────────────────────────────────

/**
 * Vergleicht zwei Plugin-Listen (stringified Plugin-Slugs) und liefert die Differenz.
 * Verwendet von /api/cron/monitor: erkennt neue Plugins, die zwischen zwei Checks
 * dazugekommen sind. Reihenfolge ist egal, Case-Insensitive.
 */
export function diffPluginLists(prev: string[] | null, current: string[]): {
  added:    string[];
  removed:  string[];
  unchanged: string[];
} {
  if (!prev || prev.length === 0) {
    return { added: [...new Set(current.map(s => s.toLowerCase()))], removed: [], unchanged: [] };
  }
  const prevSet    = new Set(prev.map(s => s.toLowerCase()));
  const currentSet = new Set(current.map(s => s.toLowerCase()));
  const added: string[]   = [];
  const removed: string[] = [];
  const unchanged: string[] = [];
  for (const s of currentSet) {
    if (prevSet.has(s)) unchanged.push(s);
    else added.push(s);
  }
  for (const s of prevSet) {
    if (!currentSet.has(s)) removed.push(s);
  }
  return { added, removed, unchanged };
}

/**
 * Extrahiert die Plugin-/Builder-Liste aus einem TechFingerprint-ähnlichen Objekt.
 * Liefert eine flache Liste von Plugin-Slugs (lowercase). Robust gegenüber
 * unterschiedlichen Fingerprint-Schemas — wir picken nur, was sicher da ist.
 *
 * Akzeptiertes Schema (neon JSON):
 *   {
 *     cms:     { value: "WordPress", confidence: 0.9 },
 *     builder: { value: "Elementor", confidence: 0.7 },
 *     ecommerce: { value: "WooCommerce", confidence: 0.8 },
 *     plugins: ["yoast", "rankmath"]   // optional
 *   }
 */
export function pluginsFromFingerprint(fp: unknown): string[] {
  if (!fp || typeof fp !== "object") return [];
  const out = new Set<string>();
  const f = fp as Record<string, unknown>;

  // explicit plugins-array
  const plugins = f.plugins;
  if (Array.isArray(plugins)) {
    for (const p of plugins) {
      if (typeof p === "string" && p.trim()) out.add(p.trim().toLowerCase());
    }
  }

  // builder + ecommerce als implizite Plugins (für Diff-Vergleich)
  for (const key of ["builder", "ecommerce", "cms"] as const) {
    const v = f[key];
    if (v && typeof v === "object") {
      const value = (v as Record<string, unknown>).value;
      if (typeof value === "string" && value.trim() && value !== "Unknown") {
        out.add(value.trim().toLowerCase());
      }
    }
  }

  return [...out];
}

// ─── CMS-Context (Single Source für Fix-Guides) ──────────────────────────────

/**
 * Leitet den CMS-Context-String aus einem TechFingerprint ab. Der Wert wird
 * in website_checks.cms_context gespeichert und von lib/fix-guides.ts
 * konsumiert, um kontextspezifische Anleitungen zu rendern.
 *
 * Werte (kanonisch, lowercase):
 *   "elementor" | "divi" | "gutenberg" | "astra" | "wpbakery" | "beaver" |
 *   "wordpress" (Klassisch ohne erkennbaren Builder) | null (kein WP)
 */
export function detectCmsContext(fp: unknown): string | null {
  if (!fp || typeof fp !== "object") return null;
  const f = fp as Record<string, unknown>;
  const cms = (f.cms as { value?: string } | undefined)?.value;
  if (cms !== "WordPress") return null; // wir labeln nur WP-Sites

  const builder = (f.builder as { value?: string; confidence?: number } | undefined);
  if (builder?.value && (builder.confidence ?? 0) >= 0.45) {
    const v = builder.value.toLowerCase();
    if (v.includes("elementor"))  return "elementor";
    if (v.includes("divi"))        return "divi";
    if (v.includes("gutenberg"))   return "gutenberg";
    if (v.includes("astra"))       return "astra";
    if (v.includes("wpbakery"))    return "wpbakery";
    if (v.includes("beaver"))      return "beaver";
    return v;
  }

  // Fallback: WordPress ohne erkennbaren Builder → "gutenberg" (Block-Editor
  // ist seit WP 5.0 default). Damit sind die Fix-Guides nie generisch leer.
  return "gutenberg";
}
