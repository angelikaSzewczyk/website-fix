import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import ReportsClient from "./reports-client";
import { isAgency as isAgencyPlan, normalizePlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Berichte — WebsiteFix",
  robots: { index: false },
};

// Legacy-aware plan gate — normalizePlan handles backwards-compat


export type ScanHistoryItem = {
  id:          string;
  url:         string;
  created_at:  string;
  issue_count: number | null;
  type:        string;
};

export type ActivityItem = {
  type:  "lead" | "scan" | "activity";
  icon:  string;
  label: string;
  sub:   string;
  date:  string;
  color: string;
};

export type ReportBranding = {
  primaryColor: string;
  agencyName:   string;
  logoUrl:      string;
};

export type ReportKPIs = {
  leadsThisMonth: number;
  leadsTotal:     number;
  scansThisMonth: number;
  avgResponseMs:  number | null;
  monitoredSites: number;
  uptimePct:      number | null;
  widgetViews:    number;
};

export type SavedSite = { id: string; name: string | null; url: string };

/**
 * Versand-Historie pro Monat — Phase 5 High-End-Refactor.
 * Status:
 *   "sent"      = monthly_reports.sent_at vorhanden (Cron hat erfolgreich versendet)
 *   "failed"    = activity_logs hat einen monthly_report_failed-Eintrag mit
 *                 metadata.month == diesem Monat (Patch in cron/monthly-report/route.ts)
 *   "pending"   = der Monat liegt im Vor-Vor-Monat oder älter und es gibt keinen
 *                 der beiden Einträge (= Cron lief noch nicht oder hat den User skipped)
 */
export type SendHistoryItem = {
  month:    string;            // ISO YYYY-MM-01
  monthLbl: string;            // "April 2026"
  status:   "sent" | "failed" | "pending";
  sent_at:  string | null;
  errorMsg: string | null;
  websites: number;
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sql  = neon(process.env.DATABASE_URL!);

  // Always read plan fresh from DB (JWT can be stale after plan change)
  let plan = "starter";
  try {
    const r = await sql`SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1`;
    plan = (r[0]?.plan as string) ?? (session.user as { plan?: string }).plan ?? "starter";
  } catch {
    plan = (session.user as { plan?: string }).plan ?? "starter";
  }

  if (normalizePlan(plan) === null) redirect("/dashboard");

  const userId   = Number(session.user.id);
  const agencyId = String(session.user.id);
  const isAgency = isAgencyPlan(plan);

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthLabel = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  // ── Queries — split by plan to avoid unnecessary DB load ────────────────────
  const [
    scanHistory,
    brandingRows,
    scanStats,
    siteRows,
    leadStats,
    recentLeads,
    activityRows,
    sentReportsRaw,
    failedEventsRaw,
  ] = await Promise.all([

    // Scan archive — all plans (starter: 5, professional: 10, agency: 10)
    sql`
      SELECT id::text, url, created_at::text, issue_count, COALESCE(type,'website') AS type
      FROM scans
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${isAgency || plan !== "starter" ? 10 : 5}
    `,

    // Agency branding / accent color
    sql`
      SELECT
        COALESCE(primary_color, '#2563EB') AS primary_color,
        COALESCE(agency_name,   '')         AS agency_name,
        COALESCE(logo_url,      '')         AS logo_url,
        COALESCE(widget_views,  0)::int     AS widget_views
      FROM agency_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `,

    // Scan KPIs from scan_log
    sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${monthStart})::int AS scans_this_month,
        AVG(duration_ms) FILTER (WHERE created_at >= ${monthStart}
          AND status = 'success' AND duration_ms IS NOT NULL)::int AS avg_ms
      FROM scan_log
      WHERE user_id = ${userId}
    `,

    // Monitored sites
    sql`
      SELECT id::text, name, url, last_check_status
      FROM saved_websites
      WHERE user_id = ${userId}
      ORDER BY name ASC NULLS LAST, url ASC
    `,

    // Lead stats — agency only
    isAgency
      ? sql`
          SELECT
            COUNT(*) FILTER (WHERE created_at >= ${monthStart})::int AS leads_this_month,
            COUNT(*)::int                                              AS leads_total
          FROM widget_leads
          WHERE agency_user_id = ${agencyId}
        `
      : Promise.resolve([{ leads_this_month: 0, leads_total: 0 }]),

    // Recent leads — agency only
    isAgency
      ? sql`
          SELECT visitor_email, scanned_url, COALESCE(score,0)::int AS score, created_at::text
          FROM widget_leads
          WHERE agency_user_id = ${agencyId}
          ORDER BY created_at DESC LIMIT 6
        `
      : Promise.resolve([]),

    // Activity logs — agency only
    isAgency
      ? sql`
          SELECT event_type, metadata, created_at::text
          FROM activity_logs
          WHERE agency_id = ${userId}
          ORDER BY created_at DESC LIMIT 5
        `
      : Promise.resolve([]),

    // Versand-Historie der letzten 6 Monate — agency only
    isAgency
      ? sql`
          SELECT month::text, sent_at::text, website_count
          FROM monthly_reports
          WHERE user_id = ${userId} AND website_id IS NULL
          ORDER BY month DESC
          LIMIT 6
        `
      : Promise.resolve([]),

    // Failed-Cron-Events — agency only, letzte 6 Monate (Phase 5 Patch)
    isAgency
      ? sql`
          SELECT metadata, created_at::text
          FROM activity_logs
          WHERE agency_id = ${userId}
            AND event_type = 'monthly_report_failed'
            AND created_at >= NOW() - INTERVAL '6 months'
          ORDER BY created_at DESC
        `
      : Promise.resolve([]),
  ]);

  const sentReports  = sentReportsRaw  as Array<{ month: string; sent_at: string; website_count: number | null }>;
  const failedEvents = failedEventsRaw as Array<{ metadata: Record<string, string>; created_at: string }>;

  // Versand-Historie für die letzten 6 Monate berechnen.
  // - sentReports: erfolgreich versendete Monate
  // - failedEvents: gescheiterte Cron-Versuche (metadata.month muss existieren)
  // Alle anderen Monate sind 'pending' (Cron lief noch nicht ODER User wurde geskipped).
  function buildSendHistory(): SendHistoryItem[] {
    const sentMap = new Map<string, { sent_at: string; websites: number }>();
    for (const r of sentReports) {
      sentMap.set(r.month.slice(0, 7), { sent_at: r.sent_at, websites: r.website_count ?? 0 });
    }
    const failedMap = new Map<string, string>();
    for (const e of failedEvents) {
      const m = (e.metadata?.month ?? "").slice(0, 7);
      if (m && !failedMap.has(m)) failedMap.set(m, e.metadata?.error ?? "Unbekannter Fehler");
    }

    const items: SendHistoryItem[] = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      const monthIso = `${monthKey}-01`;
      const lbl = d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

      const sentRec = sentMap.get(monthKey);
      if (sentRec) {
        items.push({ month: monthIso, monthLbl: lbl, status: "sent",   sent_at: sentRec.sent_at, errorMsg: null, websites: sentRec.websites });
      } else if (failedMap.has(monthKey)) {
        items.push({ month: monthIso, monthLbl: lbl, status: "failed", sent_at: null, errorMsg: failedMap.get(monthKey) ?? null, websites: 0 });
      } else {
        items.push({ month: monthIso, monthLbl: lbl, status: "pending", sent_at: null, errorMsg: null, websites: 0 });
      }
    }
    return items;
  }
  const sendHistory: SendHistoryItem[] = isAgency ? buildSendHistory() : [];

  // ── Assemble ────────────────────────────────────────────────────────────────
  const br = (brandingRows[0] ?? {}) as { primary_color: string; agency_name: string; logo_url: string; widget_views: number };
  const ls = (leadStats[0]   ?? {}) as { leads_this_month: number; leads_total: number };
  const ss = (scanStats[0]   ?? {}) as { scans_this_month: number; avg_ms: number | null };

  const sites     = siteRows as { id: string; name: string | null; url: string; last_check_status: string | null }[];
  const okSites   = sites.filter(s => s.last_check_status === "ok").length;
  const uptimePct = sites.length > 0 ? Math.round((okSites / sites.length) * 100) : null;

  const branding: ReportBranding = {
    primaryColor: br.primary_color ?? "#2563EB",
    agencyName:   br.agency_name   ?? "",
    logoUrl:      br.logo_url      ?? "",
  };

  const kpis: ReportKPIs = {
    leadsThisMonth: ls.leads_this_month ?? 0,
    leadsTotal:     ls.leads_total      ?? 0,
    scansThisMonth: ss.scans_this_month ?? 0,
    avgResponseMs:  ss.avg_ms           ?? null,
    monitoredSites: sites.length,
    uptimePct,
    widgetViews:    br.widget_views ?? 0,
  };

  const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
    ai_fix_generated:    { icon: "🤖", label: "KI-Optimierungsvorschlag",   color: "#7C3AED" },
    jira_ticket_created: { icon: "📋", label: "Entwickler-Ticket erstellt",  color: "#0369A1" },
    scan_completed:      { icon: "🔍", label: "Audit abgeschlossen",         color: "#2563EB" },
    alert_sent:          { icon: "🚨", label: "Monitoring-Alert",             color: "#DC2626" },
  };

  const activities: ActivityItem[] = [
    ...(recentLeads as { visitor_email: string; scanned_url: string; score: number; created_at: string }[]).map(l => {
      const domain = (() => { try { return new URL(l.scanned_url).hostname; } catch { return l.scanned_url; } })();
      return { type: "lead" as const, icon: "🎯", label: `Neuer Lead: ${l.visitor_email}`, sub: `${domain} · Score ${l.score}%`, date: l.created_at, color: "#16A34A" };
    }),
    ...(activityRows as { event_type: string; metadata: Record<string, string>; created_at: string }[]).map(a => {
      const meta = EVENT_META[a.event_type] ?? { icon: "•", label: a.event_type, color: "#6B7280" };
      const m    = (a.metadata as Record<string, string>) ?? {};
      const sub  = m.jira_key ? `Ticket ${m.jira_key}` : m.alert_type ? m.alert_type.replace(/_/g, " ") : "";
      return { type: "activity" as const, icon: meta.icon, label: meta.label, sub, date: a.created_at, color: meta.color };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const history = (scanHistory as ScanHistoryItem[]);
  const savedSites: SavedSite[] = sites.map(s => ({ id: s.id, name: s.name, url: s.url }));

  return (
    <ReportsClient
      plan={plan}
      scanHistory={history}
      branding={branding}
      kpis={kpis}
      activities={activities}
      monthLabel={monthLabel}
      agencyId={agencyId}
      savedSites={savedSites}
      sendHistory={sendHistory}
    />
  );
}
