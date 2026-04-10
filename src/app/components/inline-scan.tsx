"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ScanPhase = "idle" | "scanning" | "done" | "error";

const FREE_SCAN_KEY = "wf_free_scan_ts";
const FREE_SCAN_LIMIT_MS = 24 * 60 * 60 * 1000;
const MAX_FREE_PAGES = 25;

function formatTimeRemaining(nextMs: number): string {
  const remaining = nextMs - Date.now();
  if (remaining <= 0) return "0h";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export default function InlineScan({
  placeholder = "Deine Website-URL eingeben (z.B. https://deinewebsite.de)",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [error, setError] = useState("");
  const [crawlCounter, setCrawlCounter] = useState(0);
  const [activityFeed, setActivityFeed] = useState<{ level: string; msg: string; color: string }[]>([]);
  const [scanBlocked, setScanBlocked] = useState<{ blocked: boolean; nextMs: number }>({ blocked: false, nextMs: 0 });
  const [timeRemaining, setTimeRemaining] = useState("");

  const crawlIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── 24h gate check ────────────────────────────────────────
  useEffect(() => {
    try {
      const ts = localStorage.getItem(FREE_SCAN_KEY);
      if (ts) {
        const elapsed = Date.now() - parseInt(ts);
        if (elapsed < FREE_SCAN_LIMIT_MS) {
          const nextMs = parseInt(ts) + FREE_SCAN_LIMIT_MS;
          setScanBlocked({ blocked: true, nextMs });
          setTimeRemaining(formatTimeRemaining(nextMs));
        }
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  // ── Countdown refresh ─────────────────────────────────────
  useEffect(() => {
    if (!scanBlocked.blocked) return;
    const id = setInterval(() => {
      const remaining = scanBlocked.nextMs - Date.now();
      if (remaining <= 0) {
        setScanBlocked({ blocked: false, nextMs: 0 });
        clearInterval(id);
      } else {
        setTimeRemaining(formatTimeRemaining(scanBlocked.nextMs));
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [scanBlocked]);

  // ── Crawl counter during scan ─────────────────────────────
  useEffect(() => {
    if (phase === "scanning") {
      // Start counter after 12s (when step3 would begin)
      const startId = setTimeout(() => {
        setCrawlCounter(1);
        crawlIntervalRef.current = setInterval(() => {
          setCrawlCounter(prev => {
            if (prev >= MAX_FREE_PAGES) {
              if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
              return MAX_FREE_PAGES;
            }
            return prev + 1;
          });
        }, 400);
      }, 12_000);
      activityTimers.current.push(startId);
    } else {
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
      if (phase === "idle") setCrawlCounter(0);
    }
    return () => {
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    };
  }, [phase]);

  function startActivityFeed(scanUrl: string) {
    const domain = (() => { try { return new URL(scanUrl).hostname; } catch { return scanUrl; } })();
    const messages: { delay: number; level: string; msg: string; color: string }[] = [
      { delay: 1200,  level: "INFO",     color: "#8df3d3", msg: `HTTPS-Verbindung zu ${domain} hergestellt` },
      { delay: 3800,  level: "INFO",     color: "#8df3d3", msg: "Sitemap analysiert — interne Links gefunden" },
      { delay: 7000,  level: "LEGAL",    color: "#c084fc", msg: "BFSG-Dokumentation wird erstellt…" },
      { delay: 11500, level: "CRITICAL", color: "#ff6b6b", msg: `Barriere-Check: Formulare auf ${domain} werden geprüft` },
      { delay: 15000, level: "WARN",     color: "#fbbf24", msg: "Performance-Analyse: Ladezeit wird gemessen…" },
      { delay: 20000, level: "INFO",     color: "#7aa6ff", msg: "KI-Analyse gestartet — Befunde werden aggregiert…" },
    ];
    setActivityFeed([]);
    activityTimers.current.forEach(t => clearTimeout(t));
    activityTimers.current = messages.map(({ delay, level, msg, color }) =>
      setTimeout(() => setActivityFeed(prev => [...prev, { level, msg, color }]), delay)
    );
  }

  function cleanup() {
    if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    activityTimers.current.forEach(t => clearTimeout(t));
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || phase === "scanning" || scanBlocked.blocked) return;

    cleanup();
    setPhase("scanning");
    setError("");
    setActivityFeed([]);
    setCrawlCounter(0);
    startActivityFeed(url);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.success) {
        // Save 24h gate timestamp
        try { localStorage.setItem(FREE_SCAN_KEY, Date.now().toString()); } catch { /* ignore */ }

        // Store scan result for /scan/results
        try {
          const audit = data.scanData?.audit ?? {};
          sessionStorage.setItem("wf_scan_result", JSON.stringify({
            url,
            pages:                audit.gescannteSeiten ?? 1,
            unterseiten:          (audit.unterseiten ?? []).map((p: { url: string; erreichbar: boolean; altMissing: number; noindex: boolean }) => ({
              url: p.url, erreichbar: p.erreichbar, altMissing: p.altMissing, noindex: p.noindex,
            })),
            diagnose:             data.diagnose ?? "",
            https:                data.scanData?.https ?? true,
            brokenLinksCount:     audit.brokenLinks?.length ?? 0,
            altMissingCount:      audit.altTexte?.fehlend ?? 0,
            duplicateTitlesCount: audit.duplicateTitles?.length ?? 0,
            duplicateMetasCount:  audit.duplicateMetas?.length ?? 0,
            noIndex:              data.scanData?.indexierungGesperrt ?? false,
            hasTitle:             !!data.scanData?.title,
            hasMeta:              !!data.scanData?.metaDescription,
            hasH1:                !!data.scanData?.h1,
            hasSitemap:           data.scanData?.sitemapVorhanden ?? false,
            robotsBlocked:        data.scanData?.robotsBlockiertAlles ?? false,
            hasUnreachable:       (audit.unterseiten ?? []).some((p: { erreichbar: boolean }) => !p.erreichbar),
          }));
        } catch { /* sessionStorage not available */ }

        setPhase("done");
        // Brief pause to let "done" register, then redirect to results
        setTimeout(() => {
          router.push(`/scan/results?url=${encodeURIComponent(url)}`);
        }, 600);
      } else {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        setPhase("error");
      }
    } catch {
      cleanup();
      setError("Verbindungsfehler. Bitte versuche es erneut.");
      setPhase("error");
    }
  }

  function reset() {
    cleanup();
    setPhase("idle");
    setUrl("");
    setError("");
    setCrawlCounter(0);
    setActivityFeed([]);
  }

  const isScanning = phase === "scanning";

  // ── 24h blocked state ─────────────────────────────────────
  if (scanBlocked.blocked) {
    return (
      <div style={{
        padding: "18px 22px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
          ⏱ Limit erreicht.
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Nächster freier Scan in{" "}
          <span style={{ color: "#8df3d3", fontWeight: 700 }}>{timeRemaining}</span>
        </p>
        <a href="/register" style={{
          display: "inline-block", padding: "9px 20px", borderRadius: 9,
          background: "linear-gradient(90deg, #007BFF, #0057b8)",
          color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
        }}>
          Unbegrenzt scannen mit Pro →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* ── Input form ── */}
      {!isScanning && phase !== "done" && (
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
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#fff", fontSize: 15, padding: "10px 8px", minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={!url}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                background: !url ? "rgba(37,99,235,0.4)" : "#2563EB",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "11px 20px", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
                cursor: !url ? "default" : "pointer", transition: "background 0.15s",
              }}
            >
              Einmaligen Gratis-Deep-Scan starten
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          {/* Trust chips */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            {["Prüft bis zu 25 Unterseiten", "Inkl. BFSG-Check", "Keine Anmeldung"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </form>
      )}

      {/* ── Scanning state ── */}
      {isScanning && (
        <div style={{ marginTop: 8 }}>
          {/* Header */}
          <div style={{
            padding: "12px 18px", borderRadius: "12px 12px 0 0",
            background: "rgba(0,123,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#007BFF", flexShrink: 0,
              boxShadow: "0 0 7px #007BFF",
              animation: "wf-pulse-dot 1.5s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Deep Scan aktiv — {url}
            </span>
          </div>

          {/* Steps */}
          <div style={{
            padding: "16px 18px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "none",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {[
              { label: "Crawl gestartet", done: true },
              { label: "Sitemap & Links analysiert", done: true },
              { label: crawlCounter > 0 ? `Analysiere Seite ${crawlCounter} von ${MAX_FREE_PAGES}…` : "Unterseiten werden geprüft…", done: false, active: true },
              { label: "KI-Diagnose wird erstellt…", done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: step.done ? "rgba(141,243,211,0.15)" : step.active ? "rgba(0,123,255,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${step.done ? "#8df3d3" : step.active ? "#007BFF" : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.done ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : step.active ? (
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#007BFF", animation: "wf-pulse-dot 1.2s ease-in-out infinite" }} />
                  ) : null}
                </div>
                <span style={{
                  color: step.done ? "#8df3d3" : step.active ? "#fff" : "rgba(255,255,255,0.25)",
                  fontWeight: step.active ? 600 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          {activityFeed.length > 0 && (
            <div style={{
              padding: "10px 18px",
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              display: "flex", flexDirection: "column", gap: 6,
              fontFamily: "monospace",
            }}>
              {activityFeed.map((entry, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 10 }}>
                  <span style={{
                    flexShrink: 0, padding: "1px 5px", borderRadius: 3,
                    background: `${entry.color}15`, border: `1px solid ${entry.color}30`,
                    color: entry.color, fontWeight: 700, letterSpacing: "0.04em",
                  }}>
                    {entry.level}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Done flash (briefly shown before redirect) ── */}
      {phase === "done" && (
        <div style={{
          padding: "16px 18px", borderRadius: 12,
          background: "rgba(141,243,211,0.06)",
          border: "1px solid rgba(141,243,211,0.2)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#8df3d3", boxShadow: "0 0 6px #8df3d3", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Scan abgeschlossen — Ergebnisse werden geladen…</span>
        </div>
      )}

      {/* ── Error ── */}
      {phase === "error" && (
        <div style={{ marginTop: 12, padding: "14px 18px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10 }}>
          <p style={{ margin: "0 0 10px", color: "#ff6b6b", fontSize: 14 }}>{error}</p>
          <button
            onClick={reset}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, cursor: "pointer", padding: "6px 14px" }}
          >
            Erneut versuchen
          </button>
        </div>
      )}

      <style>{`
        @keyframes wf-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
