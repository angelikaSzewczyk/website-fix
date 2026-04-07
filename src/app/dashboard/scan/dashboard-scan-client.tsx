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
  if (saved) return <span style={{ fontSize: 13, color: "#8df3d3", padding: "6px 0" }}>✓ Wöchentlicher Scan aktiviert</span>;
  return (
    <button onClick={handleSchedule} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", padding: "6px 14px" }}>
      🔁 Wöchentlich automatisch scannen
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
      return <h3 key={i} style={{ fontSize: 16, margin: "20px 0 8px", fontWeight: 700, color: "#fff" }}>{line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("**🔴")) {
      return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 700, color: "#ff6b6b", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.startsWith("**🟡")) {
      return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 700, color: "#ffd93d", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.startsWith("**🟢")) {
      return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 700, color: "#8df3d3", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    }
    if (line.match(/^\d+\./)) {
      return <div key={i} style={{ margin: "4px 0", paddingLeft: 16, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{line}</div>;
    }
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>{line}</p>;
  });
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

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;
    setState("scanning");
    setDiagnose("");
    setError("");
    setWcagViolations([]);
    setPerfData(null);

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
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              ← Dashboard
            </Link>
            <span style={{
              padding: "4px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600,
              background: plan === "agentur" ? "rgba(122,166,255,0.1)" : "rgba(141,243,211,0.1)",
              color: plan === "agentur" ? "#7aa6ff" : "#8df3d3",
              border: `1px solid ${plan === "agentur" ? "rgba(122,166,255,0.2)" : "rgba(141,243,211,0.2)"}`,
            }}>
              {plan === "agentur" ? "Agentur" : plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {userName ? `Hallo ${userName} —` : ""} Website scannen
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            KI-Diagnose
          </h1>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, maxWidth: 520 }}>
          {([
            { key: "website" as TabType, label: "🔍 Website-Check" },
            { key: "wcag" as TabType, label: "♿ Barrierefreiheit" },
            { key: "performance" as TabType, label: "⚡ Performance" },
          ]).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setState("idle"); setDiagnose(""); setError(""); }}
              style={{
                flex: 1, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                fontWeight: tab === t.key ? 650 : 400,
                background: tab === t.key ? "rgba(141,243,211,0.1)" : "transparent",
                color: tab === t.key ? "#8df3d3" : "rgba(255,255,255,0.45)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* DEVICE TOGGLE — nur bei Performance */}
        {tab === "performance" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["mobile", "desktop"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)} style={{
                padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                fontWeight: device === d ? 650 : 400,
                background: device === d ? "rgba(255,217,61,0.12)" : "rgba(255,255,255,0.04)",
                color: device === d ? "#ffd93d" : "rgba(255,255,255,0.4)",
              }}>
                {d === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
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
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://kunden-website.de"
            disabled={state === "scanning"}
            style={{
              flex: 1, minWidth: 280,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "13px 18px", color: "#fff", fontSize: 15, outline: "none",
            }}
          />
          <button type="submit" disabled={state === "scanning" || !url}
            style={{
              padding: "13px 28px", borderRadius: 10, border: "none", cursor: state === "scanning" || !url ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", color: "#0b0c10",
              fontWeight: 700, fontSize: 14, opacity: !url ? 0.5 : 1,
            }}>
            {state === "scanning" ? "Scannt..." : "Scan starten"}
          </button>
        </form>

        {/* SCANNING */}
        {state === "scanning" && (
          <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(tab === "wcag"
                ? ["Browser startet...", "Seite laden und JavaScript ausführen...", "axe-core WCAG 2.1 Analyse...", "KI erstellt Diagnose..."]
                : tab === "performance"
                ? ["Google PageSpeed Insights wird abgefragt...", "Core Web Vitals analysieren...", "KI erstellt Diagnose..."]
                : ["Website abrufen...", "HTML analysieren: Title, Meta, H1, robots.txt...", "KI erstellt Diagnose..."]
              ).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                  <span style={{ color: "#8df3d3", fontSize: 16 }}>⟳</span> {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div style={{ padding: "16px 20px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, color: "#ff6b6b", fontSize: 14 }}>{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {state === "done" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#8df3d3", fontSize: 18 }}>✓</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Scan abgeschlossen</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>— {url}</span>
              </div>
              <button onClick={() => { setState("idle"); setDiagnose(""); setWcagViolations([]); setUrl(""); setPerfData(null); }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", padding: "6px 14px" }}>
                Neuer Scan
              </button>
              <ScheduleButton url={url} type={tab} />
            </div>

            {/* WCAG violations list */}
            {tab === "wcag" && wcagViolations.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {wcagViolations.length} Verstöße gefunden
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wcagViolations.map((v, i) => (
                    <div key={i} style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{v.priority} {v.help}</div>
                      {v.nodeHtml && (
                        <code style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, display: "block", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.nodeHtml}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Scores */}
            {tab === "performance" && perfData && (
              <div style={{ marginBottom: 24 }}>
                {/* Score Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Performance", value: perfData.scores.performance },
                    { label: "SEO", value: perfData.scores.seo },
                    { label: "Accessibility", value: perfData.scores.accessibility },
                    { label: "Best Practices", value: perfData.scores.bestPractices },
                  ].map((s) => {
                    const color = s.value >= 90 ? "#8df3d3" : s.value >= 50 ? "#ffd93d" : "#ff6b6b";
                    return (
                      <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Core Web Vitals */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 650, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Core Web Vitals</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                    {[
                      { label: "LCP", value: perfData.vitals.lcp },
                      { label: "CLS", value: perfData.vitals.cls },
                      { label: "TBT", value: perfData.vitals.tbt },
                      { label: "FCP", value: perfData.vitals.fcp },
                    ].map((v) => (
                      <div key={v.label}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{v.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Diagnose */}
            {diagnose && (
              <div style={{ padding: "28px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                {renderDiagnose(diagnose)}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
