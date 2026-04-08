"use client";

import { useState } from "react";
import Link from "next/link";

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

function ScheduleButton({ url, type }: { url: string; type: string }) {
  const [saved, setSaved] = useState(false);
  async function go() {
    await fetch("/api/scheduled-scans", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type, frequency: "weekly", notify_email: true }),
    });
    setSaved(true);
  }
  if (saved) return <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Wöchentlich aktiviert</span>;
  return (
    <button onClick={go} style={{
      fontSize: 13, color: C.textSub, background: C.card,
      border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", padding: "7px 14px",
    }}>
      Wöchentlich wiederholen
    </button>
  );
}

type ScanState = "idle" | "scanning" | "done" | "error";
type TabType = "website" | "wcag" | "performance";

type PerfData = {
  scores: { performance: number; accessibility: number; seo: number; bestPractices: number };
  vitals: { lcp: string; cls: string; tbt: string; fcp: string; si: string };
  opportunities: { title: string; displayValue?: string; score: number | null }[];
};

const TABS: { key: TabType; label: string }[] = [
  { key: "website", label: "Website-Check" },
  { key: "wcag",    label: "Barrierefreiheit" },
  { key: "performance", label: "Performance" },
];

const SCAN_STEPS: Record<TabType, string[]> = {
  wcag:        ["Browser startet...", "Seite wird geladen...", "WCAG 2.1 Analyse läuft...", "KI erstellt Diagnose..."],
  performance: ["PageSpeed Insights wird abgefragt...", "Core Web Vitals werden analysiert...", "KI erstellt Diagnose..."],
  website:     ["Website wird abgerufen...", "HTML wird analysiert...", "KI erstellt Diagnose..."],
};

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

  function resetState() {
    setState("idle"); setDiagnose(""); setError("");
    setWcagViolations([]); setPerfData(null); setUrl(""); setSavedScanId(null);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;
    setState("scanning");
    setDiagnose(""); setError(""); setWcagViolations([]); setPerfData(null); setSavedScanId(null);

    try {
      const endpoint = tab === "wcag" ? "/api/wcag-scan" : tab === "performance" ? "/api/performance-scan" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy: device }), credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDiagnose(data.diagnose ?? "");
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
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setState("idle"); setDiagnose(""); setError(""); }}
            style={{
              padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? C.blue : C.textMuted,
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.1s",
            }}>
            {t.label}
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

      {/* SCANNING STATE */}
      {state === "scanning" && (
        <div style={{ padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 24, boxShadow: C.shadow }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SCAN_STEPS[tab].map((step, i) => (
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.greenDot }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Scan abgeschlossen</span>
              <span style={{ color: C.textMuted, fontSize: 13 }}>— {url}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {savedScanId && (
                <a href={`/dashboard/scans/${savedScanId}`} style={{
                  fontSize: 13, padding: "7px 14px", borderRadius: 8, textDecoration: "none",
                  background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`, fontWeight: 600,
                }}>
                  Vollständige Analyse →
                </a>
              )}
              <ScheduleButton url={url} type={tab} />
              <button onClick={resetState} style={{
                fontSize: 13, color: C.textSub, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", padding: "7px 14px",
              }}>
                Neuer Scan
              </button>
            </div>
          </div>

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

          {/* AI DIAGNOSIS */}
          {diagnose && (
            <div style={{ padding: "24px 28px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                KI-Analyse
              </p>
              {renderDiagnoseLight(diagnose)}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
