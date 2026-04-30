/**
 * AgencyDashboard — Phase 3 Sprint 5.
 *
 * Echtes Agency-Layout — Kommandozentrale mit Kunden-Matrix, Stat-Strip und
 * TeamWidget. Vorher als Inline-IIFE in app/dashboard/page.tsx (~280 LOC),
 * jetzt eigene Komponente.
 *
 * page.tsx → if (isAgency) <AgencyDashboard {...props}/>
 *
 * Server-Component: kein "use client" nötig, der Render ist mostly statisch.
 * TeamWidget ist client und wird als child gerendert (works fine).
 */

import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import TeamWidget from "@/app/dashboard/components/team-widget";
import { getPlanQuota } from "@/lib/plans";

// ─── Theme tokens — Dark-Mode (Phase 3 Sprint 6: vereinheitlicht mit
//     Pro/Starter-Variants + IssueList. Glassmorphism über transparent-
//     weißem Layer auf dunklem Page-BG.). Variable-Namen behalten, damit
//     Render-Block unverändert bleibt — nur Werte gemappt.
const C = {
  bg:          "#0b0c10",                       // Page-BG (matches D.page)
  card:        "rgba(255,255,255,0.025)",       // Glassmorphism-Card
  border:      "rgba(255,255,255,0.08)",
  divider:     "rgba(255,255,255,0.06)",
  shadow:      "none",                          // Dark theme: keine Karten-Shadows
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
type CriticalSite = {
  id: string; url: string; name: string | null;
  last_check_status: string; last_check_at: string;
  ssl_days_left: number | null; security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

type Props = {
  /** Vorname für eventuelle Personalisierung — heute nur Übergabe für Tour-Konsistenz. */
  firstName: string;
  /** Plan-String (kanonisch oder Legacy — Helper normalisieren intern). */
  plan: string;
  /** PLAN_BADGE-Eintrag für die Plan-Pill. */
  badge: { label: string; color: string; bg: string; border: string };
  /** User-ID für Live-Daten-Queries (Sprint 9). */
  userId: string;
  /** Markenname der Agentur (aus agency_settings); null = Default "Kommandozentrale". */
  agencyName: string | null;
  /** Logo-URL der Agentur. */
  agencyLogoUrl: string | null;
  /** Top-N Kunden-Sites (aus saved_websites). */
  criticalSites: CriticalSite[];
  /** Bisherige Scans des Users (für Stat-Strip + Detail-Link). */
  scans: ScanBrief[];
  /** Anzahl belegter Slots (= criticalSites.length). */
  usedSlots: number;
};

// ─── Sparkline — Mini-SVG-Trend für KPI-Cards (Sprint 9) ─────────────────────
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
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

// Health-Score aus dem Status der Kunden-Site. Approximation für die UI-Pill.
function healthScore(status: string) {
  return status === "ok" ? 88 : status === "warning" ? 61 : 34;
}

// Eindeutige Kunden-Farben für die Avatar-Bubbles in der Kunden-Matrix.
const AGENCY_COLORS = ["#2563EB","#16A34A","#D97706","#7C3AED","#DC2626","#0891B2","#059669","#DB2777"];

// Mini-Icon für die Bericht-Buttons in der Kunden-Matrix.
function PdfIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

export default async function AgencyDashboard({
  firstName, plan, badge, userId, agencyName, agencyLogoUrl, criticalSites, scans, usedSlots,
}: Props) {
  // ─── Sprint 9: Live-Daten für Widgets + Sparklines ────────────────────────
  const sql = neon(process.env.DATABASE_URL!);
  type DayRow      = { day: string; cnt: number };
  type RecentRow   = { id: string; url: string; created_at: string; issue_count: number | null; name: string | null };
  type HealthRow   = { ok: number; total: number };
  let scanTrend: DayRow[]      = [];
  let recentScans: RecentRow[] = [];
  let scanHealth: HealthRow    = { ok: 0, total: 0 };
  try {
    const [trendRows, recentRows, healthRows] = await Promise.all([
      // Scans pro Tag der letzten 7 Tage (für Sparkline + System-Status)
      sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS cnt
        FROM scans
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
      `,
      // Letzte 5 Scans, joined mit saved_websites für den Anzeige-Namen
      sql`
        SELECT s.id::text, s.url, s.created_at::text, s.issue_count,
               sw.name
        FROM scans s
        LEFT JOIN saved_websites sw ON sw.url = s.url AND sw.user_id = s.user_id
        WHERE s.user_id = ${userId}
        ORDER BY s.created_at DESC LIMIT 5
      `,
      // Scan-Log Success-Rate der letzten 24 Stunden — System-Status-Indikator
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
    // Tabellen fehlen evtl. (z.B. scan_log), Render fällt graceful auf leere Widgets
  }

  // 7-Tage-Array auffüllen — fehlende Tage = 0 (für Sparkline-Verlauf)
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
  void firstName; void agencyLogoUrl; // reserviert für künftige Personalisierung / Print-Header

  // CSS-Variablen kommen aus dashboard/layout.tsx (Branding-Color-Cascade).
  const accent       = "var(--agency-accent)";
  const accentBg     = "var(--agency-accent-bg)";
  const accentBorder = "var(--agency-accent-border)";
  const accentGlow   = "var(--agency-accent-glow)";       // CTA-Shadow
  const accentGlowS  = "var(--agency-accent-glow-soft)";  // Bericht-Button

  const clientSlotLimit = getPlanQuota(plan).projects;
  const slotsLabel      = String(clientSlotLimit);
  const lastScanId      = scans[0]?.id ?? null;

  // saved_websites → Agency-Client-Row-Format. No demo fallback —
  // empty state is rendered explicitly when an agency has no analyzed sites yet.
  const agencyClients = criticalSites.length > 0
    ? criticalSites.map((site, i) => {
        const domain = (() => { try { return new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`).hostname; } catch { return site.url; } })();
        const label  = site.name ?? domain;
        const initials = label.replace(/https?:\/\//, "").replace(/\./g, " ").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "??";
        const rawStatus = site.last_check_status ?? "ok";
        const status: "ok" | "warning" | "critical" = rawStatus === "critical" || rawStatus === "error" ? "critical" : rawStatus === "warning" ? "warning" : "ok";
        const lastScanLabel = site.last_check_at
          ? new Date(site.last_check_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        return { id: site.id, name: label, contact: domain, initials, color: AGENCY_COLORS[i % AGENCY_COLORS.length], domains: [domain], status, lastScan: lastScanLabel, assignee: "–", autoReport: false, clientLogin: false };
      })
    : [];

        return (
          <main style={{ padding: "28px 32px 80px" }}>

              {/* ── Sticky Action-Bar (Phase 3 Sprint 9).
                  position:sticky + backdrop-blur lässt den Content elegant
                  drunter durchscrollen. AgencyTopBar darüber ist bei z-index
                  30, daher hier 25 — bleibt unter der App-Topbar. */}
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
                {/* Primary CTA — solides Lila mit Shadow-Glow für Prominenz */}
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

              {/* ── Stat Strip — Sprint 10: 4-col full-width, gap reduziert,
                  echtes Bento-Feeling. */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
                {([
                  { value: agencyClients.length,                                       label: "Aktive Kunden",    color: C.blue,
                    iconPath: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
                  { value: agencyClients.reduce((s, c) => s + c.domains.length, 0),  label: "Domains gesamt",   color: C.green,
                    iconPath: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
                  { value: agencyClients.filter(c => c.status === "critical").length, label: "Handlungsbedarf",  color: C.red,
                    iconPath: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
                  { value: scansThisWeek,                                             label: "Scans · 7 Tage",   color: C.blue,
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
                    {/* Sprint 9: Sparkline nur wo sinnvoll (Scans-Verlauf 7d). */}
                    {"sparkline" in s && s.sparkline && (
                      <Sparkline values={s.sparkline} color={s.color} width={56} height={20} />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Bento-Grid (Sprint 10) — 2:1 proportional, Right-Column ist
                  ein vertikaler Stack: Team + Live-Widgets. Skaliert auf
                  breiten Monitoren (kein fixed-width mehr). */}
              <div className="wf-agency-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "start" }}>

              {/* ── Kunden-Matrix ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowMd }}>

                {/* Table header */}
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Kunden-Matrix</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.04em" }}>
                      UNLIMITIERT
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{agencyClients.length} {agencyClients.length === 1 ? "Projekt" : "Projekte"}</span>
                </div>

                {/* Quick-Start Guide — Phase 3 Sprint 8.
                    Statt zentrierter "Noch nichts da"-Anzeige drei horizontale
                    Step-Karten, die füllen die volle Breite der Kunden-Matrix
                    und führen den User durch das Onboarding. */}
                {agencyClients.length === 0 && (
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
                        {
                          n: "1",
                          title: "Domain hinzufügen",
                          desc: "Lege deinen ersten Kunden mit Website-URL und Namen an.",
                          cta: "Kunden anlegen",
                          href: "#modal-new-client",
                        },
                        {
                          n: "2",
                          title: "White-Label einrichten",
                          desc: "Lade dein Agentur-Logo hoch und setze die Brand-Farbe.",
                          cta: "Branding öffnen",
                          href: "/dashboard/settings#branding",
                        },
                        {
                          n: "3",
                          title: "Ersten Bericht versenden",
                          desc: "Aktiviere den automatischen Monats-Report im Berichte-Archiv.",
                          cta: "Berichte öffnen",
                          href: "/dashboard/reports",
                        },
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
                          <p style={{ margin: 0, fontSize: 11.5, color: C.textSub, lineHeight: 1.55, flex: 1 }}>
                            {step.desc}
                          </p>
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

                {/* Column headers — 7 cols (only when clients exist) */}
                {agencyClients.length > 0 && (
                  <div className="agency-matrix-head" style={{ padding: "9px 22px", background: C.bg, borderBottom: `1px solid ${C.divider}`, display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 170px", gap: 12, alignItems: "center" }}>
                    {["Kunde", "Domain", "Status", "Health", "Zuständig", "Login", "Aktion"].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                    ))}
                  </div>
                )}

                {/* Rows */}
                <div style={{ overflowX: "auto" }}>
                {agencyClients.map((client, i) => {
                  const score  = healthScore(client.status);
                  const isOk   = client.status === "ok";
                  const isCrit = client.status === "critical";
                  const statusConf = isOk
                    ? { label: "Sicher",          color: C.green, bg: C.greenBg, border: "#A7F3D0" }
                    : isCrit
                    ? { label: "Kritisch",        color: C.red,   bg: C.redBg,   border: "#FECACA" }
                    : { label: "Prüfen",          color: C.amber, bg: C.amberBg, border: "#FDE68A" };
                  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
                  const detailHref = lastScanId ? `/dashboard/scans/${lastScanId}` : "/dashboard/scan";
                  const cbId = `ar-${client.id}`;

                  return (
                    <div key={client.id} className="agency-client-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 170px", gap: 12, alignItems: "center", padding: "13px 22px", borderBottom: i < agencyClients.length - 1 ? `1px solid ${C.divider}` : "none", background: "transparent" }}>

                      {/* Kunde */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${client.color}14`, border: `1px solid ${client.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: client.color }}>
                          {client.initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.contact}</div>
                        </div>
                      </div>

                      {/* Domain */}
                      <div style={{ minWidth: 0 }}>
                        {client.domains.slice(0, 2).map((d, di) => (
                          <a key={d} href={`https://${d}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: di === 0 && client.domains.length > 1 ? 2 : 0 }}>
                            {d}
                          </a>
                        ))}
                        {client.domains.length > 2 && <span style={{ fontSize: 10, color: C.textMuted }}>+{client.domains.length - 2} weitere</span>}
                      </div>

                      {/* Status */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusConf.color, display: "inline-block", flexShrink: 0 }} />
                        {statusConf.label}
                      </span>

                      {/* Health-Score */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>/100</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor }} />
                        </div>
                      </div>

                      {/* Verantwortlich */}
                      <div title={`Zuständig: ${client.assignee}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: accent }}>
                          {client.assignee}
                        </div>
                      </div>

                      {/* Kunden-Login */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {client.clientLogin ? (
                          <span title="Kunden-Login aktiv" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </span>
                        ) : (
                          <span title="Kein Kunden-Login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: C.divider, border: `1px solid ${C.border}` }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                        )}
                      </div>

                      {/* PDF + Bericht-Button (Auto-Report-Toggle entfernt — siehe Beta-Indikator) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Beta-Indikator: Auto-Report ist noch nicht live, kein irreführender Toggle.
                            Vorher CSS-only checkbox ohne Backend — wirkte aktiv, war Deko. */}
                        <span
                          aria-label="Auto-Report-Beta"
                          title="BETA: Automatischer Versand wird aktuell für Agency-Accounts ausgerollt."
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 7,
                            background: C.divider,
                            border: `1px solid ${C.border}`,
                            color: C.textMuted,
                            cursor: "help",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </span>
                        {/* Reference cbId to silence unused-var TS error from removed toggle */}
                        <span style={{ display: "none" }} aria-hidden="true">{cbId}</span>
                        {/* PDF-Export: nur als <a> rendern wenn ein Scan existiert.
                            Sonst ein <span> ohne Tab-/Enter-Aktivierung (echtes Disable,
                            nicht nur pointer-events). */}
                        {lastScanId ? (
                          <a
                            href={`/api/export/pdf?scanId=${lastScanId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Als PDF exportieren"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 30, height: 30, borderRadius: 7,
                              background: "#F0FDF4",
                              border: "1px solid #A7F3D0",
                              color: C.green,
                              textDecoration: "none",
                            }}
                          >
                            <PdfIcon />
                          </a>
                        ) : (
                          <span
                            role="img"
                            aria-label="PDF-Export verfügbar nach erstem Scan"
                            title="Noch kein Scan vorhanden"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 30, height: 30, borderRadius: 7,
                              background: C.divider,
                              border: `1px solid ${C.border}`,
                              color: C.textMuted,
                              opacity: 0.55,
                              cursor: "not-allowed",
                            }}
                          >
                            <PdfIcon />
                          </span>
                        )}
                        <Link href={detailHref} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: accent, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: `0 1px 6px ${accentGlowS}` }}>
                          Bericht →
                        </Link>
                      </div>

                    </div>
                  );
                })}
                </div>

              </div>
              {/* /Kunden-Matrix */}

              {/* Right-Column-Stack (Sprint 10): TeamWidget + 3 Live-Widgets
                  vertikal gestapelt. Sitzt in der 1fr-Spalte des Bento-Grids. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <TeamWidget />
                {/* ── Widget 1: Zuletzt gescannte Kunden ──────────────────── */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Zuletzt gescannt</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Live
                    </span>
                  </div>
                  {recentScans.length === 0 ? (
                    <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                      Noch keine Scans im Account.<br/>
                      Starte einen ersten Scan, dann erscheint er hier.
                    </div>
                  ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {recentScans.map((r, i) => {
                        const dom = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; } })();
                        const ts  = new Date(r.created_at);
                        const ago = (() => {
                          const diff = Date.now() - ts.getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1)   return "gerade eben";
                          if (mins < 60)  return `vor ${mins} min`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24)   return `vor ${hrs} h`;
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

                {/* ── Widget 2: System-Status ──────────────────────────────── */}
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
                      <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                        {scansThisWeek}
                      </span>
                    </div>
                    {scanHealth.total > 0 && (
                      <div style={{ marginTop: 4, fontSize: 10.5, color: C.textMuted, lineHeight: 1.5 }}>
                        {scanHealth.ok} von {scanHealth.total} Scan-Versuchen erfolgreich.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Widget 3: Anstehende Berichte ─────────────────────────
                    Phase-3-Stub: derived aus criticalSites (1. des Folgemonats
                    pro Site). Echtes Scheduling kommt in Phase 4. */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Anstehende Berichte</span>
                    <Link href="/dashboard/reports" style={{ fontSize: 10.5, fontWeight: 700, color: "#a78bfa", textDecoration: "none", letterSpacing: "0.04em" }}>
                      Alle →
                    </Link>
                  </div>
                  {criticalSites.length === 0 ? (
                    <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                      Noch keine Kunden für Auto-Reports konfiguriert.<br/>
                      Lege einen Kunden an, um den nächsten Bericht zu planen.
                    </div>
                  ) : (() => {
                    const now = new Date();
                    const next1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    const fmt = next1.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
                    return (
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {criticalSites.slice(0, 5).map((site, i) => {
                          const dom = (() => { try { return new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`).hostname.replace(/^www\./, ""); } catch { return site.url; } })();
                          return (
                            <li key={site.id} style={{
                              display: "flex", alignItems: "center", gap: 11,
                              padding: "10px 18px",
                              borderBottom: i < Math.min(criticalSites.length, 5) - 1 ? `1px solid ${C.divider}` : "none",
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
                                  {site.name ?? dom}
                                </div>
                                <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>
                                  Monatsbericht · {fmt}
                                </div>
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
          </main>
        );
}
