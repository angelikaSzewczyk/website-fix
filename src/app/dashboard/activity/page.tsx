import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Log — WebsiteFix",
  robots: { index: false },
};

type LogEntry = {
  id: number;
  event_type: string;
  platform: string;
  client_id: number | null;
  client_name: string | null;
  client_url: string | null;
  metadata: Record<string, string>;
  created_at: string;
};

type Client = {
  id: number;
  name: string | null;
  url: string;
};

// ─── Business labels ──────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; icon: string; color: string; detail: (m: Record<string, string>) => string }> = {
  ai_fix_generated: {
    label:  "KI-Optimierungsvorschlag erstellt",
    icon:   "🤖",
    color:  "#7aa6ff",
    detail: m => m.alert_type ? `Problem: ${ALERT_LABEL[m.alert_type] ?? m.alert_type}` : "",
  },
  jira_ticket_created: {
    label:  "Technisches Ticket an Entwicklung delegiert",
    icon:   "📋",
    color:  "#8df3d3",
    detail: m => m.jira_key ? `Ticket ${m.jira_key} · ${m.issue_label ?? ""}` : "",
  },
  scan_completed: {
    label:  "Website-Scan abgeschlossen",
    icon:   "🔍",
    color:  "rgba(255,255,255,0.5)",
    detail: m => m.scan_type ?? "",
  },
  alert_sent: {
    label:  "Monitoring-Alert ausgelöst",
    icon:   "🚨",
    color:  "#ffd93d",
    detail: m => m.alert_type ? ALERT_LABEL[m.alert_type] ?? m.alert_type : "",
  },
};

const ALERT_LABEL: Record<string, string> = {
  website_down:     "Website nicht erreichbar",
  ssl_expiring:     "SSL-Zertifikat läuft ab",
  security_issue:   "Sicherheitsproblem",
  performance_drop: "Performance-Einbruch",
  wcag_violation:   "Barrierefreiheit-Verstoß (WCAG)",
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

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);
  const selectedClientId = searchParams.client ? parseInt(searchParams.client) : null;

  // All clients for filter dropdown
  const clients = await sql`
    SELECT id, name, url FROM saved_websites
    WHERE user_id = ${session.user.id}
    ORDER BY name ASC NULLS LAST, url ASC
  ` as Client[];

  // Activity log with optional client filter
  const entries = selectedClientId
    ? await sql`
        SELECT
          al.id, al.event_type, al.platform, al.client_id,
          sw.name AS client_name, sw.url AS client_url,
          al.metadata, al.created_at
        FROM activity_logs al
        LEFT JOIN saved_websites sw ON sw.id = al.client_id
        WHERE al.agency_id = ${session.user.id}
          AND al.client_id = ${selectedClientId}
        ORDER BY al.created_at DESC
        LIMIT 100
      ` as LogEntry[]
    : await sql`
        SELECT
          al.id, al.event_type, al.platform, al.client_id,
          sw.name AS client_name, sw.url AS client_url,
          al.metadata, al.created_at
        FROM activity_logs al
        LEFT JOIN saved_websites sw ON sw.id = al.client_id
        WHERE al.agency_id = ${session.user.id}
        ORDER BY al.created_at DESC
        LIMIT 100
      ` as LogEntry[];

  // Month stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEntries = entries.filter(e => e.created_at >= monthStart);

  const aiCount   = monthEntries.filter(e => e.event_type === "ai_fix_generated").length;
  const jiraCount = monthEntries.filter(e => e.event_type === "jira_ticket_created").length;
  const totalMonth = monthEntries.length;

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Activity Log</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Alle automatisierten Aktionen und KI-Interventionen via Slack.
          </p>
        </div>

        {/* CLIENT FILTER */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectedClient && (
            <Link href="/dashboard/activity" style={{
              fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none",
              padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
            }}>
              × Filter aufheben
            </Link>
          )}
          <div style={{ position: "relative" }}>
            <select
              // Server component — filter via form submit or link
              defaultValue={selectedClientId?.toString() ?? ""}
              onChange={undefined}
              style={{
                appearance: "none", padding: "8px 32px 8px 14px", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, cursor: "pointer", outline: "none",
              }}
              // Use a form wrapper for server-side navigation
              disabled
            >
              <option value="">Alle Kunden</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name ?? c.url}</option>
              ))}
            </select>
          </div>
          {/* Client filter links */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 360 }}>
            <Link
              href="/dashboard/activity"
              style={{
                fontSize: 11, padding: "5px 10px", borderRadius: 6, textDecoration: "none",
                background: !selectedClientId ? "rgba(255,255,255,0.1)" : "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                color: !selectedClientId ? "#fff" : "rgba(255,255,255,0.4)",
                fontWeight: !selectedClientId ? 600 : 400,
              }}
            >
              Alle
            </Link>
            {clients.slice(0, 6).map(c => (
              <Link
                key={c.id}
                href={`/dashboard/activity?client=${c.id}`}
                style={{
                  fontSize: 11, padding: "5px 10px", borderRadius: 6, textDecoration: "none",
                  background: selectedClientId === c.id ? "rgba(122,166,255,0.12)" : "transparent",
                  border: `1px solid ${selectedClientId === c.id ? "rgba(122,166,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                  color: selectedClientId === c.id ? "#7aa6ff" : "rgba(255,255,255,0.4)",
                  fontWeight: selectedClientId === c.id ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {c.name ?? new URL(c.url).hostname}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* MONTH STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 32 }}>
        {[
          { label: "Aktionen diesen Monat", value: totalMonth, color: "rgba(255,255,255,0.7)" },
          { label: "KI-Optimierungsvorschläge", value: aiCount,   color: "#7aa6ff",  icon: "🤖" },
          { label: "An Entwicklung delegiert",  value: jiraCount, color: "#8df3d3",  icon: "📋" },
          { label: "Kunden betreut",            value: new Set(monthEntries.filter(e => e.client_id).map(e => e.client_id)).size, color: "rgba(255,255,255,0.5)", icon: "🌐" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 18px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: 11, marginBottom: 6 }}>{"icon" in s ? s.icon : ""}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTER CONTEXT */}
      {selectedClient && (
        <div style={{
          padding: "12px 16px", borderRadius: 9, marginBottom: 20,
          background: "rgba(122,166,255,0.06)", border: "1px solid rgba(122,166,255,0.15)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 12, color: "#7aa6ff", fontWeight: 600 }}>
            Gefiltert: {selectedClient.name ?? selectedClient.url}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {entries.length} Einträge
          </span>
        </div>
      )}

      {/* LOG LIST */}
      {entries.length === 0 ? (
        <div style={{
          padding: "56px 24px", textAlign: "center",
          border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
        }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            {selectedClient
              ? `Noch keine Aktivitäten für ${selectedClient.name ?? selectedClient.url}.`
              : "Noch keine Aktivitäten — Slack-Buttons klicken um die erste Aktion zu loggen."}
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          {entries.map((entry, i) => {
            const meta    = EVENT_META[entry.event_type] ?? EVENT_META.alert_sent;
            const detail  = meta.detail(entry.metadata ?? {});
            const jiraUrl = entry.metadata?.jira_url as string | undefined;

            return (
              <div key={entry.id} style={{
                padding: "14px 20px",
                borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* Icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${meta.color}12`,
                  border: `1px solid ${meta.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                    {meta.label}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {(entry.client_name || entry.client_url) && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 5,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)",
                      }}>
                        {entry.client_name ?? entry.client_url}
                      </span>
                    )}
                    {detail && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{detail}</span>
                    )}
                    {jiraUrl && (
                      <a
                        href={jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#8df3d3", fontWeight: 600, textDecoration: "none" }}
                      >
                        {entry.metadata?.jira_key} ↗
                      </a>
                    )}
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 4,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.25)",
                    }}>
                      via {entry.platform}
                    </span>
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
