"use server";

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";

export type ValueReportData = {
  // Client
  websiteId:   string;
  websiteName: string;
  websiteUrl:  string;
  monthLabel:  string;
  // Activities
  activities: { event_type: string; label: string; detail: string; created_at: string }[];
  // Monitoring
  avgUptimePct:  number;
  avgResponseMs: number | null;
  totalChecks:   number;
  // Scans
  scanCounts: { total: number; wcag: number; performance: number; website: number };
  // AI
  executiveSummary: string;
  // Branding
  agencyName:    string;
  logoUrl:       string;
  primaryColor:  string;
};

const EVENT_LABEL: Record<string, string> = {
  ai_fix_generated:    "KI-Optimierungsvorschlag erstellt",
  jira_ticket_created: "Technisches Ticket an Entwicklungsteam delegiert",
  scan_completed:      "Website-Audit durchgeführt",
  alert_sent:          "Monitoring-Alert erkannt und bearbeitet",
};

export async function generateMonthlyValueReport(
  websiteId: string,
  monthStr:  string,   // "YYYY-MM" from <input type="month">
): Promise<{ data?: ValueReportData; error?: string }> {

  const session = await auth();
  if (!session?.user) return { error: "Nicht eingeloggt." };

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") return { error: "Nur für den Agentur-Plan." };

  const sql = neon(process.env.DATABASE_URL!);

  // Parse month
  const [year, mon] = monthStr.split("-").map(Number);
  const monthStart = new Date(year, mon - 1, 1).toISOString();
  const monthEnd   = new Date(year, mon, 0, 23, 59, 59).toISOString();
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  // Verify website ownership
  const [site] = await sql`
    SELECT id::text, name, url FROM saved_websites
    WHERE id = ${websiteId}::uuid AND user_id = ${session.user.id}
    LIMIT 1
  ` as { id: string; name: string | null; url: string }[];

  if (!site) return { error: "Website nicht gefunden oder keine Berechtigung." };

  // ── Queries in parallel ───────────────────────────────────────────────────

  const [activityRows, checkStats, scanStats, agencyRow] = await Promise.all([

    sql`
      SELECT event_type, metadata, created_at
      FROM activity_logs
      WHERE client_id = ${websiteId}::uuid
        AND agency_id = ${session.user.id}
        AND created_at BETWEEN ${monthStart} AND ${monthEnd}
      ORDER BY created_at DESC
    ` as Promise<{ event_type: string; metadata: Record<string, string>; created_at: string }[]>,

    sql`
      SELECT
        COUNT(*)::int                                                  AS total_checks,
        COALESCE(ROUND(AVG(CASE WHEN is_online THEN 100 ELSE 0 END)), 100)::int AS avg_uptime_pct,
        ROUND(AVG(response_time_ms))::int                             AS avg_response_ms
      FROM website_checks
      WHERE website_id = ${websiteId}::uuid
        AND user_id    = ${session.user.id}
        AND checked_at BETWEEN ${monthStart} AND ${monthEnd}
    ` as Promise<{ total_checks: number; avg_uptime_pct: number; avg_response_ms: number | null }[]>,

    sql`
      SELECT
        COUNT(*)::int                                          AS total,
        COUNT(*) FILTER (WHERE type = 'wcag')::int        AS wcag,
        COUNT(*) FILTER (WHERE type = 'performance')::int AS performance,
        COUNT(*) FILTER (WHERE type = 'website')::int     AS website
      FROM scans
      WHERE url       = ${site.url}
        AND user_id   = ${session.user.id}
        AND created_at BETWEEN ${monthStart} AND ${monthEnd}
    ` as Promise<{ total: number; wcag: number; performance: number; website: number }[]>,

    sql`
      SELECT agency_name, logo_url, primary_color
      FROM agency_settings
      WHERE user_id = ${session.user.id}
      LIMIT 1
    ` as Promise<{ agency_name: string | null; logo_url: string | null; primary_color: string | null }[]>,
  ]);

  const checks = checkStats[0];
  const scans  = scanStats[0];
  const agency = agencyRow[0];

  // ── Build activity list for Claude ────────────────────────────────────────

  const activities = activityRows.map(a => {
    const m      = a.metadata ?? {};
    const detail = m.jira_key
      ? `Ticket ${m.jira_key}${m.issue_label ? ` — ${m.issue_label}` : ""}`
      : m.alert_type ? m.alert_type.replace(/_/g, " ") : "";
    return { event_type: a.event_type, label: EVENT_LABEL[a.event_type] ?? a.event_type, detail, created_at: a.created_at };
  });

  const bulletLines: string[] = [
    ...activities.map(a => `- ${a.label}${a.detail ? ` (${a.detail})` : ""}`),
    ...(scans?.wcag        > 0 ? [`- ${scans.wcag} WCAG-Barrierefreiheits-Audit(s) — BFSG-Konformität sichergestellt`] : []),
    ...(scans?.performance > 0 ? [`- ${scans.performance} Performance-Audit(s) durchgeführt`] : []),
    ...(scans?.website     > 0 ? [`- ${scans.website} vollständiger Website-Check(s)`] : []),
  ];

  const uptimeLine = checks?.total_checks > 0
    ? `Technische Kennzahlen: ${checks.avg_uptime_pct}% Uptime, Ø ${checks.avg_response_ms ?? "–"}ms Ladezeit, ${checks.total_checks} Monitoring-Checks.`
    : "";

  // ── Claude Executive Summary ──────────────────────────────────────────────

  let executiveSummary = `Wir haben im ${monthLabel} alle vereinbarten Leistungen für Ihre Website erbracht und den reibungslosen Betrieb sichergestellt.`;

  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{
        role:    "user",
        content: `Du bist ein Account Manager einer Webagentur. Hier ist eine Liste der technischen Arbeiten, die wir diesen Monat für den Kunden "${site.name ?? site.url}" erledigt haben:

${bulletLines.length > 0 ? bulletLines.join("\n") : "- Allgemeine Website-Überwachung und Bereitschaft"}
${uptimeLine ? `\n${uptimeLine}` : ""}

Schreibe daraus eine höfliche, professionelle Management-Zusammenfassung (3–4 Sätze), die dem Kunden zeigt, dass seine Website sicher, stabil und rechtssicher (WCAG) ist. Vermeide zu viel Technik-Jargon. Schreibe in der Wir-Form. Antworte auf Deutsch.`,
      }],
    });
    executiveSummary = (msg.content[0] as { type: string; text: string }).text;
  } catch (err) {
    console.error("Claude summary error:", err);
  }

  return {
    data: {
      websiteId,
      websiteName:  site.name ?? site.url,
      websiteUrl:   site.url,
      monthLabel,
      activities,
      avgUptimePct:  checks?.avg_uptime_pct  ?? 100,
      avgResponseMs: checks?.avg_response_ms ?? null,
      totalChecks:   checks?.total_checks    ?? 0,
      scanCounts: {
        total:       scans?.total       ?? 0,
        wcag:        scans?.wcag        ?? 0,
        performance: scans?.performance ?? 0,
        website:     scans?.website     ?? 0,
      },
      executiveSummary,
      agencyName:   agency?.agency_name   ?? "",
      logoUrl:      agency?.logo_url      ?? "",
      primaryColor: agency?.primary_color ?? "#8df3d3",
    },
  };
}
