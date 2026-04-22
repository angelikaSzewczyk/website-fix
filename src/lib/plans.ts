/**
 * SINGLE SOURCE OF TRUTH für alle WebsiteFix-Pläne.
 * 3 kanonische Pläne: starter | professional | agency
 * Legacy DB-Werte (smart-guard, agency-starter, agency-pro) werden via normalizePlan gemappt.
 */

export type PlanKey = "starter" | "professional" | "agency";

export interface PlanDef {
  label: string;
  mrr: number;
  color: string;
}

export const PLANS: Record<PlanKey, PlanDef> = {
  "starter":      { label: "Starter",      mrr: 29,  color: "#60a5fa" },
  "professional": { label: "Professional", mrr: 89,  color: "#10B981" },
  "agency":       { label: "Agency",       mrr: 249, color: "#a78bfa" },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export const PLAN_MRR: Record<string, number> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.mrr]),
);

export const PLAN_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.color]),
);

export const PLAN_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.label]),
);

/**
 * Maps any DB plan string (including legacy values) to a canonical PlanKey.
 * Returns null for "free" or unknown values → caller should redirect to /fuer-agenturen.
 */
export function normalizePlan(plan: string | null | undefined): PlanKey | null {
  if (plan === "starter") return "starter";
  if (plan === "professional" || plan === "smart-guard") return "professional";
  if (plan === "agency" || plan === "agency-starter" || plan === "agency-pro") return "agency";
  return null;
}
