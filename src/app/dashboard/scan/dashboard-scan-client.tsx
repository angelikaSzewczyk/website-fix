"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import DiagnoseReport from "./diagnose-report";

// ─── Light-mode tokens ────────────────────────────────────────────────────────
const C = {
  bg:         "#F8FAFC",
  card:       "#FFFFFF",
  border:     "#E2E8F0",
  divider:    "#F1F5F9",
  shadow:     "0 1px 4px rgba(0,0,0,0.07)",
  text:       "#0F172A",
  textSub:    "#475569",
  textMuted:  "#94A3B8",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenDot:   "#22C55E",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FCA5A5",
};

// ─── WCAG priority → severity mapping ────────────────────────────────────────
const PRIORITY_MAP: Record<string, { sev: "red"|"yellow"|"green"; label: string }> = {
  critical:  { sev: "red",    label: "Kritisch" },
  serious:   { sev: "red",    label: "Schwerwiegend" },
  moderate:  { sev: "yellow", label: "Mittel" },
  minor:     { sev: "yellow", label: "Gering" },
};

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function go() { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
  return (
    <button onClick={go} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 10px", borderRadius: 6, border: `1px solid ${copied ? "#A7F3D0" : C.border}`,
      background: copied ? C.greenBg : "#fff", color: copied ? C.green : C.textMuted,
      fontSize: 11, fontWeight: 600, cursor: "pointer",
    }}>
      {copied ? "✓ Kopiert" : "Kopieren"}
    </button>
  );
}

function WcagViolationCard({ v, i }: { v: { priority: string; help: string; nodeHtml: string }; i: number }) {
  const info = PRIORITY_MAP[v.priority.toLowerCase()] ?? { sev: "yellow", label: v.priority };
  const isRed = info.sev === "red";

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, boxShadow: C.shadow, overflow: "hidden",
    }}>
      <div style={{ height: 3, background: isRed ? `linear-gradient(90deg, ${C.red}, ${C.red}66)` : `linear-gradient(90deg, ${C.amber}, ${C.amber}66)` }} />
      <div style={{ padding: "18px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
            background: isRed ? C.redBg : C.amberBg,
            color: isRed ? C.red : C.amber,
            border: `1px solid ${isRed ? C.redBorder : C.amberBorder}`,
            letterSpacing: "0.04em",
          }}>
            {isRed ? "🔴" : "🟡"} {info.label}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>#{i + 1}</span>
        </div>

        {/* Title */}
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
          {v.help}
        </h3>

        {/* Affected element */}
        {v.nodeHtml && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Betroffenes Element
            </p>
            <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{
                  background: "#0F172A", borderRadius: 6, padding: "10px 12px",
                  flex: 1, overflow: "auto",
                }}>
                  <code style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>
                    {v.nodeHtml}
                  </code>
                </div>
                <CopyButton code={v.nodeHtml} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderDiagnoseLight(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 15, margin: "22px 0 8px", fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.divider}`, paddingBottom: 8 }}>{line.replace("## ", "")}</h3>;
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: C.red, fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: C.amber, fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: C.green, fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "5px 0", paddingLeft: 18, color: C.textSub, fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <p key={i} style={{ margin: "4px 0", color: C.textSub, fontSize: 14, lineHeight: 1.75 }}>{line}</p>;
  });
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────
// Renders the AI diagnosis with an inline "Neu scannen" (RefreshCw) button.
// When `refreshing` is true, a translucent overlay shows the live-analysis message
// while the old result stays visible underneath.
function ScoreCard({
  title,
  diagnose,
  refreshing,
  onRefresh,
  url,
  totalPages,
  issueCount,
  scannedAt,
}: {
  title: string;
  diagnose: string;
  refreshing: boolean;
  onRefresh: () => void;
  url?: string;
  totalPages?: number;
  issueCount?: number;
  scannedAt?: string | null;
}) {
  return (
    <div style={{
      padding: "24px 28px", background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, boxShadow: C.shadow, position: "relative", overflow: "hidden",
    }}>
      {/* Loading overlay — shown while force-refresh scan is running */}
      {refreshing && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "rgba(248,250,252,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          borderRadius: 12,
        }}>
          <RefreshCw
            size={22}
            color={C.blue}
            style={{ animation: "wf-spin 1s linear infinite" }}
          />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text }}>
              Cache wird umgangen...
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>
              Starte Live-Analyse.
            </p>
          </div>
        </div>
      )}

      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </p>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Neu scannen – Cache umgehen"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${C.border}`, background: C.card,
            cursor: refreshing ? "default" : "pointer",
            color: C.textSub, fontSize: 12, fontWeight: 500,
            opacity: refreshing ? 0.4 : 1, transition: "opacity 0.15s",
          }}
        >
          <RefreshCw size={12} style={refreshing ? { animation: "wf-spin 1s linear infinite" } : undefined} />
          Neu scannen
        </button>
      </div>

      {/* AI diagnosis rendered as structured report */}
      <DiagnoseReport
        diagnose={diagnose}
        url={url}
        totalPages={totalPages}
        issueCount={issueCount}
        scannedAt={scannedAt}
      />
    </div>
  );
}

function AutoPilotWidget({ url, type }: { url: string; type: string }) {
  const [active, setActive] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [secInterval, setSecInterval] = useState<"täglich" | "wöchentlich">("täglich");
  const [deepInterval, setDeepInterval] = useState<"wöchentlich" | "monatlich">("wöchentlich");

  async function activate() {
    await fetch("/api/scheduled-scans", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type, frequency: "weekly", notify_email: true }),
    }).catch(() => null);
    setActive(true);
  }

  if (!active) {
    return (
      <button onClick={activate} style={{
        display: "flex", alignItems: "center", gap: 7,
        fontSize: 13, color: C.textSub, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", padding: "7px 14px",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Auto-Pilot aktivieren
      </button>
    );
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      overflow: "hidden", minWidth: 220,
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px", background: "#F0FDF4", borderBottom: `1px solid #A7F3D0`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: C.greenDot, flexShrink: 0,
            boxShadow: `0 0 0 2px #bbf7d0`,
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Auto-Pilot · Aktiv</span>
        </div>
        <button
          onClick={() => setShowEdit(e => !e)}
          style={{
            fontSize: 11, color: C.blue, background: "none", border: "none",
            cursor: "pointer", fontWeight: 600, padding: 0,
          }}
        >
          {showEdit ? "Fertig" : "Zeitplan anpassen"}
        </button>
      </div>

      {/* Schedule rows */}
      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        {!showEdit ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: C.textMuted }}>Security-Scan</span>
              <span style={{ fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{secInterval}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: C.textMuted }}>Deep-Scan</span>
              <span style={{ fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{deepInterval}</span>
            </div>
          </>
        ) : (
          <>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.textSub }}>
              Security-Scan
              <select
                value={secInterval}
                onChange={e => setSecInterval(e.target.value as typeof secInterval)}
                style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 6px", color: C.text, background: C.card }}
              >
                <option value="täglich">Täglich</option>
                <option value="wöchentlich">Wöchentlich</option>
              </select>
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.textSub }}>
              Deep-Scan
              <select
                value={deepInterval}
                onChange={e => setDeepInterval(e.target.value as typeof deepInterval)}
                style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 6px", color: C.text, background: C.card }}
              >
                <option value="wöchentlich">Wöchentlich</option>
                <option value="monatlich">Monatlich</option>
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}

type ScanState = "idle" | "scanning" | "done" | "error";
type TabType = "website" | "wcag" | "performance" | "fullsite";

// ─── Full-Site progress state ─────────────────────────────────────────────────
type FullSitePhase = "crawling" | "analyzing" | "ai" | "done" | "error";
type FullSiteProgress = {
  phase: FullSitePhase;
  message: string;
  found?: number;
  remaining?: number;
};

// ─── Full-Site scan result ────────────────────────────────────────────────────
type FullSiteResult = {
  scanId:     string | null;
  issueCount: number;
  totalPages: number;
  diagnose:   string;
  fromCache?: boolean;
  cachedAt?:  string;
};

type PerfData = {
  scores: { performance: number; accessibility: number; seo: number; bestPractices: number };
  vitals: { lcp: string; cls: string; tbt: string; fcp: string; si: string };
  opportunities: { title: string; displayValue?: string; score: number | null }[];
};

const TABS: { key: TabType; label: string; badge?: string }[] = [
  { key: "website",     label: "Website-Check" },
  { key: "wcag",        label: "Barrierefreiheit" },
  { key: "performance", label: "Performance" },
  { key: "fullsite",    label: "Full-Site Crawl", badge: "NEU" },
];

const SCAN_STEPS: Record<TabType, string[]> = {
  wcag:        ["Browser startet...", "Seite wird geladen...", "WCAG 2.1 Analyse läuft...", "KI erstellt Diagnose..."],
  performance: ["PageSpeed Insights wird abgefragt...", "Core Web Vitals werden analysiert...", "KI erstellt Diagnose..."],
  website:     ["Website wird abgerufen...", "HTML wird analysiert...", "KI erstellt Diagnose..."],
  fullsite:    ["Website wird gecrawlt...", "Unterseiten werden analysiert...", "KI erstellt Site-Report..."],
};

function formatCacheAge(cachedAt: string): string {
  const ms      = Date.now() - new Date(cachedAt).getTime();
  const hours   = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `vor ${hours}h`;
  if (minutes >= 1) return `vor ${minutes} min`;
  return "gerade eben";
}

export default function DashboardScanClient({ userName, plan }: { userName: string; plan: string }) {
  const [tab, setTab] = useState<TabType>("website");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [diagnose, setDiagnose] = useState("");
  const [wcagViolations, setWcagViolations] = useState<{ priority: string; help: string; nodeHtml: string }[]>([]);
  const [perfData, setPerfData] = useState<PerfData | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [error, setError] = useState("");
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  // Full-site specific state
  const [fsProgress, setFsProgress] = useState<FullSiteProgress | null>(null);
  const [fsResult, setFsResult] = useState<FullSiteResult | null>(null);

  const isAgencyPlan = ["agency_core", "agency_scale", "agentur", "pro", "freelancer"].includes(plan);

  function resetState() {
    setState("idle"); setDiagnose(""); setError("");
    setWcagViolations([]); setPerfData(null); setUrl(""); setSavedScanId(null);
    setFsProgress(null); setFsResult(null); setFromCache(false); setCachedAt(null);
  }

  async function handleScan(e: React.FormEvent | null, forceRefresh = false) {
    if (e) e.preventDefault();
    if (!url || state === "scanning") return;

    if (tab === "fullsite") {
      handleFullSiteScan(forceRefresh);
      return;
    }

    setState("scanning");
    setDiagnose(""); setError(""); setWcagViolations([]); setPerfData(null);
    setSavedScanId(null); setFromCache(false); setCachedAt(null);

    try {
      const endpoint = tab === "wcag" ? "/api/wcag-scan" : tab === "performance" ? "/api/performance-scan" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy: device, forceRefresh }), credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDiagnose(data.diagnose ?? "");
        setFromCache(data.fromCache === true);
        setCachedAt(data.cachedAt ?? null);
        if (tab === "wcag") setWcagViolations(data.violations ?? []);
        if (tab === "performance") setPerfData({ scores: data.scores, vitals: data.vitals, opportunities: data.opportunities });
        if (data.scanId) setSavedScanId(data.scanId);
        setState("done");
      } else {
        setError(data.error ?? "Fehler beim Scannen.");
        setState("error");
      }
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
      setState("error");
    }
  }

  function handleFullSiteScan(forceRefresh = false) {
    setState("scanning");
    setFsProgress({ phase: "crawling", message: "Verbinde..." });
    setFsResult(null);
    setError(""); setFromCache(false); setCachedAt(null);

    const encodedUrl = encodeURIComponent(url);
    const es = new EventSource(`/api/full-scan?url=${encodedUrl}${forceRefresh ? "&forceRefresh=true" : ""}`);

    es.addEventListener("phase", (ev) => {
      const d = JSON.parse(ev.data);
      setFsProgress({ phase: d.phase as FullSitePhase, message: d.message });
    });

    es.addEventListener("progress", (ev) => {
      const d = JSON.parse(ev.data);
      setFsProgress({
        phase: d.phase as FullSitePhase,
        message: d.message,
        found: d.found,
        remaining: d.remaining,
      });
    });

    es.addEventListener("complete", (ev) => {
      const d = JSON.parse(ev.data) as FullSiteResult;
      setFsResult(d);
      setFsProgress({ phase: "done", message: `${d.totalPages} Seiten analysiert` });
      setFromCache(d.fromCache === true);
      setCachedAt(d.cachedAt ?? null);
      setState("done");
      es.close();
    });

    es.addEventListener("error", (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data ?? "{}");
        setError(d.message ?? "Scan fehlgeschlagen.");
      } catch {
        setError("Verbindungsfehler beim Crawl. Bitte erneut versuchen.");
      }
      setState("error");
      es.close();
    });

    es.onerror = () => {
      // Only fire if not already done
      setState((prev) => {
        if (prev === "scanning") {
          setError("Verbindung unterbrochen. Bitte erneut versuchen.");
          return "error";
        }
        return prev;
      });
      es.close();
    };
  }

  // ── Force-refresh: re-runs scan in-place, keeps results visible ──────────────
  // For fullsite (SSE-based) we fall back to the normal scanning flow.
  async function handleForceRefresh() {
    if (isForceRefreshing) return;
    if (tab === "fullsite") { handleScan(null, true); return; }
    if (state !== "done") return;

    setIsForceRefreshing(true);
    try {
      const endpoint = tab === "wcag"
        ? "/api/wcag-scan"
        : tab === "performance"
          ? "/api/performance-scan"
          : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy: device, forceRefresh: true }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDiagnose(data.diagnose ?? "");
        setFromCache(false);
        setCachedAt(null);
        if (tab === "wcag") setWcagViolations(data.violations ?? []);
        if (tab === "performance") setPerfData({
          scores: data.scores,
          vitals: data.vitals,
          opportunities: data.opportunities,
        });
        if (data.scanId) setSavedScanId(data.scanId);
      } else {
        setError(data.error ?? "Fehler beim Neu-Scannen.");
        setState("error");
      }
    } catch {
      setError("Verbindungsfehler beim Neu-Scannen.");
      setState("error");
    } finally {
      setIsForceRefreshing(false);
    }
  }

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 24px 80px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          {userName ? `${userName} — ` : ""}Scan
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: "-0.025em" }}>
          Website scannen
        </h1>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setState("idle"); setDiagnose(""); setError(""); setFsProgress(null); setFsResult(null); }}
            style={{
              padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? C.blue : C.textMuted,
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.1s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {t.label}
            {t.badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                background: C.blueBg, color: C.blue, letterSpacing: "0.05em",
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Device toggle */}
      {tab === "performance" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {(["mobile", "desktop"] as const).map(d => (
            <button key={d} onClick={() => setDevice(d)} style={{
              padding: "7px 16px", borderRadius: 8, border: `1px solid ${device === d ? C.blueBorder : C.border}`,
              background: device === d ? C.blueBg : C.card,
              color: device === d ? C.blue : C.textMuted,
              fontSize: 13, cursor: "pointer", fontWeight: device === d ? 600 : 400,
            }}>
              {d === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
            </button>
          ))}
        </div>
      )}

      {/* SCAN FORM */}
      <form onSubmit={handleScan} style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <label htmlFor="dashboard-scan-url" className="sr-only">Website-URL</label>
        <input
          id="dashboard-scan-url"
          type="text" value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://kunden-website.de"
          disabled={state === "scanning"}
          style={{
            flex: 1, minWidth: 280,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14, outline: "none",
            boxShadow: C.shadow,
          }}
        />
        <button type="submit" disabled={state === "scanning" || !url} style={{
          padding: "12px 28px", borderRadius: 10, border: "none",
          background: !url || state === "scanning" ? "#E2E8F0" : C.blue,
          color: !url || state === "scanning" ? C.textMuted : "#fff",
          fontWeight: 700, fontSize: 14,
          cursor: !url || state === "scanning" ? "not-allowed" : "pointer",
          boxShadow: !url || state === "scanning" ? "none" : "0 2px 8px rgba(37,99,235,0.3)",
          transition: "background 0.15s",
        }}>
          {state === "scanning" ? "Scannt..." : "Scan starten"}
        </button>
      </form>

      {/* FULL-SITE: upgrade prompt for free users */}
      {tab === "fullsite" && !isAgencyPlan && (
        <div style={{
          padding: "24px 28px", background: C.blueBg, border: `1px solid ${C.blueBorder}`,
          borderRadius: 14, marginBottom: 24,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.text }}>
            Full-Site Crawl — ab Freelancer Plan
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
            Analysiere deine gesamte Website automatisch — alle Unterseiten, aggregierte Fehler, Seitentyp-Auswertung.
            Verfügbar ab dem Freelancer-Plan (25 Seiten) bis Agency Scale (150 Seiten).
          </p>
          <a href="/fuer-agenturen#pricing" style={{
            display: "inline-block", padding: "9px 20px", borderRadius: 8,
            background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}>
            Plan upgraden →
          </a>
        </div>
      )}

      {/* FULL-SITE: info banner for paid users */}
      {tab === "fullsite" && isAgencyPlan && state === "idle" && (
        <div style={{
          padding: "14px 18px", background: C.blueBg, border: `1px solid ${C.blueBorder}`,
          borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🕷</span>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: C.text }}>
              Full-Site Crawl — crawlt alle Unterseiten automatisch
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
              Gibt die Domain ein (z.B. <code style={{ background: C.divider, padding: "1px 4px", borderRadius: 3 }}>https://kundenwebsite.de</code>).
              Der Crawler findet alle Seiten via Sitemap + interne Links und liefert einen aggregierten Report für die gesamte Website.
              {plan === "freelancer" ? " Limit: 25 Seiten." : plan === "agency_core" || plan === "agentur" ? " Limit: 50 Seiten." : " Limit: 150 Seiten."}
            </p>
          </div>
        </div>
      )}

      {/* SCANNING STATE — Full-Site live progress */}
      {state === "scanning" && tab === "fullsite" && fsProgress && (
        <div style={{
          padding: "24px 28px", background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, marginBottom: 24, boxShadow: C.shadow,
        }}>
          {/* Phase indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {(["crawling", "analyzing", "ai"] as const).map((ph, i) => {
              const phaseOrder = ["crawling", "analyzing", "ai"];
              const currentIdx = phaseOrder.indexOf(fsProgress.phase);
              const isDone = i < currentIdx;
              const isActive = ph === fsProgress.phase;
              return (
                <div key={ph} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: isDone ? C.green : isActive ? C.blue : C.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: isDone || isActive ? "#fff" : C.textMuted, fontWeight: 700,
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: isActive ? 700 : 400,
                    color: isActive ? C.text : isDone ? C.green : C.textMuted,
                  }}>
                    {ph === "crawling" ? "Crawlen" : ph === "analyzing" ? "Analysieren" : "KI-Report"}
                  </span>
                  {i < 2 && <span style={{ color: C.border, fontSize: 14, marginLeft: 2 }}>›</span>}
                </div>
              );
            })}
          </div>

          {/* Live message */}
          <div style={{
            padding: "12px 16px", background: C.blueBg, borderRadius: 8,
            border: `1px solid ${C.blueBorder}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: C.blue, flexShrink: 0,
                animation: "pulse 1.5s infinite",
              }} />
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{fsProgress.message}</span>
            </div>
          </div>

          {/* Found count progress */}
          {fsProgress.phase === "crawling" && typeof fsProgress.found === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", background: C.blue, borderRadius: 2,
                  width: `${Math.min(100, (fsProgress.found / (
                    plan === "agency_scale" ? 150 : plan === "agency_core" || plan === "agentur" ? 50 : 25
                  )) * 100)}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", fontWeight: 600 }}>
                {fsProgress.found} Seiten
              </span>
            </div>
          )}
        </div>
      )}

      {/* SCANNING STATE — regular scans */}
      {state === "scanning" && tab !== "fullsite" && (
        <div style={{ padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 24, boxShadow: C.shadow }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SCAN_STEPS[tab as Exclude<TabType, "fullsite">].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: C.textSub, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, flexShrink: 0, opacity: 0.6 }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {state === "error" && (
        <div style={{ padding: "14px 18px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, marginBottom: 24 }}>
          <p style={{ margin: 0, color: C.red, fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* RESULTS */}
      {state === "done" && (
        <div>
          {/* Result header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.greenDot, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
                {tab === "fullsite" ? "Full-Site Crawl abgeschlossen" : "Scan abgeschlossen"}
              </span>
              <span style={{ color: C.textMuted, fontSize: 13 }}>— {url}</span>
              {tab === "fullsite" && fsResult && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                  background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`,
                }}>
                  {fsResult.totalPages} Seiten · {fsResult.issueCount} Problemtypen
                </span>
              )}
              {/* Cache badge */}
              {fromCache && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                  background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}`,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  🕐 Gecacht{cachedAt ? ` · ${formatCacheAge(cachedAt)}` : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(savedScanId || fsResult?.scanId) && (
                <a href={`/dashboard/scans/${savedScanId ?? fsResult?.scanId}`} style={{
                  fontSize: 13, padding: "7px 14px", borderRadius: 8, textDecoration: "none",
                  background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`, fontWeight: 600,
                }}>
                  Vollständige Analyse →
                </a>
              )}
              {tab !== "fullsite" && <AutoPilotWidget url={url} type={tab} />}
              {/* Neu scannen — re-runs same URL with cache bypass */}
              <button
                onClick={handleForceRefresh}
                disabled={isForceRefreshing}
                style={{
                  fontSize: 13, color: C.blue, background: C.blueBg,
                  border: `1px solid ${C.blueBorder}`, borderRadius: 8,
                  cursor: isForceRefreshing ? "default" : "pointer",
                  padding: "7px 14px", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  opacity: isForceRefreshing ? 0.6 : 1,
                }}
              >
                <RefreshCw size={13} style={isForceRefreshing ? { animation: "wf-spin 1s linear infinite" } : undefined} />
                Neu scannen
              </button>
              <button onClick={resetState} style={{
                fontSize: 13, color: C.textSub, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", padding: "7px 14px",
              }}>
                Andere URL
              </button>
            </div>
          </div>

          {/* FULL-SITE result summary bar */}
          {tab === "fullsite" && fsResult && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10, marginBottom: 20,
            }}>
              {[
                { label: "Seiten analysiert", value: fsResult.totalPages, color: C.blue, bg: C.blueBg },
                { label: "Problemtypen", value: fsResult.issueCount,
                  color: fsResult.issueCount === 0 ? C.green : fsResult.issueCount <= 3 ? C.amber : C.red,
                  bg: fsResult.issueCount === 0 ? C.greenBg : fsResult.issueCount <= 3 ? C.amberBg : "#FEF2F2",
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg, borderRadius: 10, padding: "16px 20px", textAlign: "center",
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* WCAG violations — consulting cards */}
          {tab === "wcag" && wcagViolations.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {wcagViolations.length} Verstöße
                </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                {["critical","serious","moderate","minor"].map(p => {
                  const n = wcagViolations.filter(v => v.priority.toLowerCase() === p).length;
                  if (!n) return null;
                  const isHigh = p === "critical" || p === "serious";
                  return (
                    <span key={p} style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10,
                      background: isHigh ? "#FEF2F2" : "#FFFBEB",
                      color: isHigh ? C.red : C.amber,
                    }}>
                      {isHigh ? "🔴" : "🟡"} {n}
                    </span>
                  );
                })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {wcagViolations.map((v, i) => <WcagViolationCard key={i} v={v} i={i} />)}
              </div>
            </div>
          )}

          {/* WCAG — no violations */}
          {tab === "wcag" && wcagViolations.length === 0 && (
            <div style={{ padding: "28px", background: C.greenBg, border: "1px solid #A7F3D0", borderRadius: 12, marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.green }}>Keine WCAG-Verstöße gefunden</p>
            </div>
          )}

          {/* PERFORMANCE */}
          {tab === "performance" && perfData && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Performance",    value: perfData.scores.performance },
                  { label: "SEO",            value: perfData.scores.seo },
                  { label: "Accessibility",  value: perfData.scores.accessibility },
                  { label: "Best Practices", value: perfData.scores.bestPractices },
                ].map(s => {
                  const color = s.value >= 90 ? C.green : s.value >= 50 ? C.amber : C.red;
                  const bg = s.value >= 90 ? C.greenBg : s.value >= 50 ? C.amberBg : "#FEF2F2";
                  return (
                    <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px", textAlign: "center", boxShadow: C.shadow }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: `${color}20`, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.value}%`, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", boxShadow: C.shadow }}>
                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Core Web Vitals
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 16 }}>
                  {[
                    { label: "LCP", value: perfData.vitals.lcp },
                    { label: "CLS", value: perfData.vitals.cls },
                    { label: "TBT", value: perfData.vitals.tbt },
                    { label: "FCP", value: perfData.vitals.fcp },
                  ].map(v => (
                    <div key={v.label}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{v.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI DIAGNOSIS — ScoreCard with inline RefreshCw */}
          {(diagnose || fsResult?.diagnose) && (
            <ScoreCard
              title={tab === "fullsite" ? "KI Site-Report" : "KI-Analyse"}
              diagnose={diagnose || fsResult?.diagnose || ""}
              refreshing={isForceRefreshing}
              onRefresh={handleForceRefresh}
              url={url}
              totalPages={fsResult?.totalPages}
              issueCount={fsResult?.issueCount}
              scannedAt={cachedAt}
            />
          )}
        </div>
      )}
    </main>
  );
}
