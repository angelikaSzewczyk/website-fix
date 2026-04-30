/**
 * dashboard-types — Phase-2-Iter-3 Shared-Types.
 *
 * Vorher in jedem Variant dupliziert. Ein zentrales Modul für alle
 * Dashboard-Datenstrukturen (Issues, Subpages, Scan-Brief), damit
 * Variant + extrahierte Sektionen die gleichen Typen referenzieren.
 *
 * Builder/Woo-spezifische Types leben in builder-utils.ts.
 */

export interface ParsedIssueProp {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  count?: number;
  url?: string;
  affectedUrls?: string[];
  scope?:        "global" | "local";
}

export interface ScanBriefProp {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
}

export interface UnterseiteProp {
  url: string;
  erreichbar: boolean;
  title: string;
  h1?: string;
  noindex: boolean;
  altMissing: number;
  altMissingImages?: string[];
  metaDescription?: string;
  inputsWithoutLabel?: number;
  inputsWithoutLabelFields?: string[];
  buttonsWithoutText?: number;
  /** Where the crawler found this URL (parent page url or "sitemap") */
  foundVia?: string;
}
