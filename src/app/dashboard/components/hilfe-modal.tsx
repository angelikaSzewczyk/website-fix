"use client";

import { useState, useEffect } from "react";

const S = {
  bg:      "rgba(0,0,0,0.72)",
  surface: "#0F1623",
  border:  "rgba(255,255,255,0.1)",
  text:    "#F0F2F8",
  sub:     "rgba(255,255,255,0.5)",
  muted:   "rgba(255,255,255,0.28)",
  blue:    "#4F8EF7",
  green:   "#22C55E",
  amber:   "#fbbf24",
  red:     "#f87171",
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "resolved";
  admin_reply: string | null;
  replied_at:  string | null;
  created_at:  string;
  user_read:   boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface Props {
  onClose:     () => void;
  projectUrl?: string;
  plan?:       string;
}

export default function HilfeModal({ onClose, projectUrl = "", plan = "free" }: Props) {
  const [view, setView]       = useState<"new" | "tickets">("new");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [lastErrorLog, setLastErrorLog]     = useState<string | null>(null);

  // Read last scan error from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wf_scan_result");
      if (raw) {
        const parsed = JSON.parse(raw) as { diagnose?: string; url?: string };
        if (parsed?.diagnose) setLastErrorLog(parsed.diagnose.slice(0, 400));
      }
    } catch { /* ignore */ }
  }, []);

  // Load tickets when switching to "Meine Tickets" tab
  useEffect(() => {
    if (view !== "tickets") return;
    setTicketsLoading(true);

    // Mark all as read when user opens tickets view
    fetch("/api/support/mark-read", { method: "POST" }).catch(() => {/* non-critical */});

    fetch("/api/support/tickets")
      .then(r => r.json())
      .then((d: { tickets?: Ticket[] }) => setTickets(d.tickets ?? []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, [view]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          metadata: {
            activeProjectUrl: projectUrl || null,
            lastErrorLog:     lastErrorLog || null,
            timestamp:        new Date().toISOString(),
            plan,
          },
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Fehler beim Senden."); return; }
      setSent(true);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = (s: string) =>
    s === "open" ? "Offen" : s === "replied" ? "Beantwortet" : "Gelöst";
  const statusColor = (s: string) =>
    s === "open" ? S.amber : s === "replied" ? S.blue : S.green;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: S.bg, backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: S.surface,
        border: `1px solid ${S.border}`,
        borderRadius: 16,
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px",
          borderBottom: `1px solid ${S.border}`,
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["new", "tickets"] as const).map(v => (
              <button
                key={v}
                onClick={() => { setView(v); setSent(false); }}
                style={{
                  padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: "none", cursor: "pointer",
                  background: view === v ? "rgba(255,255,255,0.1)" : "transparent",
                  color: view === v ? S.text : S.sub,
                }}
              >
                {v === "new" ? "Neue Anfrage" : "Meine Tickets"}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: S.sub,
            fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* ── NEW TICKET ── */}
        {view === "new" && (
          <div style={{ padding: "20px" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: S.text }}>
                  Nachricht gesendet!
                </h3>
                <p style={{ margin: "0 0 24px", fontSize: 13, color: S.sub, lineHeight: 1.6 }}>
                  Wir antworten so schnell wie möglich. Du siehst die Antwort unter&nbsp;
                  <strong style={{ color: S.text }}>Meine Tickets</strong>.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => { setSent(false); setSubject(""); setMessage(""); }} style={{
                    padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: "rgba(255,255,255,0.07)", color: S.sub, border: `1px solid ${S.border}`, cursor: "pointer",
                  }}>
                    Neue Anfrage
                  </button>
                  <button onClick={() => setView("tickets")} style={{
                    padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    background: S.blue, color: "#fff", border: "none", cursor: "pointer",
                  }}>
                    Ticket ansehen →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Metadata preview strip */}
                {(projectUrl || lastErrorLog) && (
                  <div style={{
                    padding: "10px 13px", background: "rgba(79,142,247,0.06)",
                    border: `1px solid rgba(79,142,247,0.15)`, borderRadius: 8,
                    fontSize: 11, color: S.muted, lineHeight: 1.6,
                  }}>
                    <span style={{ fontWeight: 700, color: S.sub }}>Wird automatisch mitgesendet:</span>
                    {projectUrl && <div>🔗 Projekt-URL: <span style={{ color: S.text }}>{projectUrl}</span></div>}
                    {lastErrorLog && <div>⚠ Letzter Scan-Log vorhanden</div>}
                    <div>📅 Zeitstempel: {new Date().toLocaleString("de-DE")}</div>
                    <div>📦 Plan: {plan}</div>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 6 }}>
                    Betreff
                  </label>
                  <input
                    type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="z. B. Scan startet nicht"
                    required maxLength={120}
                    style={{
                      width: "100%", padding: "10px 13px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${S.border}`,
                      borderRadius: 8, color: S.text, fontSize: 13,
                      outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 6 }}>
                    Problem beschreiben
                  </label>
                  <textarea
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Beschreibe dein Problem so genau wie möglich…"
                    required rows={5} maxLength={2000}
                    style={{
                      width: "100%", padding: "10px 13px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${S.border}`,
                      borderRadius: 8, color: S.text, fontSize: 13,
                      lineHeight: 1.6, outline: "none", resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ textAlign: "right", fontSize: 11, color: S.muted, marginTop: 4 }}>
                    {message.length}/2000
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: "10px 13px", borderRadius: 8,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    fontSize: 13, color: S.red,
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !subject.trim() || !message.trim()}
                  style={{
                    padding: "11px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    background: loading || !subject.trim() || !message.trim()
                      ? "rgba(79,142,247,0.3)" : S.blue,
                    color: "#fff", border: "none",
                    cursor: loading || !subject.trim() || !message.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Senden…" : "Anfrage senden →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── MY TICKETS ── */}
        {view === "tickets" && (
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {ticketsLoading ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: S.muted, fontSize: 13 }}>
                Lädt…
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
                <p style={{ color: S.muted, fontSize: 13 }}>Noch keine Tickets vorhanden.</p>
                <button onClick={() => setView("new")} style={{
                  marginTop: 12, padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: S.blue, color: "#fff", border: "none", cursor: "pointer",
                }}>
                  Erste Anfrage senden →
                </button>
              </div>
            ) : (
              tickets.map((t, i) => (
                <div key={t.id} style={{
                  padding: "16px 20px",
                  borderBottom: i < tickets.length - 1 ? `1px solid ${S.border}` : "none",
                  background: !t.user_read ? "rgba(251,191,36,0.04)" : "transparent",
                }}>
                  {/* Ticket header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>
                        {!t.user_read && (
                          <span style={{
                            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                            background: S.amber, marginRight: 6, verticalAlign: "middle",
                          }} />
                        )}
                        {t.subject}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      color: statusColor(t.status), background: `${statusColor(t.status)}18`,
                      flexShrink: 0,
                    }}>
                      {statusLabel(t.status)}
                    </span>
                  </div>

                  {/* User message */}
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: S.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {t.message}
                  </p>

                  {/* Admin reply */}
                  {t.admin_reply && (
                    <div style={{
                      padding: "12px 14px", marginTop: 10,
                      background: "rgba(79,142,247,0.07)",
                      border: `1px solid rgba(79,142,247,0.2)`,
                      borderRadius: 9,
                    }}>
                      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: S.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Support-Antwort · {t.replied_at ? fmtDate(t.replied_at) : ""}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: S.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {t.admin_reply}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 11, color: S.muted }}>
                    {fmtDate(t.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
