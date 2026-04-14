"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Zap,
  FileText,
  Settings,
  Clock,
  Archive,
  Users,
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  soon?: boolean;
};

// Plans that get the agency nav
const AGENCY_PLANS = ["agency-starter", "agency-pro"];

// 4-item agency nav (same for both agency tiers)
const AGENCY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",          label: "Kommandozentrale",   icon: <LayoutDashboard size={16} />, exact: true },
  { href: "/dashboard/clients",  label: "Kundenliste",        icon: <Users size={16} /> },
  { href: "/dashboard/reports",  label: "Berichte-Archiv",    icon: <Archive size={16} /> },
  { href: "/dashboard/settings", label: "Team-Einstellungen", icon: <Settings size={16} /> },
];

// Nav for free / single plans
const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",           label: "Übersicht",    icon: <LayoutDashboard size={16} />, exact: true },
  { href: "/dashboard/scan",      label: "Scan starten", icon: <Zap size={16} /> },
  { href: "/dashboard/monitoring",label: "Monitoring",   icon: <Clock size={16} /> },
  { href: "/dashboard/reports",   label: "Berichte",     icon: <FileText size={16} /> },
];

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free:              { label: "Free",           color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.1)" },
  "smart-guard":     { label: "Smart-Guard",    color: "#4ADE80",                bg: "rgba(74,222,128,0.1)",    border: "rgba(74,222,128,0.25)" },
  "agency-starter":  { label: "Agency Starter", color: "#60A5FA",                bg: "rgba(96,165,250,0.1)",    border: "rgba(96,165,250,0.25)" },
  "agency-pro":      { label: "Agency Pro",     color: "#A78BFA",                bg: "rgba(167,139,250,0.1)",   border: "rgba(167,139,250,0.25)" },
};

type Props = {
  plan: string;
  userName: string;
  userImage?: string | null;
  signOutButton: ReactNode;
  lastScanClean?: boolean | null;
};

// ─── Slim Icon Sidebar (Free / Smart-Guard) ────────────────────────────────────
const SLIM_ITEMS = [
  { href: "/dashboard",            label: "Übersicht",    icon: (active: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, exact: true },
  { href: "/dashboard/scan",       label: "Scan starten", icon: (active: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { href: "/dashboard/reports",    label: "Berichte",     icon: (active: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { href: "/dashboard/settings",   label: "Einstellungen",icon: (active: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

function SlimSidebar({ plan, userName, userImage, signOutButton, lastScanClean }: Props) {
  const pathname = usePathname();
  const CYAN = "#22D3EE";
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", padding: "16px 0" }}>
      <style>{`
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 8px rgba(34,211,238,0.3); } 50% { box-shadow: 0 0 16px rgba(34,211,238,0.55), 0 0 30px rgba(34,211,238,0.15); } }
        .slim-icon-active { animation: glow-pulse 3s ease-in-out infinite; }
        .slim-icon:hover { background: rgba(34,211,238,0.1) !important; color: ${CYAN} !important; }
      `}</style>

      {/* Brand mark */}
      <Link href="/dashboard" style={{ display: "block", marginBottom: 28, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
      </Link>

      {/* Nav icons */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {SLIM_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} title={item.label} className={`slim-icon${active ? " slim-icon-active" : ""}`} style={{
              width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(34,211,238,0.1)" : "transparent",
              color: active ? CYAN : "rgba(255,255,255,0.28)",
              border: active ? "1px solid rgba(34,211,238,0.25)" : "1px solid transparent",
              transition: "all 0.2s",
            }}>
              {item.icon(active)}
              {item.href === "/dashboard/scan" && lastScanClean === false && (
                <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#F87171", boxShadow: "0 0 6px #F87171" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Scan counter for free */}
      {plan === "free" && (
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
      )}

      {/* User avatar */}
      <div style={{ flexShrink: 0 }}>
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt="" width={32} height={32} style={{ borderRadius: "50%", border: "1px solid rgba(34,211,238,0.2)" }} />
        ) : (
          <div title={userName} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: CYAN, cursor: "default" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SidebarNav({ plan, userName, userImage, signOutButton, lastScanClean }: Props) {
  const pathname  = usePathname();
  const planCfg   = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const isAgency  = AGENCY_PLANS.includes(plan);
  const isProPlan = plan === "agency-pro"; // Agency Pro — full white-label

  // Free / Smart-Guard → slim icon sidebar
  if (plan === "free" || plan === "smart-guard") {
    return <SlimSidebar plan={plan} userName={userName} userImage={userImage} signOutButton={signOutButton} lastScanClean={lastScanClean} />;
  }

  const navItems = isAgency ? AGENCY_NAV_ITEMS : DEFAULT_NAV_ITEMS;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 12px" }}>

      {/* Logo / Agency Pro placeholder */}
      <div style={{ padding: "20px 8px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {isProPlan ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Logo placeholder frame */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: "rgba(167,139,250,0.08)",
              border: "1.5px dashed rgba(167,139,250,0.4)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>Agentur-Logo</div>
              <div style={{ fontSize: 10, color: "rgba(167,139,250,0.7)", marginTop: 2, fontWeight: 500 }}>In Einstellungen setzen →</div>
            </div>
          </div>
        ) : (
          <BrandLogo href="/dashboard" />
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item);
          const linkStyle = {
            display: "flex" as const, alignItems: "center" as const, gap: 10,
            padding: "9px 12px", borderRadius: 8, textDecoration: "none",
            fontSize: 13, fontWeight: active ? 600 : 400,
            color: active ? "#fff" : item.soon ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
            background: active ? "rgba(0,123,255,0.15)" : "transparent",
            borderLeft: active ? "2px solid #007BFF" : "2px solid transparent",
            paddingLeft: active ? "10px" : "12px",
            cursor: item.soon ? "default" as const : "pointer" as const,
          };
          const content = (
            <>
              <span style={{ opacity: active ? 1 : 0.5, color: active ? "#007BFF" : "inherit", display: "flex" }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.href === "/dashboard/scan" && lastScanClean === true && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
              )}
              {item.href === "/dashboard/scan" && lastScanClean === false && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: "#EF4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.25)" }} />
              )}
              {item.soon && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: "rgba(217,119,6,0.15)", color: "#D97706", letterSpacing: "0.06em" }}>BALD</span>
              )}
            </>
          );
          if (item.soon) return <span key={item.href} style={linkStyle}>{content}</span>;
          return <Link key={item.href} href={item.href} style={linkStyle}>{content}</Link>;
        })}
      </nav>

      {/* Bottom: user + plan label + sign out */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, paddingBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px" }}>
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: planCfg.color }}>{planCfg.label}</span>
          </div>
        </div>
        {signOutButton}
      </div>
    </div>
  );
}
