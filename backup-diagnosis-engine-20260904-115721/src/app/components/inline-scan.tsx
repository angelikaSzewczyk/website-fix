"use client";

import { useState, useEffect, useRef } from "react";
import { saveScanToStorage } from "@/lib/scan-storage";
import { isScanBlocked, recordScan, recordRateLimit, formatTimeRemaining as fmtScanGate, FREE_SCAN_LIMIT_MS } from "@/lib/scan-gate";

type ScanPhase = "idle" | "scanning" | "done" | "error" | "not_wordpress";

// Timing constants for the crawl animation
const SETUP_DELAY_MS = 3_000;  // before first page check
const STEP_DELAY_MS  = 1_500;  // per discovered page
const AI_DELAY_MS    = 1_500;  // after last page, before AI message

function getHostname(u: string): string {
  try { return new URL(u).hostname; } catch { return u; }
}
function getPathname(u: string): string {
  try { const p = new URL(u).pathname; return p === "/" ? "(Startseite)" : p; } catch { return u; }
}

// formatTimeRemaining ist jetzt in lib/scan-gate.ts zentralisiert (fmtScanGate-Alias).

export default function InlineScan({
  placeholder = "https://deine-website.de",
}: {
  placeholder?: string;
}) {
  const [url, setUrl]                   = useState("");
  const [phase, setPhase]               = useState<ScanPhase>("idle");
  const [error, setError]               = useState("");
  const [crawlCounter, setCrawlCounter] = useState(0);
  const [activityFeed, setActivityFeed] = useState<{ level: string; msg: string; color: string }[]>([]);
  const [scanBlocked, setScanBlocked]   = useState<{ blocked: boolean; nextMs: number }>({ blocked: false, nextMs: 0 });
  const [timeRemaining, setTimeRemaining] = useState("");
  const [notifyNextJs, setNotifyNextJs] = useState(false);
  const [showSystemInput, setShowSystemInput] = useState(false);
  const [systemInput, setSystemInput]   = useState("");
  const [mounted, setMounted]           = useState(false);

  const crawlIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityTimers    = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Stores the redirect URL when API returns before animation finishes
  const pendingRedirectRef  = useRef<string | null>(null);
  const scanStartRef        = useRef<number>(0);
  // Real discovered page count — set once /api/scan/discover returns
  const pageTotalRef        = useRef<number | null>(null);

  // ── 24h gate auf mount: Per-URL — Inline-Scan kennt die URL noch nicht,
  // also nur Legacy-Globalblock prüfen (rec.url === "*" für alte Einträge).
  useEffect(() => {
    const gate = isScanBlocked();
    if (gate.blocked) {
      setScanBlocked({ blocked: true, nextMs: gate.nextMs });
      setTimeRemaining(fmtScanGate(gate.nextMs));
    }
    setMounted(true);
  }, []);

  // ── Countdown refresh ──────────────────────────────────────
  useEffect(() => {
    if (!scanBlocked.blocked) return;
    const id = setInterval(() => {
      const remaining = scanBlocked.nextMs - Date.now();
      if (remaining <= 0) {
        setScanBlocked({ blocked: false, nextMs: 0 });
        clearInterval(id);
      } else {
        setTimeRemaining(fmtScanGate(scanBlocked.nextMs));
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [scanBlocked]);

  // ── Crawl counter — starts after SETUP_DELAY_MS, waits for real page count ──
  useEffect(() => {
    if (phase !== "scanning") {
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
      if (phase === "idle") setCrawlCounter(0);
      return;
    }

    let cancelled = false;

    // After setup delay, wait for discover to return, then count up to real page total
    const outerTimer = setTimeout(() => {
      if (cancelled) return;

      const tryStart = () => {
        if (cancelled) return;
        const total = pageTotalRef.current;

        if (total === null) {
          // Discover not back yet — poll every 150ms
          setTimeout(tryStart, 150);
          return;
        }

        if (total === 0) {
          // No subpages — animation is just setup + AI message; fire redirect when ready
          const waitId = setTimeout(() => {
            if (pendingRedirectRef.current) {
              const target = pendingRedirectRef.current;
              pendingRedirectRef.current = null;
              setTimeout(() => { window.location.href = target; }, 800);
            }
          }, AI_DELAY_MS + 800);
          activityTimers.current.push(waitId);
          return;
        }

        setCrawlCounter(1);
        crawlIntervalRef.current = setInterval(() => {
          setCrawlCounter(prev => {
            const max = pageTotalRef.current ?? 1;
            if (prev >= max) {
              if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
              if (pendingRedirectRef.current) {
                const target = pendingRedirectRef.current;
                pendingRedirectRef.current = null;
                setTimeout(() => { window.location.href = target; }, 800);
              }
              return max;
            }
            return prev + 1;
          });
        }, STEP_DELAY_MS);
      };

      tryStart();
    }, SETUP_DELAY_MS);

    activityTimers.current.push(outerTimer);
    return () => {
      cancelled = true;
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    };
  }, [phase]);

  function scheduleMessage(delay: number, level: string, color: string, msg: string) {
    const t = setTimeout(() => setActivityFeed(prev => [...prev, { level, msg, color }]), delay);
    activityTimers.current.push(t);
  }

  function startSetupMessages(scanUrl: string) {
  const domain = getHostname(scanUrl);

  scheduleMessage(
    400,
    "SYSTEM",
    "#8b95a5",
    "Verbindung wird aufgebaut…"
  );

  scheduleMessage(
    1_400,
    "OK",
    "#22c55e",
    `${domain} erreichbar`
  );

  scheduleMessage(
    2_400,
    "INFO",
    "#8b95a5",
    "Sitemap und interne Links werden erfasst…"
  );
}

  function startPageMessages(urls: string[]) {
    const elapsed  = Date.now() - scanStartRef.current;
    const baseDelay = Math.max(0, SETUP_DELAY_MS - elapsed);

    if (urls.length === 0) {
      scheduleMessage(
        baseDelay + 300,
        "INFO", "#8df3d3",
        "Keine weiteren Unterseiten gefunden — Snapshot-Analyse der Startseite abgeschlossen."
      );
      scheduleMessage(
        baseDelay + 300 + AI_DELAY_MS,
        "AI", "#c084fc",
        "KI-Analyse gestartet — Befunde werden aggregiert…"
      );
      return;
    }

    urls.forEach((pageUrl, i) => {
      scheduleMessage(
        baseDelay + i * STEP_DELAY_MS,
        "INFO", "#8df3d3",
        `Prüfe URL ${i + 1}/${urls.length}: ${pageUrl}…`
      );
    });

    // AI message after all pages
    scheduleMessage(
  baseDelay + urls.length * STEP_DELAY_MS + AI_DELAY_MS,
  "INFO",
  "#8b95a5",
  "Technische Befunde werden zusammengeführt…"
);
  }

  function cleanup() {
    if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    activityTimers.current.forEach(t => clearTimeout(t));
    activityTimers.current = [];
    pendingRedirectRef.current = null;
    pageTotalRef.current = null;
  }

  // Called when API returns successfully — delays redirect until animation is done
  function scheduleRedirect(href: string) {
    const elapsed  = Date.now() - scanStartRef.current;
    const pageCount = pageTotalRef.current ?? 10;
    const totalAnim = SETUP_DELAY_MS + pageCount * STEP_DELAY_MS + AI_DELAY_MS + 800;
    const remaining = totalAnim - elapsed;

    if (remaining <= 0) {
      // Animation already done — redirect immediately
      setPhase("done");
      setTimeout(() => { window.location.href = href; }, 600);
    } else {
      // Store redirect URL; crawl counter effect fires it when counter hits MAX_FREE_PAGES
      pendingRedirectRef.current = href;
      // Fallback: guarantee redirect after totalAnim regardless
      setTimeout(() => {
        if (pendingRedirectRef.current === href) {
          pendingRedirectRef.current = null;
          setPhase("done");
          setTimeout(() => { window.location.href = href; }, 600);
        }
      }, remaining + 200);
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || phase === "scanning") return;

    // URL-spezifischer Gate-Check — andere URLs dürfen weiter gescannt werden.
    const gate = isScanBlocked(url);
    if (gate.blocked) {
      setScanBlocked({ blocked: true, nextMs: gate.nextMs });
      setTimeRemaining(fmtScanGate(gate.nextMs));
      return;
    }
    if (scanBlocked.blocked && !gate.blocked) {
      setScanBlocked({ blocked: false, nextMs: 0 });
    }

    cleanup();
    pageTotalRef.current = null;  // reset discover state
    scanStartRef.current = Date.now();
    setPhase("scanning");
    setError("");
    setActivityFeed([]);
    setCrawlCounter(0);
    startSetupMessages(url);

    // ── Parallel: discover real URLs + full scan ──────────────
    // Discover fires first (~1-2s), populates activity feed with real URLs
    fetch("/api/scan/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then(r => r.json())
      .then((d: { urls?: string[]; count?: number }) => {
        const urls = d.urls ?? [];
        pageTotalRef.current = urls.length + 1;  // +1 for homepage
        startPageMessages([url, ...urls]);  // homepage first
      })
      .catch(() => {
        pageTotalRef.current = 0;
        startPageMessages([]);
      });

    try {
      const res  = await fetch("/api/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.success) {
        // Per-URL Gate-Eintrag schreiben — andere URLs bleiben scanbar.
        // setScanBlocked NICHT hier setzen — phase ist noch "scanning",
        // wir wollen das Block-Panel erst beim nächsten Mount zeigen.
        recordScan(url);

        // Store scan result for /scan/results (canonical writer)
        saveScanToStorage(url, data);

        // Delay redirect until crawl animation finishes
        scheduleRedirect(`/scan/results?url=${encodeURIComponent(url)}`);

      } else if (data.errorCode === "RATE_LIMITED") {
        cleanup();
        const now   = Date.now();
        const nextMs = data.retryAfterMs ? now + data.retryAfterMs : now + FREE_SCAN_LIMIT_MS;
        recordRateLimit(url, nextMs);
        // Phase → idle FIRST, then set blocked — so the panel only renders in idle
        setPhase("idle");
        setScanBlocked({ blocked: true, nextMs });
        setTimeRemaining(fmtScanGate(nextMs));

      } else if (data.errorCode === "ERR_NOT_WORDPRESS") {
        cleanup();
        setPhase("not_wordpress");
      } else if (data.errorCode === "SITE_UNREACHABLE") {
        cleanup();
        setError("Diese Website konnte nicht erreicht werden. Bitte prüfe die URL auf Tippfehler.");
        setPhase("error");
      } else {
        cleanup();
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
    setNotifyNextJs(false);
    setShowSystemInput(false);
    setSystemInput("");
  }

  const isScanning = phase === "scanning";

  // ── 24h blocked — only render when idle (prevents flash during active scan) ──
  if (!mounted) return <div style={{ height: 72 }} />;
  if (scanBlocked.blocked && phase === "idle") {
    return (
      <div style={{
        padding: "34px 28px 28px",
        background: "rgba(10,8,18,0.72)",
        border: "1px solid rgba(139,92,246,0.22)",
        borderRadius: 18,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(139,92,246,0.10), inset 0 1px 0 rgba(139,92,246,0.12)",
      }}>
        {/* Purple glow orb */}
        <div style={{
          position: "absolute", top: -60, left: "50%",
          transform: "translateX(-50%)",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Shield icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "rgba(139,92,246,0.10)",
          border: "1px solid rgba(139,92,246,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 0 22px rgba(139,92,246,0.22)",
        }}>
        </div>

        <div style={{
          fontSize: 16, fontWeight: 800, color: "#fff",
          letterSpacing: "-0.3px", marginBottom: 8, lineHeight: 1.3,
        }}>
          Gast-Limit erreicht
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, marginBottom: 22 }}>
          Sichere dir jetzt vollen Zugriff auf alle Reports<br/>
          und den Smart-Fix Guide.
        </div>

        <a href="/#pricing" className="wf-scan-limit-cta" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 26px", borderRadius: 11,
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          boxShadow: "0 6px 28px rgba(124,58,237,0.45), 0 0 0 1px rgba(139,92,246,0.3)",
          marginBottom: 18,
          letterSpacing: "-0.1px",
          transition: "box-shadow 0.2s, transform 0.15s",
        }}>
          Report sichern &amp; optimieren →
        </a>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 20, marginBottom: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.25)",
            fontVariantNumeric: "tabular-nums", fontWeight: 500,
          }}>
            Freigabe in {timeRemaining}
          </span>
        </div>

        <div>
          <a href="/login" style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            cursor: "pointer",
          }}>
            Bereits Kunde? <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Hier anmelden</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Input form ── */}
      {!isScanning && phase !== "done" && (
        <form onSubmit={handleScan} style={{ position: "relative" }}>
          <label htmlFor="inline-scan-url" className="sr-only">Website-URL eingeben</label>
          <div className="wf-scan-form">

  <input
    id="inline-scan-url"
    type="text"
    inputMode="url"
    autoComplete="url"
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder={placeholder}
    className="wf-scan-input"
  />

  <button
    type="submit"
    disabled={!url}
    className="wf-scan-btn"
  >
    Website prüfen →
  </button>
</div>

<div className="wf-scan-meta">
  <span>Kostenloser Erstcheck</span>
  <span className="wf-scan-meta-dot" />
  <span>Kein Login erforderlich</span>
  <span className="wf-scan-meta-dot" />
  <span>Keine Änderungen an deiner Website</span>
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
              Website wird geprüft — {getHostname(url)}
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
              { label: "Website erreichbar", done: true },
              { label: "Seitenstruktur erfasst", done: true },
              {
                label: crawlCounter > 0 && pageTotalRef.current
                  ? `Prüfe Seite ${crawlCounter} von ${pageTotalRef.current}`
                  : crawlCounter > 0
                  ? `Prüfe Seite ${crawlCounter}`
                  : "Technische Signale werden geprüft",
                done: false,
                active: true,
              },
              { label: "Befunde zusammenführen", done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: step.done ? "rgba(141,243,211,0.15)" : step.active ? "rgba(0,123,255,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${step.done ? "#8df3d3" : step.active ? "#007BFF" : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.done ? (
                    <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1, color: "#8df3d3", fontWeight: 800 }}>✓</span>
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

          {/* Activity feed — step-by-step page checks */}
          {activityFeed.length > 0 && (
            <div style={{
              padding: "10px 18px",
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              display: "flex", flexDirection: "column", gap: 6,
              fontFamily: "monospace",
              maxHeight: 220,
              overflowY: "auto",
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

      {/* ── Not WordPress ── */}
      {phase === "not_wordpress" && (
        <div style={{
          marginTop: 12,
          padding: "26px 24px 22px",
          background: "rgba(10,8,18,0.70)",
          border: "1px solid rgba(122,166,255,0.18)",
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "60%", height: "100%",
            background: "radial-gradient(ellipse at 90% 30%, rgba(99,102,241,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, position: "relative" }}>
            <div style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(99,102,241,0.10)",
              border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", marginBottom: 4 }}>
                Spezialisierter WordPress-Check
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.6, maxWidth: 460 }}>
                Der aktuelle WebsiteFix-Check ist auf WordPress spezialisiert. Für andere Systeme können wir derzeit keine vollständige Diagnose liefern.
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0 18px" }} />

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <button
              onClick={reset}
              style={{
                fontSize: 13, fontWeight: 600,
                color: "#fff",
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.30)",
                borderRadius: 8, cursor: "pointer",
                padding: "8px 16px",
              }}
            >
              Andere Website prüfen
            </button>

            {!notifyNextJs ? (
              !showSystemInput ? (
                <button
                  onClick={() => setShowSystemInput(true)}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    color: "rgba(255,255,255,0.35)",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, cursor: "pointer",
                    padding: "8px 14px",
                  }}
                >
                  Support für mein System anfragen
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="z. B. Joomla, Shopify, Next.js…"
                    value={systemInput}
                    onChange={(e) => setSystemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && systemInput.trim()) {
                        setNotifyNextJs(true);
                        try { localStorage.setItem("wf_system_request", systemInput.trim()); } catch {}
                      }
                    }}
                    autoFocus
                    style={{
                      fontSize: 12, padding: "7px 12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 8, color: "#fff",
                      outline: "none", width: 200,
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!systemInput.trim()) return;
                      setNotifyNextJs(true);
                      try { localStorage.setItem("wf_system_request", systemInput.trim()); } catch {}
                    }}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      color: "#818cf8",
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: 8, cursor: "pointer",
                      padding: "7px 12px",
                    }}
                  >
                    Absenden →
                  </button>
                </div>
              )
            ) : (
              <span style={{
                fontSize: 12, color: "rgba(141,243,211,0.7)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                Gemerkt — wir melden uns!
              </span>
            )}
          </div>
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
    </div>
  );
}
