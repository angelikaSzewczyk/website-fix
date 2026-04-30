"use client";

/**
 * Monitoring-Page — Dark-Mode-Refactor (Sprint 12).
 *
 * Vorher: Light-Cards (#fff Background, #E2E8F0 Border, #007BFF Buttons,
 * Emoji-Icons) → Stilbruch zum Rest des Dashboards.
 *
 * Jetzt: gleiche Token-Familie wie AgencyDashboard 2.0 + clients/page.tsx —
 * rgba(255,255,255,0.025) Card-BG, rgba(255,255,255,0.08) Border, lila Akzent
 * (#7C3AED) für Primary-CTA, Lucide-style SVG-Icons (inline, ohne extra Dep).
 */

import { useState } from "react";
import type { ScheduledScan } from "./page";

// ─── Dark-Tokens (mirrored from variants/_shared) ────────────────────────────
const T = {
  page:       "#0b0c10",
  card:       "rgba(255,255,255,0.025)",
  cardSolid:  "#0f1623",
  border:     "rgba(255,255,255,0.08)",
  borderMid:  "rgba(255,255,255,0.12)",
  divider:    "rgba(255,255,255,0.06)",
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.4)",
  textFaint:  "rgba(255,255,255,0.25)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.10)",
  greenBdr:   "rgba(74,222,128,0.28)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.10)",
  amberBdr:   "rgba(251,191,36,0.28)",
  red:        "#f87171",
  redBg:      "rgba(248,113,113,0.10)",
  redBdr:     "rgba(248,113,113,0.28)",
  purple:     "#a78bfa",
  purpleBg:   "rgba(124,58,237,0.18)",
  purpleBdr:  "rgba(124,58,237,0.40)",
  purpleSolid:"rgba(124,58,237,0.85)",
  blue:       "#7aa6ff",
  blueBg:     "rgba(122,166,255,0.10)",
  blueBdr:    "rgba(122,166,255,0.28)",
};

// ─── Lucide-Style Inline-SVGs ────────────────────────────────────────────────
function IconClock()    { return <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>; }
function IconActive()   { return <><polyline points="20 6 9 17 4 12"/></>; }
function IconCalendar() { return <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>; }
function IconBell()     { return <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>; }
function IconPlus()     { return <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>; }
function IconTrash()    { return <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>; }
function IconInfo()     { return <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>; }
function IconEmpty()    { return <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>; }
function IconCheckSm()  { return <><polyline points="20 6 9 17 4 12"/></>; }
function IconWarn()     { return <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>; }

const FREQ_LABELS: Record<string, string> = { daily: "Täglich", weekly: "Wöchentlich" };
const TYPE_LABELS: Record<string, string> = { website: "Website-Check", wcag: "WCAG", performance: "Performance" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysUntil(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Heute";
  if (diff === 1) return "Morgen";
  return `In ${diff} Tagen`;
}

const TABLE_GRID = "1.5fr 130px 130px 110px 130px 80px";

export default function MonitoringClient({ schedules: initial }: { schedules: ScheduledScan[] }) {
  const [schedules, setSchedules] = useState(initial);
  const [showForm, setShowForm]   = useState(false);
  const [url, setUrl]             = useState("");
  const [type, setType]           = useState("website");
  const [freq, setFreq]           = useState("weekly");
  const [notify, setNotify]       = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const active   = schedules.filter(s => s.active).length;
  const dueToday = schedules.filter(s => {
    if (!s.next_run_at) return false;
    return new Date(s.next_run_at).toDateString() === new Date().toDateString();
  }).length;

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/scheduled-scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type, frequency: freq, notify_email: notify }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(id: string) {
    setDeleting(id);
    try {
      await fetch("/api/scheduled-scans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSchedules(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  // Input-Style: gleiche Optik wie agency-config-client (settings)
  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 9,
    border: `1px solid ${T.border}`,
    background: "rgba(255,255,255,0.03)",
    color: T.text,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <main style={{ padding: "32px 32px 80px", color: T.text, minHeight: "100vh" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
        marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${T.divider}`,
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Agency · Automatisches Monitoring
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            Geplante Scans
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 620, lineHeight: 1.55 }}>
            Scans laufen automatisch nach Plan — du bekommst nur eine E-Mail wenn Probleme auftauchen.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 10,
          background: T.purpleSolid,
          border: "1px solid rgba(167,139,250,0.55)",
          color: "#fff",
          fontWeight: 700, fontSize: 13,
          whiteSpace: "nowrap",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <IconPlus />
          </svg>
          Neuen Scan planen
        </button>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {([
          { label: "Geplante Scans", value: schedules.length, color: T.purple, bg: T.purpleBg, bdr: T.purpleBdr, icon: <IconClock /> },
          { label: "Aktiv",          value: active,           color: T.green,  bg: T.greenBg,  bdr: T.greenBdr,  icon: <IconActive /> },
          { label: "Fällig heute",   value: dueToday,         color: dueToday > 0 ? T.amber : T.textMuted, bg: dueToday > 0 ? T.amberBg : T.card, bdr: dueToday > 0 ? T.amberBdr : T.border, icon: <IconCalendar /> },
          { label: "Mit Mail-Alert", value: schedules.filter(s => s.notify_email).length, color: T.blue, bg: T.blueBg, bdr: T.blueBdr, icon: <IconBell /> },
        ] as const).map(s => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12,
            backdropFilter: "blur(8px)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: s.bg, border: `1px solid ${s.bdr}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {s.icon}
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, letterSpacing: "0.02em" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add-Form (collapse-Panel) ──────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={addSchedule} style={{
          padding: "20px 24px", borderRadius: 14,
          background: T.card, border: `1px solid ${T.purpleBdr}`,
          marginBottom: 24, backdropFilter: "blur(8px)",
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
            Neuen automatischen Scan einrichten
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              type="url"
              placeholder="https://kunden-website.de"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              style={{ ...inputStyle, minWidth: 220 }}
            />
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="website">Website-Check</option>
              <option value="wcag">WCAG</option>
              <option value="performance">Performance</option>
            </select>
            <select value={freq} onChange={e => setFreq(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="weekly">Wöchentlich</option>
              <option value="daily">Täglich</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: T.textSub }}>
              <input
                type="checkbox"
                checked={notify}
                onChange={e => setNotify(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: T.purpleSolid }}
              />
              E-Mail-Benachrichtigung bei Problemen
            </label>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: "9px 16px", borderRadius: 9,
                border: `1px solid ${T.border}`,
                background: "rgba(255,255,255,0.03)",
                color: T.textSub, fontWeight: 600, fontSize: 12.5,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Abbrechen
              </button>
              <button type="submit" disabled={saving} style={{
                padding: "9px 18px", borderRadius: 9,
                background: T.purpleSolid, color: "#fff",
                border: "1px solid rgba(167,139,250,0.55)",
                fontWeight: 700, fontSize: 12.5,
                cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
                fontFamily: "inherit",
                boxShadow: "0 2px 10px rgba(124,58,237,0.30)",
              }}>
                {saving ? "Speichern…" : "Scan planen"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Schedule-List ──────────────────────────────────────────────────── */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}>
        {/* Table-Header — immer sichtbar, auch im Empty-State */}
        <div style={{
          display: "grid", gridTemplateColumns: TABLE_GRID, gap: 14,
          padding: "12px 22px",
          borderBottom: `1px solid ${T.divider}`,
          background: "rgba(255,255,255,0.015)",
        }}>
          {["Website", "Typ", "Intervall", "Nächster Scan", "Letzter Scan", ""].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {h}
            </span>
          ))}
        </div>

        {schedules.length === 0 ? (
          <div style={{ padding: "48px 28px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, marginBottom: 18,
              background: T.purpleBg,
              border: `1px solid ${T.purpleBdr}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <IconEmpty />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
              Noch keine geplanten Scans
            </h3>
            <p style={{ margin: "0 auto 22px", fontSize: 12.5, color: T.textSub, lineHeight: 1.65, maxWidth: 480 }}>
              Richte automatische Scans ein — WebsiteFix arbeitet täglich für dich, auch wenn du schläfst. Bei Problemen kommt automatisch eine E-Mail.
            </p>
            <button onClick={() => setShowForm(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 10,
              background: T.purpleSolid,
              border: "1px solid rgba(167,139,250,0.55)",
              color: "#fff",
              fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <IconPlus />
              </svg>
              Ersten Scan planen
            </button>
          </div>
        ) : (
          schedules.map((s, i) => {
            const nextColor = !s.next_run_at ? T.textFaint
              : new Date(s.next_run_at) <= new Date() ? T.red
              : new Date(s.next_run_at).getTime() - Date.now() < 86400000 ? T.amber
              : T.green;
            const host = (() => { try { return new URL(s.url).host.replace(/^www\./, ""); } catch { return s.url; } })();
            const issueColor = s.last_issue_count === 0 ? T.green : T.amber;

            return (
              <div key={s.id} style={{
                display: "grid", gridTemplateColumns: TABLE_GRID, gap: 14,
                padding: "14px 22px", alignItems: "center",
                borderBottom: i < schedules.length - 1 ? `1px solid ${T.divider}` : "none",
              }}>
                {/* Website */}
                <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: s.active ? T.green : T.textFaint,
                    boxShadow: s.active ? `0 0 6px ${T.green}80` : "none",
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {host}
                    </div>
                    {s.last_issue_count !== null && (
                      <div style={{ fontSize: 11, color: issueColor, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {s.last_issue_count === 0 ? <IconCheckSm /> : <IconWarn />}
                        </svg>
                        {s.last_issue_count === 0 ? "Keine Probleme" : `${s.last_issue_count} Probleme`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type */}
                <span style={{ fontSize: 12, color: T.textSub }}>{TYPE_LABELS[s.type] ?? s.type}</span>

                {/* Frequency */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                  display: "inline-block", width: "fit-content",
                  background: T.purpleBg, color: T.purple,
                  border: `1px solid ${T.purpleBdr}`,
                }}>
                  {FREQ_LABELS[s.frequency] ?? s.frequency}
                </span>

                {/* Next */}
                <span style={{ fontSize: 12, fontWeight: 700, color: nextColor }}>
                  {daysUntil(s.next_run_at)}
                </span>

                {/* Last */}
                <span style={{ fontSize: 11, color: T.textMuted }}>{fmtDate(s.last_run_at)}</span>

                {/* Delete */}
                <button
                  onClick={() => deleteSchedule(s.id)}
                  disabled={deleting === s.id}
                  title="Plan löschen"
                  style={{
                    justifySelf: "start",
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "6px 10px", borderRadius: 7,
                    border: `1px solid ${T.redBdr}`,
                    background: T.redBg,
                    color: T.red, fontSize: 11, fontWeight: 700,
                    cursor: deleting === s.id ? "not-allowed" : "pointer",
                    opacity: deleting === s.id ? 0.5 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <IconTrash />
                  </svg>
                  Löschen
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Info-Hinweis ──────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 20, padding: "14px 18px", borderRadius: 12,
        background: T.card, border: `1px solid ${T.border}`,
        display: "flex", gap: 12, alignItems: "flex-start",
        backdropFilter: "blur(8px)",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: T.blueBg, border: `1px solid ${T.blueBdr}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: T.blue, marginTop: 1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <IconInfo />
          </svg>
        </span>
        <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>
          Scans laufen täglich um <strong style={{ color: T.text }}>07:00 Uhr</strong> automatisch.
          Du bekommst nur eine E-Mail, wenn Probleme gefunden werden — kein Spam wenn alles OK ist.
          Wöchentliches Intervall ist ideal für Kunden-Websites, das tägliche für kritische Produktionssysteme.
        </p>
      </div>
    </main>
  );
}
