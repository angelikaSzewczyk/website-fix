import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ReportActions from "./report-actions";

type ValueStat = {
  scans_total: number;
  wcag_scans: number;
  ai_suggestions: number;
  jira_tickets: number;
  critical_issues_resolved: number;
  websites_monitored: number;
};

type ReportRow = {
  id: number;
  month: string;
  sent_at: string;
  website_count: number;
  ok_count: number;
  issue_count: number;
  avg_uptime_pct: number;
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);

  const [user] = (await sql`
    SELECT id, plan FROM users WHERE email = ${session.user.email}
  `) as { id: number; plan: string }[];

  if (!user || !["pro", "agentur"].includes(user.plan)) {
    redirect("/dashboard");
  }

  const reports = (await sql`
    SELECT id, month, sent_at, website_count, ok_count, issue_count, avg_uptime_pct
    FROM monthly_reports
    WHERE user_id = ${user.id}
    ORDER BY month DESC
    LIMIT 24
  `) as ReportRow[];

  // Current month string for the send button
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthLabel = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  // Value report stats (agentur only)
  let valueStats: ValueStat | null = null;
  if (user.plan === "agentur") {
    const [vs] = await sql`
      SELECT
        (SELECT COUNT(*)::int  FROM scans        WHERE user_id = ${user.id} AND created_at >= ${monthStart}) AS scans_total,
        (SELECT COUNT(*)::int  FROM scans        WHERE user_id = ${user.id} AND created_at >= ${monthStart} AND type = 'wcag') AS wcag_scans,
        (SELECT COUNT(*)::int  FROM activity_log WHERE user_id = ${user.id} AND created_at >= ${monthStart} AND action_type = 'ai_suggest') AS ai_suggestions,
        (SELECT COUNT(*)::int  FROM activity_log WHERE user_id = ${user.id} AND created_at >= ${monthStart} AND action_type = 'jira_create') AS jira_tickets,
        (SELECT COUNT(*)::int  FROM activity_log WHERE user_id = ${user.id} AND created_at >= ${monthStart} AND action_type IN ('ai_suggest','jira_create')) AS critical_issues_resolved,
        (SELECT COUNT(*)::int  FROM saved_websites WHERE user_id = ${user.id}) AS websites_monitored
    ` as ValueStat[];
    if (vs) valueStats = vs;
  }

  return (
    <>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Monatsberichte
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Automatisch generiert am 1. jedes Monats und per E-Mail versandt.
            </p>
          </div>

          <ReportActions currentMonth={currentMonth} />
        </div>

        {/* VALUE REPORT — Agentur only */}
        {valueStats && (
          <div style={{
            border: "1px solid rgba(122,166,255,0.15)",
            borderRadius: 14,
            background: "rgba(122,166,255,0.02)",
            marginBottom: 32,
            overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Erbrachte Leistungen</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{monthLabel}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                  background: "rgba(122,166,255,0.1)", border: "1px solid rgba(122,166,255,0.2)",
                  color: "#7aa6ff",
                }}>
                  Agentur-Report
                </span>
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 24 }}>
                {[
                  { value: valueStats.scans_total,            label: "Scans durchgeführt",         color: "#7aa6ff",              icon: "🔍" },
                  { value: valueStats.wcag_scans,             label: "WCAG-Audits",                 color: "#8df3d3",              icon: "♿" },
                  { value: valueStats.ai_suggestions,         label: "KI-Lösungen generiert",       color: "#7aa6ff",              icon: "🤖" },
                  { value: valueStats.jira_tickets,           label: "Jira Tickets erstellt",       color: "#8df3d3",              icon: "📋" },
                  { value: valueStats.critical_issues_resolved, label: "Kritische Issues bearbeitet", color: "#ffd93d",            icon: "🚨" },
                  { value: valueStats.websites_monitored,     label: "Websites überwacht",          color: "rgba(255,255,255,0.6)", icon: "🌐" },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "14px 16px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <div style={{ fontSize: 13, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Copy-paste summary for client conversations */}
              <div style={{
                padding: "16px 18px", borderRadius: 10,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Gesprächsvorbereitung — Zusammenfassung für Kunden
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
                  {`„Im ${monthLabel} haben wir `}
                  <strong style={{ color: "#fff" }}>{valueStats.scans_total} automatisierte Scans</strong>
                  {` durchgeführt`}
                  {valueStats.wcag_scans > 0 && <> (davon <strong style={{ color: "#8df3d3" }}>{valueStats.wcag_scans} WCAG-Audits</strong> für BFSG-Konformität)</>}
                  {valueStats.critical_issues_resolved > 0 && (
                    <>, <strong style={{ color: "#ffd93d" }}>{valueStats.critical_issues_resolved} kritische Sicherheitsprobleme</strong> sofort via KI-Assistenz identifiziert und bearbeitet</>
                  )}
                  {valueStats.jira_tickets > 0 && (
                    <> und <strong style={{ color: "#8df3d3" }}>{valueStats.jira_tickets} Tickets</strong> direkt ins Projektmanagement übergeben</>
                  )}
                  {`. Alle ${valueStats.websites_monitored} Websites werden 24/7 überwacht."`}
                </p>
              </div>
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
            padding: "48px 32px", textAlign: "center",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 8px" }}>
              Noch kein Bericht vorhanden.
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0 }}>
              Der erste Bericht wird am 1. des nächsten Monats automatisch verschickt. Du kannst auch jetzt einen Testbericht senden.
            </p>
          </div>
        ) : (
          <div className="scroll-x-sm" style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
              minWidth: 580,
              padding: "10px 20px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {["Monat", "Websites", "OK", "Probleme", "Ø Uptime", "Versandt"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </span>
              ))}
            </div>

            {reports.map((r, i) => {
              const date = new Date(r.month);
              const monthLabel = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
              const sentDate = new Date(r.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

              return (
                <div key={r.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
                  minWidth: 580,
                  padding: "16px 20px",
                  borderBottom: i < reports.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{monthLabel}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{r.website_count}</span>
                  <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>{r.ok_count}</span>
                  <span style={{ fontSize: 14, color: r.issue_count > 0 ? "#ef4444" : "rgba(255,255,255,0.35)", fontWeight: r.issue_count > 0 ? 600 : 400 }}>
                    {r.issue_count}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                    {r.avg_uptime_pct > 0 ? `${r.avg_uptime_pct}%` : "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{sentDate}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, lineHeight: 1.6 }}>
            Berichte werden automatisch am 1. jeden Monats für den Vormonat generiert und an deine E-Mail-Adresse gesendet.
            Mit dem Button oben kannst du jederzeit einen Bericht für den aktuellen Monat manuell auslösen.
          </p>
        </div>
      </main>
    </>
  );
}
