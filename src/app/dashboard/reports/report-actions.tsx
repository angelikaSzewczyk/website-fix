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
          padding: "10px 20px", borderRadius: 9, fontWeight: 700, fontSize: 13,
          background: loading ? "rgba(255,255,255,0.1)" : "#fff",
          color: loading ? "rgba(255,255,255,0.4)" : "#0b0c10",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          transition: "opacity 0.15s", flexShrink: 0,
        }}
      >
        {loading ? "Wird gesendet..." : "Testbericht jetzt senden"}
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
