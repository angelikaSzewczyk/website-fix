/**
 * FeatureGate — inline plan-gate primitive.
 *
 * Gegenpart zu LockedSection: LockedSection swappt einen ganzen Subtree
 * gegen eine Upsell-Card. FeatureGate ist die kleinere, inline-Variante für
 * "zeig den Anfang, sperr den Rest" / "Lock-Pill statt Button" / "Tooltip
 * auf Daten-Vorschau". Wenn qualifiziert → reines Children-Passthrough,
 * Children werden gar nicht erst gemountet wenn nicht qualifiziert.
 *
 * Modi:
 *   - "fold"   → Trenn-Card nach abgeschnittenem Listen-Tail. CTA + Hidden-Count.
 *   - "teaser" → Pill-Lock-Button statt regulärem Button. Click → Upgrade-Modal.
 *   - "tooltip"→ Wrapper-Span mit cursor:help + Lock-Hint-Text. Inhalt bleibt sichtbar.
 *
 * Plan-Check ist über `isAtLeastProfessional` (Default) oder `isAgency`
 * abhängig vom required-Tier — gleiche Logik wie LockedSection.
 */

import type { ReactNode } from "react";
import { isAtLeastProfessional, isAgency } from "@/lib/plans";

type Tier = "professional" | "agency";

const TIER_LABEL: Record<Tier, string> = {
  professional: "Professional",
  agency:       "Agency",
};

const TIER_PRICE: Record<Tier, number> = {
  professional: 89,
  agency:       249,
};

function meets(plan: string | null | undefined, tier: Tier): boolean {
  return tier === "agency" ? isAgency(plan) : isAtLeastProfessional(plan);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLD — Trennstrich nach abgeschnittenem Issue-Tail
// ─────────────────────────────────────────────────────────────────────────────

export function UpgradeFold({
  hiddenCount,
  required = "professional",
  currentPlan,
  onClick,
  message,
}: {
  hiddenCount: number;
  required?:   Tier;
  currentPlan: string | null | undefined;
  /** Aktion bei Klick — typisch ein setShowUpgrade(true) im Parent. */
  onClick?:    () => void;
  /** Optionaler Override-Text. Default-Copy ist Issue-spezifisch. */
  message?:    string;
}) {
  if (meets(currentPlan, required) || hiddenCount <= 0) return null;
  const tierLabel = TIER_LABEL[required];
  const price = TIER_PRICE[required];
  const text = message ?? `${hiddenCount} weitere Befunde sind in der Schnell-Analyse ausgeblendet`;

  return (
    <div
      data-testid="upgrade-fold"
      style={{
        marginTop: 14,
        padding: "18px 20px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(122,166,255,0.04))",
        border: "1px dashed rgba(16,185,129,0.32)",
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 220px", minWidth: 220 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: "#10B981", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🔒 {tierLabel}-Feature
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>
          {text}. Schalte die volle Audit-Tiefe frei und sieh alle Findings inklusive Expert-Fixes.
        </p>
      </div>
      <button
        onClick={onClick}
        style={{
          flexShrink: 0,
          padding: "10px 18px", borderRadius: 9,
          background: "rgba(16,185,129,0.14)",
          border: "1px solid rgba(16,185,129,0.4)",
          color: "#10B981", fontSize: 12, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        Auf {tierLabel} upgraden — {price} €/Monat
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEASER — Lock-Pill statt regulärem Button (Expert-Fix etc.)
// ─────────────────────────────────────────────────────────────────────────────

export function LockedTeaser({
  required = "professional",
  currentPlan,
  label,
  onClick,
  children,
}: {
  required?:   Tier;
  currentPlan: string | null | undefined;
  /** Sichtbarer Text wenn gesperrt. */
  label:       string;
  onClick?:    () => void;
  /** Wird gerendert wenn der User qualifiziert ist. */
  children:    ReactNode;
}) {
  if (meets(currentPlan, required)) return <>{children}</>;
  const tierLabel = TIER_LABEL[required];

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${tierLabel}-Feature — Click für Upgrade-Details`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "7px 14px", borderRadius: 7,
        background: "rgba(255,255,255,0.03)",
        border: "1px dashed rgba(16,185,129,0.35)",
        color: "rgba(16,185,129,0.7)",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeatureGate — generischer Wrapper. Default-Mode: hide.
// Used für die reine "Hide for Starter, Show for Pro+"-Mechanik.
// ─────────────────────────────────────────────────────────────────────────────

export default function FeatureGate({
  required = "professional",
  currentPlan,
  fallback = null,
  children,
}: {
  required?:   Tier;
  currentPlan: string | null | undefined;
  /** Wird angezeigt wenn nicht qualifiziert. Default: nichts. */
  fallback?:   ReactNode;
  children:    ReactNode;
}) {
  return meets(currentPlan, required) ? <>{children}</> : <>{fallback}</>;
}
