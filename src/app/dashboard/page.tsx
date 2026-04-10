import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import BillingPortalButton from "../components/billing-portal-button";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         "#F8FAFC",
  card:       "#FFFFFF",
  border:     "#E2E8F0",
  divider:    "#F1F5F9",
  shadow:     "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd:   "0 2px 10px rgba(0,0,0,0.08)",
  text:       "#0F172A",
  textSub:    "#475569",
  textMuted:  "#94A3B8",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenDot:   "#22C55E",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberDot:   "#F59E0B",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redDot:     "#EF4444",
  yellow:     "#EAB308",
} as const;

// ─── Plan → Layout mapping ────────────────────────────────────────────────────
function getLayout(plan: string): "single" | "agency" | "enterprise" {
  if (plan === "enterprise")           return "enterprise";
  if (plan === "agentur" || plan === "pro") return "agency";
  return "single";
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Scan = {
  id: string; url: string; type: string;
  created_at: string; issue_count: number | null;
};
type CriticalSite = {
  id: string; url: string; name: string | null;
  last_check_status: string; last_check_at: string;
  ssl_days_left: number | null; security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

const PLAN_BADGE = {
  free:       { label: "Single-Fix",      color: C.textMuted, bg: "#F1F5F9",  border: C.border },
  pro:        { label: "Agency Starter",  color: "#059669",   bg: "#ECFDF5",  border: "#A7F3D0" },
  agentur:    { label: "Agency Pro",      color: C.blue,      bg: C.blueBg,   border: C.blueBorder },
  enterprise: { label: "Enterprise",      color: "#7C3AED",   bg: "#F5F3FF",  border: "#DDD6FE" },
} as const;

// ─── Dummy client data (Skeleton — echte Daten im nächsten Schritt) ───────────
const DUMMY_CLIENTS = [
  {
    id: "1",
    name: "Autohaus Müller GmbH",
    contact: "Hans Müller",
    initials: "AM",
    color: "#2563EB",
    domains: ["autohaus-mueller.de", "gebrauchtwagen-mueller.de"],
    status: "warning" as const,
    lastScan: "08. Apr 2026",
  },
  {
    id: "2",
    name: "Kanzlei Schneider & Partner",
    contact: "Dr. Anna Schneider",
    initials: "KS",
    color: "#16A34A",
    domains: ["kanzlei-schneider.de"],
    status: "ok" as const,
    lastScan: "09. Apr 2026",
  },
  {
    id: "3",
    name: "Bäckerei Hoffmann",
    contact: "Klaus Hoffmann",
    initials: "BH",
    color: "#D97706",
    domains: ["baeckerei-hoffmann.de", "hoffmann-catering.de", "hoffmann-shop.de"],
    status: "critical" as const,
    lastScan: "07. Apr 2026",
  },
  {
    id: "4",
    name: "TechStart Berlin UG",
    contact: "Lena Vogel",
    initials: "TB",
    color: "#7C3AED",
    domains: ["techstart.berlin"],
    status: "ok" as const,
    lastScan: "10. Apr 2026",
  },
];

// ─── Shared: PDF-Icon SVG ─────────────────────────────────────────────────────
function PdfIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

// ─── Shared: Status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "ok" | "warning" | "critical" | string }) {
  const conf = {
    ok:       { label: "OK",       color: C.green, bg: C.greenBg, dot: C.greenDot, border: "#A7F3D0" },
    warning:  { label: "Warnung",  color: C.amber, bg: C.amberBg, dot: C.amberDot, border: "#FDE68A" },
    critical: { label: "Kritisch", color: C.red,   bg: C.redBg,   dot: C.redDot,   border: "#FECACA" },
  }[status] ?? { label: "—", color: C.textMuted, bg: C.divider, dot: C.textMuted, border: C.border };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
      color: conf.color, background: conf.bg, border: `1px solid ${conf.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: conf.dot, display: "inline-block" }} />
      {conf.label}
    </span>
  );
}

// ─── Shared: Health ring (SVG) ────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Gut aufgestellt" : score >= 60 ? "Verbesserungspotenzial" : "Handlungsbedarf";
  const textColor = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        <svg width="128" height="128" viewBox="0 0 128 128"
          style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 10px ${color}40)` }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: textColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>/100</span>
        </div>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
        color: textColor,
        background: score >= 80 ? C.greenBg : score >= 60 ? C.amberBg : C.redBg,
        border: `1px solid ${score >= 80 ? "#A7F3D0" : score >= 60 ? "#FDE68A" : "#FECACA"}`,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Progress bar (sticky) ────────────────────────────────────────────────────
function ProgressBar({ plan }: { plan: string }) {
  const badge = PLAN_BADGE[plan as keyof typeof PLAN_BADGE] ?? PLAN_BADGE.free;
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "#fff", borderBottom: `1px solid ${C.border}`,
      padding: "8px 28px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, whiteSpace: "nowrap", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Setup
        </span>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "35%", borderRadius: 99, background: C.yellow }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.yellow, whiteSpace: "nowrap" }}>35%</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
          color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
          whiteSpace: "nowrap",
        }}>
          {badge.label}
        </span>
        {(plan === "free") && (
          <Link href="/fuer-agenturen" style={{
            fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
            textDecoration: "none", background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706",
          }}>
            Upgrade →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Agency Sidebar ───────────────────────────────────────────────────────────
function AgencySidebar({
  firstName, plan, planBadge, domainCount, domainLimit, isEnterprise,
}: {
  firstName: string; plan: string;
  planBadge: { label: string; color: string; bg: string; border: string };
  domainCount: number; domainLimit: number; isEnterprise: boolean;
}) {
  const navItems = [
    {
      label: "Übersicht",  href: "/dashboard",          active: true,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      label: "Kunden",     href: "/dashboard/clients",  active: false,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "Deep-Audits", href: "/dashboard/scan",    active: false,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    },
    {
      label: "Berichte",   href: "/dashboard/reports",  active: false,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      label: "Team",       href: "/dashboard/team",     active: false,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    ...(isEnterprise ? [{
      label: "Admin / Rechte", href: "/dashboard/admin", active: false,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    }] : []),
  ];

  return (
    <aside style={{
      width: 230, flexShrink: 0,
      minHeight: "calc(100vh - 45px)",
      borderRight: `1px solid ${C.border}`,
      background: C.card,
      display: "flex", flexDirection: "column",
    }}>
      {/* User info */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: C.blueBg, border: `1px solid ${C.blueBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: C.blue,
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstName}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
              color: planBadge.color, background: planBadge.bg, border: `1px solid ${planBadge.border}`,
            }}>
              {planBadge.label}
            </span>
          </div>
        </div>
        <BillingPortalButton />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {navItems.map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 18px",
              background:  item.active ? C.blueBg    : "transparent",
              color:       item.active ? C.blue      : C.textSub,
              fontSize:    13,
              fontWeight:  item.active ? 700         : 500,
              borderLeft:  item.active ? `3px solid ${C.blue}` : "3px solid transparent",
            }}>
              {item.icon}
              {item.label}
              {item.label === "Admin / Rechte" && (
                <span style={{
                  marginLeft: "auto", fontSize: 9, fontWeight: 800, padding: "1px 6px",
                  borderRadius: 4, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE",
                }}>
                  ENT
                </span>
              )}
            </div>
          </Link>
        ))}
      </nav>

      {/* Domain quota */}
      <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>Domains</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
            {domainCount} <span style={{ color: C.textMuted, fontWeight: 400 }}>/ {domainLimit}</span>
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${Math.min(100, (domainCount / domainLimit) * 100)}%`,
            background: domainCount / domainLimit > 0.8 ? C.red : C.blue,
          }} />
        </div>
      </div>
    </aside>
  );
}

// ─── Client matrix row ────────────────────────────────────────────────────────
function ClientRow({ client, last }: { client: typeof DUMMY_CLIENTS[0]; last: boolean }) {
  const isOk       = client.status === "ok";
  const isCritical = client.status === "critical";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "2fr 1.4fr 100px 1fr 180px",
      gap: 16, alignItems: "center",
      padding: "13px 20px",
      borderBottom: last ? "none" : `1px solid ${C.divider}`,
      background: "transparent",
    }}>
      {/* Kunde / Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${client.color}18`,
          border: `1px solid ${client.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: client.color,
        }}>
          {client.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.name}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{client.contact}</div>
        </div>
      </div>

      {/* Domains */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {client.domains.slice(0, 2).map(d => (
          <span key={d} style={{
            fontSize: 11, color: C.textSub,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {d}
          </span>
        ))}
        {client.domains.length > 2 && (
          <span style={{ fontSize: 10, color: C.textMuted }}>+{client.domains.length - 2} weitere</span>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={client.status} />

      {/* Letzter Scan */}
      <span style={{ fontSize: 11, color: C.textMuted }}>{client.lastScan}</span>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        {/* White-Label PDF */}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 6,
          background: "#F0FDF4", border: "1px solid #A7F3D0",
          color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          <PdfIcon /> PDF
        </button>
        {/* Slack */}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 6,
          background: "#F5F3FF", border: "1px solid #DDD6FE",
          color: "#7C3AED", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24"><g fill="#7C3AED">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </g></svg>
        </button>
        {/* Jira */}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 6,
          background: C.blueBg, border: `1px solid ${C.blueBorder}`,
          color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={C.blue}>
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql   = neon(process.env.DATABASE_URL!);
  const plan  = ((session.user as { plan?: string }).plan ?? "free") as keyof typeof PLAN_BADGE;
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC LIMIT 20
  ` as Scan[];

  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";
  const layout    = getLayout(plan);
  const isAgency  = layout === "agency" || layout === "enterprise";

  let criticalSites: CriticalSite[] = [];
  let domainCount = DUMMY_CLIENTS.reduce((sum, c) => sum + c.domains.length, 0); // dummy
  const domainLimit = plan === "agentur" ? 50 : plan === "pro" ? 20 : 1;

  if (isAgency) {
    try {
      criticalSites = await sql`
        SELECT sw.id::text, sw.url, sw.name, sw.last_check_status, sw.last_check_at,
               wc.ssl_days_left, wc.security_score, wc.alerts
        FROM saved_websites sw
        LEFT JOIN LATERAL (
          SELECT ssl_days_left, security_score, alerts FROM website_checks
          WHERE website_id = sw.id AND user_id = sw.user_id
          ORDER BY checked_at DESC LIMIT 1
        ) wc ON true
        WHERE sw.user_id = ${session.user.id}
        ORDER BY sw.last_check_at DESC NULLS LAST LIMIT 10
      ` as CriticalSite[];
      domainCount = criticalSites.length;
    } catch { /* table may not exist yet */ }
  }

  // Single: dummy score for skeleton
  const dummyScore = scans[0]?.issue_count === 0 ? 87
    : (scans[0]?.issue_count ?? 0) > 3 ? 42 : 67;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        a { text-decoration: none; }
        .dash-row:hover { background: ${C.divider} !important; }
        .sidebar-link:hover { background: ${C.blueBg} !important; color: ${C.blue} !important; }
        .action-btn:hover { opacity: 0.8; }
      `}</style>

      {/* ── PROGRESS BAR ── */}
      <ProgressBar plan={plan} />

      {/* ══════════════════════════════════════════════════════════
          SINGLE-FIX LAYOUT  (plan: free)
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, color: C.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Willkommen zurück
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
                {firstName}
              </h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Health Ring + Domain Card */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, boxShadow: C.shadowMd, overflow: "hidden", marginBottom: 20,
          }}>
            <div style={{ height: 3, background: dummyScore >= 80 ? "#22C55E" : dummyScore >= 60 ? "#F59E0B" : "#EF4444" }} />
            <div style={{ padding: "28px 32px", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
              <HealthRing score={dummyScore} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Überwachte Domain
                </p>
                <p style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: C.text }}>
                  {scans[0]?.url ?? "Noch keine Domain"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/dashboard/scan" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8,
                    background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 13,
                    boxShadow: "0 2px 10px rgba(234,179,8,0.35)",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Omni-Scan starten
                  </Link>
                  {scans[0] && (
                    <Link href={`/dashboard/scans/${scans[0].id}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 8,
                      background: C.blueBg, color: C.blue, fontWeight: 700, fontSize: 13,
                      border: `1px solid ${C.blueBorder}`,
                    }}>
                      Letzter Bericht →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error checklist */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Fehler-Checkliste</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: C.redBg, color: C.red, border: "1px solid #FECACA", letterSpacing: "0.05em" }}>RECHT</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: C.greenBg, color: C.green, border: "1px solid #A7F3D0", letterSpacing: "0.05em" }}>SPEED</span>
            </div>
            {scans.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>Starte einen Scan, um Fehler zu sehen.</p>
              </div>
            ) : (
              <div>
                <div style={{ padding: "8px 20px", background: C.bg, borderBottom: `1px solid ${C.divider}`, display: "grid", gridTemplateColumns: "1fr 100px 70px", gap: 12 }}>
                  {["Domain / Typ", "Kategorie", "Status"].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                  ))}
                </div>
                {scans.slice(0, 8).map((scan, i) => {
                  const isLegal = scan.type === "wcag";
                  const sc = scan.issue_count;
                  return (
                    <Link key={scan.id} href={`/dashboard/scans/${scan.id}`}>
                      <div className="dash-row" style={{
                        padding: "11px 20px", background: "transparent",
                        borderBottom: i < Math.min(scans.length, 8) - 1 ? `1px solid ${C.divider}` : "none",
                        display: "grid", gridTemplateColumns: "1fr 100px 70px", gap: 12, alignItems: "center",
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {scan.url}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, display: "inline-block",
                          color: isLegal ? C.blue : C.green,
                          background: isLegal ? C.blueBg : C.greenBg,
                          border: `1px solid ${isLegal ? C.blueBorder : "#A7F3D0"}`,
                        }}>
                          {isLegal ? "Recht/BFSG" : "Speed/SEO"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: sc === 0 ? C.green : sc === null ? C.textMuted : C.amber }}>
                          {sc === null ? "—" : sc === 0 ? "✓ OK" : `${sc} ⚠`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upgrade Banner */}
          <div style={{
            background: "linear-gradient(135deg, #FFFBEB, #FEF9C3)",
            border: "1px solid #FDE68A", borderRadius: 14,
            padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Mehr Projekte nötig?
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#78350F", lineHeight: 1.6 }}>
                Verwalte mehrere Kunden, White-Label PDFs und BFSG-Monitoring mit <strong>Agency Starter</strong>.
              </p>
            </div>
            <Link href="/fuer-agenturen" style={{
              padding: "10px 20px", borderRadius: 9,
              background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 13,
              boxShadow: "0 2px 12px rgba(234,179,8,0.35)", flexShrink: 0,
            }}>
              Upgrade ansehen →
            </Link>
          </div>

        </main>
      )}

      {/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT  (plan: pro / agentur / enterprise)
          ══════════════════════════════════════════════════════════ */}
      {isAgency && (
        <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>

          <AgencySidebar
            firstName={firstName}
            plan={plan}
            planBadge={badge}
            domainCount={domainCount}
            domainLimit={domainLimit}
            isEnterprise={layout === "enterprise"}
          />

          <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 80px" }}>

            {/* Header */}
            <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: C.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Willkommen zurück
                </p>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
                  {firstName}
                </h1>
              </div>
              {/* Neuen Kunden anlegen — opens /dashboard/clients/new (modal in nächstem Schritt) */}
              <Link href="/dashboard/clients/new" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10,
                background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13,
                boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Neuen Kunden anlegen
              </Link>
            </div>

            {/* Stat strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
              {[
                { value: DUMMY_CLIENTS.length,                                            label: "Kunden gesamt",       color: C.blue },
                { value: DUMMY_CLIENTS.reduce((s, c) => s + c.domains.length, 0),        label: "Domains überwacht",   color: C.green },
                { value: DUMMY_CLIENTS.filter(c => c.status === "critical").length,       label: "Kritische Befunde",   color: DUMMY_CLIENTS.some(c => c.status === "critical") ? C.red : C.green },
                { value: scans.length,                                                    label: "Scans gesamt",        color: C.textSub },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: C.shadow }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Kunden-Matrix */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>

              {/* Table header */}
              <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Kunden-Übersicht</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{DUMMY_CLIENTS.length} Kunden · Dummy-Daten</span>
                  <Link href="/dashboard/clients" style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
                    Alle →
                  </Link>
                </div>
              </div>

              {/* Column headers */}
              <div style={{
                padding: "8px 20px", background: C.bg, borderBottom: `1px solid ${C.divider}`,
                display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 1fr 180px", gap: 16,
              }}>
                {["Kunde / Logo", "Domains", "Status", "Letzter Scan", "Quick-Actions"].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {DUMMY_CLIENTS.map((client, i) => (
                <ClientRow key={client.id} client={client} last={i === DUMMY_CLIENTS.length - 1} />
              ))}

            </div>

          </main>
        </div>
      )}

    </div>
  );
}
