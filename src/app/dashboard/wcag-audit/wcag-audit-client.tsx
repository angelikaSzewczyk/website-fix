"use client";

/**
 * WcagAuditClient — Frontend für /api/wcag-scan.
 *
 * Echter axe-core-Audit (WCAG 2.1 A + AA) im headless Chromium statt der
 * statischen Heuristik. Nutzt die bereits existierende Backend-Route, die
 * Playwright + Sparticuz-Chromium-Min lädt, axe-core via CDN injiziert
 * und die Violations + Claude-Diagnose zurückliefert.
 *
 * UI-Flow:
 *   1. URL-Input (vorausgefüllt aus ?url=… wenn gesetzt)
 *   2. Klick "Audit starten" → Loading-State (~25 s, weil Chromium-Cold-Start)
 *   3. Resultat: Violations-Liste (sortiert nach impact) + Claude-Diagnose-Markdown
 *
 * Rate-Limit-Aware: Backend hat 3 Scans/Min global + IP-Rate-Limit. Bei 429
 * zeigen wir die Server-Reason an.
 */

import { useState } from "react";
import Link from "next/link";

const C = {
  bg:          "#0b0c10",
  card:        "rgba(255,255,255,0.03)",
  cardSolid:   "#0f1623",
  border:      "rgba(255,255,255,0.08)",
  borderStr:   "rgba(255,255,255,0.14)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  green:       "#22C55E",
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
  red:         "#F87171",
  redBg:       "rgba(248,113,113,0.10)",
  redBorder:   "rgba(248,113,113,0.30)",
  blue:        "#7aa6ff",
} as const;

type Violation = {
  id:       string;
  impact:   string;
  priority: string;
  help:     string;
  nodeHtml: string;
};

type ScanOk = {
  success:        true;
  url:            string;
  violationCount: number;
  violations:     Violation[];
  diagnose:       string;
};

type ScanErr = { success: false; error: string };

type ScanResult = ScanOk | ScanErr;

function impactStyle(impact: string): { fg: string; bg: string; bd: string; label: string } {
  if (impact === "critical" || impact === "serious") {
    return { fg: C.red, bg: C.redBg, bd: C.redBorder, label: "KRITISCH" };
  }
  if (impact === "moderate") {
    return { fg: C.amber, bg: C.amberBg, bd: C.amberBorder, label: "WICHTIG" };
  }
  return { fg: C.blue, bg: "rgba(122,166,255,0.10)", bd: "rgba(122,166,255,0.30)", label: "INFO" };
}

export default function WcagAuditClient({ initialUrl }: { initialUrl: string }) {
  const [url,     setUrl]     = useState(initialUrl);
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState<ScanResult | null>(null);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (running) return;
    const target = url.trim();
    if (!target) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch("/api/wcag-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await r.json() as ScanResult;
      setResult(data);
    } catch {
      setResult({ success: false, error: "Verbindungsfehler — bitte erneut versuchen." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      padding: "44px 24px 80px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <Link href="/dashboard" style={{
          fontSize: 12, color: C.textMuted, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
        }}>
          ← Zurück zum Dashboard
        </Link>

        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 800,
          padding: "3px 10px", borderRadius: 999, marginBottom: 14,
          background: C.greenBg, color: C.green,
          border: `1px solid ${C.greenBorder}`,
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          Echter Audit · axe-core 4.10 + Headless Chromium
        </span>

        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, letterSpacing: "-0.025em", color: C.text }}>
          WCAG 2.1 — Headless-Audit
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14.5, color: C.textSub, lineHeight: 1.65, maxWidth: 600 }}>
          Anders als die WCAG-Heuristik im Dashboard läuft hier ein echter Browser-Test:
          axe-core wird in Headless-Chromium injiziert und liefert die exakten Verstöße
          — inklusive konkreter HTML-Elemente und Code-Fix-Vorschlägen.
        </p>

        {/* URL-Form */}
        <form onSubmit={handleRun} style={{
          display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18,
          padding: "14px 16px", borderRadius: 12,
          background: C.cardSolid, border: `1px solid ${C.borderStr}`,
        }}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://deine-website.de"
            disabled={running}
            style={{
              flex: 1, minWidth: 220,
              padding: "11px 14px", borderRadius: 8,
              fontSize: 14, fontFamily: "inherit",
              background: "rgba(0,0,0,0.32)",
              border: `1px solid ${C.border}`,
              color: C.text, outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={running || url.trim().length === 0}
            style={{
              padding: "11px 22px", borderRadius: 9, fontSize: 13.5, fontWeight: 800,
              background: running ? "rgba(255,255,255,0.05)" : "linear-gradient(90deg,#16a34a,#22c55e)",
              color: running ? C.textMuted : "#fff",
              border: "none",
              cursor: running ? "default" : "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
              boxShadow: running ? "none" : "0 4px 16px rgba(34,197,94,0.32)",
            }}
          >
            {running ? "Audit läuft… (~25 s)" : "Audit starten"}
          </button>
        </form>

        {/* Hint während Loading */}
        {running && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: C.amberBg, border: `1px solid ${C.amberBorder}`,
            fontSize: 12.5, color: C.textSub, lineHeight: 1.6, marginBottom: 18,
          }}>
            <strong style={{ color: C.amber }}>Bitte warten:</strong> Headless-Chromium startet kalt
            (~10-25 s) und führt anschließend axe-core gegen alle WCAG 2.1 A + AA-Regeln aus.
            Browser-Tab nicht schließen.
          </div>
        )}

        {/* Result */}
        {result && !result.success && (
          <div style={{
            padding: "14px 18px", borderRadius: 10,
            background: C.redBg, border: `1px solid ${C.redBorder}`,
            fontSize: 13, color: C.red,
          }}>
            <strong>Fehler:</strong> {result.error}
          </div>
        )}

        {result && result.success && result.violationCount === 0 && (
          <div style={{
            padding: "20px 22px", borderRadius: 12,
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>✓</span>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.green }}>
                Keine WCAG-Verstöße gefunden
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.6 }}>
                Automatische Scans erkennen ~40 % aller WCAG-Kriterien. Komplexe Nutzerinteraktionen
                (Tastatur-Navigation, Screen-Reader-Tests) sollten zusätzlich manuell geprüft werden.
              </p>
            </div>
          </div>
        )}

        {result && result.success && result.violationCount > 0 && (
          <>
            <div style={{
              padding: "16px 20px", borderRadius: 12, marginBottom: 18,
              background: C.cardSolid, border: `1px solid ${C.redBorder}`,
              display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: C.redBg, border: `1px solid ${C.redBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.red, fontSize: 20, fontWeight: 800,
              }}>
                {result.violationCount}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: C.text }}>
                  WCAG-Verstöße auf {new URL(result.url).hostname}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                  Nach Severity sortiert — die ersten Einträge zuerst beheben.
                </p>
              </div>
            </div>

            {/* Violations-Liste */}
            <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {result.violations.map((v, i) => {
                const s = impactStyle(v.impact);
                return (
                  <li key={i} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: C.card, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9.5, fontWeight: 800,
                        padding: "2px 8px", borderRadius: 999,
                        background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
                        letterSpacing: "0.10em",
                      }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                        {v.id}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
                      {v.help}
                    </p>
                    {v.nodeHtml && (
                      <pre style={{
                        margin: 0, padding: "8px 12px",
                        background: "rgba(0,0,0,0.40)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 6,
                        fontSize: 11, color: "#cbd5e1",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap",
                      }}>
                        <code>{v.nodeHtml}</code>
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Claude-Diagnose */}
            {result.diagnose && (
              <details open style={{
                padding: "16px 20px", borderRadius: 12,
                background: C.cardSolid, border: `1px solid ${C.borderStr}`,
              }}>
                <summary style={{
                  cursor: "pointer", fontSize: 12, fontWeight: 800, color: C.amber,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                }}>
                  Diagnose &amp; Code-Fixes (KI)
                </summary>
                <div style={{
                  marginTop: 14, fontSize: 13, color: C.textSub, lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {result.diagnose}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </main>
  );
}
