import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { ReactNode } from "react";
import SidebarNav from "./components/sidebar-nav";
import SignOutForm from "./components/signout-form";
import BrandLogo from "../components/BrandLogo";
import FreeSidebar, { FREE_SIDEBAR_W } from "./components/free-sidebar";
import { normalizePlan, getPlanTheme, hasBrandingAccess, isLegacyPlanValue } from "@/lib/plans";

const SCAN_LIMIT = 3;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // ── PAYMENT GATE: Immer frische DB-Abfrage — JWT kann nach Stripe-Webhook veraltet sein ──
  let rawPlan = "starter";
  try {
    const sqlGate = neon(process.env.DATABASE_URL!);
    const planRow = await sqlGate`SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1`;
    rawPlan = (planRow[0]?.plan as string) ?? "starter";

    // Self-Heal: Legacy-DB-Werte (free, smart-guard, agency-starter, agency-pro)
    // werden in den canonical Wert migriert. Verhindert Redirect-Loops bei
    // Bestandsusern, die vor der 3-Plan-Migration angelegt wurden.
    if (isLegacyPlanValue(rawPlan)) {
      const canonical = normalizePlan(rawPlan);
      if (canonical && canonical !== rawPlan) {
        await sqlGate`UPDATE users SET plan = ${canonical} WHERE id = ${session.user.id}`;
        rawPlan = canonical;
      }
    }
  } catch {
    rawPlan = (session.user as { plan?: string }).plan ?? "starter";
  }

  const plan = normalizePlan(rawPlan);
  if (!plan) redirect("/fuer-agenturen");

  const userName  = session.user.name?.split(" ")[0] ?? session.user.email ?? "User";
  const userImage = session.user.image ?? null;

  // starter → FreeSidebar dark UI; professional + agency → FreeSidebar with Pro stripe (or SidebarNav)
  const isAuditPlan = plan === "starter" || plan === "professional";
  const isPro       = plan === "professional" || plan === "agency";
  const isAgencyPlan = plan === "agency";
  const isStarterPlan = plan === "starter";
  const theme = getPlanTheme(plan);

  // Load agency primary color for CSS variable injection (agency plans)
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

    queries.push(
      sql`
        SELECT primary_color FROM agency_settings
        WHERE user_id = ${session.user.id} LIMIT 1
      `
    );

    const results = await Promise.all(queries);

    const scanRows    = results[0] as { issue_count: number | null }[];
    const countRows   = results[1] as { cnt: number }[];
    const urlRows     = results[2] as { url: string }[];
    const unreadRows  = results[3] as { cnt: number }[];

    if (scanRows[0]) lastScanClean = scanRows[0].issue_count === 0;
    monthlyScans  = countRows[0]?.cnt  ?? 0;
    projectUrl    = urlRows[0]?.url    ?? "";
    unreadTickets = unreadRows[0]?.cnt ?? 0;

    const colorRows = results[4] as { primary_color: string | null }[];
    if (colorRows[0]?.primary_color) agencyPrimary = colorRows[0].primary_color;
  } catch { /* non-critical */ }

  // Sanitize: only allow valid hex colors to prevent CSS injection.
  // Starter hat KEIN Branding — nutzt immer Theme-Primary. Pro/Agency dürfen Custom-Color.
  const userBrandingColor = hasBrandingAccess(plan) && /^#[0-9a-fA-F]{3,8}$/.test(agencyPrimary)
    ? agencyPrimary
    : theme.primary;
  const safeColor = userBrandingColor;

  const sidebarW = isAuditPlan ? FREE_SIDEBAR_W : 220;

  const planClass = `plan-${plan}`; // plan-starter | plan-professional | plan-agency

  return (
    <div
      className={`${planClass} ${isPro ? "is-pro-plan " : ""}${isAgencyPlan ? "is-agency-plan " : ""}${isStarterPlan ? "is-starter-plan" : ""}`.trim()}
      style={{ display: "flex", minHeight: "100vh", background: isAuditPlan ? "#0b0c10" : "#F0F4F8" }}
    >
      {/* CSS custom properties — available throughout the dashboard */}
      <style>{`
        :root {
          /* Plan-Primary (wird plan-spezifisch überschrieben, Fallback = sicherer Wert) */
          --plan-primary:        ${theme.primary};
          --plan-primary-deep:   ${theme.deep};
          --plan-primary-bg:     ${theme.bg};
          --plan-primary-border: ${theme.border};
          --plan-secondary:      ${theme.secondary ?? "transparent"};

          /* Agency-Primary = User-Branding wenn berechtigt, sonst Plan-Theme-Primary */
          --agency-primary:        ${safeColor};
          --agency-primary-bg:     ${safeColor}18;
          --agency-primary-border: ${safeColor}35;

          /* Emerald-Tokens (für Professional-Upgrade-CTAs überall im Starter-Dashboard) */
          --pro-emerald:           #10B981;
          --pro-emerald-deep:      #059669;
          --pro-emerald-soft:      #34D399;
          --pro-emerald-bg:        rgba(16,185,129,0.08);
          --pro-emerald-bg-strong: rgba(16,185,129,0.14);
          --pro-emerald-border:    rgba(16,185,129,0.25);
          --pro-emerald-glow:      0 0 24px rgba(16,185,129,0.25);
          --pro-gold:              #FBBF24;
          --pro-gold-deep:         #D97706;
          --pro-gold-bg:           rgba(251,191,36,0.10);
          --pro-gold-border:       rgba(251,191,36,0.30);

          /* Agency-Indigo-Tokens (für Agency-CTAs im Pro/Starter-Dashboard) */
          --agency-indigo:         #7C3AED;
          --agency-indigo-deep:    #5B21B6;
          --agency-indigo-bg:      rgba(124,58,237,0.10);
          --agency-indigo-border:  rgba(124,58,237,0.30);
        }
        /* Pro-plan global mesh/background overrides */
        .is-pro-plan:not(.is-agency-plan) {
          --pro-mesh-1: radial-gradient(ellipse 60% 50% at 0% 0%,   rgba(16,185,129,0.055) 0%, transparent 70%);
          --pro-mesh-2: radial-gradient(ellipse 50% 60% at 100% 80%, rgba(16,185,129,0.035) 0%, transparent 70%);
        }
        .is-agency-plan {
          --pro-mesh-1: radial-gradient(ellipse 60% 50% at 0% 0%,   rgba(124,58,237,0.065) 0%, transparent 70%);
          --pro-mesh-2: radial-gradient(ellipse 50% 60% at 100% 80%, rgba(124,58,237,0.045) 0%, transparent 70%);
        }
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
        overflowX: "hidden",
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
            color: "#a78bfa",
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.25)",
          }}>
            Agency
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
