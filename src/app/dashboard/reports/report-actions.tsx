"use client";

import { useState } from "react";

export default function ReportActions({ currentMonth }: { currentMonth: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; email?: string; error?: string } | null>(null);

  async function sendReport() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Netzwerkfehler" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <button
        onClick={sendReport}
        disabled={loading}
        style={{
          padding: "10px 22px", borderRadius: 9, fontWeight: 700, fontSize: 13,
          background: loading
            ? "rgba(255,255,255,0.07)"
            : "linear-gradient(90deg, #007BFF, #0057b8)",
          color: loading ? "rgba(255,255,255,0.3)" : "#fff",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 2px 12px rgba(0,123,255,0.3)",
          transition: "opacity 0.15s", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 7,
        }}
      >
        {!loading && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        )}
        {loading ? "Wird gesendet…" : "Testbericht senden"}
      </button>

      {result?.ok && (
        <p style={{ fontSize: 12, color: "#8df3d3", margin: 0 }}>
          Bericht gesendet an {result.email}
        </p>
      )}
      {result?.error && (
        <p style={{ fontSize: 12, color: "#f38d8d", margin: 0 }}>
          {result.error}
        </p>
      )}
    </div>
  );
}
