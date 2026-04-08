import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ReportActions from "./report-actions";
import ValueReportClient from "./value-report-client";

const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FCA5A5",
};

type ReportRow = {
  id: number;
  month: string;
  client_name: string | null;
  sent_at: string;
  website_count: number;
  ok_count: number;
  issue_count: number;
  avg_uptime_pct: number;
};

type Website = { id: string; name: string | null; url: string };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);

  const [user] = await sql`
    SELECT id, plan FROM users WHERE email = ${session.user.email}
  ` as { id: number; plan: string }[];

  if (!user || !["pro", "agentur"].includes(user.plan)) redirect("/dashboard");

  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthLabel   = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const [reports, valueStats, websites] = await Promise.all([

    sql`
      SELECT id, month, client_name, sent_at, website_count, ok_count, issue_count, avg_uptime_pct
      FROM monthly_reports
      WHERE user_id = ${user.id}
      ORDER BY month DESC LIMIT 24
    ` as unknown as Promise<ReportRow[]>,

    user.plan === "agentur"
      ? sql`
          SELECT
            (SELECT COUNT(*)::int FROM scans           WHERE user_id  = ${user.id} AND created_at >= ${monthStart}) AS scans_total,
            (SELECT COUNT(*)::int FROM scans           WHERE user_id  = ${user.id} AND created_at >= ${monthStart} AND type = 'wcag') AS wcag_scans,
            (SELECT COUNT(*)::int FROM activity_logs   WHERE agency_id = ${user.id} AND created_at >= ${monthStart} AND event_type = 'ai_fix_generated') AS ai_suggestions,
            (SELECT COUNT(*)::int FROM activity_logs   WHERE agency_id = ${user.id} AND created_at >= ${monthStart} AND event_type = 'jira_ticket_created') AS jira_tickets,
            (SELECT COUNT(*)::int FROM activity_logs   WHERE agency_id = ${user.id} AND created_at >= ${monthStart}) AS critical_issues_resolved,
            (SELECT COUNT(*)::int FROM saved_websites  WHERE user_id  = ${user.id}) AS websites_monitored
        ` as unknown as Promise<{ scans_total: number; wcag_scans: number; ai_suggestions: number; jira_tickets: number; critical_issues_resolved: number; websites_monitored: number }[]>
      : Promise.resolve([]),

    user.plan === "agentur"
      ? sql`
          SELECT id::text, name, url FROM saved_websites
          WHERE user_id = ${user.id}
          ORDER BY name ASC NULLS LAST, url ASC
        ` as unknown as Promise<Website[]>
      : Promise.resolve([]),
  ]);

  const vs = (valueStats as { scans_total: number; wcag_scans: number; ai_suggestions: number; jira_tickets: number; critical_issues_resolved: number; websites_monitored: number }[])[0];

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>Berichte</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            Value Reports und automatische Monatsberichte.
          </p>
        </div>
        <ReportActions currentMonth={currentMonth} />
      </div>

      {/* VALUE REPORT GENERATOR — Agentur only */}
      {user.plan === "agentur" && (
        <ValueReportClient websites={websites as Website[]} />
      )}

      {/* MONTH SUMMARY — Agentur only */}
      {user.plan === "agentur" && vs && (
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          boxShadow: C.shadow,
          marginBottom: 32,
          overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${C.divider}` }}>
            <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: C.text }}>Erbrachte Leistungen</h2>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{monthLabel} — Übersicht</p>
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { value: vs.scans_total,              label: "Scans",          color: C.blue,  bg: C.blueBg,  icon: "🔍" },
                { value: vs.wcag_scans,               label: "WCAG-Audits",    color: C.green, bg: C.greenBg, icon: "♿" },
                { value: vs.ai_suggestions,           label: "KI-Lösungen",    color: C.blue,  bg: C.blueBg,  icon: "🤖" },
                { value: vs.jira_tickets,             label: "Jira Tickets",   color: C.green, bg: C.greenBg, icon: "📋" },
                { value: vs.critical_issues_resolved, label: "Slack-Aktionen", color: C.amber, bg: C.amberBg, icon: "⚡" },
                { value: vs.websites_monitored,       label: "Überwacht",      color: C.textSub, bg: C.divider, icon: "🌐" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: s.bg,
                }}>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Talking points */}
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: C.blueBg, border: `1px solid ${C.blueBorder}`,
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Gesprächs-Punkte für das Kunden-Meeting
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.8 }}>
                {`„Im ${monthLabel} haben wir `}
                <strong style={{ color: C.text }}>{vs.scans_total} automatisierte Scans</strong>
                {` durchgeführt`}
                {vs.wcag_scans > 0 && <> (davon <strong style={{ color: C.green }}>{vs.wcag_scans} WCAG-Audits</strong>)</>}
                {vs.critical_issues_resolved > 0 && <>, <strong style={{ color: C.amber }}>{vs.critical_issues_resolved} kritische Ereignisse</strong> direkt via KI-Assistenz bearbeitet</>}
                {vs.jira_tickets > 0 && <> und <strong style={{ color: C.green }}>{vs.jira_tickets} Tickets</strong> ins Projektmanagement übergeben</>}
                {`. Alle ${vs.websites_monitored} Websites werden 24/7 überwacht."`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORTS TABLE */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Automatische Monatsberichte
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Werden am 1. jeden Monats generiert und per E-Mail versandt.
          </p>
        </div>

        {reports.length === 0 ? (
          /* ── Empty State ── */
          <div style={{
            background: C.card,
            border: `1px dashed ${C.border}`,
            borderRadius: 16,
            padding: "56px 32px",
            textAlign: "center",
          }}>
            {/* Illustration */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: C.blueBg, border: `1px solid ${C.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: C.text }}>
              Noch kein Bericht vorhanden
            </h3>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: C.textSub, lineHeight: 1.65, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              Dein erster Monatsbericht wird automatisch am{" "}
              <strong style={{ color: C.text }}>1. des nächsten Monats</strong>{" "}
              erstellt und per E-Mail verschickt.
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: C.textMuted }}>
              Führe jetzt Scans durch — sie fließen direkt in den Bericht ein.
            </p>

            <a href="/dashboard/scan" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 10, textDecoration: "none",
              fontSize: 14, fontWeight: 700,
              background: C.blue, color: "#fff",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Scan starten →
            </a>
          </div>
        ) : (
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: C.shadow,
            overflow: "hidden",
          }}>
            {reports.map((r, idx) => {
              const date     = new Date(r.month);
              const monthStr = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
              const sentStr  = new Date(r.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
              const uptime   = r.avg_uptime_pct;
              const uptimeColor = uptime >= 99 ? C.green : uptime >= 95 ? C.amber : C.red;
              const uptimeBg    = uptime >= 99 ? C.greenBg : uptime >= 95 ? C.amberBg : C.redBg;
              const clientLabel = r.client_name ?? "?";
              const avatarLetter = clientLabel.charAt(0).toUpperCase();

              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 20px",
                  borderBottom: idx < reports.length - 1 ? `1px solid ${C.divider}` : "none",
                }}>
                  {/* Client avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: C.blueBg, border: `1px solid ${C.blueBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: C.blue,
                  }}>
                    {avatarLetter}
                  </div>

                  {/* Primary info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {clientLabel}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {monthStr}
                    </div>
                  </div>

                  {/* Uptime indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{
                      padding: "3px 9px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      color: uptimeColor, background: uptimeBg,
                    }}>
                      {uptime > 0 ? `${uptime}% Uptime` : "—"}
                    </span>
                  </div>

                  {/* Issues pill */}
                  <div style={{
                    padding: "3px 10px", borderRadius: 16, flexShrink: 0,
                    fontSize: 12, fontWeight: 600,
                    color: r.issue_count > 0 ? C.red : C.green,
                    background: r.issue_count > 0 ? C.redBg : C.greenBg,
                    border: `1px solid ${r.issue_count > 0 ? C.redBorder : "#A7F3D0"}`,
                  }}>
                    {r.issue_count > 0 ? `${r.issue_count} Issues` : "✓ Alles OK"}
                  </div>

                  {/* Sent date */}
                  <div style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, textAlign: "right", minWidth: 80 }}>
                    {sentStr}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
