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
const AGENCY_PLANS = ["pro", "agentur"];

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
  free:    { label: "Free",           color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.1)" },
  single:  { label: "Smart-Guard",    color: "#4ADE80",                bg: "rgba(74,222,128,0.1)",    border: "rgba(74,222,128,0.25)" },
  pro:     { label: "Agency Starter", color: "#60A5FA",                bg: "rgba(96,165,250,0.1)",    border: "rgba(96,165,250,0.25)" },
  agentur: { label: "Agency Pro",     color: "#A78BFA",                bg: "rgba(167,139,250,0.1)",   border: "rgba(167,139,250,0.25)" },
};

type Props = {
  plan: string;
  userName: string;
  userImage?: string | null;
  signOutButton: ReactNode;
  lastScanClean?: boolean | null;
};

export default function SidebarNav({ plan, userName, userImage, signOutButton, lastScanClean }: Props) {
  const pathname  = usePathname();
  const planCfg   = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const isAgency  = AGENCY_PLANS.includes(plan);
  const isProPlan = plan === "agentur"; // Agency Pro — full white-label

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
