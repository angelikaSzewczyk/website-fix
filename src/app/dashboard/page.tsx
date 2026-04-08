import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import BillingPortalButton from "../components/billing-portal-button";
import WebsitesSection from "../components/websites-section";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

type Scan = {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
};

type CriticalSite = {
  id: string;
  url: string;
  name: string | null;
  last_check_status: string;
  last_check_at: string;
  ssl_days_left: number | null;
  security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

const PLAN_CONFIG = {
  free:    { label: "Free",    color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.1)" },
  pro:     { label: "Pro",     color: "#8df3d3", bg: "rgba(141,243,211,0.06)", border: "rgba(141,243,211,0.2)" },
  agentur: { label: "Agentur", color: "#7aa6ff", bg: "rgba(122,166,255,0.06)", border: "rgba(122,166,255,0.2)" },
} as const;

const TYPE_LABEL: Record<string, string> = {
  website: "Website-Check",
  wcag: "Barrierefreiheit",
  performance: "Performance",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const plan = ((session.user as { plan?: string }).plan ?? "free") as keyof typeof PLAN_CONFIG;
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  ` as Scan[];

  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";

  // Agentur-specific queries
  let criticalSites: CriticalSite[] = [];
  let marginLevers = { wcagScansMonth: 0, websitesMonitored: 0, alertsSent: 0, scansThisMonth: 0 };

  if (plan === "agentur") {
    criticalSites = await sql`
      SELECT
        sw.id::text,
        sw.url,
        sw.name,
        sw.last_check_status,
        sw.last_check_at,
        wc.ssl_days_left,
        wc.security_score,
        wc.alerts
      FROM saved_websites sw
      LEFT JOIN LATERAL (
        SELECT ssl_days_left, security_score, alerts
        FROM website_checks
        WHERE website_id = sw.id AND user_id = sw.user_id
        ORDER BY checked_at DESC
        LIMIT 1
      ) wc ON true
      WHERE sw.user_id = ${session.user.id}
        AND sw.last_check_status IN ('critical', 'warning', 'offline')
      ORDER BY
        CASE sw.last_check_status WHEN 'offline' THEN 0 WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        sw.last_check_at DESC NULLS LAST
      LIMIT 10
    ` as CriticalSite[];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [levers] = await sql`
      SELECT
        (SELECT COUNT(*) FROM saved_websites WHERE user_id = ${session.user.id}) AS websites_monitored,
        (SELECT COUNT(*) FROM scans WHERE user_id = ${session.user.id} AND created_at >= ${monthStart}) AS scans_this_month,
        (SELECT COUNT(*) FROM scans WHERE user_id = ${session.user.id} AND type = 'wcag' AND created_at >= ${monthStart}) AS wcag_scans_month
    ` as { websites_monitored: number; scans_this_month: number; wcag_scans_month: number }[];

    if (levers) {
      marginLevers = {
        wcagScansMonth: Number(levers.wcag_scans_month),
        websitesMonitored: Number(levers.websites_monitored),
        alertsSent: criticalSites.length,
        scansThisMonth: Number(levers.scans_this_month),
      };
    }
  }

  const scoreColor = (n: number | null) =>
    n === null ? "rgba(255,255,255,0.3)" : n === 0 ? "#8df3d3" : n <= 2 ? "#ffd93d" : "#ff6b6b";

  const statusColor = (s: string) =>
    s === "offline" ? "#ff6b6b" : s === "critical" ? "#ff6b6b" : s === "warning" ? "#ffd93d" : "#8df3d3";

  const statusLabel = (s: string) =>
    s === "offline" ? "Offline" : s === "critical" ? "Kritisch" : s === "warning" ? "Warnung" : "OK";

  return (
    <>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Willkommen zurück</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>{firstName}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 16,
                background: planCfg.bg, border: `1px solid ${planCfg.border}`,
                fontSize: 12, fontWeight: 600, color: planCfg.color,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: planCfg.color }} />
                {planCfg.label}
              </span>
              {plan === "free" && (
                <Link href="/fuer-agenturen" style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 16, textDecoration: "none",
                  border: "1px solid rgba(141,243,211,0.2)", color: "#8df3d3",
                }}>
                  Upgrade
                </Link>
              )}
              {plan !== "free" && <BillingPortalButton />}
            </div>
          </div>
        </div>

        {/* AGENTUR COMMAND CENTER */}
        {plan === "agentur" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 14, marginBottom: 40 }}>

            {/* CRITICAL EVENTS */}
            <div style={{
              border: criticalSites.length > 0 ? "1px solid rgba(255,107,107,0.2)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              background: criticalSites.length > 0 ? "rgba(255,107,107,0.03)" : "rgba(255,255,255,0.01)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {criticalSites.length > 0 && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff6b6b", boxShadow: "0 0 8px #ff6b6b80" }} />
                  )}
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Kritische Ereignisse</span>
                  {criticalSites.length > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                      background: "rgba(255,107,107,0.15)", color: "#ff6b6b",
                    }}>
                      {criticalSites.length}
                    </span>
                  )}
                </div>
                <Link href="/dashboard/clients" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
                  Alle →
                </Link>
              </div>

              {criticalSites.length === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(141,243,211,0.08)", border: "1px solid rgba(141,243,211,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 16 }}>✓</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#8df3d3", fontWeight: 600 }}>Alles OK</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Keine kritischen Ereignisse</p>
                </div>
              ) : (
                <div>
                  {criticalSites.map((site, i) => {
                    const sc = statusColor(site.last_check_status);
                    const alerts = site.alerts ?? [];
                    const topMessage = alerts[0]?.message ?? site.last_check_status;
                    return (
                      <Link key={site.id} href="/dashboard/clients" style={{ textDecoration: "none" }}>
                        <div style={{
                          padding: "12px 20px",
                          borderBottom: i < criticalSites.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc, flexShrink: 0, boxShadow: `0 0 5px ${sc}60` }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: 13, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {site.name ?? site.url}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {topMessage}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                            color: sc, border: `1px solid ${sc}30`, background: `${sc}0d`, flexShrink: 0,
                          }}>
                            {statusLabel(site.last_check_status)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MARGIN LEVERS */}
            <div style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              background: "rgba(255,255,255,0.01)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Marge-Hebel</span>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Aktivitäten diesen Monat</p>
              </div>

              <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {
                    value: marginLevers.scansThisMonth,
                    label: "Scans diesen Monat",
                    color: "#7aa6ff",
                    hint: marginLevers.scansThisMonth >= 10 ? "Gutes Volumen" : "Mehr scannen = mehr Wert",
                  },
                  {
                    value: marginLevers.wcagScansMonth,
                    label: "WCAG-Audits",
                    color: "#8df3d3",
                    hint: marginLevers.wcagScansMonth > 0 ? "BFSG-ready" : "Pflicht ab 2025",
                  },
                  {
                    value: marginLevers.websitesMonitored,
                    label: "Websites überwacht",
                    color: "#ffd93d",
                    hint: marginLevers.websitesMonitored > 0 ? "24/7 aktiv" : "Website hinzufügen",
                  },
                  {
                    value: marginLevers.alertsSent,
                    label: "Offene Warnungen",
                    color: marginLevers.alertsSent > 0 ? "#ff6b6b" : "#8df3d3",
                    hint: marginLevers.alertsSent === 0 ? "Kein Handlungsbedarf" : "Aufmerksamkeit nötig",
                  },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: "14px 16px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: item.color, letterSpacing: "-0.02em" }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{item.hint}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600, color: "#7aa6ff", textDecoration: "none",
                }}>
                  Neuen Scan starten →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ONBOARDING */}
        {scans.length === 0 && (
          <div style={{
            border: "1px solid rgba(141,243,211,0.15)",
            borderRadius: 12, padding: "32px",
            marginBottom: 40,
            background: "rgba(141,243,211,0.03)",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8df3d3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Erster Schritt</p>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>Starte deinen ersten Scan</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              URL eingeben — KI analysiert SEO, Barrierefreiheit und Performance in unter 60 Sekunden.
            </p>
            <Link href="/dashboard/scan" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 9, textDecoration: "none",
              background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
            }}>
              Ersten Scan starten
            </Link>
          </div>
        )}

        {/* WEBSITES (Pro/Agentur) */}
        {plan !== "free" && <WebsitesSection />}

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Neuer Scan</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { href: "/dashboard/scan", label: "Website-Check", desc: "SEO, Technik, Erreichbarkeit", color: "#7aa6ff" },
              { href: "/dashboard/scan?tab=wcag", label: "Barrierefreiheit", desc: "WCAG 2.1 AA · BFSG-relevant", color: "#8df3d3" },
              { href: "/dashboard/scan?tab=performance", label: "Performance", desc: "Core Web Vitals, PageSpeed", color: "#ffd93d" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "20px 22px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, marginBottom: 14 }} />
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                  <div style={{ fontSize: 13, color: item.color, marginTop: 12, fontWeight: 500 }}>Scan starten →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SCAN HISTORY */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Letzte Scans
            </p>
            {scans.length > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{scans.length} gespeichert</span>
            )}
          </div>

          {scans.length === 0 ? (
            <div style={{
              padding: "40px 20px", textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 12,
            }}>
              <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                Noch keine Scans.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              {scans.map((scan, i) => (
                <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "14px 20px",
                    borderBottom: i < scans.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    display: "flex", alignItems: "center", gap: 16,
                    background: "rgba(255,255,255,0.01)",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: scoreColor(scan.issue_count), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {scan.url}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {TYPE_LABEL[scan.type] ?? scan.type} · {new Date(scan.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {scan.issue_count !== null && (
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: scoreColor(scan.issue_count),
                        }}>
                          {scan.issue_count === 0 ? "Keine Fehler" : `${scan.issue_count} Probleme`}
                        </span>
                      )}
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.15)" }}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
