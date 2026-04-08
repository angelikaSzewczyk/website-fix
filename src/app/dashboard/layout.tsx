import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { ReactNode } from "react";
import SidebarNav from "./components/sidebar-nav";
import SignOutForm from "./components/signout-form";

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0c10" }}>

      {/* CSS custom properties — available throughout the dashboard */}
      <style>{`:root { --agency-primary: ${safeColor}; --agency-primary-bg: ${safeColor}18; --agency-primary-border: ${safeColor}35; }`}</style>

      {/* SIDEBAR — desktop */}
      <aside className="dashboard-sidebar" style={{
        width: 220, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: "#0d0e14",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
        zIndex: 40,
      }}>
        <SidebarNav
          plan={plan}
          userName={userName}
          userImage={userImage}
          signOutButton={<SignOutForm />}
        />
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="dashboard-mobile-bar" style={{
        display: "none", // shown via CSS on mobile
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
        height: 52,
        background: "rgba(13,14,20,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
          Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 10,
          color: plan === "agentur" ? "#7aa6ff" : plan === "pro" ? "#8df3d3" : "rgba(255,255,255,0.45)",
          background: plan === "agentur" ? "rgba(122,166,255,0.08)" : plan === "pro" ? "rgba(141,243,211,0.08)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${plan === "agentur" ? "rgba(122,166,255,0.2)" : plan === "pro" ? "rgba(141,243,211,0.2)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {plan === "agentur" ? "Agentur" : plan === "pro" ? "Pro" : "Free"}
        </span>
      </header>

      {/* CONTENT */}
      <div className="dashboard-content" style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </div>

    </div>
  );
}
