import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Log — WebsiteFix",
  robots: { index: false },
};

type LogEntry = {
  id: number;
  action_type: string;
  project_name: string | null;
  project_url: string | null;
  alert_type: string | null;
  detail: string | null;
  jira_key: string | null;
  created_at: string;
};

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  ai_suggest:     { icon: "🤖", color: "#7aa6ff",              label: "KI-Lösung generiert" },
  jira_create:    { icon: "📋", color: "#8df3d3",              label: "Jira Ticket erstellt" },
  scan_completed: { icon: "🔍", color: "rgba(255,255,255,0.5)", label: "Scan abgeschlossen" },
  alert_sent:     { icon: "🚨", color: "#ffd93d",              label: "Alert gesendet" },
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  website_down:     "Website offline",
  ssl_expiring:     "SSL läuft ab",
  security_issue:   "Sicherheitsproblem",
  performance_drop: "Performance",
  wcag_violation:   "Barrierefreiheit",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days !== 1 ? "en" : ""}`;
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const entries = await sql`
    SELECT id, action_type, project_name, project_url, alert_type, detail, jira_key, created_at
    FROM activity_log
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 100
  ` as LogEntry[];

  // Month stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthEntries = entries.filter(e => e.created_at >= monthStart);
  const aiCount    = monthEntries.filter(e => e.action_type === "ai_suggest").length;
  const jiraCount  = monthEntries.filter(e => e.action_type === "jira_create").length;
  const alertCount = monthEntries.filter(e => e.action_type === "alert_sent").length;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Activity Log</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Alle automatisierten Aktionen und Slack-Interaktionen.
        </p>
      </div>

      {/* MONTH STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
        {[
          { label: "Aktionen gesamt",    value: monthEntries.length, color: "rgba(255,255,255,0.7)" },
          { label: "KI-Lösungen",        value: aiCount,             color: "#7aa6ff" },
          { label: "Jira Tickets",       value: jiraCount,           color: "#8df3d3" },
          { label: "Alerts ausgelöst",   value: alertCount,          color: "#ffd93d" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 18px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LOG LIST */}
      {entries.length === 0 ? (
        <div style={{
          padding: "56px 24px", textAlign: "center",
          border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
        }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            Noch keine Aktivitäten — Slack-Buttons klicken um die erste Aktion zu loggen.
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          {entries.map((entry, i) => {
            const meta = ACTION_META[entry.action_type] ?? ACTION_META.alert_sent;
            return (
              <div key={entry.id} style={{
                padding: "14px 20px",
                borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${meta.color}12`,
                  border: `1px solid ${meta.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>
                    {entry.detail ?? meta.label}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {entry.project_name && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        {entry.project_name}
                      </span>
                    )}
                    {entry.alert_type && (
                      <span style={{
                        fontSize: 11, padding: "1px 7px", borderRadius: 5,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.4)",
                      }}>
                        {ALERT_TYPE_LABEL[entry.alert_type] ?? entry.alert_type}
                      </span>
                    )}
                    {entry.jira_key && (
                      <span style={{ fontSize: 11, color: "#8df3d3", fontWeight: 600 }}>
                        {entry.jira_key}
                      </span>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0, textAlign: "right" }}>
                  <div>{relativeTime(entry.created_at)}</div>
                  <div style={{ marginTop: 2 }}>
                    {new Date(entry.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
