/**
 * SINGLE SOURCE OF TRUTH für alle WebsiteFix-Pläne.
 * 3 kanonische Pläne: starter | professional | agency
 *
 * Legacy DB-Werte (smart-guard, agency-starter, agency-pro, free) werden
 * via normalizePlan() transparent gemappt. Neue Gates IMMER über die Helper
 * isAtLeastProfessional / hasBrandingAccess / isAgency prüfen — nie über
 * manuelle String-Arrays.
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
  "agency":       { label: "Agency",       mrr: 249, color: "#7C3AED" },
};

// ── Plan-Theme (UI-Farben je Plan) ────────────────────────────────────────
export interface PlanTheme {
  /** Primärfarbe (Hex) — Links, Accents, Ring-Stroke */
  primary:      string;
  /** Dunklere Variante — Gradient-End, Hover */
  deep:         string;
  /** RGBA mit Alpha ~0.08 — Hintergrund-Tint */
  bg:           string;
  /** RGBA mit Alpha ~0.25 — Border */
  border:       string;
  /** Sekundärfarbe (Gold für Professional, Cyan für Agency, None für Starter) */
  secondary:    string | null;
  /** Kurzer Label-Code für Badge */
  badge:        "STARTER" | "PROFESSIONAL" | "AGENCY";
}

export const PLAN_THEMES: Record<PlanKey, PlanTheme> = {
  starter: {
    primary:   "#007BFF",
    deep:      "#0057B8",
    bg:        "rgba(0,123,255,0.08)",
    border:    "rgba(0,123,255,0.25)",
    secondary: null,
    badge:     "STARTER",
  },
  professional: {
    primary:   "#10B981",
    deep:      "#059669",
    bg:        "rgba(16,185,129,0.08)",
    border:    "rgba(16,185,129,0.25)",
    secondary: "#FBBF24", // Gold-Akzent
    badge:     "PROFESSIONAL",
  },
  agency: {
    primary:   "#7C3AED",
    deep:      "#5B21B6",
    bg:        "rgba(124,58,237,0.10)",
    border:    "rgba(124,58,237,0.30)",
    secondary: "#22D3EE", // Cyan-Akzent
    badge:     "AGENCY",
  },
};

/** Theme-Tokens für einen Plan (Legacy-Werte werden normalisiert). */
export function getPlanTheme(plan: string | null | undefined): PlanTheme {
  const p = normalizePlan(plan) ?? "starter";
  return PLAN_THEMES[p];
}

// ── Scan-Quota (UI-seitig, echte Limits kommen später aus Stripe) ─────────
export interface PlanQuota {
  /** Scans pro Monat (Infinity = unlimitiert) */
  monthlyScans:    number;
  /** Anzeige-String für die Sidebar-Bar */
  monthlyScansLabel: string;
  /** Anzahl Projekte/Slots */
  projects:        number;
  projectsLabel:   string;
}

export const PLAN_QUOTAS: Record<PlanKey, PlanQuota> = {
  starter:      { monthlyScans: 5,        monthlyScansLabel: "5 Scans",       projects: 3,  projectsLabel: "3 Projekte" },
  professional: { monthlyScans: 25,       monthlyScansLabel: "25 Scans",      projects: 10, projectsLabel: "10 Projekte" },
  agency:       { monthlyScans: 100,      monthlyScansLabel: "100 Scans",     projects: 50, projectsLabel: "50 Projekte" },
};

export function getPlanQuota(plan: string | null | undefined): PlanQuota {
  const p = normalizePlan(plan) ?? "starter";
  return PLAN_QUOTAS[p];
}

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
 *
 * Legacy "free" wird auf "starter" gemappt — vor der 3-Plan-Migration war "free"
 * der Default für unbezahlte User. Im neuen Modell ist Starter der minimale
 * Plan; Free-User landen damit im Dashboard (mit Upgrade-Hinweisen) statt im
 * Redirect-Loop zur Pricing-Seite. Echtes "Plan unbekannt" (null/undefined/
 * fremde Strings) → null und Caller redirected.
 */
export function normalizePlan(plan: string | null | undefined): PlanKey | null {
  if (plan === "starter" || plan === "free") return "starter";
  if (plan === "professional" || plan === "smart-guard") return "professional";
  if (plan === "agency" || plan === "agency-starter" || plan === "agency-pro") return "agency";
  return null;
}

/** True, wenn der DB-Wert ein Legacy-Wert ist, der ein DB-Update vertragen
 *  könnte (z.B. "free" → "starter"). Wird vom Dashboard-Layout für
 *  Self-Healing genutzt. */
export function isLegacyPlanValue(plan: string | null | undefined): boolean {
  if (!plan) return false;
  return plan === "free"
      || plan === "smart-guard"
      || plan === "agency-starter"
      || plan === "agency-pro";
}

// ── Plan-Rank ──────────────────────────────────────────────────────────────
// Höhere Zahl = mehr Features. Für Vergleiche "X oder höher".
const PLAN_RANK: Record<PlanKey, number> = {
  starter:      0,
  professional: 1,
  agency:       2,
};

/** True, wenn der Plan Professional-Features oder höher freischaltet. */
export function isAtLeastProfessional(plan: string | null | undefined): boolean {
  const p = normalizePlan(plan);
  if (!p) return false;
  return PLAN_RANK[p] >= PLAN_RANK.professional;
}

/** True, wenn der Plan Agency-Features hat. */
export function isAgency(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "agency";
}

/** True, wenn der Plan White-Label-Branding setzen darf.
 *  Starter: KEIN Branding (sieht nur Upgrade-CTA).
 *  Professional + Agency: Full Branding (Logo, Farbe, Name). */
export function hasBrandingAccess(plan: string | null | undefined): boolean {
  return isAtLeastProfessional(plan);
}

/** True, wenn der Plan White-Label auf PDF/Share-Links erhält (Pro+). */
export function hasWhiteLabelExport(plan: string | null | undefined): boolean {
  return isAtLeastProfessional(plan);
}
