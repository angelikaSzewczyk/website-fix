"use server";

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "@/lib/ai-models";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape returned by generateMonthlyValueReport — matches value-report-client expectations */
export type ValueReportData = {
  // Identifiers
  websiteId:    string;
  websiteName:  string;
  websiteUrl:   string;
  monthLabel:   string;
  monthStr:     string;  // "YYYY-MM"
  // Aggregated metrics
  avgUptimePct:  number;
  avgResponseMs: number | null;
  totalChecks:   number;
  aiFixCount:    number;
  jiraCount:     number;
  scanCounts: {
    total:       number;
    wcag:        number;
    performance: number;
    website:     number;  // total - wcag - performance
  };
  // Activity detail
  activities:  { event_type: string; label: string; detail: string; created_at: string }[];
  // AI output
  executiveSummary: string;
  // Branding
  agencyName:   string;
  logoUrl:      string;
  primaryColor: string;
  // Saved report id (if persisted)
  reportId?:    number;
};

/** @deprecated use ValueReportData */
export type ReportData = ValueReportData & {
  uptime: number;
  fixes: number;
  scans: number;
  wcagScans: number;
  perfScans: number;
  aiSummary: string;
};

// ─── Helper: aggregate raw data ───────────────────────────────────────────────

async function getReportData(
  userId: number,
  websiteId: string,
  monthStr: string,
): Promise<Omit<ValueReportData, "executiveSummary" | "agencyName" | "logoUrl" | "primaryColor">> {

  const sql = neon(process.env.DATABASE_URL!);
  const [year, mon] = monthStr.split("-").map(Number);
  const monthStart  = new Date(year, mon - 1, 1).toISOString();
  const monthEnd    = new Date(year, mon, 0, 23, 59, 59).toISOString();
  const monthLabel  = new Date(year, mon - 1, 1)
    .toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const [site] = await sql`
    SELECT id::text, name, url FROM saved_websites
    WHERE id = ${websiteId}::uuid AND user_id = ${userId} LIMIT 1
  ` as { id: string; name: string | null; url: string }[];

  if (!site) throw new Error("Website nicht gefunden.");

  const [activityRows, checkRow, scanRow] = await Promise.all([

    sql`
      SELECT event_type, metadata, created_at FROM activity_logs
      WHERE client_id  = ${websiteId}::uuid
        AND agency_id  = ${userId}
        AND created_at BETWEEN ${monthStart} AND ${monthEnd}
      ORDER BY created_at DESC
    ` as unknown as Promise<{ event_type: string; metadata: Record<string, string>; created_at: string }[]>,

    sql`
      SELECT
        COALESCE(ROUND(AVG(CASE WHEN is_online THEN 100 ELSE 0 END)), 100)::int AS uptime,
        ROUND(AVG(response_time_ms))::int AS avg_response_ms,
        COUNT(*)::int AS total_checks
      FROM website_checks
      WHERE website_id = ${websiteId}::uuid
        AND user_id    = ${userId}
        AND checked_at BETWEEN ${monthStart} AND ${monthEnd}
    ` as unknown as Promise<{ uptime: number; avg_response_ms: number | null; total_checks: number }[]>,

    sql`
      SELECT
        COUNT(*)::int                                          AS total,
        COUNT(*) FILTER (WHERE type = 'wcag')::int        AS wcag,
        COUNT(*) FILTER (WHERE type = 'performance')::int AS perf
      FROM scans
      WHERE url      = ${site.url}
        AND user_id  = ${userId}
        AND created_at BETWEEN ${monthStart} AND ${monthEnd}
    ` as unknown as Promise<{ total: number; wcag: number; perf: number }[]>,
  ]);

  const checks = checkRow[0];
  const scans  = scanRow[0];

  const EVENT_LABEL: Record<string, string> = {
    ai_fix_generated:    "KI-Optimierungsvorschlag erstellt",
    jira_ticket_created: "Technisches Ticket delegiert",
    scan_completed:      "Website-Audit durchgeführt",
    alert_sent:          "Monitoring-Alert bearbeitet",
  };

  const activities = activityRows.map(a => {
    const m = a.metadata ?? {};
    const detail = m.jira_key
      ? `Ticket ${m.jira_key}${m.issue_label ? ` — ${m.issue_label}` : ""}`
      : m.alert_type ? m.alert_type.replace(/_/g, " ") : "";
    return { event_type: a.event_type, label: EVENT_LABEL[a.event_type] ?? a.event_type, detail, created_at: a.created_at };
  });

  const aiFixCount = activityRows.filter(a => a.event_type === "ai_fix_generated").length;
  const jiraCount  = activityRows.filter(a => a.event_type === "jira_ticket_created").length;

  const totalScans = scans?.total ?? 0;
  const wcagScans  = scans?.wcag  ?? 0;
  const perfScans  = scans?.perf  ?? 0;

  return {
    websiteId,
    websiteName:   site.name ?? site.url,
    websiteUrl:    site.url,
    monthLabel,
    monthStr,
    avgUptimePct:  checks?.uptime        ?? 100,
    avgResponseMs: checks?.avg_response_ms ?? null,
    totalChecks:   checks?.total_checks  ?? 0,
    aiFixCount,
    jiraCount,
    scanCounts: {
      total:       totalScans,
      wcag:        wcagScans,
      performance: perfScans,
      website:     Math.max(0, totalScans - wcagScans - perfScans),
    },
    activities,
  };
}

// ─── AI Summary ───────────────────────────────────────────────────────────────

async function generateAISummary(
  data: Omit<ValueReportData, "executiveSummary" | "agencyName" | "logoUrl" | "primaryColor" | "reportId">,
): Promise<string> {
  const fallback = `Wir haben im ${data.monthLabel} alle vereinbarten Leistungen für Ihre Website erbracht und den reibungslosen Betrieb sichergestellt.`;

  const fixes = data.aiFixCount + data.jiraCount;
  const dataLines = [
    `- Uptime: ${data.avgUptimePct}%${data.totalChecks > 0 ? ` (${data.totalChecks} Monitoring-Checks)` : ""}`,
    data.avgResponseMs != null ? `- Durchschnittliche Ladezeit: ${data.avgResponseMs} ms` : null,
    fixes > 0
      ? `- Behobene Probleme: ${fixes} (${data.aiFixCount} via KI-Assistent, ${data.jiraCount} als Entwickler-Ticket)`
      : null,
    data.scanCounts.total > 0
      ? `- Durchgeführte Audits: ${data.scanCounts.total} gesamt (${data.scanCounts.wcag} WCAG-Barrierefreiheit, ${data.scanCounts.performance} Performance)`
      : null,
    data.activities.length > 0 ? `- Aktive Interventionen: ${data.activities.length}` : null,
  ].filter(Boolean).join("\n");

  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model:      MODELS.EXPERT,
      max_tokens: 350,
      system: `Du bist Senior Account Manager einer Webagentur. \
Schreibe für den Kunden eine Management-Zusammenfassung (3-4 Sätze). \
Verwandle technische Events (z.B. SSL-Fix, WCAG-Scan) in geschäftlichen Mehrwert \
(Sicherheit, Rechtssicherheit, Umsatzschutz). \
Sei professionell und beruhigend. \
Verkaufe das Gefühl, dass die Website in besten Händen ist.`,
      messages: [{
        role:    "user",
        content: `Kunde: ${data.websiteName}\nMonat: ${data.monthLabel}\n\nAktivitäten:\n${dataLines}`,
      }],
    });
    return (msg.content[0] as { type: string; text: string }).text;
  } catch (err) {
    console.error("generateAISummary error:", err);
    return fallback;
  }
}

// ─── Server Action: generateMonthlyValueReport ────────────────────────────────

export async function generateMonthlyValueReport(
  websiteId: string,
  monthStr:  string,
): Promise<{ data?: ValueReportData; error?: string }> {

  const session = await auth();
  if (!session?.user) return { error: "Nicht eingeloggt." };

  const plan = (session.user as { plan?: string }).plan;
  if (!["agency-pro", "agentur"].includes(plan ?? "")) return { error: "Nur für den Agency Pro Plan." };

  const sql = neon(process.env.DATABASE_URL!);

  let rawData: Omit<ValueReportData, "executiveSummary" | "agencyName" | "logoUrl" | "primaryColor">;
  try {
    rawData = await getReportData(Number(session.user.id), websiteId, monthStr);
  } catch (err) {
    return { error: (err as Error).message };
  }

  // Agency branding
  const [agencyRow] = await sql`
    SELECT agency_name, logo_url, primary_color
    FROM agency_settings WHERE user_id = ${session.user.id} LIMIT 1
  ` as { agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

  const agencyName  = agencyRow?.agency_name   ?? "";
  const logoUrl     = agencyRow?.logo_url      ?? "";
  const primaryColor = agencyRow?.primary_color ?? "#007BFF";

  // ── Claude: KI-Account-Manager ─────────────────────────────────────────────

  const executiveSummary = await generateAISummary(rawData);

  // ── Persist to monthly_reports (UPSERT by user + website + month) ──────────

  const [year, mon] = monthStr.split("-").map(Number);
  const monthDate = `${year}-${String(mon).padStart(2, "0")}-01`;

  let reportId: number | undefined;
  try {
    const totalFixes = rawData.aiFixCount + rawData.jiraCount;
    const [saved] = await sql`
      INSERT INTO monthly_reports
        (user_id, website_id, client_name, month, sent_at,
         website_count, ok_count, issue_count, avg_uptime_pct,
         fixes_count, ai_summary)
      VALUES
        (${session.user.id}, ${websiteId}::uuid, ${rawData.websiteName}, ${monthDate}, NOW(),
         1,
         ${rawData.avgUptimePct >= 99 ? 1 : 0},
         ${totalFixes},
         ${rawData.avgUptimePct},
         ${totalFixes},
         ${executiveSummary})
      ON CONFLICT (user_id, month)
      DO UPDATE SET
        website_id    = EXCLUDED.website_id,
        client_name   = EXCLUDED.client_name,
        sent_at       = NOW(),
        ok_count      = EXCLUDED.ok_count,
        issue_count   = EXCLUDED.issue_count,
        avg_uptime_pct = EXCLUDED.avg_uptime_pct,
        fixes_count   = EXCLUDED.fixes_count,
        ai_summary    = EXCLUDED.ai_summary
      RETURNING id
    ` as { id: number }[];
    reportId = saved?.id;
  } catch (err) {
    console.error("monthly_reports persist error:", err);
  }

  return {
    data: {
      ...rawData,
      executiveSummary,
      agencyName,
      logoUrl,
      primaryColor,
      reportId,
    },
  };
}

// ─── Server Action: getSavedReports ───────────────────────────────────────────

export type SavedReport = {
  id: number;
  month: string;
  client_name: string | null;
  sent_at: string;
  uptime: number;
  fixes_count: number;
  issue_count: number;
  ai_summary: string | null;
};

export async function getSavedReports(): Promise<SavedReport[]> {
  const session = await auth();
  if (!session?.user) return [];

  const sql = neon(process.env.DATABASE_URL!);
  return sql`
    SELECT id, month, client_name, sent_at, avg_uptime_pct AS uptime,
           fixes_count, issue_count, ai_summary
    FROM monthly_reports
    WHERE user_id = ${session.user.id}
    ORDER BY month DESC, sent_at DESC
    LIMIT 36
  ` as unknown as Promise<SavedReport[]>;
}
