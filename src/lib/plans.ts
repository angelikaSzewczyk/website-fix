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
  // Pay-per-Guide-Pivot (05.05.2026): Starter ist Single-Site. 5 Scans/Monat
  // reichen für Re-Scans nach Fixes. Wer 2+ Sites braucht, soll auf
  // Professional upgraden — der Server-Guard in /api/websites/route.ts
  // erzwingt diese Grenze (402 limit_reached).
  starter:      { monthlyScans: 5,        monthlyScansLabel: "5 Scans",       projects: 1,  projectsLabel: "1 Projekt" },
  professional: { monthlyScans: 25,       monthlyScansLabel: "25 Scans",      projects: 10, projectsLabel: "10 Projekte" },
  // Agency: technisches Anti-Abuse-Cap bei 500 Scans/Monat. UI rendert "Flatrate" /
  // "∞" damit der User nicht zählt. Wer 500 wirklich erreicht (extrem unwahrscheinlich)
  // bekommt am Server-Side-Limit einen 429 — ehrlicher als "Unbegrenzt" und dann
  // doch eine Wand bei 100.
  agency:       { monthlyScans: 500,      monthlyScansLabel: "Flatrate",      projects: 50, projectsLabel: "50 Projekte" },
};

export function getPlanQuota(plan: string | null | undefined): PlanQuota {
  const p = normalizePlan(plan) ?? "starter";
  return PLAN_QUOTAS[p];
}

/** True, wenn das Quota-UI für diesen Plan als "unlimited" rendern soll
 *  (technisches Cap existiert in PLAN_QUOTAS, ist aber so hoch dass User
 *  effektiv keine Wand spüren). Aktuell nur Agency. */
export function isUnlimitedQuota(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "agency";
}

/** UI-formatiertes Limit für "X / Y"-Counter — gibt "∞" zurück bei
 *  unlimitierten Plans, sonst den numerischen Cap als String. */
export function formatQuotaLimit(plan: string | null | undefined): string {
  return isUnlimitedQuota(plan) ? "∞" : String(getPlanQuota(plan).monthlyScans);
}

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

/** Alle Plan-Strings, die WebsiteFix in der DB akzeptiert — kanonische 3 + Legacy.
 *  Single-Source für Bulk-User-Filter (Cron-Routes). Vorher waren die 6 Strings
 *  in jeder SQL-Query hartkodiert; ein neuer Legacy-String hätte stillschweigend
 *  Cron-User exkludiert. WICHTIG: "free" bewusst NICHT enthalten — Free-User
 *  sollen keine Monitoring-Mails / Monatsberichte bekommen, das gehört zum Pro-Plan. */
export const KNOWN_PLAN_STRINGS: readonly string[] = [
  "starter", "professional", "agency",
  "smart-guard", "agency-starter", "agency-pro",
] as const;

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

/** True, wenn der User irgendeinen bezahlten Plan hat (Starter+).
 *  Verwende für Features, die jedem zahlenden Kunden zustehen
 *  (z.B. Shop/Builder-Audit), unabhängig vom Plan-Tier. */
export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== null;
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

// ── Crawl-Tiefe (Single Source of Truth) ──────────────────────────────────
// WICHTIG: Diese Funktion ist die EINZIGE Autorität für maxSubpages.
// /api/scan, /api/full-scan, scan-cache.ts und Dashboard-UI MÜSSEN sie
// importieren — nicht reimplementieren. Ein zweiter Tabellen-Spiegel
// wäre der Drift-Vektor, den wir gerade ausrotten.
//
// Rückgabe in Seiten/Crawl. anonyme User = 10, Starter = 50,
// Professional = 500, Agency = 10000 (effektiv "alles").
export function getMaxSubpages(plan: string | null | undefined): number {
  const p = normalizePlan(plan);
  if (p === "agency")       return 10000;
  if (p === "professional") return 500;
  if (p === "starter")      return 50;
  return 10; // unauthenticated / unknown
}

/** Plan-Tier-Schlüssel für Cache-Isolation (Composite-Key url:plan_tier:depth).
 *  Anonyme/unbekannte Pläne erhalten "anon" — verhindert Cache-Mischung
 *  zwischen registrierten und unregistrierten Scans. */
export function planTierKey(plan: string | null | undefined): string {
  return normalizePlan(plan) ?? "anon";
}
