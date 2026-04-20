/**
 * SINGLE SOURCE OF TRUTH für alle WebsiteFix-Pläne.
 * Importiert in: admin/page.tsx, admin/admin-client.tsx, api/admin/route.ts, middleware.ts
 * Niemals Preise oder Plan-Keys an anderer Stelle hardcoden.
 */

export type PlanKey =
  | "free"
  | "starter"
  | "smart-guard"
  | "professional"
  | "agency-starter"
  | "agency-pro";

export interface PlanDef {
  /** UI-Label für Badges und Dropdowns */
  label: string;
  /** Monatlicher Preis in EUR (0 = kostenlos) */
  mrr: number;
  /** Hex-Farbe für Badges und Charts */
  color: string;
}

export const PLANS: Record<PlanKey, PlanDef> = {
  "free":           { label: "Free",          mrr: 0,   color: "#6b7280" },
  "starter":        { label: "Starter",        mrr: 29,  color: "#60a5fa" },
  "smart-guard":    { label: "Professional",   mrr: 89,  color: "#fbbf24" },
  "professional":   { label: "Professional",   mrr: 89,  color: "#fbbf24" },
  "agency-starter": { label: "Agency",         mrr: 249, color: "#a78bfa" },
  "agency-pro":     { label: "Agency Pro",     mrr: 249, color: "#a78bfa" },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

/** MRR-Lookup: { "starter": 29, "smart-guard": 89, … } */
export const PLAN_MRR: Record<string, number> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.mrr]),
);

/** Farb-Lookup: { "starter": "#60a5fa", … } */
export const PLAN_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.color]),
);

/** Label-Lookup: { "smart-guard": "Professional", … } */
export const PLAN_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.label]),
);
