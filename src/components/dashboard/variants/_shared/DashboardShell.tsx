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

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import WfOnboardingTour from "@/app/dashboard/components/WfOnboardingTour";
import WfProGuidedTour from "@/app/dashboard/components/WfProGuidedTour";
import WebsiteSettingsModal, { type WebsiteSettingsTarget } from "./WebsiteSettingsModal";
import { isAtLeastProfessional, isAgency as isAgencyPlan, normalizePlan, getPlanQuota } from "@/lib/plans";

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
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Phase 3 Sprint 3: Power-Switcher mit Search + Tabs
  type ProjectRow = {
    id:                  string;
    url:                 string;
    name:                string | null;
    is_customer_project: boolean;
    client_label:        string | null;
    client_logo_url:     string | null;
    last_scan_id:        string | null;
    last_scan_at:        string | null;
    last_issue_count:    number | null;
  };
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectTab, setProjectTab] = useState<"all" | "own" | "customer">("all");

  // Lazy-fetch der Projektliste — erst beim Öffnen des Modals.
  useEffect(() => {
    if (!projectDialogOpen || projects !== null) return;
    setProjectsLoading(true);
    fetch("/api/websites")
      .then(r => r.json())
      .then(d => setProjects((d.websites as ProjectRow[]) ?? []))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [projectDialogOpen, projects]);

  // Filter-Pipeline: Tab → Search.
  const visibleProjects = useMemo(() => {
    if (!projects) return [];
    let list = projects;
    if (projectTab === "own")      list = list.filter(p => !p.is_customer_project);
    if (projectTab === "customer") list = list.filter(p =>  p.is_customer_project);
    const q = projectSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.url.toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.client_label ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [projects, projectTab, projectSearch]);

  const ownCount      = projects?.filter(p => !p.is_customer_project).length ?? 0;
  const customerCount = projects?.filter(p =>  p.is_customer_project).length ?? 0;

  // Phase 3 Sprint 4: Settings-Modal-State (Edit-Stift im Switcher).
  const [settingsTarget, setSettingsTarget] = useState<WebsiteSettingsTarget | null>(null);
  function refreshProjects() {
    setProjectsLoading(true);
    fetch("/api/websites")
      .then(r => r.json())
      .then(d => setProjects((d.websites as ProjectRow[]) ?? []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }

  const canonical = normalizePlan(plan);
  const isStarter = canonical === "starter";
  const isPro     = isAtLeastProfessional(plan);
  const isAgency  = isAgencyPlan(plan);

  // Slot-Label aus Source-of-Truth (lib/plans.ts:PLAN_QUOTAS) statt hardcoded.
  // Vorher stand "3 Slots" für Starter — Drift gegenüber dem echten Limit (1).
  const slotLabel = isAgency
    ? "Unlimited"
    : getPlanQuota(plan).projectsLabel;

  // Upgrade-CTA — Plan-aware:
  //   Starter (Solo) → "Auf Pro →" (nicht direkt Agency, das wäre Über-Sprung)
  //   Pro            → "Auf Agency →"
  //   Agency         → kein Button
  const upgradeLabel = isAgency
    ? null
    : isPro
      ? "Auf Agency →"
      : "Auf Professional →";

  // Plan-aware Upgrade-Ziel: Starter → #pricing-Anker mit Pro-Highlight,
  // Pro → Agency-Anker. Beide Varianten landen auf /fuer-agenturen#pricing,
  // aber ein Plan-Param hilft analytisch zu trennen wo der Klick herkommt.
  const upgradeHref = isPro
    ? "/fuer-agenturen?upgrade=agency#pricing"
    : "/fuer-agenturen?upgrade=professional#pricing";

  async function handleResetAll() {
    if (resetting) return;
    setResetting(true);
    try {
      await fetch("/api/clear-project", { method: "POST" });
    } catch { /* non-critical */ }
    setProjectDialogOpen(false);
    window.location.href = "/dashboard/scan";
  }

  function handleSelectProject(p: ProjectRow) {
    setProjectDialogOpen(false);
    // Phase 3 Sprint 4: Active-Project-Scoping.
    // /dashboard?project=<id> → page.tsx scopt den lastScan-Query auf diese
    // Website. Falls noch kein Scan existiert, fallen wir auf /dashboard/scan
    // mit URL-Vorbefüllung zurück, damit der User direkt einen Scan starten kann.
    if (p.last_scan_id) {
      window.location.href = `/dashboard?project=${p.id}`;
    } else {
      window.location.href = `/dashboard/scan?url=${encodeURIComponent(p.url)}`;
    }
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

            {/* Upgrade CTA — nur wenn nicht Agency. Plan-aware Ziel:
                Starter → Pro, Pro → Agency. Kein Über-Sprung von Starter
                direkt auf Agency (würde Solo-User abschrecken). */}
            {upgradeLabel && (
              <Link href={upgradeHref} style={{
                padding: "6px 16px", borderRadius: D.radiusSm,
                background: isPro ? "linear-gradient(90deg,#7C3AED,#A78BFA)" : D.blue,
                color: "#fff",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                boxShadow: isPro ? "0 4px 14px rgba(124,58,237,0.40)" : D.blueGlow,
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

      {/* PROJEKT-POWER-SWITCHER (Phase 3 Sprint 3) */}
      {projectDialogOpen && (
        <div
          onClick={() => { setProjectDialogOpen(false); setResetConfirm(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "60px 24px 24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623",
              border: `1px solid ${D.borderStrong}`,
              borderRadius: D.radius,
              padding: "20px 22px 18px",
              maxWidth: 560, width: "100%",
              maxHeight: "calc(100vh - 96px)",
              display: "flex", flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
                Projekt wechseln
              </h2>
              <button
                onClick={() => { setProjectDialogOpen(false); setResetConfirm(false); }}
                aria-label="Schließen"
                style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: "transparent", border: `1px solid ${D.border}`,
                  color: D.textMuted, cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Suche nach Domain, Name oder Kunde…"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 12px 9px 34px", borderRadius: D.radiusSm,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${D.border}`,
                  color: D.text, fontSize: 13,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.textMuted}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            {/* Tabs / Filter-Pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, padding: 4, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${D.divider}` }}>
              {([
                { key: "all" as const,      label: "Alle",     count: projects?.length ?? 0 },
                { key: "own" as const,      label: "Eigene",   count: ownCount },
                { key: "customer" as const, label: "Kunden",   count: customerCount },
              ]).map(t => {
                const active = projectTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setProjectTab(t.key)}
                    style={{
                      flex: 1, padding: "5px 10px", borderRadius: 6,
                      background: active ? D.blue : "transparent",
                      border: "none",
                      color: active ? "#fff" : D.textSub,
                      fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {t.label}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                      background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)",
                      color: active ? "#fff" : D.textMuted,
                    }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Project list */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              border: `1px solid ${D.divider}`,
              borderRadius: D.radiusSm,
              background: "rgba(255,255,255,0.015)",
              minHeight: 120,
              maxHeight: 360,
            }}>
              {projectsLoading ? (
                <div style={{ padding: 18, fontSize: 12, color: D.textMuted, textAlign: "center" }}>
                  Lade Projekte…
                </div>
              ) : visibleProjects.length === 0 ? (
                <div style={{ padding: 24, fontSize: 12, color: D.textMuted, textAlign: "center", lineHeight: 1.6 }}>
                  {projectSearch
                    ? "Keine Projekte gefunden für diese Suche."
                    : projects && projects.length === 0
                      ? "Du hast noch keine Projekte gespeichert."
                      : projectTab === "customer"
                        ? "Du hast noch keine Kunden-Projekte markiert."
                        : "Keine Projekte in dieser Ansicht."
                  }
                </div>
              ) : (
                visibleProjects.map((p, i) => {
                  let displayDomain = p.url;
                  try { displayDomain = new URL(p.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
                  const lastScanLabel = p.last_scan_at
                    ? new Date(p.last_scan_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
                    : "–";
                  return (
                    <div
                      key={p.id}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderBottom: i < visibleProjects.length - 1 ? `1px solid ${D.divider}` : "none",
                        display: "flex", alignItems: "center", gap: 11,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,123,255,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                    <button
                      onClick={() => handleSelectProject(p)}
                      style={{
                        flex: 1, textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: D.text,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 11,
                        padding: 0,
                      }}
                    >
                      {/* Avatar (Logo oder Initial) */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: p.is_customer_project ? "rgba(124,58,237,0.18)" : "rgba(0,123,255,0.15)",
                        border: `1px solid ${p.is_customer_project ? "rgba(124,58,237,0.32)" : D.blueBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800,
                        color: p.is_customer_project ? "#a78bfa" : D.blueSoft,
                        overflow: "hidden",
                      }}>
                        {p.client_logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.client_logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          (p.client_label ?? p.name ?? displayDomain).charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Name + Meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.client_label ?? p.name ?? displayDomain}
                          </span>
                          {p.is_customer_project && (
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8,
                              background: "rgba(124,58,237,0.12)",
                              border: "1px solid rgba(124,58,237,0.30)",
                              color: "#a78bfa",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase" as const,
                              flexShrink: 0,
                            }}>
                              Kunde
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: D.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {displayDomain} · Letzter Scan: {lastScanLabel}
                          {p.last_issue_count != null && ` · ${p.last_issue_count} Issues`}
                        </span>
                      </div>
                      {/* Chevron */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.textMuted}
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                    {/* Edit-Stift: öffnet WebsiteSettingsModal (Phase 3 Sprint 4) */}
                    <button
                      type="button"
                      onClick={() => setSettingsTarget({
                        id: p.id, url: p.url, name: p.name,
                        is_customer_project: p.is_customer_project,
                        client_label: p.client_label,
                        client_logo_url: p.client_logo_url,
                      })}
                      title="Projekt-Einstellungen bearbeiten"
                      style={{
                        flexShrink: 0,
                        width: 26, height: 26, borderRadius: 6,
                        background: "transparent",
                        border: `1px solid ${D.border}`,
                        color: D.textMuted,
                        cursor: "pointer", padding: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: secondary danger action — Reset / Clear */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${D.divider}` }}>
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  style={{
                    width: "100%", padding: "8px 14px", borderRadius: D.radiusSm,
                    background: "transparent",
                    border: `1px dashed ${D.redBorder}`,
                    color: "rgba(248,113,113,0.85)",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Alle Scans löschen & neu starten…
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ flex: 1, fontSize: 11.5, color: "rgba(248,113,113,0.9)", lineHeight: 1.5 }}>
                    Alle Scan-Daten werden unwiderruflich gelöscht.
                  </span>
                  <button
                    onClick={() => setResetConfirm(false)}
                    style={{
                      padding: "7px 12px", borderRadius: D.radiusSm,
                      background: "transparent", border: `1px solid ${D.borderStrong}`,
                      color: D.textSub, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleResetAll}
                    disabled={resetting}
                    style={{
                      padding: "7px 12px", borderRadius: D.radiusSm,
                      background: D.red, border: "none",
                      color: "#fff", fontSize: 11.5, fontWeight: 700,
                      cursor: resetting ? "default" : "pointer",
                      fontFamily: "inherit",
                      opacity: resetting ? 0.7 : 1,
                    }}
                  >
                    {resetting ? "Lösche…" : "Ja, alles löschen"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings-Modal (Phase 3 Sprint 4) */}
      {settingsTarget && (
        <WebsiteSettingsModal
          target={settingsTarget}
          onClose={() => setSettingsTarget(null)}
          onSaved={() => { setSettingsTarget(null); refreshProjects(); }}
        />
      )}
    </div>
  );
}
