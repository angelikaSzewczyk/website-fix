"use client";
import { useState } from "react";

const PRO_PLANS = ["professional", "smart-guard", "agency-pro", "agency-starter"];

export default function PrintButton({ url, type, date, scanId, plan }: {
  url: string; type: string; date: string;
  scanId?: string; plan?: string;
}) {
  const [shareState, setShareState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [shareLink,  setShareLink]  = useState<string | null>(null);
  const isPro = PRO_PLANS.includes(plan ?? "");

  async function handleShare() {
    if (!scanId || !isPro) return;
    setShareState("loading");
    try {
      const res = await fetch(`/api/share-token?scanId=${scanId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json() as { token: string };
      const link = `${window.location.origin}/view/${token}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 6000);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2500);
    }
  }

  return (
    <>
      <button
        onClick={() => window.print()}
        style={{
          padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: "1px solid rgba(141,243,211,0.25)", color: "#8df3d3",
          background: "rgba(141,243,211,0.06)", cursor: "pointer",
        }}
      >
        📄 Als PDF speichern
      </button>

      {isPro && scanId && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <button
            onClick={handleShare}
            disabled={shareState === "loading"}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: shareState === "copied"
                ? "1px solid rgba(74,222,128,0.35)"
                : shareState === "error"
                ? "1px solid rgba(239,68,68,0.35)"
                : "1px solid rgba(255,255,255,0.1)",
              color: shareState === "copied"
                ? "#4ade80"
                : shareState === "error"
                ? "#f87171"
                : "rgba(255,255,255,0.6)",
              background: shareState === "copied" ? "rgba(74,222,128,0.06)" : "none",
              cursor: shareState === "loading" ? "default" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}
          >
            {shareState === "loading" ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.7s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generiere Link…
              </>
            ) : shareState === "copied" ? (
              <>✓ Link kopiert!</>
            ) : shareState === "error" ? (
              <>Fehler – nochmal versuchen</>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Teilen-Link generieren
              </>
            )}
          </button>

          {/* Success: show the generated link */}
          {shareState === "copied" && shareLink && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8,
              background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)",
              animation: "wf-link-in 0.25s ease both",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>
                Dein White-Label Bericht ist jetzt unter{" "}
                <span style={{ color: "#4ade80", fontWeight: 600, wordBreak: "break-all" }}>{shareLink.replace(/^https?:\/\//, "")}</span>{" "}
                erreichbar.
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wf-link-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
