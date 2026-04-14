import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kunden-Websites — WebsiteFix",
  robots: { index: false },
};

type Website = {
  id: string;
  url: string;
  name: string | null;
  // Monitoring (website_checks)
  last_check_at: string | null;
  last_check_status: string | null;
  ssl_days_left: number | null;
  security_score: number | null;
  platform: string | null;
  response_time_ms: number | null;
  // Scans
  last_issue_count: number | null;
  last_scan_at: string | null;
  last_scan_type: string | null;
  scan_count: number;
};

const statusColor = (s: string | null) =>
  s === "ok" ? "#8df3d3" : s === "warning" ? "#ffd93d" : s === "critical" ? "#ff6b6b" : "rgba(255,255,255,0.25)";

const statusLabel = (s: string | null) =>
  s === "ok" ? "OK" : s === "warning" ? "Warnung" : s === "critical" ? "Kritisch" : "—";

const sslColor = (d: number | null) =>
  d === null ? "rgba(255,255,255,0.3)" : d <= 7 ? "#ff6b6b" : d <= 30 ? "#ffd93d" : "#8df3d3";

const scoreColor = (n: number | null) =>
  n === null ? "rgba(255,255,255,0.3)" : n >= 80 ? "#8df3d3" : n >= 50 ? "#ffd93d" : "#ff6b6b";

const SCAN_TYPE_LABEL: Record<string, string> = {
  website: "Website-Check",
  wcag: "WCAG",
  performance: "Performance",
};

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (!["agency-pro", "agency-starter"].includes(plan ?? "")) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const websites = (await sql`
    SELECT
      sw.id::text,
      sw.url,
      sw.name,
      sw.last_check_at,
      sw.last_check_status,
      wc.ssl_days_left,
      wc.security_score,
      wc.platform,
      wc.response_time_ms,
      s_latest.issue_count   AS last_issue_count,
      s_latest.created_at    AS last_scan_at,
      s_latest.type          AS last_scan_type,
      (SELECT COUNT(*)::int FROM scans WHERE url = sw.url AND user_id = sw.user_id) AS scan_count
    FROM saved_websites sw
    LEFT JOIN LATERAL (
      SELECT ssl_days_left, security_score, platform, response_time_ms
      FROM website_checks
      WHERE website_id = sw.id AND user_id = sw.user_id
      ORDER BY checked_at DESC
      LIMIT 1
    ) wc ON true
    LEFT JOIN LATERAL (
      SELECT issue_count, created_at, type
      FROM scans
      WHERE url = sw.url AND user_id = sw.user_id
      ORDER BY created_at DESC
      LIMIT 1
    ) s_latest ON true
    WHERE sw.user_id = ${session.user.id}
    ORDER BY GREATEST(sw.last_check_at, s_latest.created_at) DESC NULLS LAST
  `) as Website[];

  const total = websites.length;
  const monitored = websites.filter(w => w.last_check_at !== null);
  const ok = monitored.filter(w => w.last_check_status === "ok").length;
  const issues = monitored.filter(w => w.last_check_status === "warning" || w.last_check_status === "critical").length;
  const unmonitored = websites.filter(w => w.last_check_at === null).length;

  return (
    <>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Kunden-Websites</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Monitoring-Status und Scan-Ergebnisse aller gespeicherten Websites.
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
          {[
            { label: "Websites gesamt", value: total, color: "rgba(255,255,255,0.7)" },
            { label: "Status OK", value: ok, color: "#8df3d3" },
            { label: "Mit Problemen", value: issues, color: "#ff6b6b" },
            { label: "Nicht überwacht", value: unmonitored, color: "rgba(255,255,255,0.3)" },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "16px 18px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* LIST */}
        {websites.length === 0 ? (
          <div style={{
            padding: "56px 24px", textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
          }}>
            <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
              Noch keine Kunden-Websites gespeichert.
            </p>
            <Link href="/dashboard" style={{
              padding: "10px 22px", borderRadius: 9, textDecoration: "none",
              background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
            }}>
              Zum Dashboard
            </Link>
          </div>
        ) : (
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, overflow: "hidden",
          }}>
            {websites.map((site, i) => {
              const dot = statusColor(site.last_check_status);
              return (
                <div key={site.id} style={{
                  padding: "18px 20px",
                  borderBottom: i < websites.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>

                  {/* Status dot + name/url */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 200px", minWidth: 0 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: dot, flexShrink: 0,
                      boxShadow: site.last_check_status ? `0 0 6px ${dot}80` : "none",
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {site.name ?? site.url}
                      </div>
                      {site.name && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {site.url}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monitoring pills */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>

                    {/* Check status */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                      color: dot, border: `1px solid ${dot}30`, background: `${dot}0d`,
                    }}>
                      {statusLabel(site.last_check_status)}
                    </span>

                    {/* Platform */}
                    {site.platform && (
                      <span style={{
                        fontSize: 11, padding: "3px 9px", borderRadius: 6,
                        color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        {site.platform}
                      </span>
                    )}

                    {/* SSL */}
                    {site.ssl_days_left !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                        color: sslColor(site.ssl_days_left),
                        border: `1px solid ${sslColor(site.ssl_days_left)}30`,
                      }}>
                        SSL {site.ssl_days_left}d
                      </span>
                    )}

                    {/* Security score */}
                    {site.security_score !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                        color: scoreColor(site.security_score),
                        border: `1px solid ${scoreColor(site.security_score)}30`,
                      }}>
                        Sicherheit {site.security_score}/100
                      </span>
                    )}

                    {/* Response time */}
                    {site.response_time_ms !== null && (
                      <span style={{
                        fontSize: 11, padding: "3px 9px", borderRadius: 6,
                        color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)",
                      }}>
                        {site.response_time_ms}ms
                      </span>
                    )}
                  </div>

                  {/* Scan info */}
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0, textAlign: "right" }}>
                    {site.last_scan_at ? (
                      <>
                        <div>{SCAN_TYPE_LABEL[site.last_scan_type ?? ""] ?? site.last_scan_type} · {new Date(site.last_scan_at).toLocaleDateString("de-DE")}</div>
                        {site.last_issue_count !== null && (
                          <div style={{ color: site.last_issue_count === 0 ? "#8df3d3" : "#ffd93d", marginTop: 2 }}>
                            {site.last_issue_count === 0 ? "Keine Probleme" : `${site.last_issue_count} Probleme`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div>Noch nicht gescannt</div>
                    )}
                    <div style={{ marginTop: 2 }}>{site.scan_count} Scan{site.scan_count !== 1 ? "s" : ""}</div>
                  </div>

                  {/* CTA */}
                  <Link href={`/dashboard/scan?url=${encodeURIComponent(site.url)}`} style={{
                    padding: "7px 14px", borderRadius: 8, textDecoration: "none",
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                  }}>
                    Scannen
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
