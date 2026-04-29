/**
 * LockedSection — Plan-gegated Render-Wrapper.
 *
 * Architektur:
 *   - Bei freigeschaltetem User → reines Passthrough (KEIN Wrapper-DOM).
 *     Damit ist der gelockte und der freigeschaltete Render layout-identisch
 *     für die Nachbar-Sektionen (kein CLS bei Plan-Wechsel).
 *   - Bei gelocktem User → Lock-Card. Children werden gar NICHT gemountet:
 *     keine API-Calls aus den gelockten Subtrees, kein Bundle-Code für
 *     deren Daten, kein Daten-Leak über React-Devtools.
 *
 * Shared-Component (kein "use client"): funktioniert serverseitig im
 * Dashboard-Page-Tree und clientseitig innerhalb von FreeDashboardClient.
 *
 * Lock-Glass-Visual (vorher als globale CSS-Klasse `.lock-glass` in
 * page.tsx) ist hier inline gekapselt — kein implizites Stylesheet-Coupling.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { isAtLeastProfessional, isAgency } from "@/lib/plans";

type RequiredTier = "professional" | "agency";

type Props = {
  /** Mindest-Plan-Tier für Vollzugriff. */
  required:    RequiredTier;
  /** Aktueller User-Plan (DB-String, kanonisch oder Legacy). */
  currentPlan: string | null | undefined;
  /** Slug für data-testid und Telemetrie (z.B. "history-chart", "shop-audit"). */
  feature:     string;
  /** Card-Headline im Lock-State. */
  title:       string;
  /** Erläuternder Untertitel im Lock-State. */
  description: string;
  /** €-Preis im CTA — Spec-Konvention: Pro = 89, Agency = 249. */
  upsellPrice: number;
  /** CTA-Ziel; default = Pricing-Anker. */
  upsellHref?: string;
  /** Wird gerendert, wenn der User qualifiziert ist. */
  children:    ReactNode;
};

const TIER_LABEL: Record<RequiredTier, string> = {
  professional: "Professional",
  agency:       "Agency",
};

const TIER_THEME: Record<RequiredTier, { primary: string; bg: string; border: string }> = {
  professional: { primary: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.28)"  },
  agency:       { primary: "#7C3AED", bg: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.30)" },
};

function meetsRequirement(plan: string | null | undefined, required: RequiredTier): boolean {
  // Helper-basiert, NICHT String-Vergleich — Legacy-Plans (smart-guard,
  // agency-pro etc.) werden in lib/plans normalisiert.
  return required === "agency" ? isAgency(plan) : isAtLeastProfessional(plan);
}

export default function LockedSection({
  required, currentPlan, feature, title, description,
  upsellPrice, upsellHref = "/fuer-agenturen#pricing", children,
}: Props) {
  if (meetsRequirement(currentPlan, required)) {
    return <>{children}</>;
  }

  const theme     = TIER_THEME[required];
  const tierLabel = TIER_LABEL[required];

  return (
    <div
      data-testid={`locked-${feature}`}
      data-required={required}
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: "32px 28px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 14, textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Glow-Akzent — re-use des Lock-Glass-Vibes ohne Overlay-Position. */}
      <span aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 0%, ${theme.bg}, transparent 65%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: theme.bg, border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <span style={{
          fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
          background: theme.bg, color: theme.primary, border: `1px solid ${theme.border}`,
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          {tierLabel}-Feature
        </span>

        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>
          {title}
        </h3>

        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, maxWidth: 380 }}>
          {description}
        </p>

        <Link href={upsellHref} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 22px", borderRadius: 10,
          background: theme.primary, color: "#fff",
          fontSize: 13, fontWeight: 800, textDecoration: "none",
          boxShadow: `0 4px 16px ${theme.primary}40`,
          marginTop: 4,
        }}>
          {tierLabel} freischalten · {upsellPrice}€/Monat →
        </Link>
      </div>
    </div>
  );
}
