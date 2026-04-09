"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Zap,
  Users,
  Users2,
  FileText,
  Settings,
  Activity,
  Plug,
  Target,
  Clock,
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  plans?: string[];
  exact?: boolean;
  soon?: boolean;
  hot?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",               label: "Übersicht",      icon: <LayoutDashboard size={16} />, exact: true },
  { href: "/dashboard/scan",          label: "Scan starten",   icon: <Zap size={16} /> },
  { href: "/dashboard/leads",          label: "Lead-Management",icon: <Target size={16} />,   plans: ["agentur"], hot: true },
  { href: "/dashboard/clients",       label: "Kunden",         icon: <Users size={16} />,    plans: ["agentur"] },
  { href: "/dashboard/monitoring",    label: "Monitoring",     icon: <Clock size={16} />,    plans: ["pro", "agentur"] },
  { href: "/dashboard/activity",      label: "Activity Log",   icon: <Activity size={16} />, plans: ["agentur"] },
  { href: "/dashboard/reports",       label: "Berichte",       icon: <FileText size={16} />, plans: ["pro", "agentur"] },
  { href: "/dashboard/integrations",  label: "Integrationen",  icon: <Plug size={16} />, plans: ["pro", "agentur"] },
  { href: "/dashboard/team",          label: "Mein Team",      icon: <Users2 size={16} />, plans: ["agentur"], soon: true },
  { href: "/dashboard/settings",      label: "Einstellungen",  icon: <Settings size={16} />, plans: ["agentur"] },
];

const PLAN_CONFIG = {
  free:    { label: "Free",    color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)",  border: "rgba(255,255,255,0.1)" },
  pro:     { label: "Pro",     color: "#8df3d3",  bg: "rgba(141,243,211,0.08)", border: "rgba(141,243,211,0.2)" },
  agentur: { label: "Agentur", color: "#007BFF",  bg: "rgba(0,123,255,0.12)",   border: "rgba(0,123,255,0.3)" },
} as const;

type Props = {
  plan: string;
  userName: string;
  userImage?: string | null;
  signOutButton: ReactNode;
  lastScanClean?: boolean | null;
};

export default function SidebarNav({ plan, userName, userImage, signOutButton, lastScanClean }: Props) {
  const pathname = usePathname();
  const planCfg = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.free;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.plans || item.plans.includes(plan)
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: "0 12px",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 8px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <BrandLogo href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
        {visibleItems.map((item) => {
          const active = isActive(item);
          const sharedStyle = {
            display: "flex" as const, alignItems: "center" as const, gap: 10,
            padding: "9px 12px", borderRadius: 8, textDecoration: "none",
            fontSize: 13, fontWeight: active ? 600 : 400,
            color: active ? "#fff" : item.soon ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.45)",
            background: active ? "rgba(0,123,255,0.15)" : "transparent",
            borderLeft: active ? "2px solid #007BFF" : "2px solid transparent",
            paddingLeft: active ? "10px" : "12px",
            transition: "background 0.1s, color 0.1s, border-color 0.1s",
            cursor: item.soon ? "default" as const : "pointer" as const,
          };
          const children = (
            <>
              <span style={{ opacity: active ? 1 : item.soon ? 0.3 : 0.5, color: active ? "#007BFF" : "inherit", display: "flex" }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.href === "/dashboard/scan" && lastScanClean === true && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: "#22C55E",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                }} />
              )}
              {item.href === "/dashboard/scan" && lastScanClean === false && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: "#EF4444",
                  boxShadow: "0 0 0 2px rgba(239,68,68,0.25)",
                }} />
              )}
              {item.soon && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                  background: "rgba(217,119,6,0.15)", color: "#D97706",
                  letterSpacing: "0.06em",
                }}>BALD</span>
              )}
              {item.hot && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                  background: "rgba(239,68,68,0.15)", color: "#ef4444",
                  letterSpacing: "0.06em",
                }}>NEU</span>
              )}
            </>
          );
          if (item.soon) {
            return <span key={item.href} style={sharedStyle}>{children}</span>;
          }
          return (
            <Link key={item.href} href={item.href} style={sharedStyle}>
              {children}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User + Plan + Sign out */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 12, paddingBottom: 16,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px" }}>
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)",
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: planCfg.color,
            }}>
              {planCfg.label}
            </span>
          </div>
        </div>

        {/* Sign out */}
        {signOutButton}
      </div>
    </div>
  );
}
