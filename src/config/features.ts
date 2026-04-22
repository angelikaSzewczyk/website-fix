/**
 * Central feature matrix for WebsiteFix plan tiers.
 *
 * Canonical DB plan strings: "starter" | "professional" | "agency"
 * Legacy aliases handled via normalizePlan() in src/lib/plans.ts:
 *   "smart-guard"  → professional
 *   "agency-starter" | "agency-pro" → agency
 */

export type PlanString = "starter" | "professional" | "agency";

export interface PlanFeatures {
  label: string;
  projects: number | "unlimited";
  monthlyScans: number | "unlimited";
  crawlDepth: number;
  smartFix: boolean;
  smartFixReadOnly: boolean;
  scoreHistory: boolean;
  monitoring: boolean;
  pdfReports: boolean;
  integrations: Array<"slack" | "jira" | "zapier">;
  leadMagnet: boolean;
  pluginSupport: boolean;
  whiteLabel: boolean;
  color: string;
}

const FEATURES: Record<PlanString, PlanFeatures> = {
  starter: {
    label: "Starter",
    projects: 3,
    monthlyScans: 3,
    crawlDepth: 50,
    smartFix: false,
    smartFixReadOnly: true,
    scoreHistory: false,
    monitoring: false,
    pdfReports: false,
    integrations: [],
    leadMagnet: false,
    pluginSupport: false,
    whiteLabel: false,
    color: "#60a5fa",
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
    whiteLabel: true,
    color: "#10B981",
  },
  agency: {
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
};

export function getFeatures(plan: string): PlanFeatures {
  if (plan === "professional" || plan === "smart-guard") return FEATURES["professional"];
  if (plan === "agency" || plan === "agency-starter" || plan === "agency-pro") return FEATURES["agency"];
  return FEATURES["starter"];
}

export { FEATURES };
