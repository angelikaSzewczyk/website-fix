/**
 * tech-detector/adapter.ts
 *
 * Transforms a full TechFingerprint into a flat DashboardFingerprint
 * ready for display in the WebsiteFix dashboard.
 *
 * Rules:
 * - Values at or above CONFIDENCE_THRESHOLD are shown as-is
 * - Everything below threshold shows as null (omitted from display)
 * - SSL is always shown (never null — it's either active or a warning)
 * - Tracking is a string[] so the dashboard can render all detected trackers
 */

import type { TechFingerprint, DashboardFingerprint, DetectedValue } from "./types";
import { CONFIDENCE_THRESHOLD, UNKNOWN } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the value if confidence is sufficient, otherwise null */
function valueOrNull(detected: DetectedValue): string | null {
  if (detected.confidence < CONFIDENCE_THRESHOLD) return null;
  if (detected.value === UNKNOWN) return null;
  return detected.value;
}

/** Returns the value or UNKNOWN — for fields that should always show something */
function valueOrUnknown(detected: DetectedValue): string {
  if (detected.confidence < CONFIDENCE_THRESHOLD) return UNKNOWN;
  return detected.value;
}

// ─── Label formatting ─────────────────────────────────────────────────────────

/**
 * Converts internal value to a localised dashboard label.
 * Most values are already in final form — only SSL gets special formatting.
 */
function formatSsl(detected: DetectedValue): string {
  if (detected.value === "Kein SSL / HTTP") return "Kein SSL ⚠";
  if (detected.value.startsWith("SSL aktiv")) return "Aktiv";
  return detected.value;
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

/**
 * Transforms a TechFingerprint into dashboard-ready labels.
 *
 * Usage:
 *   const labels = fingerprintToDisplay(result.fingerprint);
 *   // labels.cms → "WordPress" | "Nicht eindeutig erkannt"
 *   // labels.builder → "Elementor" | null  (null = omit pill from UI)
 */
export function fingerprintToDisplay(fp: TechFingerprint): DashboardFingerprint {
  return {
    cms:        valueOrUnknown(fp.cms),
    builder:    valueOrNull(fp.builder),
    framework:  valueOrNull(fp.framework),
    ecommerce:  valueOrNull(fp.ecommerce),
    server:     valueOrUnknown(fp.server),
    phpVersion: valueOrNull(fp.phpVersion),
    ssl:        formatSsl(fp.ssl),
    hosting:    valueOrNull(fp.hosting),
    analytics:  valueOrNull(fp.analytics),
    tagManager: valueOrNull(fp.tagManager),
    tracking:   fp.tracking
      .filter(t => t.confidence >= CONFIDENCE_THRESHOLD && t.value !== UNKNOWN)
      .map(t => t.value),
  };
}

/**
 * Builds an ordered array of chips for the tech strip in the dashboard.
 * Each chip has a label, value, and a semantic color category.
 *
 * Chips are only included when a value is present (not null).
 * The order matches the visual hierarchy: CMS → Builder → Framework
 *   → E-Commerce → Server → PHP → SSL → Tracking → Analytics → Tag Manager.
 */
export interface TechChip {
  label:    string;
  value:    string;
  color:    "blue" | "purple" | "teal" | "green" | "amber" | "red" | "muted";
  /** Human-readable confidence string, e.g. "96%" */
  confidence: string;
}

export function buildTechChips(fp: TechFingerprint): TechChip[] {
  const display  = fingerprintToDisplay(fp);
  const chips: TechChip[] = [];

  if (display.cms) {
    chips.push({
      label:      "CMS",
      value:      display.cms,
      color:      display.cms === UNKNOWN ? "muted" : "blue",
      confidence: fp.cms.confidence > 0 ? `${Math.round(fp.cms.confidence * 100)}%` : "—",
    });
  }
  if (display.builder) {
    chips.push({
      label:      "Builder",
      value:      display.builder,
      color:      "purple",
      confidence: `${Math.round(fp.builder.confidence * 100)}%`,
    });
  }
  if (display.framework) {
    chips.push({
      label:      "Framework",
      value:      display.framework,
      color:      "teal",
      confidence: `${Math.round(fp.framework.confidence * 100)}%`,
    });
  }
  if (display.ecommerce) {
    chips.push({
      label:      "E-Commerce",
      value:      display.ecommerce,
      color:      "green",
      confidence: `${Math.round(fp.ecommerce.confidence * 100)}%`,
    });
  }
  if (display.server) {
    chips.push({
      label:      "Server",
      value:      display.server,
      color:      display.server === UNKNOWN ? "muted" : "teal",
      confidence: fp.server.confidence > 0 ? `${Math.round(fp.server.confidence * 100)}%` : "—",
    });
  }
  if (display.phpVersion) {
    chips.push({
      label:      "PHP",
      value:      display.phpVersion,
      color:      "purple",
      confidence: `${Math.round(fp.phpVersion.confidence * 100)}%`,
    });
  }
  // SSL always present
  chips.push({
    label:      "SSL",
    value:      display.ssl,
    color:      display.ssl === "Aktiv" || display.ssl.startsWith("SSL aktiv") ? "green" : "red",
    confidence: "100%",
  });
  if (display.hosting) {
    chips.push({
      label:      "Hosting",
      value:      display.hosting,
      color:      "blue",
      confidence: `${Math.round(fp.hosting.confidence * 100)}%`,
    });
  }
  if (display.analytics) {
    chips.push({
      label:      "Analytics",
      value:      display.analytics,
      color:      "amber",
      confidence: `${Math.round(fp.analytics.confidence * 100)}%`,
    });
  }
  if (display.tagManager) {
    chips.push({
      label:      "Tag Manager",
      value:      display.tagManager,
      color:      "amber",
      confidence: `${Math.round(fp.tagManager.confidence * 100)}%`,
    });
  }

  return chips;
}
