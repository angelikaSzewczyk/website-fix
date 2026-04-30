"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import DiagnoseReport from "./diagnose-report";
import { isAgency, isAtLeastProfessional, normalizePlan, formatQuotaLimit, isUnlimitedQuota } from "@/lib/plans";

// ─── Dark glassmorphism tokens — matches free-dashboard-client ────────────────
const C = {
  page:        "#0b0c10",
  card:        "rgba(255,255,255,0.03)",
  cardSolid:   "#0f1623",
  border:      "rgba(255,255,255,0.07)",
  borderMid:   "rgba(255,255,255,0.11)",
  divider:     "rgba(255,255,255,0.06)",
  shadow:      "none",
  text:        "#ffffff",
  textSub:     "rgba(255,255,255,0.5)",
  textMuted:   "rgba(255,255,255,0.3)",
  blue:        "#007BFF",
  blueSoft:    "#7aa6ff",
  blueBg:      "rgba(0,123,255,0.08)",
  blueBorder:  "rgba(0,123,255,0.25)",
  blueGlow:    "0 2px 14px rgba(0,123,255,0.35)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.1)",
  greenBorder: "rgba(74,222,128,0.25)",
  greenDot:    "#4ade80",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.1)",
  amberBorder: "rgba(251,191,36,0.25)",
  red:         "#f87171",
  redBg:       "rgba(239,68,68,0.1)",
  redBorder:   "rgba(239,68,68,0.25)",
  radius:      14,
  radiusSm:    8,
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
      padding: "5px 10px", borderRadius: 6,
      border: `1px solid ${copied ? C.greenBorder : C.border}`,
      background: copied ? C.greenBg : "rgba(255,255,255,0.04)",
      color: copied ? C.green : C.textMuted,
      fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
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
      background: C.card,
      border: `1px solid rgba(${isRed ? "239,68,68" : "251,191,36"},0.2)`,
      borderRadius: C.radiusSm, overflow: "hidden",
    }}>
      <div style={{ height: 2, background: isRed ? `linear-gradient(90deg,${C.red},transparent)` : `linear-gradient(90deg,${C.amber},transparent)` }} />
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: isRed ? C.redBg : C.amberBg,
            color: isRed ? C.red : C.amber,
            border: `1px solid ${isRed ? C.redBorder : C.amberBorder}`,
            letterSpacing: "0.05em",
          }}>
            {info.label}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>#{i + 1}</span>
        </div>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
          {v.help}
        </h3>
        {v.nodeHtml && (
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Betroffenes Element
            </p>
            <div style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <code style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6, flex: 1 }}>
                  {v.nodeHtml}
                </code>
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
      borderRadius: C.radius, position: "relative", overflow: "hidden",
    }}>
      {refreshing && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "rgba(11,12,16,0.88)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          borderRadius: C.radius,
        }}>
          <RefreshCw size={22} color={C.blue} style={{ animation: "wf-spin 1s linear infinite" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text }}>Cache wird umgangen...</p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Starte Live-Analyse.</p>
          </div>
        </div>
      )}
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
            padding: "5px 12px", borderRadius: C.radiusSm,
            border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)",
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
        fontSize: 12, color: C.textSub, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: C.radiusSm, cursor: "pointer", padding: "7px 14px",
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
      background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: C.radiusSm,
      overflow: "hidden", minWidth: 200,
    }}>
      <div style={{
        padding: "7px 12px", borderBottom: `1px solid ${C.greenBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.greenDot, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Auto-Pilot · Aktiv</span>
        </div>
        <button onClick={() => setShowEdit(e => !e)} style={{
          fontSize: 11, color: C.blueSoft, background: "none", border: "none",
          cursor: "pointer", fontWeight: 600, padding: 0,
        }}>
          {showEdit ? "Fertig" : "Anpassen"}
        </button>
      </div>
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
              <select value={secInterval} onChange={e => setSecInterval(e.target.value as typeof secInterval)}
                style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 6px", color: C.text, background: C.cardSolid }}>
                <option value="täglich">Täglich</option>
                <option value="wöchentlich">Wöchentlich</option>
              </select>
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.textSub }}>
              Deep-Scan
              <select value={deepInterval} onChange={e => setDeepInterval(e.target.value as typeof deepInterval)}
                style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 6px", color: C.text, background: C.cardSolid }}>
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
  opportunities: {
    id?: string;
    title: string;
    displayValue?: string;
    score: number | null;
    /** KB-Ersparnis bei Byte-Saving-Audits (Unused CSS/JS, Bilder, Text-Compression). */
    kbSavings?: number | null;
  }[];
};

const SCAN_STEPS: Record<TabType, string[]> = {
  wcag:        ["Browser startet...", "Seite wird geladen...", "WCAG 2.1 Analyse läuft...", "Kontraste & Farben prüfen...", "KI erstellt Diagnose..."],
  performance: ["PageSpeed Insights wird abgefragt...", "Core Web Vitals werden analysiert...", "LCP / CLS / FID messen...", "KI erstellt Diagnose..."],
  website:     [
    "Website wird abgerufen...",
    "Sitemap & Robots.txt prüfen...",
    "Alt-Texte & Bildoptimierung analysieren...",
    "Header-Struktur (H1–H6) prüfen...",
    "Meta-Tags & SEO-Signale auswerten...",
    "Ladezeit & technische Parameter messen...",
    "KI erstellt Diagnose...",
  ],
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

// ── Plan-aware Upgrade-Hint für das Limit-Reached-Banner ────────────────────
// Pro hat schon Pro → "Professional aktivieren" wäre absurd. Agency hat keine
// höhere Stufe → kein CTA, nur Reset-Hinweis. Starter (oder unbekannt) sieht
// den klassischen Pro-Upsell.
type UpgradeHint = {
  ctaLabel: string | null;   // null → keinen CTA-Button rendern
  ctaHref:  string;
  bannerSuffix: string;
};
function upgradeHintFor(plan: string): UpgradeHint {
  const canonical = normalizePlan(plan);
  if (canonical === "agency") {
    return {
      ctaLabel: null,
      ctaHref:  "",
      bannerSuffix: "Ab dem 1. des nächsten Monats steht dein Kontingent wieder zur Verfügung.",
    };
  }
  if (canonical === "professional") {
    return {
      ctaLabel: "Auf Agency upgraden →",
      ctaHref:  "/fuer-agenturen#pricing",
      bannerSuffix: "Reset am 1. des nächsten Monats — oder jetzt auf Agency upgraden für 100 Scans/Monat.",
    };
  }
  // starter (oder Unknown-Fallback)
  return {
    ctaLabel: "Professional aktivieren →",
    ctaHref:  "/fuer-agenturen#pricing",
    bannerSuffix: "Reset am 1. des nächsten Monats — oder jetzt auf Professional upgraden für 25 Scans/Monat.",
  };
}

export default function DashboardScanClient({
  userName,
  plan,
  projectUrl = null,
  monthlyScans = 0,
  scanLimit = 3,
}: {
  userName: string;
  plan: string;
  projectUrl?: string | null;
  monthlyScans?: number;
  scanLimit?: number;
}) {
  // Hardcoded: alle Plans bekommen den Full-Site Deep-Scan (Pricing-konform).
  // Die anderen Modi (wcag/performance/website) sind code-mäßig noch
  // unterstützt — die Tabs sind nur UI-mäßig auf den Deep-Scan reduziert.
  // useState hält den Typ auf TabType (statt Literal "fullsite"), damit
  // bestehende `tab === "wcag"`-Branches type-safe bleiben.
  const [tab] = useState<TabType>("fullsite");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [scanStep, setScanStep] = useState(0);
  const scanStepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [diagnose, setDiagnose] = useState("");
  const [wcagViolations, setWcagViolations] = useState<{ priority: string; help: string; nodeHtml: string }[]>([]);
  const [perfData, setPerfData] = useState<PerfData | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [error, setError] = useState("");
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [dbIssueCount, setDbIssueCount] = useState<number | undefined>(undefined);

  // Full-site specific state
  const [fsProgress, setFsProgress] = useState<FullSiteProgress | null>(null);
  const [fsResult, setFsResult] = useState<FullSiteResult | null>(null);

  const [urlFocused, setUrlFocused] = useState(false);
  const [urlHint, setUrlHint]       = useState<"https" | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canonical         = normalizePlan(plan);
  const isAgencyPlan      = isAgency(plan);
  const isFullsiteEnabled = canonical !== null; // starter, professional, agency all have fullsite
  // Agency hat Anti-Abuse-Cap bei 500 — UI rendert "∞", limitReached wird für
  // unlimitierte Pläne nie true (selbst bei theoretischen 500 Scans bleibt
  // das Pill auf "∞"; Server würde an dem Punkt 429 zurückgeben).
  const isUnlimited       = isUnlimitedQuota(plan);
  const limitDisplay      = formatQuotaLimit(plan);
  const limitReached      = !isUnlimited && monthlyScans >= scanLimit;
  const upgrade           = upgradeHintFor(plan);

  // Page limit per canonical plan for full-site crawl
  const fullsitePageLimit =
    canonical === "starter"      ? 25
    : canonical === "professional" ? 100
    : canonical === "agency"     ? 500
    : 0;

  // Pre-fill the URL field on mount — query param takes priority, then projectUrl
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("url");
    if (queryUrl) {
      const full = queryUrl.startsWith("http") ? queryUrl : `https://${queryUrl}`;
      setUrl(full);
    } else if (projectUrl && !url) {
      setUrl(projectUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUrl]);

  function startRedirectCountdown() {
    setRedirectCountdown(5);
    countdownRef.current = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          window.location.href = "/dashboard?newScan=true";
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelRedirect() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRedirectCountdown(null);
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (scanStepRef.current) clearInterval(scanStepRef.current);
    };
  }, []);

  function resetState() {
    setState("idle"); setDiagnose(""); setError("");
    setWcagViolations([]); setPerfData(null); setUrl(""); setSavedScanId(null);
    setFsProgress(null); setFsResult(null); setFromCache(false); setCachedAt(null);
    setScanStep(0);
    if (scanStepRef.current) clearInterval(scanStepRef.current);
  }

  async function handleScan(e: React.FormEvent | null, forceRefresh = false) {
    if (e) e.preventDefault();
    if (!url || state === "scanning") return;

    if (tab === "fullsite") {
      handleFullSiteScan(forceRefresh);
      return;
    }

    setState("scanning");
    setScanStep(0);
    setDiagnose(""); setError(""); setWcagViolations([]); setPerfData(null);
    setSavedScanId(null); setFromCache(false); setCachedAt(null); setDbIssueCount(undefined);

    // Progressive step animation — advance every ~1.4 s, stop one before the last
    const steps = SCAN_STEPS[tab as Exclude<TabType, "fullsite">];
    if (scanStepRef.current) clearInterval(scanStepRef.current);
    scanStepRef.current = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 2) {
          if (scanStepRef.current) clearInterval(scanStepRef.current);
          return steps.length - 2;
        }
        return prev + 1;
      });
    }, 1400);

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
        if (typeof data.issueCount === "number") setDbIssueCount(data.issueCount);
        if (tab === "wcag") setWcagViolations(data.violations ?? []);
        if (tab === "performance") setPerfData({ scores: data.scores, vitals: data.vitals, opportunities: data.opportunities });
        if (data.scanId) setSavedScanId(data.scanId);
        if (scanStepRef.current) clearInterval(scanStepRef.current);
        setState("done");
        startRedirectCountdown();
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
      startRedirectCountdown();
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

  // Derived values
  const projectDomain = projectUrl
    ? projectUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;
  const scansRemaining = Math.max(0, scanLimit - monthlyScans);
  const buttonLabel = state === "scanning"
    ? "Scannt..."
    : projectUrl && url === projectUrl
      ? "Audit aktualisieren"
      : "Projekt-Audit starten (Deep-Scan)";

  // URL auto-correction on blur
  function handleUrlBlur() {
    setUrlFocused(false);
    if (!url) return;
    const trimmed = url.trim();
    if (trimmed && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrl(`https://${trimmed}`);
      setUrlHint("https");
      setTimeout(() => setUrlHint(null), 3000);
    }
  }

  const hasValidUrl = url.trim().length > 0 && state !== "scanning";


  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0c10", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes wf-spin        { to { transform: rotate(360deg); } }
        @keyframes wf-dot-pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wf-btn-glow    {
          0%,100% { box-shadow: 0 4px 20px rgba(0,123,255,0.45); }
          50%     { box-shadow: 0 4px 36px rgba(0,123,255,0.75), 0 0 0 4px rgba(0,123,255,0.12); }
        }
        @keyframes wf-radar-sweep { to { transform: rotate(360deg); } }
        @keyframes wf-radar-ping  {
          0%   { transform: scale(0.95); opacity: 0.5; }
          60%  { transform: scale(1.5);  opacity: 0.15; }
          100% { transform: scale(1.8);  opacity: 0; }
        }
        @keyframes wf-radar-blip  {
          0%,100% { opacity: 0; transform: scale(0.6); }
          50%     { opacity: 1; transform: scale(1); }
        }
        @keyframes wf-hint-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── MAIN CONTENT — sidebar rendered by dashboard layout.tsx ── */}
      <main style={{ flex: 1, minWidth: 0, maxWidth: "none" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 24px 80px" }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        {projectDomain ? (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Projekt-Analyse
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: C.text, letterSpacing: "-0.03em" }}>
              {projectDomain}
            </h1>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              {userName ? `${userName} — ` : ""}Scan
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: C.text, letterSpacing: "-0.03em" }}>
              Website scannen
            </h1>
          </>
        )}
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {projectDomain
            ? `Wähle einen Scan-Modus für dein aktives Projekt.`
            : "Wähle einen Scan-Modus und analysiere deine Ziel-URL in Echtzeit."}
        </p>
      </div>

      {/* ── SCAN COCKPIT CARD ───────────────────────────────── */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: "28px 28px 24px",
        marginBottom: 28,
      }}>

        {/* DEEP-SCAN HEADER — alle Plans bekommen den Full-Site-Crawl als
            Single-Mode (Pricing-konform: Starter inkl.). Kein Mode-Picker
            mehr — eine Audit-Tiefe für alle. */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 18,
          padding: "12px 16px", borderRadius: 10,
          background: "rgba(0,123,255,0.06)",
          border: `1px solid ${C.blueBorder}`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: C.blue, boxShadow: C.blueGlow,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
              Projekt-Audit (Deep-Scan)
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.55 }}>
              Crawlt alle Unterseiten via Sitemap und interne Links. Aggregierte Befunde, Performance-Metriken, Barrierefreiheits-Heuristik — komplettes Site-Audit in einem Lauf.
            </p>
          </div>
        </div>

        {/* Device toggle (performance only) — durch Single-Mode-Cleanup
            (Deep-Scan-only) faktisch unreachable, aber strukturell behalten
            falls die Modi später wieder per Setting freigeschaltet werden. */}
        {tab === "performance" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {(["mobile", "desktop"] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{
                padding: "6px 14px", borderRadius: C.radiusSm,
                border: `1px solid ${device === d ? C.blueBorder : C.border}`,
                background: device === d ? C.blueBg : "transparent",
                color: device === d ? C.blueSoft : C.textMuted,
                fontSize: 12, cursor: "pointer", fontWeight: device === d ? 700 : 400,
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              }}>
                {d === "mobile" ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Mobile</>
                ) : (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Desktop</>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Scan-limit indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>Scans diesen Monat:</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "2px 9px", borderRadius: 20,
              background: limitReached ? C.redBg : "rgba(255,255,255,0.05)",
              border: `1px solid ${limitReached ? C.redBorder : C.borderMid}`,
              color: limitReached ? C.red : C.textSub,
            }}>
              {monthlyScans} / {limitDisplay}{
                isUnlimited     ? " — Flatrate" :
                limitReached    ? " — Limit erreicht" :
                                  ` — ${scansRemaining} verbleibend`
              }
            </span>
          </div>
          {/* "Limit erhöhen"-Pill: Agency hat keine höhere Stufe, also kein
              CTA — sonst landet der User auf der Pricing-Page mit nichts zu
              kaufen. Pro/Starter sehen den Pill mit Plan-passendem Label. */}
          {limitReached && upgrade.ctaLabel && (
            <Link href={upgrade.ctaHref} style={{
              fontSize: 11, fontWeight: 700,
              padding: "4px 12px", borderRadius: C.radiusSm,
              background: C.blueBg, border: `1px solid ${C.blueBorder}`,
              color: C.blueSoft, textDecoration: "none",
            }}>
              Limit erhöhen →
            </Link>
          )}
        </div>

        {/* SCAN FORM */}
        {limitReached ? (
          <div style={{
            padding: "20px 24px", borderRadius: C.radiusSm,
            background: C.redBg, border: `1px solid ${C.redBorder}`,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={C.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.red }}>
                Scan-Limit für diesen Monat erreicht
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
                Du hast {scanLimit} von {scanLimit} Scans dieses Monats verbraucht. {upgrade.bannerSuffix}
              </p>
            </div>
            {upgrade.ctaLabel && (
              <Link href={upgrade.ctaHref} style={{
                flexShrink: 0, padding: "10px 20px", borderRadius: C.radiusSm,
                background: C.blue, color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,123,255,0.35)",
              }}>
                {upgrade.ctaLabel}
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleScan} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label htmlFor="dashboard-scan-url" className="sr-only">Website-URL</label>
              <input
                id="dashboard-scan-url"
                type="text" value={url}
                onChange={e => { setUrl(e.target.value); setUrlHint(null); }}
                placeholder="https://kunden-website.de"
                disabled={state === "scanning"}
                onFocus={() => setUrlFocused(true)}
                onBlur={handleUrlBlur}
                style={{
                  flex: 1, minWidth: 280,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${urlFocused ? C.blue : C.borderMid}`,
                  borderRadius: C.radiusSm,
                  padding: "12px 16px",
                  color: C.text, fontSize: 14, outline: "none",
                  boxShadow: urlFocused ? `0 0 0 3px rgba(0,123,255,0.18)` : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              />
              <button type="submit" disabled={state === "scanning" || !url} style={{
                padding: "12px 28px", borderRadius: C.radiusSm, border: "none",
                background: !url || state === "scanning" ? "rgba(255,255,255,0.06)" : C.blue,
                color: !url || state === "scanning" ? C.textMuted : "#fff",
                fontWeight: 700, fontSize: 14,
                cursor: !url || state === "scanning" ? "not-allowed" : "pointer",
                animation: hasValidUrl ? "wf-btn-glow 2s ease-in-out infinite" : "none",
                boxShadow: hasValidUrl ? "0 4px 20px rgba(0,123,255,0.45)" : "none",
                transition: "background 0.15s",
                fontFamily: "inherit",
              }}>
                {buttonLabel}
              </button>
            </div>
            {/* Soft URL hint */}
            {urlHint === "https" && (
              <p style={{
                margin: 0, fontSize: 11,
                color: C.amber,
                display: "flex", alignItems: "center", gap: 5,
                animation: "wf-hint-in 0.2s ease both",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
                </svg>
                https:// wurde automatisch ergänzt
              </p>
            )}
          </form>
        )}

      </div>

      {/* ── REDIRECT COUNTDOWN BANNER ──────────────────────── */}
      {redirectCountdown !== null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 22px", borderRadius: C.radiusSm, marginBottom: 24,
          background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.green }}>
              Scan abgeschlossen — Daten wurden gespeichert
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSub }}>
              Weiterleitung zum Dashboard in {redirectCountdown}s…
            </p>
          </div>
          <button
            onClick={() => { window.location.href = "/dashboard?newScan=true"; }}
            style={{
              flexShrink: 0, padding: "8px 18px", borderRadius: C.radiusSm,
              background: C.green, border: "none", color: "#0b0c10",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Jetzt zum Dashboard →
          </button>
          <button
            onClick={cancelRedirect}
            style={{
              flexShrink: 0, padding: "8px 14px", borderRadius: C.radiusSm,
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Hier bleiben
          </button>
        </div>
      )}

      {/* FULL-SITE: upgrade prompt — only for free users */}
      {tab === "fullsite" && !isFullsiteEnabled && (
        <div style={{
          padding: "24px 28px",
          background: "rgba(0,123,255,0.05)",
          border: `1px solid ${C.blueBorder}`,
          borderRadius: C.radius, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blueSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>
              Full-Site Crawl — ab Starter Plan
            </p>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
            Analysiere deine gesamte Website automatisch — alle Unterseiten, aggregierte Fehler, Seitentyp-Auswertung.
            Verfügbar ab dem Starter-Plan (25 Seiten) bis Agency Scale (500 Seiten).
          </p>
          <a href="/fuer-agenturen#pricing" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "9px 20px", borderRadius: C.radiusSm,
            background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13,
            textDecoration: "none", boxShadow: C.blueGlow,
          }}>
            Plan upgraden →
          </a>
        </div>
      )}

      {/* FULL-SITE: info banner for all paid users */}
      {tab === "fullsite" && isFullsiteEnabled && state === "idle" && (
        <div style={{
          padding: "14px 18px", background: C.blueBg, border: `1px solid ${C.blueBorder}`,
          borderRadius: C.radiusSm, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blueSoft}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
          </svg>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>
              Full-Site Crawl — crawlt alle Unterseiten automatisch
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
              Domain eingeben (z.B.{" "}
              <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>
                https://kundenwebsite.de
              </code>
              ). Crawler findet alle Seiten via Sitemap + interne Links.{" "}
              <strong style={{ color: C.blueSoft }}>
                Dein Plan erlaubt Scans bis zu {fullsitePageLimit} Seiten.
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* SCANNING STATE — Full-Site live progress */}
      {state === "scanning" && tab === "fullsite" && fsProgress && (
        <div style={{ padding: "24px 28px", background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, marginBottom: 24 }}>
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
                    fontSize: 10, color: isDone || isActive ? "#fff" : C.textMuted, fontWeight: 700,
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? C.text : isDone ? C.green : C.textMuted }}>
                    {ph === "crawling" ? "Crawlen" : ph === "analyzing" ? "Analysieren" : "KI-Report"}
                  </span>
                  {i < 2 && <span style={{ color: C.textMuted, fontSize: 14, marginLeft: 2 }}>›</span>}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px", background: C.blueBg, borderRadius: C.radiusSm, border: `1px solid ${C.blueBorder}`, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.blue, flexShrink: 0, animation: "wf-dot-pulse 1.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{fsProgress.message}</span>
            </div>
          </div>
          {fsProgress.phase === "crawling" && typeof fsProgress.found === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: C.blue, borderRadius: 2,
                  width: `${Math.min(100, (fsProgress.found / fullsitePageLimit) * 100)}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", fontWeight: 600 }}>{fsProgress.found} Seiten</span>
            </div>
          )}
        </div>
      )}

      {/* SCANNING STATE — radar animation + progressive steps */}
      {state === "scanning" && tab !== "fullsite" && (
        <div style={{
          padding: "32px 28px", background: C.card, border: `1px solid ${C.border}`,
          borderRadius: C.radius, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap",
        }}>
          {/* ── Radar ── */}
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, margin: "0 auto" }}>
            {/* Concentric rings */}
            {[120, 80, 44].map((size, ri) => (
              <div key={ri} style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: size, height: size,
                borderRadius: "50%",
                border: `1px solid rgba(0,123,255,${0.18 - ri * 0.04})`,
                transform: "translate(-50%,-50%)",
              }} />
            ))}
            {/* Ping ring */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 120, height: 120, borderRadius: "50%",
              border: "1px solid rgba(0,123,255,0.35)",
              transform: "translate(-50%,-50%)",
              animation: "wf-radar-ping 2.2s ease-out infinite",
            }} />
            {/* Sweep sector — conic gradient rotating */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 120, height: 120, borderRadius: "50%",
              background: "conic-gradient(from 0deg, rgba(0,123,255,0.0) 0deg, rgba(0,123,255,0.28) 70deg, rgba(0,123,255,0.0) 90deg)",
              transform: "translate(-50%,-50%)",
              animation: "wf-radar-sweep 2s linear infinite",
            }} />
            {/* Center dot */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 6, height: 6, borderRadius: "50%",
              background: C.blue,
              transform: "translate(-50%,-50%)",
              boxShadow: `0 0 8px ${C.blue}`,
            }} />
            {/* Blip dots at random positions */}
            {[
              { top: "22%", left: "60%", delay: "0.4s" },
              { top: "58%", left: "75%", delay: "1.1s" },
              { top: "70%", left: "32%", delay: "0.8s" },
              { top: "35%", left: "25%", delay: "1.6s" },
            ].map((blip, i) => (
              <div key={i} style={{
                position: "absolute",
                top: blip.top, left: blip.left,
                width: 4, height: 4, borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
                animation: `wf-radar-blip 2.2s ease-in-out ${blip.delay} infinite`,
              }} />
            ))}
          </div>

          {/* ── Steps list ── */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 9 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Analyse läuft
            </p>
            {SCAN_STEPS[tab as Exclude<TabType, "fullsite">].map((step, i) => {
              const isDone    = i < scanStep;
              const isCurrent = i === scanStep;
              const isFuture  = i > scanStep;
              return (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "center", fontSize: 12,
                  color: isDone ? C.green : isCurrent ? C.text : C.textMuted,
                  opacity: isFuture ? 0.3 : 1,
                  transition: "opacity 0.35s, color 0.35s",
                }}>
                  {isDone ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green}
                      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : isCurrent ? (
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", background: C.blue, flexShrink: 0,
                      animation: "wf-dot-pulse 1.2s ease-in-out infinite",
                      boxShadow: `0 0 6px ${C.blue}`,
                    }} />
                  ) : (
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textMuted, flexShrink: 0, opacity: 0.3 }} />
                  )}
                  <span style={{ fontWeight: isCurrent ? 600 : 400 }}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ERROR */}
      {state === "error" && (
        <div style={{ padding: "14px 18px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: C.radiusSm, marginBottom: 24 }}>
          <p style={{ margin: 0, color: C.red, fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* RESULTS */}
      {state === "done" && (
        <div>
          {/* Result header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.greenDot, flexShrink: 0, boxShadow: `0 0 0 3px rgba(74,222,128,0.2)` }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                {tab === "fullsite" ? "Full-Site Crawl abgeschlossen" : "Scan abgeschlossen"}
              </span>
              <span style={{ color: C.textMuted, fontSize: 13 }}>— {url}</span>
              {tab === "fullsite" && fsResult && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                  background: C.blueBg, color: C.blueSoft, border: `1px solid ${C.blueBorder}`,
                }}>
                  {fsResult.totalPages} Seiten · {fsResult.issueCount} Problemtypen
                </span>
              )}
              {fromCache && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                  background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}`,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  Gecacht{cachedAt ? ` · ${formatCacheAge(cachedAt)}` : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(savedScanId || fsResult?.scanId) && (
                <a href={`/dashboard/scans/${savedScanId ?? fsResult?.scanId}`} style={{
                  fontSize: 12, padding: "7px 14px", borderRadius: C.radiusSm, textDecoration: "none",
                  background: C.blueBg, color: C.blueSoft, border: `1px solid ${C.blueBorder}`, fontWeight: 600,
                }}>
                  Vollständige Analyse →
                </a>
              )}
              {tab !== "fullsite" && <AutoPilotWidget url={url} type={tab} />}
              <button
                onClick={handleForceRefresh}
                disabled={isForceRefreshing}
                style={{
                  fontSize: 12, color: C.blueSoft, background: C.blueBg,
                  border: `1px solid ${C.blueBorder}`, borderRadius: C.radiusSm,
                  cursor: isForceRefreshing ? "default" : "pointer",
                  padding: "7px 14px", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  opacity: isForceRefreshing ? 0.6 : 1, fontFamily: "inherit",
                }}
              >
                <RefreshCw size={12} style={isForceRefreshing ? { animation: "wf-spin 1s linear infinite" } : undefined} />
                Neu scannen
              </button>
              <button onClick={resetState} style={{
                fontSize: 12, color: C.textSub, background: "transparent",
                border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                cursor: "pointer", padding: "7px 14px", fontFamily: "inherit",
              }}>
                Andere URL
              </button>
            </div>
          </div>

          {/* FULL-SITE result summary bar */}
          {tab === "fullsite" && fsResult && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Seiten analysiert", value: fsResult.totalPages, color: C.blueSoft, bg: C.blueBg, border: C.blueBorder },
                { label: "Problemtypen", value: fsResult.issueCount,
                  color: fsResult.issueCount === 0 ? C.green : fsResult.issueCount <= 3 ? C.amber : C.red,
                  bg: fsResult.issueCount === 0 ? C.greenBg : fsResult.issueCount <= 3 ? C.amberBg : C.redBg,
                  border: fsResult.issueCount === 0 ? C.greenBorder : fsResult.issueCount <= 3 ? C.amberBorder : C.redBorder,
                },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: C.radiusSm, padding: "16px 20px", textAlign: "center", border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
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
                      fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                      background: isHigh ? C.redBg : C.amberBg,
                      color: isHigh ? C.red : C.amber,
                      border: `1px solid ${isHigh ? C.redBorder : C.amberBorder}`,
                    }}>
                      {n} {isHigh ? "Kritisch" : "Mittel"}
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
            <div style={{ padding: "28px", background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: C.radiusSm, marginBottom: 24, textAlign: "center" }}>
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
                  const bg = s.value >= 90 ? C.greenBg : s.value >= 50 ? C.amberBg : C.redBg;
                  return (
                    <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "18px", textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: `${color}20`, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.value}%`, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "20px 24px" }}>
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

              {/* Optimierungsmöglichkeiten — KB-Ersparnis bei Byte-Saving-Audits */}
              {perfData.opportunities.length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
                  <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Optimierungsmöglichkeiten
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {perfData.opportunities.map((opp, i) => (
                      <div key={opp.id ?? i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 8, background: C.cardSolid, border: `1px solid ${C.border}` }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{opp.title}</div>
                          {opp.displayValue && (
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{opp.displayValue}</div>
                          )}
                        </div>
                        {typeof opp.kbSavings === "number" && opp.kbSavings > 0 && (
                          <div style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amber, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                            −{opp.kbSavings} KB
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              issueCount={fsResult?.issueCount ?? dbIssueCount}
              scannedAt={cachedAt}
            />
          )}
        </div>
      )}
      </div>{/* inner padding wrapper */}
      </main>
    </div>
  );
}
