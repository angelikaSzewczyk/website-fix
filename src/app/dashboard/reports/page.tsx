import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ReportActions from "./report-actions";
import ValueReportClient from "./value-report-client";

type ReportRow = {
  id: number;
  month: string;
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
      SELECT id, month, sent_at, website_count, ok_count, issue_count, avg_uptime_pct
      FROM monthly_reports
      WHERE user_id = ${user.id}
      ORDER BY month DESC LIMIT 24
    ` as unknown as Promise<ReportRow[]>,

    // Fixed: now queries activity_logs (not the dropped activity_log)
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

    // Websites for Value Report generator (agentur only)
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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Berichte</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
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
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
          background: "rgba(255,255,255,0.01)", marginBottom: 32, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700 }}>Erbrachte Leistungen</h2>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{monthLabel} — Übersicht</p>
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { value: vs.scans_total,               label: "Scans",             color: "#7aa6ff",              icon: "🔍" },
                { value: vs.wcag_scans,                label: "WCAG-Audits",       color: "#8df3d3",              icon: "♿" },
                { value: vs.ai_suggestions,            label: "KI-Lösungen",       color: "#7aa6ff",              icon: "🤖" },
                { value: vs.jira_tickets,              label: "Jira Tickets",      color: "#8df3d3",              icon: "📋" },
                { value: vs.critical_issues_resolved,  label: "Slack-Aktionen",    color: "#ffd93d",              icon: "⚡" },
                { value: vs.websites_monitored,        label: "Überwacht",         color: "rgba(255,255,255,0.6)", icon: "🌐" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
                }}>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Auto-generated talking points */}
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Gesprächs-Punkte für das Kunden-Meeting
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
                {`„Im ${monthLabel} haben wir `}
                <strong style={{ color: "#fff" }}>{vs.scans_total} automatisierte Scans</strong>
                {` durchgeführt`}
                {vs.wcag_scans > 0 && <> (davon <strong style={{ color: "#8df3d3" }}>{vs.wcag_scans} WCAG-Audits</strong>)</>}
                {vs.critical_issues_resolved > 0 && <>, <strong style={{ color: "#ffd93d" }}>{vs.critical_issues_resolved} kritische Ereignisse</strong> direkt via KI-Assistenz bearbeitet</>}
                {vs.jira_tickets > 0 && <> und <strong style={{ color: "#8df3d3" }}>{vs.jira_tickets} Tickets</strong> ins Projektmanagement übergeben</>}
                {`. Alle ${vs.websites_monitored} Websites werden 24/7 überwacht."`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORTS TABLE */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Automatische Monatsberichte
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
            Werden am 1. jeden Monats generiert und per E-Mail versandt.
          </p>
        </div>

        {reports.length === 0 ? (
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
            padding: "40px 32px", textAlign: "center",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 6px" }}>Noch kein Bericht vorhanden.</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0 }}>
              Der erste Bericht wird am 1. des nächsten Monats automatisch verschickt.
            </p>
          </div>
        ) : (
          <div className="scroll-x-sm" style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
              minWidth: 580, padding: "10px 20px",
              background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {["Monat", "Websites", "OK", "Probleme", "Ø Uptime", "Versandt"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </span>
              ))}
            </div>

            {reports.map((r, i) => {
              const date      = new Date(r.month);
              const monthStr  = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
              const sentStr   = new Date(r.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
              return (
                <div key={r.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
                  minWidth: 580, padding: "14px 20px",
                  borderBottom: i < reports.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{monthStr}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{r.website_count}</span>
                  <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>{r.ok_count}</span>
                  <span style={{ fontSize: 14, color: r.issue_count > 0 ? "#ef4444" : "rgba(255,255,255,0.35)", fontWeight: r.issue_count > 0 ? 600 : 400 }}>
                    {r.issue_count}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                    {r.avg_uptime_pct > 0 ? `${r.avg_uptime_pct}%` : "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{sentStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
