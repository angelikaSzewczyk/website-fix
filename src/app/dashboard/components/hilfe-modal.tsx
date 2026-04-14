"use client";

import { useState } from "react";

const S = {
  bg:      "rgba(0,0,0,0.7)",
  surface: "#0F1623",
  border:  "rgba(255,255,255,0.1)",
  text:    "#F0F2F8",
  sub:     "rgba(255,255,255,0.5)",
  blue:    "#4F8EF7",
  green:   "#22C55E",
  red:     "#f87171",
};

export default function HilfeModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
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
        width: "100%", maxWidth: 440,
        background: S.surface,
        border: `1px solid ${S.border}`,
        borderRadius: 16,
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px",
          borderBottom: `1px solid ${S.border}`,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.text }}>Hilfe & Support</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: S.sub }}>Sende uns eine Nachricht — wir antworten zeitnah.</p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: S.sub,
            fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: S.text }}>Nachricht gesendet!</h3>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: S.sub, lineHeight: 1.6 }}>
                Wir haben deine Anfrage erhalten und melden uns so schnell wie möglich.
              </p>
              <button onClick={onClose} style={{
                padding: "10px 24px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: S.blue, color: "#fff", border: "none", cursor: "pointer",
              }}>
                Schließen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 6 }}>
                  Betreff
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="z. B. Scan läuft nicht durch"
                  required
                  maxLength={120}
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
                  Nachricht
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Beschreibe dein Problem so genau wie möglich…"
                  required
                  rows={5}
                  maxLength={2000}
                  style={{
                    width: "100%", padding: "10px 13px", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${S.border}`,
                    borderRadius: 8, color: S.text, fontSize: 13,
                    lineHeight: 1.6, outline: "none", resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: S.sub, marginTop: 4 }}>
                  {message.length}/2000
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 13px", borderRadius: 8,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
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
                  marginTop: 2,
                }}
              >
                {loading ? "Senden…" : "Nachricht senden →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
