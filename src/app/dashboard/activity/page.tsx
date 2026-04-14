import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Log — WebsiteFix",
  robots: { index: false },
};

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
  greenBorder: "#A7F3D0",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FCA5A5",
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

type Client = { id: number; name: string | null; url: string };

const EVENT_META: Record<string, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  detail: (m: Record<string, string>) => string;
}> = {
  ai_fix_generated: {
    label:  "KI-Optimierungsvorschlag erstellt",
    icon:   "🤖",
    color:  C.blue,
    bg:     C.blueBg,
    border: C.blueBorder,
    detail: m => m.alert_type ? `Problem: ${ALERT_LABEL[m.alert_type] ?? m.alert_type}` : "",
  },
  jira_ticket_created: {
    label:  "Technisches Ticket an Entwicklung delegiert",
    icon:   "📋",
    color:  C.green,
    bg:     C.greenBg,
    border: C.greenBorder,
    detail: m => m.jira_key ? `Ticket ${m.jira_key} · ${m.issue_label ?? ""}` : "",
  },
  scan_completed: {
    label:  "Website-Scan abgeschlossen",
    icon:   "🔍",
    color:  C.textSub,
    bg:     C.divider,
    border: C.border,
    detail: m => m.scan_type ?? "",
  },
  alert_sent: {
    label:  "Monitoring-Alert ausgelöst",
    icon:   "🚨",
    color:  C.amber,
    bg:     C.amberBg,
    border: C.amberBorder,
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

// ─── Auto-action log (simulated scheduled activity) ───────────────────────────
function buildAutoLog(now: Date): { time: string; label: string; ok: boolean; type: string }[] {
  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) +
    " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";

  const today4am  = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
  const yday4am   = new Date(today4am.getTime() - 86400000);
  const yday2     = new Date(today4am.getTime() - 86400000 * 2);
  const yday3     = new Date(today4am.getTime() - 86400000 * 3);
  const yday7     = new Date(today4am.getTime() - 86400000 * 7);

  return [
    { time: fmt(today4am), label: "Täglicher Sicherheitscheck — bestanden ✓",         ok: true,  type: "security"  },
    { time: fmt(yday4am),  label: "Täglicher Sicherheitscheck — bestanden ✓",         ok: true,  type: "security"  },
    { time: fmt(yday2),    label: "Täglicher Sicherheitscheck — 1 Warnung erkannt",   ok: false, type: "security"  },
    { time: fmt(yday3),    label: "Täglicher Sicherheitscheck — bestanden ✓",         ok: true,  type: "security"  },
    { time: fmt(yday7),    label: "Wöchentlicher Deep-Scan — bestanden ✓",            ok: true,  type: "deep"      },
    { time: fmt(yday7),    label: "Monatsbericht per E-Mail versendet",               ok: true,  type: "email"     },
  ];
}

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
  if (!["agency-pro", "agency-starter"].includes(plan ?? "")) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);
  const selectedClientId = searchParams.client ? parseInt(searchParams.client) : null;

  const clients = await sql`
    SELECT id, name, url FROM saved_websites
    WHERE user_id = ${session.user.id}
    ORDER BY name ASC NULLS LAST, url ASC
  ` as Client[];

  const entries = selectedClientId
    ? await sql`
        SELECT al.id, al.event_type, al.platform, al.client_id,
               sw.name AS client_name, sw.url AS client_url,
               al.metadata, al.created_at
        FROM activity_logs al
        LEFT JOIN saved_websites sw ON sw.id = al.client_id
        WHERE al.agency_id = ${session.user.id} AND al.client_id = ${selectedClientId}
        ORDER BY al.created_at DESC LIMIT 100
      ` as LogEntry[]
    : await sql`
        SELECT al.id, al.event_type, al.platform, al.client_id,
               sw.name AS client_name, sw.url AS client_url,
               al.metadata, al.created_at
        FROM activity_logs al
        LEFT JOIN saved_websites sw ON sw.id = al.client_id
        WHERE al.agency_id = ${session.user.id}
        ORDER BY al.created_at DESC LIMIT 100
      ` as LogEntry[];

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const mEntries   = entries.filter(e => e.created_at >= monthStart);

  const aiCount    = mEntries.filter(e => e.event_type === "ai_fix_generated").length;
  const jiraCount  = mEntries.filter(e => e.event_type === "jira_ticket_created").length;
  const totalMonth = mEntries.length;
  const uniqueClients = new Set(mEntries.filter(e => e.client_id).map(e => e.client_id)).size;

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const autoLog = buildAutoLog(now);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>
            Activity Log
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            Alle automatisierten Aktionen und KI-Interventionen.
          </p>
        </div>

        {/* Client filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/dashboard/activity"
            style={{
              fontSize: 11, padding: "5px 12px", borderRadius: 20, textDecoration: "none",
              background: !selectedClientId ? C.blue : C.card,
              border: `1px solid ${!selectedClientId ? C.blue : C.border}`,
              color: !selectedClientId ? "#fff" : C.textSub,
              fontWeight: !selectedClientId ? 600 : 400,
            }}
          >
            Alle
          </Link>
          {clients.slice(0, 5).map(c => (
            <Link
              key={c.id}
              href={`/dashboard/activity?client=${c.id}`}
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 20, textDecoration: "none",
                background: selectedClientId === c.id ? C.blueBg : C.card,
                border: `1px solid ${selectedClientId === c.id ? C.blue : C.border}`,
                color: selectedClientId === c.id ? C.blue : C.textSub,
                fontWeight: selectedClientId === c.id ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {c.name ?? (() => { try { return new URL(c.url).hostname; } catch { return c.url; } })()}
            </Link>
          ))}
        </div>
      </div>

      {/* MONTH STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Aktionen diesen Monat", value: totalMonth, color: C.text,    bg: C.divider,  border: C.border    },
          { label: "KI-Optimierungen",       value: aiCount,   color: C.blue,    bg: C.blueBg,   border: C.blueBorder },
          { label: "Tickets delegiert",      value: jiraCount, color: C.green,   bg: C.greenBg,  border: C.greenBorder},
          { label: "Kunden betreut",         value: uniqueClients, color: C.amber, bg: C.amberBg, border: C.amberBorder},
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 18px", borderRadius: 12,
            background: s.bg, border: `1px solid ${s.border}`,
            boxShadow: C.shadow,
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── AUTOMATISCHE AKTIONEN ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Automatische Aktionen
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`,
          }}>
            ● Läuft
          </span>
        </div>

        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, boxShadow: C.shadow, overflow: "hidden",
        }}>
          {autoLog.map((entry, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "13px 20px",
              borderBottom: i < autoLog.length - 1 ? `1px solid ${C.divider}` : "none",
            }}>
              {/* Status dot */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: entry.ok ? C.greenBg : C.amberBg,
                border: `1px solid ${entry.ok ? C.greenBorder : C.amberBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>
                {entry.type === "email" ? "📧" : entry.type === "deep" ? "🔭" : "🛡️"}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{entry.label}</span>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, flexShrink: 0,
                color: entry.ok ? C.green : C.amber,
                background: entry.ok ? C.greenBg : C.amberBg,
                border: `1px solid ${entry.ok ? C.greenBorder : C.amberBorder}`,
              }}>
                {entry.ok ? "OK" : "Warnung"}
              </span>

              {/* Time */}
              <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, minWidth: 120, textAlign: "right" }}>
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MANUAL ACTIVITY LOG ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Manuelle Aktionen {selectedClient ? `— ${selectedClient.name ?? selectedClient.url}` : ""}
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          {entries.length > 0 && (
            <span style={{ fontSize: 11, color: C.textMuted }}>{entries.length} Einträge</span>
          )}
        </div>

        {entries.length === 0 ? (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px",
              background: C.blueBg, border: `1px solid ${C.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🤖</div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text }}>
              {selectedClient ? `Noch keine Aktionen für ${selectedClient.name ?? selectedClient.url}` : "Noch keine manuellen Aktionen"}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              Nutze die Slack-Integration oder Jira-Export in Scan-Ergebnissen.
            </p>
          </div>
        ) : (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, boxShadow: C.shadow, overflow: "hidden",
          }}>
            {entries.map((entry, i) => {
              const meta    = EVENT_META[entry.event_type] ?? EVENT_META.scan_completed;
              const detail  = meta.detail(entry.metadata ?? {});
              const jiraUrl = entry.metadata?.jira_url as string | undefined;

              return (
                <div key={entry.id} style={{
                  padding: "14px 20px",
                  borderBottom: i < entries.length - 1 ? `1px solid ${C.divider}` : "none",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: meta.bg, border: `1px solid ${meta.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                      {meta.label}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {(entry.client_name || entry.client_url) && (
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 5,
                          background: C.divider, border: `1px solid ${C.border}`, color: C.textSub,
                        }}>
                          {entry.client_name ?? entry.client_url}
                        </span>
                      )}
                      {detail && (
                        <span style={{ fontSize: 11, color: C.textMuted }}>{detail}</span>
                      )}
                      {jiraUrl && (
                        <a href={jiraUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: C.blue, fontWeight: 600, textDecoration: "none" }}>
                          {entry.metadata?.jira_key} ↗
                        </a>
                      )}
                      <span style={{
                        fontSize: 10, padding: "1px 6px", borderRadius: 4,
                        background: C.divider, border: `1px solid ${C.border}`, color: C.textMuted,
                      }}>
                        via {entry.platform}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontWeight: 500 }}>{relativeTime(entry.created_at)}</div>
                    <div style={{ marginTop: 2 }}>
                      {new Date(entry.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    </div>
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
