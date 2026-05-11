"use client";

import { useState } from "react";

type VitalScore = number | null;

interface PsiResult {
  scores: { performance: number; accessibility: number; seo: number };
  vitals: { lcp: string; cls: string; lcpScore: VitalScore; clsScore: VitalScore };
}

interface ApiResponse {
  success: boolean;
  scores?: PsiResult["scores"];
  vitals?: PsiResult["vitals"];
  error?: string;
  errorCode?: string;
}

/**
 * "Echte Core-Web-Vitals laden"-Button für /scan/results (Anon-Pfad).
 *
 * Klickt der User, wird /api/performance-scan mit mode="anon" gerufen.
 * Eigenes IP-Rate-Limit (2/24h), getrennt vom Hauptscan. Während des
 * API-Calls läuft eine sichtbare Ladeanimation — bewusst kein Auto-Load,
 * damit der User den Tech-Aufwand wahrnimmt.
 */
export default function PsiButton({ url, onTrack }: { url: string; onTrack?: () => void }) {
  const [state, setState]   = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<PsiResult | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  async function fetchPsi() {
    setState("loading");
    setErrMsg("");
    onTrack?.();
    try {
      const res = await fetch("/api/performance-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy: "mobile", mode: "anon" }),
      });
      const data = await res.json() as ApiResponse;
      if (!res.ok || !data.success || !data.scores || !data.vitals) {
        setErrMsg(data.error ?? "Performance-Abfrage fehlgeschlagen.");
        setState("error");
        return;
      }
      setResult({ scores: data.scores, vitals: data.vitals });
      setState("done");
    } catch {
      setErrMsg("Netzwerkfehler — bitte erneut versuchen.");
      setState("error");
    }
  }

  // ── State 1: idle — Button anzeigen ───────────────────────────────
  if (state === "idle") {
    return (
      <div style={{
        marginTop: 12, padding: "14px 16px", borderRadius: 9,
        background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.25)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.01em" }}>
              Echte Core-Web-Vitals (LCP, CLS) laden
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              Live-Messung via Google PageSpeed Insights API · einmaliger Klick, ~10 Sekunden
            </div>
          </div>
        </div>
        <button
          onClick={fetchPsi}
          style={{
            fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #22d3ee, #0ea5e9)", color: "#0b1220",
            border: "1px solid rgba(34,211,238,0.5)", cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          Jetzt messen →
        </button>
      </div>
    );
  }

  // ── State 2: loading — Animation ──────────────────────────────────
  if (state === "loading") {
    return (
      <div style={{
        marginTop: 12, padding: "16px 18px", borderRadius: 9,
        background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.2)",
      }}>
        <style>{`
          @keyframes psi-progress {
            0%   { width: 0%; }
            50%  { width: 68%; }
            100% { width: 92%; }
          }
          @keyframes psi-pulse {
            0%, 100% { opacity: 0.5; }
            50%      { opacity: 1; }
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "psi-pulse 1.4s ease-in-out infinite" }}>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
            Google PageSpeed Insights wird abgefragt…
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 8, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 8,
            background: "linear-gradient(90deg, #22d3ee, #0ea5e9)",
            animation: "psi-progress 12s ease-out forwards",
          }} />
        </div>
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 7 }}>
          LCP, CLS und Performance-Score werden direkt bei Google gemessen — keine Heuristik.
        </div>
      </div>
    );
  }

  // ── State 3: error ─────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div style={{
        marginTop: 12, padding: "12px 14px", borderRadius: 9,
        background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.3)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, color: "#fca5a5" }}>{errMsg}</span>
        <button
          onClick={fetchPsi}
          style={{
            fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7,
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // ── State 4: done — 3 Pills ───────────────────────────────────────
  const r = result!;
  // Pill-Color basierend auf Lighthouse-Score-Range (0..1) bzw. Performance-Score (0..100)
  const lcpColor = r.vitals.lcpScore == null ? "#94a3b8"
                : r.vitals.lcpScore >= 0.9 ? "#22c55e"
                : r.vitals.lcpScore >= 0.5 ? "#f59e0b" : "#ef4444";
  const clsColor = r.vitals.clsScore == null ? "#94a3b8"
                : r.vitals.clsScore >= 0.9 ? "#22c55e"
                : r.vitals.clsScore >= 0.5 ? "#f59e0b" : "#ef4444";
  const perfColor = r.scores.performance >= 90 ? "#22c55e"
                  : r.scores.performance >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      marginTop: 12, padding: "14px 16px", borderRadius: 9,
      background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.22)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#22d3ee", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Echte Werte · Google PageSpeed Insights
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Pill label="LCP" subtitle="Ladezeit Hauptinhalt" value={r.vitals.lcp} color={lcpColor} hint={lcpColor === "#22c55e" ? "im grünen Bereich" : lcpColor === "#f59e0b" ? "verbesserungsbedürftig" : "kritisch"} />
        <Pill label="CLS" subtitle="Layout-Stabilität"    value={r.vitals.cls} color={clsColor} hint={clsColor === "#22c55e" ? "stabil" : clsColor === "#f59e0b" ? "Sprünge möglich" : "starke Sprünge"} />
        <Pill label="Performance" subtitle="Gesamt-Score" value={`${r.scores.performance}/100`} color={perfColor} hint={perfColor === "#22c55e" ? "Top-Niveau" : perfColor === "#f59e0b" ? "Mittelfeld" : "schwach"} />
      </div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 9, lineHeight: 1.5 }}>
        Vollständige Performance-Roadmap (TBT, FCP, Speed-Index, KB-Ersparnisse pro Audit) im Dashboard.
      </div>
    </div>
  );
}

function Pill({ label, subtitle, value, color, hint }: {
  label: string; subtitle: string; value: string; color: string; hint: string;
}) {
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 7,
      background: "rgba(0,0,0,0.28)",
      border: `1px solid ${color}40`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginTop: 4, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{subtitle}</div>
      <div style={{ fontSize: 10, color, marginTop: 4, opacity: 0.85 }}>{hint}</div>
    </div>
  );
}
