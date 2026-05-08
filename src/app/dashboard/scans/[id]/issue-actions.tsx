"use client";

import { useState } from "react";

const C = {
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  blueBorder:"#BFDBFE",
  border:    "#E2E8F0",
  textMuted: "#94A3B8",
  textSub:   "#475569",
  green:     "#16A34A",
  greenBg:   "#F0FDF4",
};

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7, border: `1px solid ${copied ? "#A7F3D0" : C.border}`,
        background: copied ? C.greenBg : "#fff",
        color: copied ? C.green : C.textSub,
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Kopiert!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Code kopieren
        </>
      )}
    </button>
  );
}

// JiraExportButton entfernt (08.05.2026):
// - rief /api/jira-export auf, Route existierte nie → 404
// - JiraExportButton war nirgends importiert (toter Export)
// - echte Jira-Integration kommt mit Workflow-API in Q3 (Agency-Pricing-Bullet)

export function ResolvedButton() {
  const [resolved, setResolved] = useState(false);

  return (
    <button
      onClick={() => setResolved(r => !r)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        border: `1px solid ${resolved ? "#A7F3D0" : C.border}`,
        background: resolved ? C.greenBg : "#fff",
        color: resolved ? C.green : C.textMuted,
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {resolved ? "✓ Behoben" : "Als behoben markieren"}
    </button>
  );
}
