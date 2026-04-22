"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import BrandLogo from "@/app/components/BrandLogo";
import HilfeModal from "./hilfe-modal";

// ─── Design tokens (matches free-dashboard-client) ────────────────────────────
const S = {
  sidebar:    "#0A192F",
  sidebarBdr: "rgba(255,255,255,0.06)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.1)",
  divider:    "rgba(255,255,255,0.06)",
  text:       "#ffffff",
  textSub:    "rgba(255,255,255,0.5)",
  textMuted:  "rgba(255,255,255,0.3)",
  blue:       "#007BFF",
  blueSoft:   "#7aa6ff",
  blueBg:     "rgba(0,123,255,0.08)",
  blueBorder: "rgba(0,123,255,0.25)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.08)",
  amberBorder:"rgba(251,191,36,0.22)",
  red:        "#f87171",
  redBg:      "rgba(239,68,68,0.08)",
  radiusXs:   6,
  radiusSm:   8,
};

export const FREE_SIDEBAR_W = 200;

// ─── SVG nav icons ─────────────────────────────────────────────────────────────
function NavIco({ name, color }: { name: string; color: string }) {
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "dashboard") return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  if (name === "scan")      return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  if (name === "reports")   return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (name === "whitelabel") return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
  return null;
}

interface Props {
  firstName: string;
  plan: string;
  monthlyScans: number;
  scanLimit: number;
  projectUrl?: string;
  unreadTickets?: number;
}

// ─── Live-Monitor Widget ───────────────────────────────────────────────────────
function LiveMonitor() {
  type ActivityRow = { url: string; last_viewed_at: string; view_count: number; download_count: number };
  const [activity, setActivity]   = useState<ActivityRow[]>([]);
  const [pulse, setPulse]         = useState(false);
  const prevTop = useRef<string | null>(null);

  function domainOf(url: string) { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

  function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return "gerade eben";
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
    return `vor ${Math.floor(diff / 86400)} Tagen`;
  }

  async function fetchActivity() {
    try {
      const res = await fetch("/api/live-activity");
      if (!res.ok) return;
      const data = await res.json() as { activity: ActivityRow[] };
      const newTop = data.activity[0]?.last_viewed_at ?? null;
      if (prevTop.current !== null && newTop !== prevTop.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 4000);
      }
      prevTop.current = newTop;
      setActivity(data.activity);
    } catch { /* non-critical */ }
  }

  useEffect(() => {
    fetchActivity();
    const id = setInterval(fetchActivity, 30_000);
    return () => clearInterval(id);
  }, []);

  const hasActivity = activity.length > 0;
  const latest      = activity[0];

  return (
    <div style={{
      margin: "0 8px 10px",
      padding: "12px 14px",
      borderRadius: 10,
      background: hasActivity && pulse
        ? "rgba(16,185,129,0.1)"
        : hasActivity
          ? "rgba(16,185,129,0.05)"
          : "rgba(255,255,255,0.02)",
      border: `1px solid ${hasActivity ? "rgba(16,185,129,0.22)" : "rgba(255,255,255,0.07)"}`,
      transition: "background 0.5s, border-color 0.5s",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hasActivity ? 8 : 0 }}>
        <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7, flexShrink: 0 }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: hasActivity ? "#10B981" : "rgba(255,255,255,0.2)",
            animation: hasActivity ? "wf-live-pulse 2s ease-in-out infinite" : "none",
          }} />
        </span>
        <span style={{ fontSize: 9, fontWeight: 800, color: hasActivity ? "#10B981" : "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          Live-Monitor
        </span>
      </div>
      {!hasActivity ? (
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.5, fontStyle: "italic" }}>
          Warte auf Kunden-Interaktion…
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
          {activity.slice(0, 2).map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, opacity: i === 0 ? 1 : 0.5 }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span style={{ fontSize: 10, color: i === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 130 }}>
                <strong style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.45)", fontWeight: 700 }}>{domainOf(row.url)}</strong>
                {" · "}{timeAgo(row.last_viewed_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FreeSidebar({ firstName, plan, monthlyScans, scanLimit, projectUrl = "", unreadTickets = 0 }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [hilfeOpen, setHilfeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const remaining    = Math.max(0, scanLimit - monthlyScans);
  const limitReached = monthlyScans >= scanLimit;
  const planLabel    = plan === "free" ? "Free" : plan === "starter" ? "Starter" : plan === "agency-starter" ? "Agency" : plan === "agency-pro" ? "Agency Pro" : "Professional";
  const isPro        = plan === "professional" || plan === "smart-guard";
  // Use CSS variable for accent so it picks up the user's agency color
  const accent       = isPro ? "var(--agency-primary, #10B981)" : S.blue;
  const accentBg     = isPro ? "var(--agency-primary-bg, rgba(16,185,129,0.08))" : S.blueBg;
  const accentBorder = isPro ? "var(--agency-primary-border, rgba(16,185,129,0.25))" : S.blueBorder;

  // Close user menu on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isActive = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const NAV = [
    { icon: "dashboard",  label: "Dashboard",              href: "/dashboard",           exact: true,  locked: false },
    { icon: "scan",       label: "Live Scan",               href: "/dashboard/scan",      exact: false, locked: false },
    { icon: "reports",    label: "Berichte",                href: "/dashboard/scans",     exact: true,  locked: false },
    { icon: "whitelabel", label: "White-Label & Branding",  href: "/pricing",             exact: false, locked: true  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <style>{`
        @keyframes wf-gold-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(251,191,36,0.18); }
          50%       { box-shadow: 0 0 10px rgba(251,191,36,0.35); }
        }
        @keyframes wf-green-glow {
          0%, 100% { box-shadow: 0 0 4px rgba(34,197,94,0.5); }
          50%       { box-shadow: 0 0 8px rgba(34,197,94,0.9); }
        }
        @keyframes wf-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.6); }
        }
        .wf-sidebar-link { transition: background 0.12s, color 0.12s; }
        .wf-sidebar-link:hover { background: rgba(255,255,255,0.04) !important; }
        .wf-sidebar-link.active { background: ${isPro ? "var(--agency-primary-bg, rgba(16,185,129,0.08))" : S.blueBg} !important; }
        .wf-nav-whitelabel { position: relative; }
        .wf-nav-whitelabel:hover { background: rgba(167,139,250,0.06) !important; }
        .wf-nav-whitelabel:hover .wf-wl-tooltip { opacity: 1; pointer-events: auto; transform: translateX(0); }
        .wf-wl-tooltip {
          position: absolute; left: calc(100% + 8px); top: 50%; transform: translateY(-50%) translateX(-4px);
          background: #0f1623; border: 1px solid rgba(167,139,250,0.3);
          color: rgba(255,255,255,0.75); font-size: 11px; font-weight: 500;
          padding: 6px 10px; border-radius: 7px; white-space: nowrap;
          opacity: 0; pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
          z-index: 100; line-height: 1.4;
        }
        .wf-wl-tooltip::before {
          content: ""; position: absolute; right: 100%; top: 50%; transform: translateY(-50%);
          border: 5px solid transparent; border-right-color: rgba(167,139,250,0.3);
        }
        .wf-pro-badge { animation: wf-gold-pulse 3s ease-in-out infinite; }
        .wf-plan-dot  { animation: wf-green-glow 2s ease-in-out infinite; }
      `}</style>

      {/* Pro header stripe */}
      {isPro && (
        <div style={{
          padding: "7px 14px",
          background: "linear-gradient(90deg, rgba(5,150,105,0.18) 0%, rgba(16,185,129,0.08) 100%)",
          borderBottom: "1px solid rgba(16,185,129,0.18)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#10B981", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
            Professional
          </span>
          {/* Diamond PRO icon */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, color: "#FBBF24", letterSpacing: "0.06em" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            PRO
          </span>
        </div>
      )}

      {/* Logo */}
      <div style={{ padding: "18px 16px 16px", borderBottom: `1px solid ${S.sidebarBdr}` }}>
        <BrandLogo href="/dashboard" />
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 8px", flex: 1 }}>
        {NAV.map(item => {
          const active = isActive(item.href, item.exact);
          const isWL   = item.icon === "whitelabel";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`wf-sidebar-link${active ? " active" : ""}${isWL ? " wf-nav-whitelabel" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "7px 10px", borderRadius: 7,
                marginBottom: isWL ? 0 : 1,
                marginTop:    isWL ? 6 : 0,
                textDecoration: "none", fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? S.text : item.locked ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.55)",
                background: active ? accentBg : isWL ? "rgba(167,139,250,0.05)" : "transparent",
                borderLeft: active ? `2px solid ${accent}` : isWL ? "2px solid rgba(167,139,250,0.3)" : "2px solid transparent",
                opacity: item.locked ? 0.82 : 1,
                border: isWL ? "1px solid rgba(167,139,250,0.12)" : undefined,
              }}>
              <NavIco name={item.icon} color={active ? (isPro ? accent : S.blueSoft) : isWL ? "rgba(167,139,250,0.6)" : item.locked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.42)"} />
              <span style={{ flex: 1, color: isWL ? "rgba(167,139,250,0.8)" : undefined }}>
                {item.label}
              </span>
              {/* Tooltip für White-Label — erscheint beim Hover über die gesamte Row */}
              {isWL && (
                <span className="wf-wl-tooltip">
                  Ab Agency-Plan verfügbar<br/>
                  <span style={{ color: "#a78bfa", fontWeight: 700 }}>Jetzt upgraden →</span>
                </span>
              )}

              {/* Scan counter badge for Live Scan */}
              {item.icon === "scan" && !item.locked && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: limitReached ? S.redBg : S.amberBg,
                  border: `1px solid ${limitReached ? "rgba(239,68,68,0.25)" : S.amberBorder}`,
                  color: limitReached ? S.red : S.amber,
                  letterSpacing: "0.03em", flexShrink: 0,
                }}>
                  {remaining}/{scanLimit}
                </span>
              )}

              {/* Locked badge for White-Label */}
              {item.locked && (
                <span className={isWL ? "" : "wf-pro-badge"} style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                  padding: "2px 7px", borderRadius: 10,
                  background: isWL ? "rgba(167,139,250,0.12)" : "rgba(251,191,36,0.1)",
                  border: `1px solid ${isWL ? "rgba(167,139,250,0.3)" : "rgba(251,191,36,0.3)"}`,
                  color: isWL ? "#a78bfa" : S.amber,
                  flexShrink: 0,
                }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  {isWL ? "Agentur" : "Pro"}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Hilfe button */}
      <div style={{ padding: "0 8px 6px" }}>
        <button
          onClick={() => setHilfeOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            width: "100%", padding: "8px 10px", borderRadius: 7,
            background: unreadTickets > 0 ? "rgba(251,191,36,0.07)" : "transparent",
            border: `1px solid ${unreadTickets > 0 ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.07)"}`,
            cursor: "pointer", fontFamily: "inherit", fontSize: 13,
            color: unreadTickets > 0 ? S.amber : "rgba(255,255,255,0.45)",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = unreadTickets > 0 ? "rgba(251,191,36,0.07)" : "transparent"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ flex: 1, textAlign: "left" }}>Hilfe & Support</span>
          {unreadTickets > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
              background: S.amber, color: "#0b0c10", flexShrink: 0,
            }}>
              {unreadTickets}
            </span>
          )}
        </button>
      </div>

      {hilfeOpen && (
        <HilfeModal
          onClose={() => setHilfeOpen(false)}
          projectUrl={projectUrl}
          plan={plan}
        />
      )}

      {/* Live-Monitor (Pro only) */}
      {isPro && <LiveMonitor />}

      {/* User section — always at bottom */}
      <div ref={menuRef} style={{ padding: "10px 10px 12px", borderTop: `1px solid ${S.sidebarBdr}`, position: "relative", marginTop: "auto" }}>
        {/* Dropdown — opens above trigger */}
        {menuOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% - 2px)", left: 10, right: 10,
            background: "#0f1623",
            border: `1px solid ${S.borderMid}`,
            borderRadius: S.radiusSm,
            boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
            overflow: "hidden", zIndex: 60,
          }}>
            <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 12px", fontSize: 13, color: S.textSub,
              textDecoration: "none", borderBottom: `1px solid ${S.divider}`,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Einstellungen
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/" })} style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "9px 12px",
              fontSize: 13, color: "rgba(248,113,113,0.8)",
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left", fontFamily: "inherit",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Abmelden
            </button>
          </div>
        )}

        {/* Trigger row */}
        <button onClick={() => setMenuOpen(o => !o)} style={{
          display: "flex", alignItems: "center", gap: 9,
          width: "100%", padding: "7px 8px",
          background: menuOpen ? "rgba(255,255,255,0.04)" : "transparent",
          border: `1px solid ${menuOpen ? S.borderMid : "transparent"}`,
          borderRadius: S.radiusXs,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: isPro ? accentBg : S.blueBg,
            border: `1px solid ${isPro ? accentBorder : S.blueBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isPro ? accent : S.blueSoft }}>
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: S.text, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstName}
            </p>
            {isPro ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                padding: "2px 8px", borderRadius: 10, marginTop: 3,
                background: "rgba(5,46,22,0.85)",
                color: "#FBBF24",
                border: "1px solid rgba(16,185,129,0.35)",
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                PROFESSIONAL
              </span>
            ) : (
              <p style={{ margin: 0, fontSize: 10, color: S.textMuted, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 5 }}>
                <span className="wf-plan-dot" style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: plan !== "free" ? "#22C55E" : "#6b7280",
                  display: "inline-block",
                }} />
                Plan: {planLabel}
              </p>
            )}
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={S.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
