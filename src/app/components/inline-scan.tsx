"use client";

import { useState } from "react";

type ScanState = "idle" | "scanning" | "done" | "error";

function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return <h3 key={i} style={{ fontSize: 17, margin: "20px 0 8px", fontWeight: 700 }}>{line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("**🔴")) {
      return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#ff6b6b" }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.startsWith("**🟡")) {
      return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#ffd93d" }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.startsWith("**🟢")) {
      return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#8df3d3" }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.match(/^\d+\./)) {
      return <div key={i} style={{ margin: "5px 0", paddingLeft: 18, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{line}</div>;
    }
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 5 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6 }}>{line}</p>;
  });
}

export default function InlineScan({ placeholder = "Deine Website-URL eingeben (z.B. https://deinewebsite.de)" }: { placeholder?: string }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [diagnose, setDiagnose] = useState("");
  const [error, setError] = useState("");

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;
    setState("scanning");
    setDiagnose("");
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnose(data.diagnose);
        setState("done");
      } else {
        setError(data.error || "Etwas ist schiefgelaufen.");
        setState("error");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
      setState("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleScan} style={{ position: "relative" }}>
        <label htmlFor="inline-scan-url" className="sr-only">Website-URL eingeben</label>
        <div style={{
          display: "flex", alignItems: "center",
          background: "rgba(8, 10, 20, 0.9)",
          border: "1px solid rgba(37,99,235,0.3)",
          borderRadius: 14,
          padding: "6px 6px 6px 16px",
          boxShadow: "0 0 20px 3px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          {/* Lock icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 10 }} aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            id="inline-scan-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            disabled={state === "scanning"}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
              padding: "10px 8px",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={state === "scanning" || !url}
            style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              background: state === "scanning" || !url ? "rgba(37,99,235,0.4)" : "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 20px",
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: "nowrap",
              cursor: state === "scanning" || !url ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {state === "scanning" ? "Scannt…" : "Jetzt scannen"}
            {state !== "scanning" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      {state === "scanning" && (
        <div style={{ marginTop: 20, padding: "20px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Website abrufen...",
              "HTML analysieren: Title, Meta, H1, robots.txt...",
              "KI erstellt Diagnose auf Deutsch...",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                <span style={{ color: "#8df3d3" }}>⟳</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {state === "error" && (
        <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10 }}>
          <p style={{ margin: 0, color: "#ff6b6b", fontSize: 14 }}>{error}</p>
        </div>
      )}

      {state === "done" && diagnose && (
        <div style={{ marginTop: 20 }}>
          <div style={{ padding: "24px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14 }}>
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8df3d3", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Scan abgeschlossen</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>— {url}</span>
            </div>
            <div>{renderDiagnose(diagnose)}</div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/scan" style={{ fontSize: 13, padding: "10px 18px", background: "#fff", color: "#0b0c10", borderRadius: 9, fontWeight: 700, textDecoration: "none" }}>
              Vollständigen Scan öffnen →
            </a>
            <button
              onClick={() => { setState("idle"); setUrl(""); setDiagnose(""); }}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: "10px 0" }}
            >
              Neue URL scannen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
