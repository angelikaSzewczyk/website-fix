"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "../components/BrandLogo";

// ── Types ────────────────────────────────────────────────────────────────────
type ScanPhase =
  | "idle"
  | "step1"   // Crawl startet
  | "step2"   // Sitemap / Link-Discovery
  | "step3"   // Technische Barrieren
  | "step4"   // KI-Diagnose
  | "done"
  | "error";

type ScanResult = {
  diagnose: string;
  pagesScanned: number;
};

// ── Progress steps data ───────────────────────────────────────────────────────
const STEPS: { phase: ScanPhase; label: string; sub?: string }[] = [
  { phase: "step1", label: "Crawl startet…",              sub: "Verbinde mit Zieldomain" },
  { phase: "step2", label: "Sitemap analysiert",           sub: "Entdecke interne Links & Unterseiten…" },
  { phase: "step3", label: "Analysiere technische Barrieren", sub: "Prüfe Unterseiten auf Fehler…" },
  { phase: "step4", label: "KI erstellt vollständigen Report…", sub: "Aggregiere Befunde" },
];

const PHASE_ORDER: ScanPhase[] = ["idle","step1","step2","step3","step4","done","error"];

// ── Benefit cards (footer) ────────────────────────────────────────────────────
const BENEFITS = [
  {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: "Mehr Umsatz",
    title: "BFSG als neues Service-Paket",
    desc: "Verkaufe automatisierte Compliance-Audits als Wartungspaket und fakturiere monatlich — kein Mehraufwand.",
  },
  {
    color: "#7aa6ff",
    bg: "rgba(122,166,255,0.08)",
    border: "rgba(122,166,255,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: "Weniger Haftung",
    title: "BFSG 2025 automatisch im Griff",
    desc: "Lückenloser Audit-Trail. Jede Prüfung dokumentiert. Jeder Nachweis griffbereit — für den Ernstfall.",
  },
  {
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    label: "Bessere Marge",
    title: "Reports ohne Mehrarbeit",
    desc: "Monatliche White-Label Reports mit deinem Logo — vollautomatisch erstellt und direkt an den Kunden versendet.",
  },
];

// ── Diagnose renderer ─────────────────────────────────────────────────────────
function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return (
      <h3 key={i} style={{ fontSize: 16, margin: "22px 0 8px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>
        {line.replace("## ", "")}
      </h3>
    );
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#ff6b6b", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#ffd93d", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#8df3d3", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "4px 0", paddingLeft: 16, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
    if (line.startsWith("# ") || line.trim() === "") return <div key={i} style={{ height: line.trim() ? 0 : 5 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>{line}</p>;
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScanPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiDone = useRef(false);

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function advanceToPhase(target: ScanPhase, delay: number) {
    timerRef.current = setTimeout(() => {
      if (!apiDone.current) setPhase(target);
    }, delay);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || phase !== "idle") return;

    clearTimers();
    apiDone.current = false;
    setPhase("step1");
    setResult(null);
    setErrorMsg("");
    setShowOverlay(false);

    // Auto-advance steps while API runs
    advanceToPhase("step2", 5000);
    advanceToPhase("step3", 12000);
    advanceToPhase("step4", 22000);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      clearTimers();
      apiDone.current = true;

      if (data.success) {
        setPhase("done");
        // Redirect to results page after a brief "done" flash
        setTimeout(() => {
          router.push(`/scan/results?url=${encodeURIComponent(url)}`);
        }, 900);
      } else {
        setErrorMsg(data.error ?? "Etwas ist schiefgelaufen.");
        setPhase("error");
      }
    } catch {
      clearTimers();
      apiDone.current = true;
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
      setPhase("error");
    }
  }

  function reset() {
    clearTimers();
    apiDone.current = false;
    setPhase("idle");
    setUrl("");
    setResult(null);
    setErrorMsg("");
    setShowOverlay(false);
  }

  const isScanning = phase === "step1" || phase === "step2" || phase === "step3" || phase === "step4";
  const currentStepIdx = isScanning ? PHASE_ORDER.indexOf(phase) - 1 : -1;

  return (
    <>
      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={{
              fontSize: 13, padding: "7px 16px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}>
              Anmelden
            </Link>
            <Link href="/register" style={{
              fontSize: 13, padding: "7px 16px", borderRadius: 8, fontWeight: 600,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Account erstellen
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main>
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>

          {/* Monitoring badges */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            {[
              { label: "🟢 HTTPS-Monitor",     color: "#8df3d3" },
              { label: "⚡ Core Web Vitals",   color: "#7aa6ff" },
              { label: "🛡 BFSG-Compliance",   color: "#c084fc" },
              { label: "🕷 Full-Site Crawl",   color: "#fbbf24" },
            ].map(b => (
              <div key={b.label} style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 11,
                border: `1px solid ${b.color}30`,
                background: `${b.color}0d`,
                color: b.color, fontWeight: 600, letterSpacing: "0.03em",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: b.color, flexShrink: 0,
                  boxShadow: `0 0 5px ${b.color}`,
                }} />
                {b.label.replace(/^[^\s]+\s/, "")}
              </div>
            ))}
          </div>

          <h1 style={{
            fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.08,
            margin: "0 0 16px", letterSpacing: "-0.035em",
          }}>
            Starte deinen ersten<br />
            <span style={{ background: "linear-gradient(90deg,#7aa6ff,#8df3d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Deep-Scan.
            </span>
          </h1>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 40px" }}>
            KI-gestützte Analyse von Barrierefreiheit, Technik und Performance –{" "}
            <span style={{ color: "rgba(255,255,255,0.7)" }}>über alle Unterseiten hinweg.</span>
          </p>

          {/* ── INPUT FORM ── */}
          {phase === "idle" && (
            <form onSubmit={handleScan} style={{ position: "relative", maxWidth: 580, margin: "0 auto 14px" }}>
              <div style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 0 0 0 rgba(0,123,255,0)",
                transition: "box-shadow 0.2s",
              }}>
                <label htmlFor="scan-url" className="sr-only">Website-URL</label>
                <input
                  id="scan-url"
                  type="text" value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://kunden-website.de"
                  style={{
                    flex: 1, background: "transparent",
                    border: "none", outline: "none",
                    padding: "16px 20px", color: "#fff", fontSize: 16,
                  }}
                  autoFocus
                />
                <button type="submit" disabled={!url} style={{
                  padding: "14px 28px", background: url ? "#007BFF" : "rgba(255,255,255,0.08)",
                  border: "none", color: url ? "#fff" : "rgba(255,255,255,0.3)",
                  fontWeight: 700, fontSize: 14, cursor: url ? "pointer" : "default",
                  whiteSpace: "nowrap", transition: "background 0.15s",
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                }}>
                  Jetzt scannen →
                </button>
              </div>
            </form>
          )}

          {phase === "idle" && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
              Kostenlos · Keine Anmeldung · Ergebnis in unter 60 Sekunden
            </p>
          )}
        </section>

        {/* ── LIVE PROGRESS ── */}
        {isScanning && (
          <section style={{ maxWidth: 600, margin: "0 auto 48px", padding: "0 24px" }}>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(0,123,255,0.05)",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#007BFF", flexShrink: 0,
                  boxShadow: "0 0 8px #007BFF",
                  animation: "pulseDot 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  Crawler aktiv — {url}
                </span>
              </div>

              {/* Steps */}
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
                {STEPS.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isActive = i === currentStepIdx;
                  const isPending = i > currentStepIdx;
                  return (
                    <div key={step.phase} style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      paddingBottom: i < STEPS.length - 1 ? 16 : 0,
                      position: "relative",
                    }}>
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div style={{
                          position: "absolute", left: 9, top: 22,
                          width: 2, height: 16,
                          background: isDone ? "rgba(141,243,211,0.4)" : "rgba(255,255,255,0.07)",
                          transition: "background 0.5s",
                        }} />
                      )}
                      {/* Dot */}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: isDone
                          ? "rgba(141,243,211,0.15)"
                          : isActive
                            ? "rgba(0,123,255,0.2)"
                            : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${isDone ? "#8df3d3" : isActive ? "#007BFF" : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.4s",
                      }}>
                        {isDone ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : isActive ? (
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#007BFF",
                            animation: "pulseDot 1.2s ease-in-out infinite",
                          }} />
                        ) : null}
                      </div>
                      {/* Text */}
                      <div>
                        <div style={{
                          fontSize: 14, fontWeight: isActive ? 600 : 400,
                          color: isDone ? "#8df3d3" : isActive ? "#fff" : "rgba(255,255,255,0.25)",
                          transition: "color 0.4s",
                        }}>
                          {step.label}
                        </div>
                        {isActive && step.sub && (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                            {step.sub}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom bar */}
              <div style={{
                height: 2, background: "rgba(255,255,255,0.04)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${((currentStepIdx + 1) / STEPS.length) * 100}%`,
                  background: "linear-gradient(90deg, #007BFF, #8df3d3)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          </section>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <section style={{ maxWidth: 600, margin: "0 auto 48px", padding: "0 24px" }}>
            <div style={{
              padding: "18px 22px",
              background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: 12,
            }}>
              <p style={{ margin: "0 0 12px", color: "#ff6b6b", fontSize: 14 }}>{errorMsg}</p>
              <button onClick={reset} style={{
                fontSize: 13, padding: "8px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                background: "none", cursor: "pointer",
              }}>
                Erneut versuchen
              </button>
            </div>
          </section>
        )}

        {/* ── RESULTS ── */}
        {phase === "done" && result && (
          <section style={{ maxWidth: 740, margin: "0 auto 64px", padding: "0 24px" }}>

            {/* Result header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#8df3d3", boxShadow: "0 0 6px #8df3d3",
                }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  Scan abgeschlossen
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  {result.pagesScanned} Seite{result.pagesScanned !== 1 ? "n" : ""} analysiert · {url}
                </span>
              </div>
              <button onClick={reset} style={{
                fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                cursor: "pointer", padding: "6px 14px",
              }}>
                Neue URL
              </button>
            </div>

            {/* Diagnose */}
            <div style={{
              position: "relative",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{ padding: "28px 32px" }}>
                {renderDiagnose(result.diagnose)}
              </div>

              {/* Blur + Upgrade Overlay — appears after 1.2s */}
              {showOverlay && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "45%",
                  background: "linear-gradient(to bottom, transparent 0%, rgba(11,12,16,0.92) 40%, rgba(11,12,16,0.98) 100%)",
                  display: "flex", alignItems: "flex-end",
                  padding: "0 32px 28px",
                }}>
                  <div style={{
                    width: "100%",
                    padding: "22px 26px", borderRadius: 14,
                    background: "rgba(0,123,255,0.08)",
                    border: "1px solid rgba(0,123,255,0.25)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      🚀 Du hast ein großes Projekt
                    </div>
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      Dieser Scan prüfte{" "}
                      <strong style={{ color: "#fff" }}>{result.pagesScanned} Seiten</strong>.
                      Erstelle einen kostenlosen Account, um{" "}
                      <strong style={{ color: "#fff" }}>alle Unterseiten</strong> zu analysieren und den vollständigen Deep-Scan zu erhalten.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <Link href="/register" style={{
                        padding: "11px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                        background: "linear-gradient(90deg, #007BFF, #0057b8)",
                        color: "#fff", textDecoration: "none",
                        boxShadow: "0 4px 16px rgba(0,123,255,0.4)",
                      }}>
                        Kostenlosen Agentur-Account erstellen →
                      </Link>
                      <button onClick={() => setShowOverlay(false)} style={{
                        padding: "11px 18px", borderRadius: 9, fontSize: 13,
                        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)",
                        background: "none", cursor: "pointer",
                      }}>
                        Report lesen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </section>
        )}

        {/* ── BENEFITS FOOTER ── */}
        <section style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 24px 80px",
        }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Warum Agenturen WebsiteFix nutzen
            </p>
            <h2 style={{ textAlign: "center", margin: "0 0 48px", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
              Mehr Umsatz. Weniger Haftung. Bessere Marge.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {BENEFITS.map(b => (
                <div key={b.label} style={{
                  padding: "26px 24px",
                  background: b.bg,
                  border: `1px solid ${b.border}`,
                  borderRadius: 16,
                  display: "flex", flexDirection: "column", gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${b.color}15`,
                    border: `1px solid ${b.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      {b.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/fuer-agenturen" style={{
                display: "inline-block",
                padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,123,255,0.35)",
              }}>
                Jetzt Agentur-Account erstellen →
              </Link>
              <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                Keine Kreditkarte · Monatlich kündbar
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            {`© ${new Date().getFullYear()} website-fix.com`}
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Startseite</Link>
            <Link href="/fuer-agenturen" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Für Agenturen</Link>
            <Link href="/impressum" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
            <Link href="/datenschutz" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
          </div>
        </div>
      </footer>

      {/* CSS animations */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
