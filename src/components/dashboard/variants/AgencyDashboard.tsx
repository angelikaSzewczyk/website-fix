/**
 * AgencyDashboard 2.0 — Phase 3 Sprint 11 ARCHITECTURAL REBUILD.
 *
 * Single Source of Truth für die Kunden-Matrix: dieselbe LATERAL-JOIN-SQL,
 * die /dashboard/clients verwendet. Vorher liefen Kommandozentrale und
 * Kundenliste auf zwei separaten Queries — Folge: gleiche User-DB,
 * unterschiedliche Zahlen. Mit dieser Komponente ist die Kunden-Matrix
 * exakt das Spiegelbild von /dashboard/clients (selbe Reihenfolge,
 * selbe Werte, selber Score).
 *
 * Was hier strikt durchgesetzt ist:
 *   1. EINE SQL — wf-agency-grid + clients/page beide via getAgencyClientMatrix.
 *   2. Score-Trend: aus dem letzten + vorletzten Scan derselben URL via
 *      LAG window function. Δ wird in der Matrix als ↑/↓ angezeigt.
 *   3. "Eingeschränkter Scan"-Badge: wenn last_scan.total_pages
 *      < getMaxSubpages(plan), markiert die Zeile den Scan als limited
 *      und blendet einen Re-Scan-CTA ein. So kann ein flacher Scan die
 *      UI nicht mehr "verfälschen".
 *   4. Activity-Feed: echte scans + scan_log-Daten, joined über
 *      saved_websites für den Anzeigenamen. Keine Mock-Items mehr.
 *   5. White-Label-Preview: Logo + Brand-Color exakt aus agency_settings,
 *      via CSS-Var --agency-accent (Cascade aus dashboard/layout.tsx).
 */

import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import TeamWidget from "@/app/dashboard/components/team-widget";
import type { ClassifiableWpIssue } from "@/lib/wp-health";

// ─── Theme tokens — Dark-Mode (Phase 3 Sprint 6) ─────────────────────────────
const C = {
  bg:          "#0b0c10",
  card:        "rgba(255,255,255,0.025)",
  border:      "rgba(255,255,255,0.08)",
  divider:     "rgba(255,255,255,0.06)",
  shadow:      "none",
  shadowMd:    "0 4px 18px rgba(0,0,0,0.5)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.4)",
  blue:        "#7aa6ff",
  blueBg:      "rgba(0,123,255,0.08)",
  blueBorder:  "rgba(0,123,255,0.22)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.10)",
  greenDot:    "#22C55E",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberDot:    "#F59E0B",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.10)",
  redDot:      "#EF4444",
  yellow:      "#fbbf24",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type ScanBrief = { id: string; url: string; type: string; created_at: string; issue_count: number | null };

/**
 * Matrix-Row — vereinheitlichtes Schema für /dashboard und /dashboard/clients.
 * Eine Zeile = eine saved_websites-Zeile + ihr letzter Scan + Trend.
 *
 * Sprint 12: + cms_context (für Fix-Guide-Hint) + wp_layer_score-Felder
 * (aus issues_json on-the-fly berechnet).
 */
type MatrixRow = {
  id: string;
  url: string;
  name: string | null;
  client_label: string | null;
  client_logo_url: string | null;
  is_customer_project: boolean;

  last_check_at: string | null;
  last_check_status: string | null;
  ssl_days_left: number | null;
  security_score: number | null;
  platform: string | null;
  response_time_ms: number | null;
  cms_context: string | null;

  last_scan_id: string | null;
  last_scan_at: string | null;
  last_issue_count: number | null;
  last_total_pages: number | null;
  last_speed_score: number | null;
  /** issues_json des letzten Scans — Eingabe für computeWpHealthScore. */
  last_issues_json: ClassifiableWpIssue[] | null;

  prev_issue_count: number | null;
  prev_speed_score: number | null;

  scan_count: number;
};

type AlertRow = {
  id: number;
  website_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string | null;
  created_at: string;
  site_name: string | null;
  site_url: string | null;
};

type Props = {
  firstName: string;
  plan: string;
  badge: { label: string; color: string; bg: string; border: string };
  userId: string;
  agencyName: string | null;
  agencyLogoUrl: string | null;
  /** Bisherige Scans des Users (Stat-Strip + Detail-Link). */
  scans: ScanBrief[];
  /** Belegte Slots — wird aus dem Page-Wrapper für die Stat-Pill übergeben. */
  usedSlots: number;
};

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ values, color, width = 60, height = 18 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────
export default async function AgencyDashboard({
  firstName, plan, badge, userId, agencyName, agencyLogoUrl, scans, usedSlots,
}: Props) {
  const sql = neon(process.env.DATABASE_URL!);

  // ─── KANONISCHE SQL — gleicher LATERAL-JOIN-Pfad wie clients/page.tsx ────
  // Erweiterung gegenüber clients/page.tsx: zusätzlich der vorletzte Scan
  // (prev_*) für Score-Trend-Δ. Window-Function (LAG) wäre eleganter, aber
  // die LATERAL OFFSET 1 LIMIT 1 ist gegen den scans_user_id_idx bereits
  // performant und ändert die Top-Level-Row nicht.
  let matrixRows: MatrixRow[] = [];
  try {
    matrixRows = await sql`
      SELECT
        sw.id::text,
        sw.url,
        sw.name,
        sw.client_label,
        sw.client_logo_url,
        sw.is_customer_project,
        sw.last_check_at::text,
        sw.last_check_status,
        wc.ssl_days_left,
        wc.security_score,
        wc.platform,
        wc.response_time_ms,
        wc.cms_context,
        s_latest.id::text     AS last_scan_id,
        s_latest.created_at::text AS last_scan_at,
        s_latest.issue_count  AS last_issue_count,
        s_latest.total_pages  AS last_total_pages,
        s_latest.speed_score  AS last_speed_score,
        s_latest.issues_json  AS last_issues_json,
        s_prev.issue_count    AS prev_issue_count,
        s_prev.speed_score    AS prev_speed_score,
        (SELECT COUNT(*)::int FROM scans
          WHERE url = sw.url AND user_id = sw.user_id AND is_superseded = FALSE
        ) AS scan_count
      FROM saved_websites sw
      LEFT JOIN LATERAL (
        SELECT ssl_days_left, security_score, platform, response_time_ms, cms_context
        FROM website_checks
        WHERE website_id = sw.id AND user_id = sw.user_id
        ORDER BY checked_at DESC
        LIMIT 1
      ) wc ON true
      LEFT JOIN LATERAL (
        SELECT id, issue_count, total_pages, speed_score, created_at, issues_json
        FROM scans
        WHERE url = sw.url AND user_id = sw.user_id AND is_superseded = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      ) s_latest ON true
      LEFT JOIN LATERAL (
        SELECT issue_count, speed_score
        FROM scans
        WHERE url = sw.url AND user_id = sw.user_id AND is_superseded = FALSE
        ORDER BY created_at DESC
        OFFSET 1 LIMIT 1
      ) s_prev ON true
      WHERE sw.user_id = ${userId}
      ORDER BY GREATEST(sw.last_check_at, s_latest.created_at) DESC NULLS LAST
    ` as MatrixRow[];
  } catch (err) {
    console.error("[AgencyDashboard] matrix query failed:", err);
  }

  // ─── Lead-Ticker: letzte 3 widget_leads (Mission Control Highlight) ─────
  type LeadRow = { id: string; visitor_email: string | null; scanned_url: string; score: number | null; status: string | null; created_at: string };
  let recentLeads: LeadRow[] = [];
  try {
    recentLeads = await sql`
      SELECT id::text, visitor_email, scanned_url, score, status, created_at::text
      FROM widget_leads
      WHERE agency_user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 3
    ` as LeadRow[];
  } catch (err) {
    console.error("[AgencyDashboard] leads query failed:", err);
  }

  // ─── Live-Monitor: offene Alarme (acknowledged_at IS NULL) ──────────────
  // Sprint 12: Plugin-Diff-Cron schreibt in website_alerts. Hier rendern
  // wir die letzten 8 ungelesenen — der Agency-Owner sieht sofort, was
  // sich seit dem letzten Login verändert hat.
  let liveAlerts: AlertRow[] = [];
  try {
    liveAlerts = await sql`
      SELECT a.id, a.website_id::text, a.alert_type, a.severity, a.title, a.message,
             a.created_at::text,
             sw.name AS site_name, sw.url AS site_url
      FROM website_alerts a
      LEFT JOIN saved_websites sw ON sw.id = a.website_id
      WHERE a.user_id = ${userId} AND a.acknowledged_at IS NULL
      ORDER BY a.created_at DESC
      LIMIT 8
    ` as AlertRow[];
  } catch (err) {
    console.error("[AgencyDashboard] alerts query failed:", err);
  }

  // ─── Activity-Feed + Trend-Sparkline + Scan-Health (parallel) ────────────
  type DayRow      = { day: string; cnt: number };
  type RecentRow   = { id: string; url: string; created_at: string; issue_count: number | null; name: string | null };
  type HealthRow   = { ok: number; total: number };
  let scanTrend: DayRow[]      = [];
  let recentScans: RecentRow[] = [];
  let scanHealth: HealthRow    = { ok: 0, total: 0 };
  try {
    const [trendRows, recentRows, healthRows] = await Promise.all([
      sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS cnt
        FROM scans
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
      `,
      sql`
        SELECT s.id::text, s.url, s.created_at::text, s.issue_count,
               sw.name
        FROM scans s
        LEFT JOIN saved_websites sw ON sw.url = s.url AND sw.user_id = s.user_id
        WHERE s.user_id = ${userId} AND s.is_superseded = FALSE
        ORDER BY s.created_at DESC LIMIT 5
      `,
      sql`
        SELECT COUNT(*) FILTER (WHERE status = 'success')::int AS ok,
               COUNT(*)::int                                    AS total
        FROM scan_log
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '24 hours'
      `,
    ]);
    scanTrend   = trendRows   as DayRow[];
    recentScans = recentRows  as RecentRow[];
    scanHealth  = (healthRows[0] as HealthRow | undefined) ?? { ok: 0, total: 0 };
  } catch {
    /* graceful — leere Widgets bei fehlenden Tabellen */
  }

  const trendValues: number[] = (() => {
    const map = new Map(scanTrend.map(r => [r.day, r.cnt]));
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push(map.get(key) ?? 0);
    }
    return out;
  })();
  const scansThisWeek = trendValues.reduce((s, v) => s + v, 0);
  const healthPct = scanHealth.total > 0 ? Math.round((scanHealth.ok / scanHealth.total) * 100) : null;

  // CSS-Variablen kommen aus dashboard/layout.tsx (Brand-Cascade).
  const accent       = "var(--agency-accent)";
  const accentBg     = "var(--agency-accent-bg)";
  const accentBorder = "var(--agency-accent-border)";
  const accentGlowS  = "var(--agency-accent-glow-soft)";

  void firstName; void agencyLogoUrl; void badge; void plan; void usedSlots;

  return (
    <main style={{ padding: "28px 32px 80px" }}>

      {/* ── Sticky Action-Bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 25,
        marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32,
        marginTop: -32, paddingTop: 24,
        background: "rgba(11,12,16,0.78)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, gap: 14, flexWrap: "wrap",
        paddingBottom: 18, borderBottom: `1px solid ${C.divider}`,
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Kommandozentrale
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
            {agencyName ?? "Kunden-Übersicht"}
          </h1>
        </div>
        <a href="#modal-new-client" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 10,
          background: "rgba(124,58,237,0.85)",
          border: "1px solid rgba(167,139,250,0.55)",
          color: "#fff",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
          transition: "transform 0.12s ease, box-shadow 0.12s ease",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Neuen Kunden anlegen
        </a>
      </div>

      {/* ── Stat Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        {([
          { value: matrixRows.length,                                              label: "Aktive Kunden",    color: C.blue,
            iconPath: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
          { value: matrixRows.filter(r => r.is_customer_project).length,           label: "Kundenprojekte",   color: C.green,
            iconPath: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
          { value: matrixRows.filter(r => (r.last_issue_count ?? 0) > 5 || r.last_check_status === "critical").length, label: "Handlungsbedarf",  color: C.red,
            iconPath: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
          { value: scansThisWeek,                                                  label: "Scans · 7 Tage",   color: C.blue,
            iconPath: <><path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="8"/></>,
            sparkline: trendValues },
        ]).map(s => (
          <div key={s.label} style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "16px 18px",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${s.color}1a`, border: `1px solid ${s.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {s.iconPath}
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4, letterSpacing: "0.02em" }}>{s.label}</div>
            </div>
            {"sparkline" in s && s.sparkline && (
              <Sparkline values={s.sparkline} color={s.color} width={56} height={20} />
            )}
          </div>
        ))}
      </div>

      {/* ── Mission-Control-Stack ──
          Vertikales Layout: Live-Monitor (Hero, full-width) → Lead-Ticker
          (Highlight) → 2-Spalten Activity+Team → 2-Spalten System+Anstehende.
          Vorher 2-fr/1-fr-Bento mit Kunden-Matrix links — die Tabelle ist nach
          /dashboard/clients (Kunden-Portfolio) gewandert; Mission-Control
          fokussiert ausschließlich auf "Was passiert jetzt gerade?". */}
      <div className="wf-agency-grid" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Empty-State (keine Kunden noch) — Quick-Start mit 3 Schritten ── */}
        {matrixRows.length === 0 && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "24px 22px", boxShadow: C.shadowMd,
          }}>
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Quick-Start
              </p>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                Dein Agentur-Setup in 3 Schritten
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { n: "1", title: "Domain hinzufügen",        desc: "Lege deinen ersten Kunden mit Website-URL und Namen an.",         cta: "Kunden anlegen",  href: "#modal-new-client" },
                { n: "2", title: "White-Label einrichten",    desc: "Lade dein Agentur-Logo hoch und setze die Brand-Farbe.",         cta: "Branding öffnen", href: "/dashboard/settings#branding" },
                { n: "3", title: "Ersten Bericht versenden",  desc: "Aktiviere den automatischen Monats-Report im Berichts-Archiv.",  cta: "Berichte öffnen", href: "/dashboard/reports" },
              ].map(step => (
                <div key={step.n} style={{
                  padding: "16px 18px", borderRadius: 11,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  display: "flex", flexDirection: "column", gap: 9,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.40)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "#a78bfa", lineHeight: 1,
                    }}>{step.n}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>{step.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: C.textSub, lineHeight: 1.55, flex: 1 }}>{step.desc}</p>
                  <Link href={step.href} style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 6,
                    background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.32)",
                    color: "#a78bfa", fontSize: 11, fontWeight: 700, textDecoration: "none",
                  }}>{step.cta} →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stack-Inhalte folgen unten — Live-Monitor (Hero), Lead-Ticker,
            Activity+Team (2-Spalten), System-Status+Anstehende-Berichte. */}

          {/* ── Live-Monitor (Sprint 12) ──────────────────────────────────
              website_alerts mit acknowledged_at IS NULL. Wenn nichts da ist,
              rendern wir einen kompakten "Alles ruhig"-State mit Pulse-Dot,
              damit das Widget nie leer wirkt. */}
          <div style={{
            background: liveAlerts.length > 0 ? "rgba(248,113,113,0.06)" : C.card,
            border: `1px solid ${liveAlerts.length > 0 ? "rgba(248,113,113,0.22)" : C.border}`,
            borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)",
          }}>
            <div style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${liveAlerts.length > 0 ? "rgba(248,113,113,0.18)" : C.divider}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: liveAlerts.length > 0 ? C.red : C.green,
                  boxShadow: `0 0 8px ${liveAlerts.length > 0 ? C.red : C.green}80`,
                }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                  Live-Monitor
                </span>
              </div>
              {liveAlerts.length > 0 ? (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  padding: "2px 8px", borderRadius: 12,
                  background: "rgba(248,113,113,0.16)",
                  border: "1px solid rgba(248,113,113,0.35)",
                  color: C.red, letterSpacing: "0.06em",
                }}>
                  {liveAlerts.length} OFFEN
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: "0.06em" }}>
                  ALLES OK
                </span>
              )}
            </div>

            {liveAlerts.length === 0 ? (
              <div style={{ padding: "20px 18px 22px", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                Keine offenen Alarme.<br/>
                <span style={{ color: C.textSub }}>
                  Der Cron prüft täglich Plugin-Diff, SSL, Uptime und meldet Veränderungen automatisch hier.
                </span>
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {liveAlerts.map((alert, i) => {
                  const isCritical = alert.severity === "critical";
                  const isInfo     = alert.severity === "info";
                  const dotColor   = isCritical ? C.red : isInfo ? C.blue : C.amber;
                  const ts = new Date(alert.created_at);
                  const ago = (() => {
                    const diff = Date.now() - ts.getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1)   return "gerade eben";
                    if (mins < 60)  return `vor ${mins} min`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24)   return `vor ${hrs} h`;
                    return ts.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                  })();
                  // Plugin-Diff-Alerts haben besonderen Mehrwert: wir zeigen
                  // den Site-Namen prominent, damit klar ist, WO der Diff
                  // aufgetreten ist.
                  const siteLabel = alert.site_name ?? (() => {
                    if (!alert.site_url) return "Unbekannte Site";
                    try { return new URL(alert.site_url).hostname.replace(/^www\./, ""); }
                    catch { return alert.site_url; }
                  })();
                  // Type-Icon-Mapping
                  const typeBadge = (() => {
                    switch (alert.alert_type) {
                      case "plugin_added":   return "Plugin neu";
                      case "plugin_removed": return "Plugin weg";
                      case "auto_heal":      return "Auto-Heal";
                      case "speed_drop":     return "Speed";
                      case "wp_outdated":    return "WP veraltet";
                      case "ssl_expiring":   return "SSL";
                      case "site_offline":   return "Offline";
                      default:               return alert.alert_type;
                    }
                  })();
                  return (
                    <li key={alert.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "11px 18px",
                      borderBottom: i < liveAlerts.length - 1 ? `1px solid ${C.divider}` : "none",
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: dotColor, flexShrink: 0,
                        marginTop: 4,
                        boxShadow: `0 0 6px ${dotColor}80`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {alert.title}
                        </div>
                        {alert.message && (
                          <div style={{ fontSize: 10.5, color: C.textSub, marginTop: 2, lineHeight: 1.5 }}>
                            {alert.message}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: C.textMuted }}>{siteLabel}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            padding: "1px 6px", borderRadius: 8,
                            background: `${dotColor}1a`,
                            border: `1px solid ${dotColor}33`,
                            color: dotColor, letterSpacing: "0.04em", textTransform: "uppercase",
                          }}>
                            {typeBadge}
                          </span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>· {ago}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Lead-Ticker (NEU) ─────────────────────────────────────────
              Letzte 3 Leads aus dem Widget. Mission Control "Highlight" —
              zeigt sofort, ob Wachstums-Maschine läuft (Empty-State macht
              die Lücke zum Lead-Generator-Hub deutlich sichtbar). */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v6m0 0L8 5m4 3l4-3"/>
                  <path d="M3 13a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Lead-Ticker</span>
                {recentLeads.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.05em" }}>
                    Letzte {recentLeads.length}
                  </span>
                )}
              </div>
              <Link href="/dashboard/lead-generator" style={{ fontSize: 10.5, fontWeight: 700, color: "#a78bfa", textDecoration: "none", letterSpacing: "0.04em" }}>
                Lead-Generator →
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div style={{ padding: "22px 18px 24px", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                Noch keine Leads aus dem Widget.{" "}
                <Link href="/dashboard/lead-generator" style={{ color: accent, fontWeight: 600, textDecoration: "none" }}>
                  Widget einbauen →
                </Link>
                <div style={{ marginTop: 4, color: C.textSub, fontSize: 11 }}>
                  Das Lead-Widget liefert qualifizierte Anfragen direkt von den Sites deiner Kunden.
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(recentLeads.length, 3)}, 1fr)`, gap: 1, background: C.divider }}>
                {recentLeads.map(lead => {
                  const ts = new Date(lead.created_at);
                  const ago = (() => {
                    const diff = Date.now() - ts.getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1)  return "gerade eben";
                    if (mins < 60) return `vor ${mins} min`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24)  return `vor ${hrs} h`;
                    return ts.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                  })();
                  const dom = (() => { try { return new URL(lead.scanned_url).hostname.replace(/^www\./, ""); } catch { return lead.scanned_url; } })();
                  const score = lead.score;
                  const scoreColor = score == null ? C.textMuted : score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
                  const isComplete = !!lead.visitor_email;
                  return (
                    <div key={lead.id} style={{
                      background: C.card, padding: "14px 16px",
                      display: "flex", flexDirection: "column", gap: 6, minWidth: 0,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: isComplete ? C.green : C.amber,
                          boxShadow: `0 0 6px ${(isComplete ? C.green : C.amber)}80`,
                        }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          {isComplete ? "Lead" : "Teaser"}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted }}>{ago}</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.visitor_email ?? "(keine E-Mail erfasst)"}
                      </div>
                      <div style={{ fontSize: 10.5, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dom}
                      </div>
                      {score != null && (
                        <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${score}%`, background: scoreColor }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* /Lead-Ticker */}

          {/* 2-Spalten: Activity-Feed (links, breiter) + Team-Widget (rechts).
              Activity gibt das Was-ist-passiert, Team das Wer-ist-online. */}
          <div className="agency-two-col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>

          {/* Widget 1: Activity-Feed */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Activity-Feed</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Live</span>
            </div>
            {recentScans.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                Noch keine Scans im Account.<br/>Starte einen ersten Scan, dann erscheint er hier.
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {recentScans.map((r, i) => {
                  const dom = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; } })();
                  const ts  = new Date(r.created_at);
                  const ago = (() => {
                    const diff = Date.now() - ts.getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1)  return "gerade eben";
                    if (mins < 60) return `vor ${mins} min`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24)  return `vor ${hrs} h`;
                    return ts.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                  })();
                  const issueColor = r.issue_count === 0 ? C.green : r.issue_count != null && r.issue_count > 5 ? C.red : C.amber;
                  return (
                    <li key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 11,
                      padding: "10px 18px",
                      borderBottom: i < recentScans.length - 1 ? `1px solid ${C.divider}` : "none",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: issueColor, flexShrink: 0, boxShadow: `0 0 6px ${issueColor}80` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name ?? dom}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>
                          {ago}
                          {r.issue_count != null && (
                            <> · <span style={{ color: issueColor, fontWeight: 600 }}>
                              {r.issue_count === 0 ? "Sauber" : `${r.issue_count} Issues`}
                            </span></>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

            <TeamWidget />
          </div>
          {/* /2-col Activity+Team */}

          {/* 2-Spalten: System-Status + Anstehende Berichte. */}
          <div className="agency-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* Widget 2: System-Status */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>System-Status</span>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: healthPct === null || healthPct >= 95 ? C.green : healthPct >= 80 ? C.amber : C.red,
                boxShadow: `0 0 8px ${healthPct === null || healthPct >= 95 ? C.green : healthPct >= 80 ? C.amber : C.red}80`,
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Scan-Erfolgsrate · 24h</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: healthPct === null ? C.textMuted : healthPct >= 95 ? C.green : healthPct >= 80 ? C.amber : C.red }}>
                  {healthPct !== null ? `${healthPct} %` : "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Scans heute</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                  {trendValues[trendValues.length - 1] ?? 0}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>Scans · letzte 7 Tage</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{scansThisWeek}</span>
              </div>
              {scanHealth.total > 0 && (
                <div style={{ marginTop: 4, fontSize: 10.5, color: C.textMuted, lineHeight: 1.5 }}>
                  {scanHealth.ok} von {scanHealth.total} Scan-Versuchen erfolgreich.
                </div>
              )}
            </div>
          </div>

          {/* Branding-Preview entfernt — gehört in den Agency-Branding-Hub
              (siehe /dashboard/settings#branding), nicht auf die Mission Control. */}

          {/* Widget 4: Anstehende Berichte */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Anstehende Berichte</span>
              <Link href="/dashboard/reports" style={{ fontSize: 10.5, fontWeight: 700, color: "#a78bfa", textDecoration: "none", letterSpacing: "0.04em" }}>Alle →</Link>
            </div>
            {matrixRows.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                Noch keine Kunden für Auto-Reports konfiguriert.<br/>Lege einen Kunden an, um den nächsten Bericht zu planen.
              </div>
            ) : (() => {
              const now = new Date();
              const next1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
              const fmt = next1.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
              return (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {matrixRows.slice(0, 5).map((row, i) => {
                    const dom = (() => { try { return new URL(row.url.startsWith("http") ? row.url : `https://${row.url}`).hostname.replace(/^www\./, ""); } catch { return row.url; } })();
                    return (
                      <li key={row.id} style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "10px 18px",
                        borderBottom: i < Math.min(matrixRows.length, 5) - 1 ? `1px solid ${C.divider}` : "none",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          background: "rgba(124,58,237,0.14)",
                          border: "1px solid rgba(124,58,237,0.32)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.client_label ?? row.name ?? dom}
                          </div>
                          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>Monatsbericht · {fmt}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>

          </div>
          {/* /2-col System+Anstehende */}

      </div>
      {/* /wf-agency-grid */}

      {/* Last-Scan-Link reference (silences unused-prop warning when scans is consumed elsewhere) */}
      <span style={{ display: "none" }}>{scans.length}</span>
    </main>
  );
}
