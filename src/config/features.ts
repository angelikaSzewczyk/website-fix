/**
 * Central feature matrix for WebsiteFix plan tiers.
 *
 * DB plan strings (never change these — Stripe/DB backward-compat):
 *   "free" | "starter" | "smart-guard" | "professional" | "agency-starter" | "agency-pro"
 *
 * UI tier labels:
 *   Free → Starter → Professional → Agency / Agency Pro
 */

export type PlanString =
  | "free"
  | "starter"
  | "smart-guard"
  | "professional"
  | "agency-starter"
  | "agency-pro";

export interface PlanFeatures {
  /** Human-readable tier name shown in UI */
  label: string;
  /** Max projects (null = unlimited) */
  projects: number | "unlimited";
  /** Max monthly scans (null = unlimited) */
  monthlyScans: number | "unlimited";
  /** Crawl depth (max pages per scan) */
  crawlDepth: number;
  /** KI-guided Smart-Fix steps in drawer */
  smartFix: boolean;
  /** Shows only the issue list — fix guide blurred for upgrade */
  smartFixReadOnly: boolean;
  /** Daily score history chart */
  scoreHistory: boolean;
  /** 24/7 live monitoring + email alerts */
  monitoring: boolean;
  /** Auto monthly PDF report */
  pdfReports: boolean;
  /** Enabled third-party integrations */
  integrations: Array<"slack" | "jira" | "zapier">;
  /** Lead-Magnet Widget (embed on client sites) */
  leadMagnet: boolean;
  /** WordPress Helper Plugin API access */
  pluginSupport: boolean;
  /** White-label / custom domain */
  whiteLabel: boolean;
  /** Accent color for this tier */
  color: string;
}

const FEATURES: Record<PlanString, PlanFeatures> = {
  free: {
    label: "Free",
    projects: 1,
    monthlyScans: 3,
    crawlDepth: 10,
    smartFix: false,
    smartFixReadOnly: false,
    scoreHistory: false,
    monitoring: false,
    pdfReports: false,
    integrations: [],
    leadMagnet: false,
    pluginSupport: false,
    whiteLabel: false,
    color: "#94a3b8",
  },
  starter: {
    label: "Starter",
    projects: 3,
    monthlyScans: "unlimited",
    crawlDepth: 50,
    smartFix: false,
    smartFixReadOnly: true,  // sees issue list, fix guide is blurred
    scoreHistory: false,
    monitoring: false,
    pdfReports: false,
    integrations: [],
    leadMagnet: false,
    pluginSupport: false,
    whiteLabel: false,
    color: "#60a5fa",
  },
  "smart-guard": {
    // Legacy DB string — maps to Professional tier in UI
    label: "Professional",
    projects: 10,
    monthlyScans: "unlimited",
    crawlDepth: 500,
    smartFix: true,
    smartFixReadOnly: false,
    scoreHistory: true,
    monitoring: true,
    pdfReports: true,
    integrations: ["slack"],
    leadMagnet: false,
    pluginSupport: false,
    whiteLabel: false,
    color: "#FBBF24",
  },
  professional: {
    label: "Professional",
    projects: 10,
    monthlyScans: "unlimited",
    crawlDepth: 500,
    smartFix: true,
    smartFixReadOnly: false,
    scoreHistory: true,
    monitoring: true,
    pdfReports: true,
    integrations: ["slack"],
    leadMagnet: false,
    pluginSupport: false,
    whiteLabel: false,
    color: "#FBBF24",
  },
  "agency-starter": {
    label: "Agency",
    projects: "unlimited",
    monthlyScans: "unlimited",
    crawlDepth: 999,
    smartFix: true,
    smartFixReadOnly: false,
    scoreHistory: true,
    monitoring: true,
    pdfReports: true,
    integrations: ["slack", "jira", "zapier"],
    leadMagnet: true,
    pluginSupport: true,
    whiteLabel: true,
    color: "#a78bfa",
  },
  "agency-pro": {
    label: "Agency Pro",
    projects: "unlimited",
    monthlyScans: "unlimited",
    crawlDepth: 999,
    smartFix: true,
    smartFixReadOnly: false,
    scoreHistory: true,
    monitoring: true,
    pdfReports: true,
    integrations: ["slack", "jira", "zapier"],
    leadMagnet: true,
    pluginSupport: true,
    whiteLabel: true,
    color: "#a78bfa",
  },
};

export function getFeatures(plan: string): PlanFeatures {
  return FEATURES[plan as PlanString] ?? FEATURES["free"];
}

export { FEATURES };
