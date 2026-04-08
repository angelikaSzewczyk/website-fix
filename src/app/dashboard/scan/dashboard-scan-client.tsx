"use client";

import { useState } from "react";
import Link from "next/link";

function ScheduleButton({ url, type }: { url: string; type: string }) {
  const [saved, setSaved] = useState(false);
  async function handleSchedule() {
    await fetch("/api/scheduled-scans", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type, frequency: "weekly", notify_email: true }),
    });
    setSaved(true);
  }
  if (saved) return <span style={{ fontSize: 13, color: "#8df3d3" }}>Wöchentlicher Scan aktiviert</span>;
  return (
    <button onClick={handleSchedule} style={{
      fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
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

function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return <h3 key={i} style={{ fontSize: 15, margin: "20px 0 8px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>{line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#ff6b6b", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#ffd93d", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#8df3d3", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "4px 0", paddingLeft: 16, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>{line}</p>;
  });
}

const TABS: { key: TabType; label: string }[] = [
  { key: "website", label: "Website-Check" },
  { key: "wcag", label: "Barrierefreiheit" },
  { key: "performance", label: "Performance" },
];

const SCAN_STEPS: Record<TabType, string[]> = {
  wcag: ["Browser startet...", "Seite wird geladen...", "WCAG 2.1 Analyse läuft...", "KI erstellt Diagnose..."],
  performance: ["PageSpeed Insights wird abgefragt...", "Core Web Vitals werden analysiert...", "KI erstellt Diagnose..."],
  website: ["Website wird abgerufen...", "HTML wird analysiert...", "KI erstellt Diagnose..."],
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

  function resetState() {
    setState("idle"); setDiagnose(""); setError("");
    setWcagViolations([]); setPerfData(null); setUrl("");
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;
    setState("scanning");
    setDiagnose(""); setError(""); setWcagViolations([]); setPerfData(null);

    try {
      const endpoint = tab === "wcag" ? "/api/wcag-scan" : tab === "performance" ? "/api/performance-scan" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy: device }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDiagnose(data.diagnose ?? "");
        if (tab === "wcag") setWcagViolations(data.violations ?? []);
        if (tab === "performance") setPerfData({ scores: data.scores, vitals: data.vitals, opportunities: data.opportunities });
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
    <div>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            {userName ? `${userName} — ` : ""}KI-Diagnose
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Website scannen</h1>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); setState("idle"); setDiagnose(""); setError(""); }}
              style={{
                padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "#fff" : "rgba(255,255,255,0.35)",
                borderBottom: tab === t.key ? "2px solid #fff" : "2px solid transparent",
                marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* DEVICE TOGGLE */}
        {tab === "performance" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {(["mobile", "desktop"] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{
                padding: "6px 16px", borderRadius: 8, border: "1px solid",
                borderColor: device === d ? "rgba(255,217,61,0.3)" : "rgba(255,255,255,0.08)",
                background: device === d ? "rgba(255,217,61,0.06)" : "transparent",
                color: device === d ? "#ffd93d" : "rgba(255,255,255,0.35)",
                fontSize: 13, cursor: "pointer", fontWeight: device === d ? 600 : 400,
              }}>
                {d === "mobile" ? "Mobile" : "Desktop"}
              </button>
            ))}
          </div>
        )}

        {/* SCAN FORM */}
        <form onSubmit={handleScan} style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          <label htmlFor="dashboard-scan-url" className="sr-only">Website-URL</label>
          <input
            id="dashboard-scan-url"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://kunden-website.de"
            disabled={state === "scanning"}
            style={{
              flex: 1, minWidth: 280,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none",
            }}
          />
          <button type="submit" disabled={state === "scanning" || !url} style={{
            padding: "12px 24px", borderRadius: 10, border: "none",
            background: !url || state === "scanning" ? "rgba(255,255,255,0.1)" : "#fff",
            color: !url || state === "scanning" ? "rgba(255,255,255,0.3)" : "#0b0c10",
            fontWeight: 700, fontSize: 14, cursor: !url || state === "scanning" ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}>
            {state === "scanning" ? "Scannt..." : "Scan starten"}
          </button>
        </form>

        {/* SCANNING */}
        {state === "scanning" && (
          <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SCAN_STEPS[tab].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", flexShrink: 0 }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div style={{ padding: "14px 18px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, color: "#ff6b6b", fontSize: 14 }}>{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {state === "done" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8df3d3" }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Scan abgeschlossen</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>— {url}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <ScheduleButton url={url} type={tab} />
                <button onClick={resetState} style={{
                  fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
                }}>
                  Neuer Scan
                </button>
              </div>
            </div>

            {/* WCAG */}
            {tab === "wcag" && wcagViolations.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {wcagViolations.length} Verstöße gefunden
                </p>
                <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                  {wcagViolations.map((v, i) => (
                    <div key={i} style={{
                      padding: "14px 20px",
                      borderBottom: i < wcagViolations.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{v.priority} {v.help}</div>
                      {v.nodeHtml && (
                        <code style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 6, display: "block", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.nodeHtml}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PERFORMANCE */}
            {tab === "performance" && perfData && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Performance", value: perfData.scores.performance },
                    { label: "SEO", value: perfData.scores.seo },
                    { label: "Accessibility", value: perfData.scores.accessibility },
                    { label: "Best Practices", value: perfData.scores.bestPractices },
                  ].map(s => {
                    const color = s.value >= 90 ? "#8df3d3" : s.value >= 50 ? "#ffd93d" : "#ff6b6b";
                    return (
                      <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: 30, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Core Web Vitals</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
                    {[
                      { label: "LCP", value: perfData.vitals.lcp },
                      { label: "CLS", value: perfData.vitals.cls },
                      { label: "TBT", value: perfData.vitals.tbt },
                      { label: "FCP", value: perfData.vitals.fcp },
                    ].map(v => (
                      <div key={v.label}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{v.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI DIAGNOSE */}
            {diagnose && (
              <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                {renderDiagnose(diagnose)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
