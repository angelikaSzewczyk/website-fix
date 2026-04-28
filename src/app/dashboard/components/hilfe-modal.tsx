"use client";

import { useState, useEffect, useRef } from "react";

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

type Screenshot = {
  name:    string;
  type:    string;       // image/png | image/jpeg
  dataUrl: string;       // base64 data URL
  sizeKb:  number;
};

const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024; // 2 MB hardcap (kein Storage-Service nötig)
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function fmtDate(iso: string): string {
  // Defensive: ungültige ISO-Strings dürfen das Modal nicht crashen.
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

interface Props {
  onClose:     () => void;
  projectUrl?: string;
  plan?:       string;
}

// ─── Status-Badge mit Dot + Label (visueller Trenner) ───────────────────────
function StatusBadge({ status }: { status: string }) {
  const conf = status === "open" ? {
    label: "Offen",
    color: S.amber,
    bg:    "rgba(251,191,36,0.10)",
    bd:    "rgba(251,191,36,0.32)",
  } : status === "replied" ? {
    label: "In Bearbeitung",
    color: S.blue,
    bg:    "rgba(79,142,247,0.10)",
    bd:    "rgba(79,142,247,0.32)",
  } : {
    label: "Gelöst",
    color: S.green,
    bg:    "rgba(34,197,94,0.10)",
    bd:    "rgba(34,197,94,0.32)",
  };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 12,
      color: conf.color, background: conf.bg, border: `1px solid ${conf.bd}`,
      letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: conf.color,
        boxShadow: `0 0 6px ${conf.color}66`,
      }} />
      {conf.label}
    </span>
  );
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
  const [screenshot, setScreenshot]         = useState<Screenshot | null>(null);
  const [shotError, setShotError]           = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Crash-Sicherung: sessionStorage-Lookup darf das Modal nie crashen lassen.
  // Defensive try/catch fängt alles — Schema-Drift, JSON-Parse-Fail, leere
  // Felder, missing properties.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wf_scan_result");
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      const diagnose = (parsed as { diagnose?: unknown })?.diagnose;
      if (typeof diagnose === "string" && diagnose.length > 0) {
        setLastErrorLog(diagnose.slice(0, 400));
      }
    } catch (err) {
      console.warn("[hilfe-modal] sessionStorage parse failed (non-fatal):", err);
    }
  }, []);

  // Tickets-Tab: defensive Fetch + Parse, alles kann fehlschlagen ohne Modal-Crash.
  useEffect(() => {
    if (view !== "tickets") return;
    setTicketsLoading(true);

    fetch("/api/support/mark-read", { method: "POST" }).catch(() => { /* non-critical */ });

    fetch("/api/support/tickets")
      .then(r => r.ok ? r.json() : null)
      .then((d: unknown) => {
        const list = (d as { tickets?: unknown })?.tickets;
        setTickets(Array.isArray(list) ? (list as Ticket[]) : []);
      })
      .catch(err => {
        console.warn("[hilfe-modal] tickets fetch failed (non-fatal):", err);
        setTickets([]);
      })
      .finally(() => setTicketsLoading(false));
  }, [view]);

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    setShotError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setShotError("Bitte PNG, JPG oder WebP wählen.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setShotError(`Datei zu groß (max. ${MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (!dataUrl) {
        setShotError("Datei konnte nicht gelesen werden.");
        return;
      }
      setScreenshot({
        name:    file.name,
        type:    file.type,
        dataUrl,
        sizeKb:  Math.round(file.size / 1024),
      });
    };
    reader.onerror = () => setShotError("Datei konnte nicht gelesen werden.");
    reader.readAsDataURL(file);
  }

  function removeScreenshot() {
    setScreenshot(null);
    setShotError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
            // Screenshot wandert in metadata.screenshot — Server forwarded
            // an Resend als Attachment, speichert auch in support_tickets.metadata.
            screenshot: screenshot ? {
              name:    screenshot.name,
              type:    screenshot.type,
              dataUrl: screenshot.dataUrl,
              size_kb: screenshot.sizeKb,
            } : null,
          },
        }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Fehler beim Senden."); return; }
      setSent(true);
      // Reset für nächste Anfrage
      setSubject(""); setMessage(""); setScreenshot(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("[hilfe-modal] submit failed:", err);
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

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
          }} aria-label="Modal schließen">×</button>
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
                  <button onClick={() => setSent(false)} style={{
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

                {/* Screenshot-Upload */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 6 }}>
                    Screenshot (optional)
                  </label>
                  {!screenshot ? (
                    <label
                      htmlFor="wf-support-shot"
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 13px", borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: `1px dashed ${S.border}`,
                        color: S.sub, fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ flex: 1 }}>Bild auswählen (PNG, JPG, WebP — max. 2&nbsp;MB)</span>
                      <input
                        id="wf-support-shot"
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                        onChange={handleScreenshotChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: 8, borderRadius: 8,
                      background: "rgba(34,197,94,0.06)",
                      border: `1px solid rgba(34,197,94,0.22)`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshot.dataUrl}
                        alt={screenshot.name}
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "#000" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: S.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {screenshot.name}
                        </div>
                        <div style={{ fontSize: 11, color: S.sub, marginTop: 2 }}>
                          {screenshot.sizeKb}&nbsp;KB · wird mitgesendet
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        aria-label="Screenshot entfernen"
                        style={{
                          background: "none", border: "none", color: S.red,
                          fontSize: 14, cursor: "pointer", padding: "4px 8px",
                          fontFamily: "inherit",
                        }}
                      >
                        Entfernen
                      </button>
                    </div>
                  )}
                  {shotError && (
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: S.red }}>{shotError}</p>
                  )}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>
                        {!t.user_read && (
                          <span style={{
                            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                            background: S.amber, marginRight: 6, verticalAlign: "middle",
                          }} />
                        )}
                        {t.subject || "(ohne Betreff)"}
                      </span>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>

                  {/* User message */}
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: S.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {t.message || ""}
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
