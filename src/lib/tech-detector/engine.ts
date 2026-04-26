/**
 * tech-detector/engine.ts
 *
 * Main orchestration layer.
 * Calls the fetcher, runs all detectors, and assembles the final DetectionResult.
 *
 * Entry point for all external callers:
 *
 *   import { buildFingerprint } from "@/lib/tech-detector";
 *   const result = await buildFingerprint("https://example.com");
 */

import type { DetectionResult, TechFingerprint } from "./types";
import { fetchWebsiteData }   from "./fetcher";
import {
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
  detectWpPlugins,
} from "./detectors";

export interface BuildFingerprintOptions {
  /**
   * Include raw signals (HTML, headers) in the result.
   * Useful for debugging — do NOT enable in production API responses.
   * @default false
   */
  debug?: boolean;
}

/**
 * Fetches the target website and runs all technology detectors.
 *
 * @param url     Target URL (with or without https://)
 * @param options Optional configuration
 * @returns       Full DetectionResult with fingerprint + metadata
 */
export async function buildFingerprint(
  url: string,
  options: BuildFingerprintOptions = {},
): Promise<DetectionResult> {
  const data = await fetchWebsiteData(url);

  const fingerprint: TechFingerprint = {
    cms:        detectCms(data),
    builder:    detectBuilder(data),
    framework:  detectFramework(data),
    ecommerce:  detectEcommerce(data),
    server:     detectServer(data),
    phpVersion: detectPhpVersion(data),
    ssl:        detectSsl(data),
    hosting:    detectHosting(data),
    analytics:  detectAnalytics(data),
    tagManager: detectTagManager(data),
    tracking:   detectTracking(data),
    wpPlugins:  detectWpPlugins(data),
  };

  return {
    targetUrl:   data.url,
    finalUrl:    data.finalUrl,
    scannedAt:   data.fetchedAt,
    fingerprint,
    ...(options.debug ? { rawSignals: data } : {}),
  };
}

/**
 * Lightweight version: runs detection against HTML + headers you already have,
 * without making any HTTP requests. Useful when the scan has already fetched
 * the page (e.g., reusing the AI scan HTTP response).
 */
export function buildFingerprintFromRaw(rawData: Parameters<typeof detectCms>[0]): TechFingerprint {
  return {
    cms:        detectCms(rawData),
    builder:    detectBuilder(rawData),
    framework:  detectFramework(rawData),
    ecommerce:  detectEcommerce(rawData),
    server:     detectServer(rawData),
    phpVersion: detectPhpVersion(rawData),
    ssl:        detectSsl(rawData),
    hosting:    detectHosting(rawData),
    analytics:  detectAnalytics(rawData),
    tagManager: detectTagManager(rawData),
    tracking:   detectTracking(rawData),
    wpPlugins:  detectWpPlugins(rawData),
  };
}
