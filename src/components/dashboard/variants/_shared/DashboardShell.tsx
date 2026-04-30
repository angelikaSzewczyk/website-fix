"use client";

/**
 * DashboardShell — Phase-2 Shared-Component.
 *
 * Wraps die plan-spezifischen Variant-Renderer mit dem Layout-Skelett:
 *   - Outer Flex-Container + Keyframe-Styles + Mobile-Drawer-Media-Query
 *   - WfOnboardingTour (neue User) + WfProGuidedTour (Pro+, nach 1. Scan)
 *   - Optional: Impersonation-Banner (Admin-Ansicht)
 *   - Sticky-Topbar mit Projekt-Pill, Slot-Counter, Scan-Limit, Upgrade-CTA
 *   - Children-Slot rendert den Variant-spezifischen Main-Content
 *   - Project-Switcher-Dialog (Modal, internal state)
 *
 * Plan-Awareness: Slot-Counter, Scan-Limit-Pill und Upgrade-CTA werden
 * automatisch aus dem `plan`-Prop abgeleitet. Agency-User sehen kein
 * Upgrade-CTA mehr (höchste Stufe), Pro sieht "Auf Agency", Starter sieht
 * "Upgrade →".
 *
 * Sidebar lebt in dashboard/layout.tsx (über alle Variants identisch).
 */

import { useState } from "react";
import Link from "next/link";
import WfOnboardingTour from "@/app/dashboard/components/WfOnboardingTour";
import WfProGuidedTour from "@/app/dashboard/components/WfProGuidedTour";
import { isAtLeastProfessional, isAgency as isAgencyPlan, normalizePlan } from "@/lib/plans";

// ── Design tokens (mirrored from Variants) ───────────────────────────────────
const D = {
  page:        "#0b0c10",
  topbar:      "rgba(11,12,16,0.85)",
  card:        "rgba(255,255,255,0.025)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.4)",
  border:      "rgba(255,255,255,0.08)",
  borderMid:   "rgba(255,255,255,0.12)",
  borderStrong:"rgba(255,255,255,0.16)",
  divider:     "rgba(255,255,255,0.06)",
  blue:        "#007BFF",
  blueBg:      "rgba(0,123,255,0.08)",
  blueBorder:  "rgba(0,123,255,0.22)",
  blueSoft:    "#7aa6ff",
  blueGlow:    "0 2px 14px rgba(0,123,255,0.3)",
  red:         "#EF4444",
  redBg:       "rgba(239,68,68,0.08)",
  redBorder:   "rgba(239,68,68,0.22)",
  radius:      14,
  radiusSm:    8,
  radiusXs:    6,
};

type Props = {
  /** Vorname für die Onboarding-Tour. */
  firstName:       string;
  /** Plan-String aus der Session — kanonisch oder Legacy. */
  plan:            string;
  /** Bereits aufgelöste Domain ("—" wenn kein Scan gelaufen ist). */
  domain:          string;
  /** Anzahl bereits gespeicherter Scans (für die Onboarding-Tour-Heuristik). */
  scanCount:       number;
  /** Verwendete Scans im aktuellen Monat (für die Limit-Pill). */
  monthlyScans:    number;
  /** Plan-spezifisches Limit (Starter=5, Pro=25, Agency=500…). */
  scanLimit:       number;
  /** Admin-Impersonation: zeigt orange Header-Bar mit Zurück-Link. */
  isImpersonating: boolean;
  /** Variant-spezifischer Page-Content. */
  children:        React.ReactNode;
};

export default function DashboardShell({
  firstName, plan, domain, scanCount,
  monthlyScans, scanLimit, isImpersonating, children,
}: Props) {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [switchHover, setSwitchHover] = useState(false);
  const [switching, setSwitching] = useState(false);

  const canonical = normalizePlan(plan);
  const isStarter = canonical === "starter";
  const isPro     = isAtLeastProfessional(plan);
  const isAgency  = isAgencyPlan(plan);

  // Slot-Label per Plan. Agency = "Unlimited", sonst kanonisches Limit.
  const slotLabel = isAgency
    ? "Unlimited"
    : isStarter
      ? "3 Slots"
      : isPro
        ? "10 Slots"
        : "1 / 1";

  // Upgrade-CTA-Label per Plan. Agency = keine höhere Stufe → kein Button.
  const upgradeLabel = isAgency ? null
    : isPro              ? "Auf Agency →"
    :                      "Upgrade →";

  async function handleProjectSwitch() {
    if (switching) return;
    setSwitching(true);
    try {
      await fetch("/api/clear-project", { method: "POST" });
    } catch { /* non-critical */ }
    setProjectDialogOpen(false);
    window.location.href = "/dashboard/scan";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes wf-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes wf-ring {
          0%   { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes wf-gold-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(251,191,36,0.18); }
          50%       { box-shadow: 0 0 10px rgba(251,191,36,0.35); }
        }
        @keyframes wf-arrow-slide {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .wf-nav-locked { transition: opacity 0.15s; }
        .wf-nav-locked:hover { opacity: 1 !important; background: rgba(251,191,36,0.04) !important; }
        .wf-nav-whitelabel:hover { background: rgba(167,139,250,0.06) !important; }
        .wf-upgrade-btn { transition: box-shadow 0.2s, transform 0.15s; }
        .wf-upgrade-btn:hover { box-shadow: 0 6px 28px rgba(0,123,255,0.55) !important; transform: translateY(-1px); }
        .wf-upgrade-btn:hover .wf-arrow { animation: wf-arrow-slide 0.4s ease-in-out; }
        .wf-pro-badge { animation: wf-gold-pulse 3s ease-in-out infinite; }
        .wf-disabled-card { transition: filter 0.3s; }
        .wf-disabled-card:hover { filter: saturate(0.4) brightness(0.8) !important; }
        @keyframes wf-drawer-slide-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes wf-drawer-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .wf-drawer {
            top: auto !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 85vh;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px 16px 0 0;
            animation: wf-drawer-slide-up 0.32s cubic-bezier(0.22,1,0.36,1) both !important;
          }
          .wf-drawer-handle { display: flex !important; }
        }
      `}</style>

      {/* Onboarding Tour (new users only) */}
      <WfOnboardingTour firstName={firstName} plan={plan} scansCount={scanCount} />

      {/* Pro Guided Tour (after first scan, Pro+ only) */}
      <WfProGuidedTour plan={plan} scansCount={scanCount} />

      {/* Sidebar wird von dashboard/layout.tsx gerendert. */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div style={{
            padding: "10px 20px", background: "rgba(245,158,11,0.12)",
            borderBottom: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12,
          }}>
            <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
              👁 Admin-Ansicht — Du siehst das Dashboard als dieser Nutzer.
            </span>
            <a href="/admin" style={{
              fontSize: 12, color: "#fbbf24", textDecoration: "underline", cursor: "pointer",
            }}>
              ← Zurück zum Admin
            </a>
          </div>
        )}

        {/* TOP BAR */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: D.topbar,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${D.divider}`,
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "0 24px",
            height: 52,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Aktives Projekt + Stift-Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Aktives Projekt
              </span>
              {domain !== "—" ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
                    {domain}
                  </span>
                  <button
                    onClick={() => setProjectDialogOpen(true)}
                    title="Projekt wechseln"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: 5,
                      background: "transparent", border: `1px solid ${D.border}`,
                      cursor: "pointer", padding: 0, flexShrink: 0,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              ) : (
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: D.radiusSm,
                  background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                  color: D.blueSoft, fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Website hinzufügen
                </Link>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Projekt-Slots */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Projekte</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "2px 9px", borderRadius: 20,
                background: D.card, border: `1px solid ${D.borderMid}`,
                color: D.textSub,
              }}>
                {slotLabel}
              </span>
            </div>

            {/* Scan-Limit-Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Scans/Monat</span>
              {isAgency ? (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 20,
                  background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
                  color: "#FBBF24",
                }}>
                  Flatrate
                </span>
              ) : monthlyScans >= scanLimit ? (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20,
                  background: D.redBg, border: `1px solid ${D.redBorder}`,
                  color: D.red,
                }}>
                  Limit erreicht
                </span>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 20,
                  background: D.card, border: `1px solid ${D.borderMid}`,
                  color: D.textSub,
                }}>
                  {scanLimit - monthlyScans} / {scanLimit} verbleibend
                </span>
              )}
            </div>

            {/* Upgrade CTA — nur wenn nicht Agency */}
            {upgradeLabel && (
              <Link href="/fuer-agenturen#pricing" style={{
                padding: "6px 16px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                boxShadow: D.blueGlow,
              }}>
                {upgradeLabel}
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT — Variant-spezifisch */}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>
          {children}
        </main>
      </div>

      {/* PROJEKT-WECHSEL DIALOG */}
      {projectDialogOpen && (
        <div
          onClick={() => setProjectDialogOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623",
              border: `1px solid ${D.borderStrong}`,
              borderRadius: D.radius,
              padding: "32px 32px 28px",
              maxWidth: 420, width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: D.redBg, border: `1px solid ${D.redBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={D.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Projekt wechseln?
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: D.textSub, lineHeight: 1.75 }}>
              Im Free-Plan ist <strong style={{ color: D.text }}>1 Wechsel pro Monat</strong> inkludiert.
            </p>
            <div style={{
              padding: "14px 16px", borderRadius: D.radiusXs, marginBottom: 24,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.85)", lineHeight: 1.65, fontWeight: 500 }}>
                Achtung: Alle Daten und Berichte der aktuellen Website werden dabei unwiderruflich gelöscht.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setProjectDialogOpen(false)}
                onMouseEnter={() => setCancelHover(true)}
                onMouseLeave={() => setCancelHover(false)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: `1px solid ${D.borderStrong}`,
                  background: cancelHover ? "rgba(255,255,255,0.06)" : "transparent",
                  color: cancelHover ? D.text : D.textSub,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleProjectSwitch}
                onMouseEnter={() => setSwitchHover(true)}
                onMouseLeave={() => setSwitchHover(false)}
                disabled={switching}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: "none",
                  background: switchHover ? "#ef4444" : D.red,
                  color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: switching ? "default" : "pointer",
                  boxShadow: "0 4px 16px rgba(248,113,113,0.25)",
                  fontFamily: "inherit",
                  opacity: switching ? 0.7 : 1,
                  transition: "background 0.15s, opacity 0.15s",
                }}
              >
                {switching ? "Wechsle..." : "Ja, wechseln"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
