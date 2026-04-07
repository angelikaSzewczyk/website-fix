"use client";
import { useState } from "react";

export default function PrintButton({ url, type, date }: { url: string; type: string; date: string }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => window.print()}
        style={{
          padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600,
          border: "1px solid rgba(141,243,211,0.25)", color: "#8df3d3",
          background: "rgba(141,243,211,0.06)", cursor: "pointer",
        }}
      >
        📄 Als PDF speichern
      </button>
      <button
        onClick={handleShare}
        style={{
          padding: "11px 22px", borderRadius: 10, fontSize: 14,
          border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
          background: "none", cursor: "pointer",
        }}
      >
        {copied ? "✓ Link kopiert!" : "🔗 Teilen"}
      </button>
    </>
  );
}
