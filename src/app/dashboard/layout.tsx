import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { ReactNode } from "react";
import SidebarNav from "./components/sidebar-nav";
import SignOutForm from "./components/signout-form";
import BrandLogo from "../components/BrandLogo";
import FreeSidebar, { FREE_SIDEBAR_W } from "./components/free-sidebar";

const SCAN_LIMIT = 3;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan      = (session.user as { plan?: string }).plan ?? "free";
  const userName  = session.user.name?.split(" ")[0] ?? session.user.email ?? "User";
  const userImage = session.user.image ?? null;

  const isAuditPlan = plan === "free" || plan === "single";

  // Load agency primary color for CSS variable injection (agentur plan only)
  let agencyPrimary = "#8df3d3";
  let lastScanClean: boolean | null = null;
  let monthlyScans    = 0;
  let projectUrl      = "";
  let unreadTickets   = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const queries: Promise<unknown>[] = [
      sql`
        SELECT issue_count FROM scans
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC LIMIT 1
      `,
      sql`
        SELECT COUNT(*)::int AS cnt FROM scans
        WHERE user_id = ${session.user.id}
          AND created_at >= date_trunc('month', NOW())
      `,
      // Primary project URL (most recently saved)
      sql`
        SELECT url FROM saved_websites
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC LIMIT 1
      `,
      // Unread support replies for this user
      sql`
        SELECT COUNT(*)::int AS cnt FROM support_tickets
        WHERE user_email = ${session.user.email ?? ""}
          AND user_read  = FALSE
          AND status IN ('replied', 'resolved')
      `,
    ];

    if (plan === "agentur") {
      queries.push(
        sql`
          SELECT primary_color FROM agency_settings
          WHERE user_id = ${session.user.id} LIMIT 1
        `
      );
    }

    const results = await Promise.all(queries);

    const scanRows    = results[0] as { issue_count: number | null }[];
    const countRows   = results[1] as { cnt: number }[];
    const urlRows     = results[2] as { url: string }[];
    const unreadRows  = results[3] as { cnt: number }[];

    if (scanRows[0]) lastScanClean = scanRows[0].issue_count === 0;
    monthlyScans  = countRows[0]?.cnt  ?? 0;
    projectUrl    = urlRows[0]?.url    ?? "";
    unreadTickets = unreadRows[0]?.cnt ?? 0;

    if (plan === "agentur") {
      const colorRows = results[4] as { primary_color: string | null }[];
      if (colorRows[0]?.primary_color) agencyPrimary = colorRows[0].primary_color;
    }
  } catch { /* non-critical */ }

  // Sanitize: only allow valid hex colors to prevent CSS injection
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(agencyPrimary) ? agencyPrimary : "#8df3d3";

  const sidebarW = isAuditPlan ? FREE_SIDEBAR_W : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: isAuditPlan ? "#0b0c10" : "#F0F4F8" }}>

      {/* CSS custom properties — available throughout the dashboard */}
      <style>{`
        :root { --agency-primary: ${safeColor}; --agency-primary-bg: ${safeColor}18; --agency-primary-border: ${safeColor}35; }
        @media (max-width: 768px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-mobile-bar { display: flex !important; }
          .dashboard-content { margin-left: 0 !important; padding-top: 52px; }
        }
      `}</style>

      {/* SIDEBAR — free/single: FreeSidebar; agency: SidebarNav */}
      <aside className="dashboard-sidebar" style={{
        width: sidebarW, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: "#0A192F",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
        zIndex: 40,
      }}>
        {isAuditPlan ? (
          <FreeSidebar
            firstName={userName}
            plan={plan}
            monthlyScans={monthlyScans}
            scanLimit={SCAN_LIMIT}
            projectUrl={projectUrl}
            unreadTickets={unreadTickets}
          />
        ) : (
          <SidebarNav
            plan={plan}
            userName={userName}
            userImage={userImage}
            signOutButton={<SignOutForm />}
            lastScanClean={lastScanClean}
          />
        )}
      </aside>

      {/* MOBILE TOP BAR — agency only */}
      {!isAuditPlan && (
        <header className="dashboard-mobile-bar" style={{
          display: "none",
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
          height: 52,
          background: "rgba(10,25,47,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
        }}>
          <BrandLogo href="/dashboard" />
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 10,
            color: plan === "agentur" ? "#007BFF" : "#8df3d3",
            background: plan === "agentur" ? "rgba(0,123,255,0.1)" : "rgba(141,243,211,0.08)",
            border: `1px solid ${plan === "agentur" ? "rgba(0,123,255,0.25)" : "rgba(141,243,211,0.2)"}`,
          }}>
            {plan === "agentur" ? "Agency Pro" : "Agency Starter"}
          </span>
        </header>
      )}

      {/* CONTENT */}
      <div className="dashboard-content" style={{ marginLeft: sidebarW, flex: 1, minWidth: 0, background: isAuditPlan ? "#0b0c10" : "#F8FAFC", minHeight: "100vh" }}>
        {children}
      </div>

    </div>
  );
}
