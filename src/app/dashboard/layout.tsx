import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { ReactNode } from "react";
import SidebarNav from "./components/sidebar-nav";
import SignOutForm from "./components/signout-form";
import BrandLogo from "../components/BrandLogo";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";
  const userName = session.user.name?.split(" ")[0] ?? session.user.email ?? "User";
  const userImage = session.user.image ?? null;

  // Load agency primary color for CSS variable injection (agentur plan only)
  let agencyPrimary = "#8df3d3";
  if (plan === "agentur") {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const [row] = await sql`
        SELECT primary_color FROM agency_settings
        WHERE user_id = ${session.user.id} LIMIT 1
      ` as { primary_color: string | null }[];
      if (row?.primary_color) agencyPrimary = row.primary_color;
    } catch { /* non-critical */ }
  }

  // Sanitize: only allow valid hex colors to prevent CSS injection
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(agencyPrimary) ? agencyPrimary : "#8df3d3";

  // Last scan status for sidebar green dot
  let lastScanClean: boolean | null = null;
  try {
    const sql2 = neon(process.env.DATABASE_URL!);
    const [lastScan] = await sql2`
      SELECT issue_count FROM scans
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC LIMIT 1
    ` as { issue_count: number | null }[];
    if (lastScan) lastScanClean = lastScan.issue_count === 0;
  } catch { /* non-critical */ }

  const isAuditPlan = plan === "free" || plan === "single";
  const sidebarW    = isAuditPlan ? 64 : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: isAuditPlan ? "#070A12" : "#F0F4F8" }}>

      {/* CSS custom properties — available throughout the dashboard */}
      <style>{`
        :root { --agency-primary: ${safeColor}; --agency-primary-bg: ${safeColor}18; --agency-primary-border: ${safeColor}35; }
        @media (max-width: 768px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-mobile-bar { display: flex !important; }
          .dashboard-content { margin-left: 0 !important; padding-top: 52px; }
        }
      `}</style>

      {/* SIDEBAR — desktop */}
      <aside className="dashboard-sidebar" style={{
        width: sidebarW, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: "#0A192F",
        borderRight: isAuditPlan ? "1px solid rgba(34,211,238,0.08)" : "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
        zIndex: 40,
      }}>
        <SidebarNav
          plan={plan}
          userName={userName}
          userImage={userImage}
          signOutButton={<SignOutForm />}
          lastScanClean={lastScanClean}
        />
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="dashboard-mobile-bar" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
        height: 52,
        background: isAuditPlan ? "rgba(8,12,20,0.97)" : "rgba(10,25,47,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: isAuditPlan ? "1px solid rgba(34,211,238,0.1)" : "1px solid rgba(255,255,255,0.06)",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
      }}>
        <BrandLogo href="/dashboard" />
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 10,
          color: plan === "agentur" ? "#007BFF" : plan === "pro" ? "#8df3d3" : isAuditPlan ? "#22D3EE" : "rgba(255,255,255,0.45)",
          background: plan === "agentur" ? "rgba(0,123,255,0.1)" : plan === "pro" ? "rgba(141,243,211,0.08)" : "rgba(34,211,238,0.07)",
          border: `1px solid ${plan === "agentur" ? "rgba(0,123,255,0.25)" : plan === "pro" ? "rgba(141,243,211,0.2)" : "rgba(34,211,238,0.2)"}`,
        }}>
          {plan === "agentur" ? "Agency Pro" : plan === "pro" ? "Agency Starter" : plan === "single" ? "Smart-Guard" : "Free"}
        </span>
      </header>

      {/* CONTENT */}
      <div className="dashboard-content" style={{ marginLeft: sidebarW, flex: 1, minWidth: 0, background: isAuditPlan ? "#070A12" : "#F8FAFC", minHeight: "100vh" }}>
        {children}
      </div>

    </div>
  );
}
