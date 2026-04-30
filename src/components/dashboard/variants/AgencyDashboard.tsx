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
import TeamWidget from "@/app/dashboard/components/team-widget";
import { getPlanQuota } from "@/lib/plans";

// ─── Theme tokens (Agency-light layout, vs. variants/_shared/UIHelpers.D dark) ─
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd:    "0 4px 16px rgba(0,0,0,0.08)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenDot:    "#22C55E",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberDot:    "#F59E0B",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redDot:      "#EF4444",
  yellow:      "#EAB308",
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

export default function AgencyDashboard({
  firstName, plan, badge, agencyName, agencyLogoUrl, criticalSites, scans, usedSlots,
}: Props) {
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

              {/* ── Header ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
                {/* Body-H1: Markenname statt "Kommandozentrale" wenn agency_name gesetzt.
                    Spec §3.1 — der Agentur-Inhaber sieht *seinen* Namen groß als
                    Page-Heading. Fallback bleibt unsere Default-Bezeichnung,
                    damit die Page auch ohne Branding-Setup einen Titel hat. */}
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
                  {agencyName ?? "Kommandozentrale"}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Plan badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
                    Plan: {badge.label}
                  </span>
                  {/* Slots */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: usedSlots >= clientSlotLimit ? C.redBg : C.divider, border: `1px solid ${usedSlots >= clientSlotLimit ? "#FECACA" : C.border}` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? C.red : C.text, whiteSpace: "nowrap" }}>
                      Slots: {usedSlots} / {slotsLabel}
                    </span>
                  </div>
                  {/* Branding badge — Live-Preview-Hint: Tooltip zeigt dem
                      Agentur-Admin, wo das Branding noch wirkt (PDF-Reports).
                      Subtiler Upsell-Reminder für den 249€-Plan. */}
                  <span
                    title="Dieses Branding wird auch in deinen PDF-Reports für Kunden verwendet."
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, whiteSpace: "nowrap", cursor: "help" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    White-Label aktiv
                  </span>
                  {/* CTA */}
                  <a href="#modal-new-client" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 2px 12px rgba(234,179,8,0.35)", whiteSpace: "nowrap" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Neuen Kunden
                  </a>
                </div>
              </div>

              {/* ── Stat Strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { value: agencyClients.length,                                             label: "Aktive Kunden",     color: C.blue,    icon: "👥" },
                  { value: agencyClients.reduce((s, c) => s + c.domains.length, 0),        label: "Domains gesamt",   color: C.green,   icon: "🌐" },
                  { value: agencyClients.filter(c => c.status === "critical").length,       label: "Handlungsbedarf",  color: C.red,     icon: "🔴" },
                  { value: scans.length,                                                   label: "Scans gesamt",     color: C.textSub, icon: "📊" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 2-Spalten-Grid: Kunden-Matrix (links, breit) + Team-Widget (rechts, fix 320px).
                   Mobile (< 980px) stack vertikal — siehe .wf-agency-grid in Styles. */}
              <div className="wf-agency-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>

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

                {/* Empty state — Agentur hat noch keine analysierten Kunden */}
                {agencyClients.length === 0 && (
                  <div style={{ padding: "56px 28px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: accentBg, border: `1px solid ${accentBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                      Noch keine Kunden-Websites analysiert
                    </h3>
                    <p style={{ margin: "0 auto 22px", fontSize: 13, color: C.textSub, lineHeight: 1.6, maxWidth: 420 }}>
                      Starte deinen ersten Scan, um dein Portfolio aufzubauen.
                      Jeder neue Scan landet automatisch in der Kunden-Matrix.
                    </p>
                    <a href="#modal-new-client" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, background: accent, color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: `0 2px 14px ${accentGlow}`, whiteSpace: "nowrap" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Ersten Kunden anlegen
                    </a>
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
              {/* /Kunden-Matrix — Team-Widget rendert als rechte Spalte im
                  wf-agency-grid Container und schließt diesen unten ab. */}

              <TeamWidget />
              </div>
              {/* /wf-agency-grid */}
          </main>
        );
}
