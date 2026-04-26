/**
 * tech-detector/detectors.ts
 *
 * Core detection logic.
 * Each function applies all relevant rules from the registry and returns
 * a DetectedValue with a value, confidence score, and evidence array.
 *
 * Architecture:
 *   1. Collect all rules for the target category
 *   2. For each rule, test its pattern against the appropriate signal source
 *   3. Group matches by (category, value), summing their weights
 *   4. Pick the highest-confidence candidate
 *   5. If that confidence is below CONFIDENCE_THRESHOLD → return UNKNOWN
 */

import type {
  RawWebsiteData,
  DetectedValue,
  DetectionCategory,
} from "./types";
import { CONFIDENCE_THRESHOLD, UNKNOWN } from "./types";
import { RULES } from "./rules";
import { getSignalValues, matchesPattern, parseSslInfo, extractPhpVersion } from "./parsers";

// ─── Core rule engine ─────────────────────────────────────────────────────────

interface Candidate {
  value:      string;
  confidence: number;
  evidence:   string[];
}

/**
 * Runs all rules for a given category against the raw website data.
 * Returns all candidates sorted by confidence (highest first).
 */
function runRules(category: DetectionCategory, data: RawWebsiteData): Candidate[] {
  const buckets = new Map<string, Candidate>();

  for (const rule of RULES) {
    if (rule.category !== category) continue;

    const signals = getSignalValues(data, rule.source, rule.key);

    const matched = signals.some(s => matchesPattern(s, rule.pattern));
    if (!matched) continue;

    const existing = buckets.get(rule.value);
    if (existing) {
      existing.confidence = Math.min(1.0, existing.confidence + rule.weight);
      existing.evidence.push(rule.evidence);
    } else {
      buckets.set(rule.value, {
        value:      rule.value,
        confidence: Math.min(1.0, rule.weight),
        evidence:   [rule.evidence],
      });
    }
  }

  return Array.from(buckets.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Picks the best candidate for a category.
 * Returns UNKNOWN if no candidate meets the confidence threshold.
 */
function detectCategory(category: DetectionCategory, data: RawWebsiteData): DetectedValue {
  const candidates = runRules(category, data);
  const best       = candidates[0];

  if (!best || best.confidence < CONFIDENCE_THRESHOLD) {
    return { value: UNKNOWN, confidence: 0, evidence: [] };
  }

  return {
    value:      best.value,
    confidence: Math.round(best.confidence * 100) / 100,
    evidence:   best.evidence,
  };
}

// ─── Category-specific detectors ─────────────────────────────────────────────

export function detectCms(data: RawWebsiteData): DetectedValue {
  return detectCategory("cms", data);
}

export function detectBuilder(data: RawWebsiteData): DetectedValue {
  return detectCategory("builder", data);
}

export function detectFramework(data: RawWebsiteData): DetectedValue {
  // Framework detection: Next.js/Nuxt often co-exist with a CMS.
  // We do NOT suppress framework if CMS is already known — show both.
  return detectCategory("framework", data);
}

export function detectEcommerce(data: RawWebsiteData): DetectedValue {
  return detectCategory("ecommerce", data);
}

export function detectServer(data: RawWebsiteData): DetectedValue {
  return detectCategory("server", data);
}

/**
 * PHP version detection — first tries direct header extraction for precision,
 * falls back to rule-based inference.
 */
export function detectPhpVersion(data: RawWebsiteData): DetectedValue {
  const exact = extractPhpVersion(data);
  if (exact) {
    // Exact version from header is maximally reliable
    return {
      value:      `PHP ${exact}`,
      confidence: 1.0,
      evidence:   [`X-Powered-By-Header enthält 'PHP/${exact}'`],
    };
  }
  // Fall back to rule-based (e.g. inferred from WordPress presence)
  return detectCategory("phpVersion", data);
}

/**
 * SSL detection — direct analysis of HTTPS and HSTS header,
 * not rule-based (outcome is binary + HSTS details).
 */
export function detectSsl(data: RawWebsiteData): DetectedValue {
  const ssl = parseSslInfo(data);

  if (!ssl.isHttps) {
    return {
      value:      "Kein SSL / HTTP",
      confidence: 1.0,
      evidence:   ["Seite wird über HTTP ausgeliefert — kein TLS"],
    };
  }

  let value = "SSL aktiv";
  const evidence: string[] = ["Website über HTTPS erreichbar"];

  if (ssl.hsts) {
    value = "SSL aktiv + HSTS";
    const age = ssl.hstsMaxAge !== null
      ? ` (max-age: ${Math.round(ssl.hstsMaxAge / 86400)} Tage)`
      : "";
    evidence.push(`Strict-Transport-Security Header vorhanden${age}`);
  }

  return { value, confidence: 1.0, evidence };
}

export function detectHosting(data: RawWebsiteData): DetectedValue {
  return detectCategory("hosting", data);
}

export function detectAnalytics(data: RawWebsiteData): DetectedValue {
  return detectCategory("analytics", data);
}

export function detectTagManager(data: RawWebsiteData): DetectedValue {
  return detectCategory("tagManager", data);
}

/**
 * Tracking detectors — returns ALL detected trackers, not just the best one.
 * This is the only multi-value category.
 */
export function detectTracking(data: RawWebsiteData): DetectedValue[] {
  const candidates = runRules("tracking", data);
  return candidates
    .filter(c => c.confidence >= CONFIDENCE_THRESHOLD)
    .map(c => ({
      value:      c.value,
      confidence: Math.round(c.confidence * 100) / 100,
      evidence:   c.evidence,
    }));
}

/**
 * WordPress plugin detector — returns ALL detected plugins, not just the best.
 */
export function detectWpPlugins(data: RawWebsiteData): DetectedValue[] {
  const candidates = runRules("wpPlugin", data);
  return candidates
    .filter(c => c.confidence >= CONFIDENCE_THRESHOLD)
    .map(c => ({
      value:      c.value,
      confidence: Math.round(c.confidence * 100) / 100,
      evidence:   c.evidence,
    }));
}
