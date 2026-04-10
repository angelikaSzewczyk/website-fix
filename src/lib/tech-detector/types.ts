/**
 * tech-detector/types.ts
 * All type definitions for the WebsiteFix technology detection engine.
 */

// ─── Raw signal container ─────────────────────────────────────────────────────

/** Everything fetched from a target website */
export interface RawWebsiteData {
  url:        string;
  finalUrl:   string;          // after redirects
  isHttps:    boolean;
  statusCode: number;
  html:       string;          // full page source (capped at 512 KB)
  headers:    Record<string, string>;
  scriptUrls: string[];        // all <script src="..."> values
  linkUrls:   string[];        // all <link href="..."> values
  metaTags:   Record<string, string>; // name/property → content
  fetchedAt:  string;          // ISO timestamp
  error?:     string;
}

// ─── Detection rules ──────────────────────────────────────────────────────────

export type SignalSource =
  | "html"        // raw HTML body (lowercased)
  | "header"      // HTTP header value (lowercased)
  | "script-url"  // any script src URL
  | "link-url"    // any link href URL
  | "meta"        // meta tag content
  | "url";        // the page URL itself

export type DetectionCategory =
  | "cms"
  | "builder"
  | "framework"
  | "ecommerce"
  | "server"
  | "phpVersion"
  | "ssl"
  | "hosting"
  | "tracking"
  | "analytics"
  | "tagManager";

/**
 * A single detection rule.
 * Rules are applied to the corresponding signal source.
 * weight must be in range [0.1, 1.0].
 */
export interface DetectionRule {
  /** Which category this rule detects */
  category:   DetectionCategory;
  /** The technology name to assign if this rule matches */
  value:      string;
  /** Where to look for the signal */
  source:     SignalSource;
  /**
   * For header rules: the header name (lowercased).
   * For meta rules: the meta name/property.
   * Not used for html/script-url/link-url/url sources.
   */
  key?:       string;
  /** Regex or plain string pattern (tested against the lowercased signal) */
  pattern:    RegExp | string;
  /** Confidence contribution [0.1–1.0] — multiple rules can stack */
  weight:     number;
  /** Human-readable description of what was found (used in evidence array) */
  evidence:   string;
}

// ─── Detection result ─────────────────────────────────────────────────────────

export const UNKNOWN = "Nicht eindeutig erkannt" as const;
export type UnknownLabel = typeof UNKNOWN;

/** Result for a single technology category */
export interface DetectedValue {
  value:      string | UnknownLabel;
  confidence: number;             // 0.0 – 1.0
  evidence:   string[];
}

/** Minimum confidence to accept a detected value (below = UNKNOWN) */
export const CONFIDENCE_THRESHOLD = 0.45;

// ─── Full fingerprint ─────────────────────────────────────────────────────────

export interface TechFingerprint {
  cms:        DetectedValue;
  builder:    DetectedValue;
  framework:  DetectedValue;
  ecommerce:  DetectedValue;
  server:     DetectedValue;
  phpVersion: DetectedValue;
  ssl:        DetectedValue;
  hosting:    DetectedValue;
  tracking:   DetectedValue[];    // can be multiple (GTM + GA + Pixel)
  analytics:  DetectedValue;
  tagManager: DetectedValue;
}

/** Final output of the detection engine */
export interface DetectionResult {
  targetUrl:   string;
  finalUrl:    string;
  scannedAt:   string;
  fingerprint: TechFingerprint;
  rawSignals?: RawWebsiteData;    // only included if debug=true
}

// ─── Dashboard adapter output ─────────────────────────────────────────────────

/** Flattened label format for dashboard display */
export interface DashboardFingerprint {
  cms:        string;
  builder:    string | null;     // null = omit from display
  framework:  string | null;
  ecommerce:  string | null;
  server:     string;
  phpVersion: string | null;
  ssl:        string;
  hosting:    string | null;
  analytics:  string | null;
  tagManager: string | null;
  tracking:   string[];          // all detected trackers
}
