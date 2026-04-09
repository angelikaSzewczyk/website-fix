"use client";

import { useState } from "react";
import type { ScheduledScan } from "./page";

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
        // Refresh by reloading
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

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em", color: "#0F172A" }}>
            Automatisiertes Monitoring
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Geplante Scans laufen automatisch — du bekommst nur eine Mail wenn es Probleme gibt.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#007BFF", color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", boxShadow: "0 4px 14px rgba(0,123,255,0.35)",
        }}>
          + Neuen Scan planen
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Geplante Scans",  value: schedules.length, color: "#0F172A" },
          { label: "Aktiv",           value: active,            color: "#22c55e" },
          { label: "Fällig heute",    value: dueToday,          color: dueToday > 0 ? "#f59e0b" : "#94A3B8" },
          { label: "Benachrichtigt",  value: schedules.filter(s => s.notify_email).length, color: "#007BFF" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 18px", borderRadius: 12,
            border: "1px solid #E2E8F0", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addSchedule} style={{
          padding: "24px 28px", borderRadius: 16,
          border: "1px solid #BFDBFE", background: "#EFF6FF",
          marginBottom: 24,
        }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#1E40AF" }}>Neuen automatischen Scan einrichten</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              type="url"
              placeholder="https://kunden-website.de"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              style={{
                padding: "10px 14px", borderRadius: 9,
                border: "1px solid #BFDBFE", fontSize: 13,
                background: "#fff", color: "#0F172A", outline: "none",
              }}
            />
            <select value={type} onChange={e => setType(e.target.value)} style={{
              padding: "10px 14px", borderRadius: 9, border: "1px solid #BFDBFE",
              fontSize: 13, background: "#fff", color: "#0F172A", cursor: "pointer",
            }}>
              <option value="website">Website-Check</option>
              <option value="wcag">WCAG</option>
              <option value="performance">Performance</option>
            </select>
            <select value={freq} onChange={e => setFreq(e.target.value)} style={{
              padding: "10px 14px", borderRadius: 9, border: "1px solid #BFDBFE",
              fontSize: 13, background: "#fff", color: "#0F172A", cursor: "pointer",
            }}>
              <option value="weekly">Wöchentlich</option>
              <option value="daily">Täglich</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#1E40AF" }}>
              <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "#007BFF" }} />
              E-Mail-Benachrichtigung bei Problemen
            </label>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: "9px 18px", borderRadius: 9, border: "1px solid #BFDBFE",
                background: "#fff", color: "#64748B", fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                Abbrechen
              </button>
              <button type="submit" disabled={saving} style={{
                padding: "9px 20px", borderRadius: 9, border: "none",
                background: "#007BFF", color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Speichern…" : "Scan planen"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Schedule list */}
      {schedules.length === 0 ? (
        <div style={{
          padding: "64px 24px", textAlign: "center",
          border: "2px dashed #E2E8F0", borderRadius: 16, background: "#FAFAFA",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏱️</div>
          <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Noch keine geplanten Scans</p>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#94A3B8" }}>
            Richte automatische Scans ein — WebsiteFix arbeitet für dich, auch wenn du schläfst.
          </p>
          <button onClick={() => setShowForm(true)} style={{
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: "#007BFF", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Ersten Scan planen →
          </button>
        </div>
      ) : (
        <div style={{
          border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 110px 110px 100px 110px 80px",
            padding: "10px 20px", background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
          }}>
            {["Website", "Typ", "Intervall", "Nächster Scan", "Letzter Scan", ""].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {schedules.map((s, i) => {
            const nextColor = !s.next_run_at ? "#94A3B8"
              : new Date(s.next_run_at) <= new Date() ? "#ef4444"
              : new Date(s.next_run_at).getTime() - Date.now() < 86400000 ? "#f59e0b"
              : "#22c55e";
            return (
              <div key={s.id} style={{
                display: "grid", gridTemplateColumns: "1fr 110px 110px 100px 110px 80px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < schedules.length - 1 ? "1px solid #F1F5F9" : "none",
              }}>
                {/* URL */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: s.active ? "#22c55e" : "#94A3B8",
                      boxShadow: s.active ? "0 0 5px rgba(34,197,94,0.5)" : "none",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(() => { try { return new URL(s.url).host; } catch { return s.url; } })()}
                    </span>
                  </div>
                  {s.last_issue_count !== null && (
                    <div style={{ fontSize: 11, color: s.last_issue_count === 0 ? "#22c55e" : "#f59e0b", marginTop: 2, marginLeft: 15 }}>
                      {s.last_issue_count === 0 ? "✓ Keine Probleme" : `⚠ ${s.last_issue_count} Probleme`}
                    </div>
                  )}
                </div>

                {/* Type */}
                <span style={{ fontSize: 12, color: "#64748B" }}>{TYPE_LABELS[s.type] ?? s.type}</span>

                {/* Frequency */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                  display: "inline-block", width: "fit-content",
                  background: "rgba(0,123,255,0.07)", color: "#007BFF",
                  border: "1px solid rgba(0,123,255,0.2)",
                }}>
                  {FREQ_LABELS[s.frequency] ?? s.frequency}
                </span>

                {/* Next run */}
                <span style={{ fontSize: 12, fontWeight: 600, color: nextColor }}>
                  {daysUntil(s.next_run_at)}
                </span>

                {/* Last run */}
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{fmtDate(s.last_run_at)}</span>

                {/* Delete */}
                <button
                  onClick={() => deleteSchedule(s.id)}
                  disabled={deleting === s.id}
                  style={{
                    padding: "5px 10px", borderRadius: 7,
                    border: "1px solid #FEE2E2", background: "#fff",
                    color: "#ef4444", fontSize: 11, fontWeight: 600,
                    cursor: deleting === s.id ? "not-allowed" : "pointer",
                    opacity: deleting === s.id ? 0.5 : 1,
                  }}
                >
                  Löschen
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 24, padding: "16px 20px", borderRadius: 12,
        border: "1px solid #E2E8F0", background: "#F8FAFC",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
          Scans laufen täglich um 7:00 Uhr automatisch. Du bekommst nur eine E-Mail, wenn Probleme gefunden werden — kein Spam wenn alles OK ist.
          Das wöchentliche Intervall ist ideal für Kunden-Websites, das tägliche für kritische Produktionssysteme.
        </p>
      </div>
    </main>
  );
}
