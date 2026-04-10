/**
 * tech-detector/index.ts
 *
 * Public API for the WebsiteFix technology detection engine.
 *
 * ─── Quick start ─────────────────────────────────────────────────────────────
 *
 * Full detection (fetches the URL):
 *
 *   import { buildFingerprint, fingerprintToDisplay } from "@/lib/tech-detector";
 *
 *   const result = await buildFingerprint("https://example.com");
 *   const labels = fingerprintToDisplay(result.fingerprint);
 *   console.log(labels.cms);        // "WordPress"
 *   console.log(labels.builder);    // "Elementor" | null
 *   console.log(labels.phpVersion); // "PHP 8.2"   | null
 *
 * Detection from existing data (no additional HTTP request):
 *
 *   import { buildFingerprintFromRaw } from "@/lib/tech-detector";
 *   const fp = buildFingerprintFromRaw(rawData); // RawWebsiteData from your scan
 *
 * Dashboard chip array:
 *
 *   import { buildTechChips } from "@/lib/tech-detector";
 *   const chips = buildTechChips(result.fingerprint);
 *   // [{ label: "CMS", value: "WordPress", color: "blue", confidence: "96%" }, ...]
 *
 * ─── Sample outputs ──────────────────────────────────────────────────────────
 *
 * WordPress + Elementor site (woocommerce shop):
 * {
 *   cms:        { value: "WordPress",  confidence: 0.96, evidence: [...] },
 *   builder:    { value: "Elementor",  confidence: 0.90, evidence: [...] },
 *   framework:  { value: "Nicht eindeutig erkannt", confidence: 0,   evidence: [] },
 *   ecommerce:  { value: "WooCommerce", confidence: 0.90, evidence: [...] },
 *   server:     { value: "Nginx",      confidence: 1.00, evidence: [...] },
 *   phpVersion: { value: "PHP 8.2",    confidence: 1.00, evidence: [...] },
 *   ssl:        { value: "SSL aktiv + HSTS", confidence: 1.00, evidence: [...] },
 *   hosting:    { value: "Kinsta",     confidence: 1.00, evidence: [...] },
 *   analytics:  { value: "Google Analytics 4", confidence: 0.95, evidence: [...] },
 *   tagManager: { value: "Google Tag Manager", confidence: 1.00, evidence: [...] },
 *   tracking:   [ { value: "Meta Pixel", confidence: 0.95, evidence: [...] } ],
 * }
 *
 * Next.js / Vercel site:
 * {
 *   cms:        { value: "Nicht eindeutig erkannt", confidence: 0 },
 *   framework:  { value: "Next.js",   confidence: 1.00 },
 *   server:     { value: "Vercel",    confidence: 0.95 },
 *   hosting:    { value: "Vercel",    confidence: 1.00 },
 *   ssl:        { value: "SSL aktiv + HSTS", confidence: 1.00 },
 * }
 *
 * Shopify store:
 * {
 *   cms:        { value: "Shopify",   confidence: 0.97 },
 *   ecommerce:  { value: "Shopify",   confidence: 0.97 },
 *   server:     { value: "Cloudflare", confidence: 1.00 },
 *   hosting:    { value: "Cloudflare Pages", confidence: 0.60 },
 * }
 *
 * Wix site:
 * {
 *   cms:        { value: "Wix",        confidence: 0.95 },
 *   server:     { value: "Nicht eindeutig erkannt", confidence: 0 },
 * }
 */

// ─── Engine ───────────────────────────────────────────────────────────────────
export { buildFingerprint, buildFingerprintFromRaw }  from "./engine";
export type { BuildFingerprintOptions }               from "./engine";

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { fingerprintToDisplay, buildTechChips }        from "./adapter";
export type { TechChip }                               from "./adapter";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  RawWebsiteData,
  DetectionRule,
  DetectedValue,
  TechFingerprint,
  DashboardFingerprint,
  DetectionResult,
  DetectionCategory,
  SignalSource,
} from "./types";
export { UNKNOWN, CONFIDENCE_THRESHOLD } from "./types";

// ─── Rules registry (for extensibility) ──────────────────────────────────────
export { RULES, rulesForCategory }                     from "./rules";

// ─── Low-level detectors (for targeted use or testing) ───────────────────────
export {
  detectCms,
  detectBuilder,
  detectFramework,
  detectEcommerce,
  detectServer,
  detectPhpVersion,
  detectSsl,
  detectHosting,
  detectAnalytics,
  detectTagManager,
  detectTracking,
} from "./detectors";

// ─── Fetcher ──────────────────────────────────────────────────────────────────
export { fetchWebsiteData }                            from "./fetcher";
