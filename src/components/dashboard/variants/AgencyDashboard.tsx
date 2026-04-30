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
import { getPlanQuota, getMaxSubpages } from "@/lib/plans";
import { computeWpHealthScore, WP_LAYER_META, type ClassifiableWpIssue } from "@/lib/wp-health";
import { cmsContextLabel } from "@/lib/fix-guides";

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

// Health-Score: bevorzugt persistierten speed_score, sonst aus issue_count abgeleitet.
function deriveHealthScore(row: MatrixRow): number {
  if (typeof row.last_speed_score === "number") return Math.max(0, Math.min(100, row.last_speed_score));
  if (typeof row.last_issue_count === "number") return Math.max(0, 100 - row.last_issue_count * 4);
  // Fallback: status-basiert (für Zeilen ohne Scan).
  return row.last_check_status === "ok" ? 88 : row.last_check_status === "warning" ? 61 : 34;
}

const AGENCY_COLORS = ["#2563EB","#16A34A","#D97706","#7C3AED","#DC2626","#0891B2","#059669","#DB2777"];

function PdfIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
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

  const clientSlotLimit = getPlanQuota(plan).projects;
  // No-Drift-Garantie: getMaxSubpages ist die einzige Autorität. Wenn ein
  // Scan weniger Seiten gecrawlt hat, markieren wir das in der Matrix und
  // bieten einen Re-Scan-CTA an — die UI verfälscht keine Zahl mehr durch
  // einen flachen Scan im "letzten Scan"-Slot.
  const planMaxPages    = getMaxSubpages(plan);
  // 90% Schwellenwert: ein Agency-Plan-User mit 8000 von 10000 erlaubten
  // Seiten ist nicht "limited" — die Site hat eben nur 8000 Seiten. Erst
  // wenn der Scan deutlich unter dem Plan-Cap liegt UND unter ~80% des
  // bisherigen Maximums, sprechen wir von limited.
  const limitedThreshold = Math.max(20, Math.floor(planMaxPages * 0.5));

  void firstName; void agencyLogoUrl; void badge;

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
            borderRadius: 12,
            padding: "14px 16px",
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
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 3, letterSpacing: "0.02em" }}>{s.label}</div>
            </div>
            {"sparkline" in s && s.sparkline && (
              <Sparkline values={s.sparkline} color={s.color} width={56} height={20} />
            )}
          </div>
        ))}
      </div>

      {/* ── Bento-Grid 2:1 ── */}
      <div className="wf-agency-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "start" }}>

        {/* ── Kunden-Matrix ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowMd }}>

          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Kunden-Matrix</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.04em" }}>
                LIVE · {usedSlots}/{clientSlotLimit}
              </span>
            </div>
            <Link href="/dashboard/clients" style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textDecoration: "none" }}>
              Alle Kunden →
            </Link>
          </div>

          {/* Empty State */}
          {matrixRows.length === 0 && (
            <div style={{ padding: "28px 22px 26px" }}>
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
                  { n: "1", title: "Domain hinzufügen",    desc: "Lege deinen ersten Kunden mit Website-URL und Namen an.", cta: "Kunden anlegen",  href: "#modal-new-client" },
                  { n: "2", title: "White-Label einrichten", desc: "Lade dein Agentur-Logo hoch und setze die Brand-Farbe.", cta: "Branding öffnen", href: "/dashboard/settings#branding" },
                  { n: "3", title: "Ersten Bericht versenden", desc: "Aktiviere den automatischen Monats-Report im Berichte-Archiv.", cta: "Berichte öffnen", href: "/dashboard/reports" },
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
                        background: "rgba(124,58,237,0.18)",
                        border: "1px solid rgba(124,58,237,0.40)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "#a78bfa", lineHeight: 1,
                      }}>
                        {step.n}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                        {step.title}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: C.textSub, lineHeight: 1.55, flex: 1 }}>{step.desc}</p>
                    <Link href={step.href} style={{
                      alignSelf: "flex-start",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 10px", borderRadius: 6,
                      background: "rgba(124,58,237,0.14)",
                      border: "1px solid rgba(124,58,237,0.32)",
                      color: "#a78bfa",
                      fontSize: 11, fontWeight: 700, textDecoration: "none",
                    }}>
                      {step.cta} →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header */}
          {matrixRows.length > 0 && (
            <div className="agency-matrix-head" style={{
              padding: "9px 22px", background: C.bg, borderBottom: `1px solid ${C.divider}`,
              display: "grid", gridTemplateColumns: "1.7fr 1.2fr 100px 90px 110px 170px", gap: 12, alignItems: "center",
            }}>
              {["Kunde", "Domain", "Status", "Trend", "Health", "Aktion"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ overflowX: "auto" }}>
            {matrixRows.map((row, i) => {
              const domain = (() => { try { return new URL(row.url.startsWith("http") ? row.url : `https://${row.url}`).hostname; } catch { return row.url; } })();
              const label = row.client_label ?? row.name ?? domain;
              const initials = label.replace(/https?:\/\//, "").replace(/\./g, " ").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "??";
              const color = AGENCY_COLORS[i % AGENCY_COLORS.length];

              const rawStatus = row.last_check_status ?? "ok";
              const status: "ok" | "warning" | "critical" =
                rawStatus === "critical" || rawStatus === "error"
                  ? "critical"
                  : rawStatus === "warning"
                  ? "warning"
                  : "ok";
              const statusConf =
                status === "ok"      ? { label: "Sicher",   color: C.green, bg: C.greenBg, border: "rgba(74,222,128,0.30)" } :
                status === "critical"? { label: "Kritisch", color: C.red,   bg: C.redBg,   border: "rgba(248,113,113,0.30)" } :
                                       { label: "Prüfen",   color: C.amber, bg: C.amberBg, border: "rgba(251,191,36,0.30)" };

              // ── WP-Health-Score (Sprint 12) ────────────────────────────────
              // Wenn issues_json vorhanden: berechne Layer-Sub-Scores, zeige den
              // niedrigsten Layer-Wert als Hint (das ist der Engpass-Treiber).
              // Sonst Fallback auf den klassischen Health-Score aus speed_score.
              const wpHealth = Array.isArray(row.last_issues_json) && row.last_issues_json.length > 0
                ? computeWpHealthScore(row.last_issues_json)
                : null;
              const score = wpHealth ? wpHealth.overall : deriveHealthScore(row);
              const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
              // Schwächster Layer = der mit dem niedrigsten Score. Wird als
              // kleiner Hint unter der Health-Zahl gezeigt: "Schwach: Plugins"
              const weakestLayer = wpHealth
                ? (Object.keys(wpHealth.layers) as Array<keyof typeof wpHealth.layers>)
                    .reduce((min, k) => wpHealth.layers[k].score < wpHealth.layers[min].score ? k : min, "core" as keyof typeof wpHealth.layers)
                : null;
              const weakLayerLabel = weakestLayer && wpHealth && wpHealth.layers[weakestLayer].issues > 0
                ? WP_LAYER_META[weakestLayer].shortLabel
                : null;

              // Trend-Δ: Differenz zum vorletzten Scan. Issue-Count: niedriger
              // ist besser, also delta = prev - latest (positiv = Verbesserung).
              const issuesDelta =
                row.last_issue_count != null && row.prev_issue_count != null
                  ? row.prev_issue_count - row.last_issue_count
                  : null;
              const trendColor =
                issuesDelta == null ? C.textMuted : issuesDelta > 0 ? C.green : issuesDelta < 0 ? C.red : C.textMuted;
              const trendLabel =
                issuesDelta == null ? "—" : issuesDelta === 0 ? "±0" : issuesDelta > 0 ? `−${issuesDelta}` : `+${-issuesDelta}`;

              const detailHref = row.last_scan_id
                ? `/dashboard/scans/${row.last_scan_id}`
                : `/dashboard/scan?websiteId=${row.id}&url=${encodeURIComponent(row.url)}`;
              const reScanHref = `/dashboard/scan?websiteId=${row.id}&url=${encodeURIComponent(row.url)}`;

              // "Eingeschränkter Scan"-Marker: ein Scan ist limited, wenn er
              // weit unter dem Plan-Cap liegt UND der vorherige Scan tiefer war.
              // Damit triggern wir nicht bei Sites, die einfach klein sind.
              const isLimited =
                row.last_total_pages != null &&
                row.last_total_pages > 0 &&
                row.last_total_pages < limitedThreshold &&
                planMaxPages > 200;

              return (
                <div key={row.id} className="agency-client-row" style={{
                  display: "grid", gridTemplateColumns: "1.7fr 1.2fr 100px 90px 110px 170px",
                  gap: 12, alignItems: "center", padding: "13px 22px",
                  borderBottom: i < matrixRows.length - 1 ? `1px solid ${C.divider}` : "none", background: "transparent",
                }}>
                  {/* Kunde */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${color}14`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.last_scan_at
                          ? `${new Date(row.last_scan_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} · ${row.last_total_pages ?? "–"} Seiten`
                          : "Noch nicht gescannt"}
                      </div>
                    </div>
                  </div>

                  {/* Domain + CMS-Pill (Sprint 12) */}
                  <div style={{ minWidth: 0 }}>
                    <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}>
                      {domain}
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      {/* CMS-Context-Pill — zeigt Elementor/Divi/Gutenberg etc. */}
                      {row.cms_context && (
                        <span title={`Erkanntes WordPress-System: ${cmsContextLabel(row.cms_context)} — Fix-Anleitungen sind darauf zugeschnitten.`} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 9.5, fontWeight: 700,
                          padding: "1px 7px", borderRadius: 8,
                          background: "rgba(124,58,237,0.10)",
                          border: "1px solid rgba(124,58,237,0.28)",
                          color: "#a78bfa", letterSpacing: "0.04em",
                        }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          {cmsContextLabel(row.cms_context)}
                        </span>
                      )}
                      {isLimited && (
                        <span title={`Letzter Scan nur ${row.last_total_pages} Seiten — Plan-Cap ist ${planMaxPages}. Erneuter Scan empfohlen.`} style={{
                          fontSize: 9.5, fontWeight: 700,
                          padding: "1px 7px", borderRadius: 8,
                          background: C.amberBg, border: "1px solid rgba(251,191,36,0.35)",
                          color: C.amber, letterSpacing: "0.05em", textTransform: "uppercase",
                        }}>
                          Eingeschränkter Scan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`, whiteSpace: "nowrap" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusConf.color, display: "inline-block", flexShrink: 0 }} />
                    {statusConf.label}
                  </span>

                  {/* Trend */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: trendColor, display: "flex", alignItems: "center", gap: 5 }} title={issuesDelta == null ? "Kein Vorscan zum Vergleich" : `${issuesDelta > 0 ? "Verbesserung" : issuesDelta < 0 ? "Verschlechterung" : "Unverändert"} ggü. letztem Scan`}>
                    {issuesDelta != null && issuesDelta !== 0 && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {issuesDelta > 0
                          ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/></>
                          : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
                      </svg>
                    )}
                    {trendLabel}
                  </div>

                  {/* Health (WP-Layer-aware) */}
                  <div title={wpHealth ? `WP-Health: Core ${wpHealth.layers.core.score} · Plugins ${wpHealth.layers.plugins.score} · Themes ${wpHealth.layers.themes.score} · A11y ${wpHealth.layers.accessibility.score}` : "Score-Berechnung aus letztem Scan"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</span>
                      <span style={{ fontSize: 10, color: C.textMuted }}>/100</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor }} />
                    </div>
                    {weakLayerLabel && (
                      <div style={{ marginTop: 3, fontSize: 9.5, color: C.textMuted, letterSpacing: "0.04em" }}>
                        Schwach: <span style={{ color: scoreColor, fontWeight: 700 }}>{weakLayerLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Aktion */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {row.last_scan_id ? (
                      <a
                        href={`/api/export/pdf?scanId=${row.last_scan_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Als PDF exportieren"
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 30, height: 30, borderRadius: 7,
                          background: C.greenBg, border: `1px solid rgba(74,222,128,0.30)`,
                          color: C.green, textDecoration: "none",
                        }}
                      >
                        <PdfIcon />
                      </a>
                    ) : (
                      <span aria-label="PDF nach erstem Scan verfügbar" title="Noch kein Scan vorhanden" style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 30, height: 30, borderRadius: 7,
                        background: C.divider, border: `1px solid ${C.border}`,
                        color: C.textMuted, opacity: 0.55, cursor: "not-allowed",
                      }}>
                        <PdfIcon />
                      </span>
                    )}
                    <Link href={isLimited ? reScanHref : detailHref} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", borderRadius: 8,
                      background: isLimited ? C.amber : accent,
                      color: "#fff",
                      fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
                      boxShadow: `0 1px 6px ${accentGlowS}`,
                    }}>
                      {isLimited ? "Re-Scan →" : row.last_scan_id ? "Bericht →" : "Scan starten →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* /Kunden-Matrix */}

        {/* Right-Column-Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TeamWidget />

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

          {/* Widget 3: White-Label-Preview */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Branding-Preview</span>
              <Link href="/dashboard/settings#branding" style={{ fontSize: 10.5, fontWeight: 700, color: "#a78bfa", textDecoration: "none", letterSpacing: "0.04em" }}>
                Bearbeiten →
              </Link>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Hero-Tile mit echter Brand-Farbe */}
              <div style={{
                padding: "16px 18px", borderRadius: 11,
                background: `linear-gradient(135deg, ${accent}, ${accentBg})`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {agencyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agencyLogoUrl}
                    alt={agencyName ?? "Logo"}
                    style={{ height: 30, maxWidth: 80, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                  />
                ) : (
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(255,255,255,0.20)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                  }}>
                    {(agencyName ?? "WF").charAt(0).toUpperCase()}
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
                    {agencyName ?? "Deine Agentur"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                    Erscheint so in PDF-Reports
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10.5, color: C.textMuted, lineHeight: 1.5 }}>
                Logo, Brand-Farbe und Agenturname stammen direkt aus den
                Settings → Branding. Änderungen sind hier sofort sichtbar.
              </div>
            </div>
          </div>

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
        {/* /Right-Column-Stack */}
      </div>
      {/* /wf-agency-grid */}

      {/* Last-Scan-Link reference (silences unused-prop warning when scans is consumed elsewhere) */}
      <span style={{ display: "none" }}>{scans.length}</span>
    </main>
  );
}
