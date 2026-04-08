import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import BillingPortalButton from "../components/billing-portal-button";
import WebsitesSection from "../components/websites-section";
import QuickStartGuide from "./components/quick-start-guide";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

// ─── Light-mode design tokens ────────────────────────────────────────────────
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  shadowMd:    "0 2px 8px rgba(0,0,0,0.09)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  divider:     "#F1F5F9",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenDot:    "#22C55E",
  amber:       "#D97706",
  amberDot:    "#F59E0B",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redDot:      "#EF4444",
} as const;

type Scan = {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
};

type CriticalSite = {
  id: string;
  url: string;
  name: string | null;
  last_check_status: string;
  last_check_at: string;
  ssl_days_left: number | null;
  security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

const PLAN_BADGE = {
  free:    { label: "Free",    color: C.textMuted,  bg: "#F1F5F9",             border: C.border },
  pro:     { label: "Pro",     color: "#059669",    bg: "#ECFDF5",             border: "#A7F3D0" },
  agentur: { label: "Agentur", color: C.blue,       bg: C.blueBg,              border: C.blueBorder },
} as const;

const TYPE_LABEL: Record<string, string> = {
  website: "Website-Check",
  wcag: "Barrierefreiheit",
  performance: "Performance",
};

function StatusDot({ count }: { count: number | null }) {
  const color = count === null ? C.textMuted : count === 0 ? C.greenDot : count <= 2 ? C.amberDot : C.redDot;
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: color, flexShrink: 0,
    }} />
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const plan = ((session.user as { plan?: string }).plan ?? "free") as keyof typeof PLAN_BADGE;
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  ` as Scan[];

  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";

  let criticalSites: CriticalSite[] = [];
  let marginLevers = { wcagScansMonth: 0, websitesMonitored: 0, alertsSent: 0, scansThisMonth: 0, slackActionsMonth: 0 };
  let brandingDone = false;

  if (plan === "agentur") {
    criticalSites = await sql`
      SELECT
        sw.id::text, sw.url, sw.name, sw.last_check_status, sw.last_check_at,
        wc.ssl_days_left, wc.security_score, wc.alerts
      FROM saved_websites sw
      LEFT JOIN LATERAL (
        SELECT ssl_days_left, security_score, alerts
        FROM website_checks
        WHERE website_id = sw.id AND user_id = sw.user_id
        ORDER BY checked_at DESC LIMIT 1
      ) wc ON true
      WHERE sw.user_id = ${session.user.id}
        AND sw.last_check_status IN ('critical', 'warning', 'offline')
      ORDER BY
        CASE sw.last_check_status WHEN 'offline' THEN 0 WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        sw.last_check_at DESC NULLS LAST
      LIMIT 10
    ` as CriticalSite[];

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [levers] = await sql`
      SELECT
        (SELECT COUNT(*) FROM saved_websites  WHERE user_id = ${session.user.id}) AS websites_monitored,
        (SELECT COUNT(*) FROM scans           WHERE user_id = ${session.user.id} AND created_at >= ${monthStart}) AS scans_this_month,
        (SELECT COUNT(*) FROM scans           WHERE user_id = ${session.user.id} AND created_at >= ${monthStart} AND type = 'wcag') AS wcag_scans_month,
        (SELECT COUNT(*) FROM activity_logs   WHERE agency_id = ${session.user.id} AND created_at >= ${monthStart}) AS slack_actions_month
    ` as { websites_monitored: number; scans_this_month: number; wcag_scans_month: number; slack_actions_month: number }[];

    if (levers) {
      marginLevers = {
        wcagScansMonth:    Number(levers.wcag_scans_month),
        websitesMonitored: Number(levers.websites_monitored),
        alertsSent:        criticalSites.length,
        scansThisMonth:    Number(levers.scans_this_month),
        slackActionsMonth: Number(levers.slack_actions_month),
      };
    }

    const [brandingRow] = await sql`
      SELECT logo_url, primary_color FROM agency_settings
      WHERE user_id = ${session.user.id} LIMIT 1
    ` as { logo_url: string | null; primary_color: string | null }[];
    brandingDone = !!(brandingRow?.logo_url || brandingRow?.primary_color);
  }

  const statusDotColor = (s: string) =>
    s === "offline" || s === "critical" ? C.redDot : s === "warning" ? C.amberDot : C.greenDot;
  const statusTextColor = (s: string) =>
    s === "offline" || s === "critical" ? C.red : s === "warning" ? C.amber : C.green;
  const statusLabel = (s: string) =>
    s === "offline" ? "Offline" : s === "critical" ? "Kritisch" : s === "warning" ? "Warnung" : "OK";

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 28px 80px" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Willkommen zurück
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.text, letterSpacing: "-0.025em" }}>
              {firstName}
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: planBadge.bg, border: `1px solid ${planBadge.border}`,
              color: planBadge.color, letterSpacing: "0.04em",
            }}>
              {planBadge.label}
            </span>
            {plan === "free" && (
              <Link href="/fuer-agenturen" style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20, textDecoration: "none",
                border: `1px solid ${C.blueBorder}`, color: C.blue, background: C.blueBg,
              }}>
                Upgrade →
              </Link>
            )}
            {plan !== "free" && <BillingPortalButton />}
          </div>
        </div>
        <Link href="/dashboard/scan" style={{
          padding: "9px 20px", borderRadius: 9, fontWeight: 700, fontSize: 13,
          background: C.blue, color: "#fff", textDecoration: "none",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
        }}>
          + Scan starten
        </Link>
      </div>

      {/* ── QUICK START (Agentur) ── */}
      {plan === "agentur" && (
        <QuickStartGuide
          brandingDone={brandingDone}
          slackDone={!!(process.env.SLACK_WEBHOOK_URL || process.env.SLACK_BOT_TOKEN)}
          clientDone={marginLevers.websitesMonitored > 0}
        />
      )}

      {/* ── AGENTUR COMMAND CENTER ── */}
      {plan === "agentur" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 14, marginBottom: 32 }}>

          {/* Critical Events */}
          <div style={{ background: C.card, border: `1px solid ${criticalSites.length > 0 ? "#FCA5A5" : C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {criticalSites.length > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.redDot, display: "inline-block" }} />
                )}
                <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Kritische Ereignisse</span>
                {criticalSites.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: C.redBg, color: C.red, border: "1px solid #FCA5A5" }}>
                    {criticalSites.length}
                  </span>
                )}
              </div>
              <Link href="/dashboard/clients" style={{ fontSize: 12, color: C.textMuted, textDecoration: "none" }}>Alle →</Link>
            </div>

            {criticalSites.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.greenBg, border: `1px solid #A7F3D0`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 16 }}>✓</div>
                <p style={{ margin: 0, fontSize: 13, color: C.green, fontWeight: 600 }}>Alles OK</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>Keine kritischen Ereignisse</p>
              </div>
            ) : (
              <div>
                {criticalSites.map((site, i) => {
                  const dotC = statusDotColor(site.last_check_status);
                  const txtC = statusTextColor(site.last_check_status);
                  const alerts = site.alerts ?? [];
                  const topMessage = alerts[0]?.message ?? site.last_check_status;
                  return (
                    <Link key={site.id} href="/dashboard/clients" style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "12px 20px",
                        borderBottom: i < criticalSites.length - 1 ? `1px solid ${C.divider}` : "none",
                        display: "flex", alignItems: "center", gap: 12,
                        background: "transparent",
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotC, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {site.name ?? site.url}
                          </div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {topMessage}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: txtC, background: `${dotC}18`, border: `1px solid ${dotC}44`, flexShrink: 0 }}>
                          {statusLabel(site.last_check_status)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Margin Levers */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.divider}` }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Marge-Hebel</span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>Aktivitäten diesen Monat</p>
            </div>
            <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
              {[
                { value: marginLevers.scansThisMonth,   label: "Scans",         color: C.blue },
                { value: marginLevers.wcagScansMonth,   label: "WCAG-Audits",   color: "#059669" },
                { value: marginLevers.websitesMonitored,label: "Überwacht",      color: "#D97706" },
                { value: marginLevers.alertsSent,       label: "Warnungen",     color: marginLevers.alertsSent > 0 ? C.red : "#059669" },
                { value: marginLevers.slackActionsMonth,label: "Aktionen",      color: C.blue },
              ].map(item => (
                <div key={item.label} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: item.color, letterSpacing: "-0.02em" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.divider}` }}>
              <Link href="/dashboard/scan" style={{ fontSize: 13, fontWeight: 600, color: C.blue, textDecoration: "none" }}>
                Neuen Scan starten →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING (empty state) ── */}
      {scans.length === 0 && (
        <div style={{
          background: C.card, border: `1px solid ${C.blueBorder}`, borderRadius: 14,
          padding: "32px", marginBottom: 32, boxShadow: C.shadow,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Erster Schritt</p>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.text }}>Starte deinen ersten Scan</h2>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>
            URL eingeben — KI analysiert SEO, Barrierefreiheit und Performance in unter 60 Sekunden.
          </p>
          <Link href="/dashboard/scan" style={{
            display: "inline-block", padding: "9px 20px", borderRadius: 9, textDecoration: "none",
            background: C.blue, color: "#fff", fontWeight: 700, fontSize: 14,
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>
            Ersten Scan starten
          </Link>
        </div>
      )}

      {/* ── WEBSITES (Pro/Agentur) ── */}
      {plan !== "free" && <WebsitesSection />}

      {/* ── QUICK ACTIONS — Scan starten ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Neuer Scan
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {[
            {
              href: "/dashboard/scan",
              label: "Website-Check",
              desc: "SEO, Technik, Erreichbarkeit",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              ),
            },
            {
              href: "/dashboard/scan?tab=wcag",
              label: "Barrierefreiheit",
              desc: "WCAG 2.1 AA · BFSG-relevant",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="2"/><path d="M12 10v6"/><path d="M9 13h6"/>
                  <rect x="3" y="3" width="18" height="18" rx="4"/>
                </svg>
              ),
            },
            {
              href: "/dashboard/scan?tab=performance",
              label: "Performance",
              desc: "Core Web Vitals · PageSpeed",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              ),
            },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "16px 18px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                boxShadow: C.shadow,
                display: "flex", alignItems: "center", gap: 14,
                transition: "box-shadow 0.15s",
              }}>
                {/* Icon box */}
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: "#F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748B",
                }}>
                  {item.icon}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{item.desc}</div>
                </div>
                {/* Arrow */}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.blue, flexShrink: 0 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── UPTIME MONITOR ── */}
      {scans.length > 0 && (() => {
        const latest = scans[0];
        const isClean = latest.issue_count === 0;
        const hasIssues = (latest.issue_count ?? 0) > 0;
        const statusLabel = isClean ? "Live & Sicher" : hasIssues ? `Online · ${latest.issue_count} Probleme` : "Online";
        const statusColor = isClean ? C.green : hasIssues ? C.amber : C.textMuted;
        const statusBg    = isClean ? C.greenBg : hasIssues ? C.amberBg : C.divider;
        const lastSeen    = new Date(latest.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        const lastDate    = new Date(latest.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });

        return (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, boxShadow: C.shadow, marginBottom: 14,
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            {/* Pulsing dot + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <span className="wf-pulse-dot" style={{
                  display: "block", width: 12, height: 12, borderRadius: "50%",
                  background: isClean ? C.greenDot : hasIssues ? C.amberDot : C.textMuted,
                }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Uptime Monitor</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                    background: statusBg, color: statusColor,
                  }}>
                    {statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {latest.url}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                {
                  label: "SSL",
                  value: "✓ Gültig",
                  color: C.green,
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ),
                },
                {
                  label: "Letzter Check",
                  value: `${lastDate} ${lastSeen}`,
                  color: C.textSub,
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                },
                {
                  label: "Befunde",
                  value: latest.issue_count === 0 ? "Keine" : `${latest.issue_count}`,
                  color: isClean ? C.green : C.amber,
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  ),
                },
              ].map(m => (
                <div key={m.label} style={{ textAlign: "center", minWidth: 64 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: m.color, marginBottom: 2 }}>
                    {m.icon}
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{m.value}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* "Schläft nie" tagline */}
            <div style={{
              padding: "6px 12px", borderRadius: 8,
              background: C.divider, border: `1px solid ${C.border}`,
              fontSize: 11, color: C.textMuted, whiteSpace: "nowrap",
            }}>
              🕐 Überwacht 24/7
            </div>
          </div>
        );
      })()}

      {/* ── AUTO-PILOT STATUS ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        boxShadow: C.shadow, marginBottom: 20, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 20px", borderBottom: `1px solid ${C.divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: C.greenBg, border: `1px solid #A7F3D0`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Auto-Pilot</span>
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                background: C.greenBg, color: C.green, border: `1px solid #A7F3D0`,
                letterSpacing: "0.06em",
              }}>● AKTIV</span>
            </div>
          </div>
          <Link href="/dashboard/scan" style={{ fontSize: 12, color: C.blue, textDecoration: "none", fontWeight: 600 }}>
            Zeitplan anpassen →
          </Link>
        </div>

        {/* Schedule grid */}
        <div style={{ padding: "14px 20px", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            {
              label: "Security-Scan",
              interval: "Täglich",
              icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              color: C.blue,
              bg: C.blueBg,
              border: C.blueBorder,
            },
            {
              label: "Deep-Scan",
              interval: "Wöchentlich",
              icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              ),
              color: C.green,
              bg: C.greenBg,
              border: "#A7F3D0",
            },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", borderRadius: 10,
              background: s.bg, border: `1px solid ${s.border}`,
              flex: "1 1 180px",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: "#fff", border: `1px solid ${s.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color,
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.label}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.interval}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, background: C.divider, flex: "1 1 120px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub }}>E-Mail-Alerts</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>bei kritischen Befunden</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCAN HISTORY ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Letzte Scans
          </p>
          {scans.length > 0 && (
            <span style={{ fontSize: 12, color: C.textMuted }}>{scans.length} gespeichert</span>
          )}
        </div>

        {scans.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center",
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12,
          }}>
            <p style={{ margin: 0, color: C.textMuted, fontSize: 14 }}>Noch keine Scans.</p>
          </div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              padding: "10px 20px",
              background: "#F8FAFC",
              borderBottom: `1px solid ${C.border}`,
              display: "grid", gridTemplateColumns: "1fr auto auto",
              gap: 16, alignItems: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>URL / Typ</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Datum</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
            </div>

            {scans.map((scan, i) => {
              const issues = scan.issue_count;
              const dotColor = issues === null ? C.textMuted : issues === 0 ? C.greenDot : issues <= 2 ? C.amberDot : C.redDot;
              const statusText = issues === null ? "—" : issues === 0 ? "Keine Fehler" : `${issues} Probleme`;
              const statusColor2 = issues === null ? C.textMuted : issues === 0 ? C.green : issues <= 2 ? C.amber : C.red;

              return (
                <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} style={{ textDecoration: "none" }}>
                  <div className="dash-row-hover" style={{
                    padding: "14px 20px",
                    borderBottom: i < scans.length - 1 ? `1px solid ${C.divider}` : "none",
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: 16, alignItems: "center",
                    background: "transparent",
                  }}>
                    {/* URL + type */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <StatusDot count={scan.issue_count} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {scan.url}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                          {TYPE_LABEL[scan.type] ?? scan.type}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
                      {new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>

                    {/* Status pill */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      color: statusColor2,
                      background: issues === 0 ? C.greenBg : issues === null ? "#F1F5F9" : issues <= 2 ? "#FFFBEB" : C.redBg,
                      border: `1px solid ${dotColor}44`,
                      whiteSpace: "nowrap",
                    }}>
                      {statusText}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}
