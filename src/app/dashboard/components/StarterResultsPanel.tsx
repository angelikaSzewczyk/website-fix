"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types (mirrored from free-dashboard-client) ──────────────────────────────
export interface IssueProp {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
  count?: number;
}

interface Props {
  issues:     IssueProp[];
  redCount:   number;
  yellowCount: number;
  speedScore: number;
  plan:       string;
  lastScan:   boolean; // true = scan data is present
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function getLabel(sev: IssueProp["severity"]) {
  return sev === "red" ? "Kritisch" : sev === "yellow" ? "Warnung" : "Hinweis";
}
function getColor(sev: IssueProp["severity"]) {
  return sev === "red" ? "#f87171" : sev === "yellow" ? "#fbbf24" : "#4ade80";
}
function getBg(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(239,68,68,0.08)" : sev === "yellow" ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)";
}
function getBorder(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(239,68,68,0.22)" : sev === "yellow" ? "rgba(251,191,36,0.22)" : "rgba(74,222,128,0.22)";
}

// Fix steps per issue title keyword
function quickFix(issue: IssueProp): string {
  const t = (issue.title + " " + issue.body).toLowerCase();
  if (/alt.?text|alternativtext/.test(t))    return "Medien → Bibliothek → Alt-Text-Felder befüllen (Yoast SEO empfohlen).";
  if (/h1|hauptüberschrift/.test(t))         return "Editor öffnen → ersten Heading-Block auf H1 setzen — exakt eine pro Seite.";
  if (/meta.?desc|snippet/.test(t))          return "SEO-Plugin → Meta-Beschreibung → 120–155 Zeichen einladend formulieren.";
  if (/sitemap/.test(t))                     return "Yoast SEO → Allgemein → XML-Sitemap aktivieren, in GSC einreichen.";
  if (/cookie|consent/.test(t))              return "Borlabs Cookie / Complianz installieren — Opt-In Banner mit Ablehnungs-Option.";
  if (/ssl|https/.test(t))                   return "Hosting-Panel → SSL-Zertifikat aktivieren, HTTP→HTTPS 301-Redirect einrichten.";
  if (/404|broken|kaputt/.test(t))           return "Plugin 'Redirection' → 301-Weiterleitung zur nächstbesten Seite setzen.";
  if (/noindex/.test(t))                     return "SEO-Plugin → Indexierung für diese Seite aktivieren (Checkbox prüfen).";
  if (/label|formular/.test(t))              return "Jedes Input-Feld braucht ein sichtbares <label> oder aria-label-Attribut.";
  if (/lcp|cls|vitals|ladezeit/.test(t))     return "Bilder komprimieren, Caching-Plugin aktivieren (WP Super Cache / W3 Total Cache).";
  return "Betroffenen Bereich im CMS-Backend öffnen und gemäß Fehlerbeschreibung beheben.";
}

// ─── Animated circular score ring ─────────────────────────────────────────────
function ScoreRing({ score, label, color, delay = 0 }: { score: number; label: string; color: string; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = setTimeout(() => {
      const duration = 1100;
      const start = performance.now();
      function tick(now: number) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayed(Math.round(eased * score));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const R = 42;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (displayed / 100) * circumference;

  const grade = displayed >= 80 ? "Sehr gut" : displayed >= 60 ? "Gut" : displayed >= 40 ? "Mittel" : "Kritisch";

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ position: "relative", width: 106, height: 106, margin: "0 auto 10px" }}>
        <svg width="106" height="106" viewBox="0 0 106 106" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="53" cy="53" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="53" cy="53" r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 1,
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {displayed}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {grade}
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>
        {label}
      </p>
    </div>
  );
}

// ─── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({
  issue,
  index,
  onAutoFix,
}: {
  issue: IssueProp;
  index: number;
  onAutoFix: () => void;
}) {
  const [open, setOpen] = useState(false);
  const color  = getColor(issue.severity);
  const bg     = getBg(issue.severity);
  const border = getBorder(issue.severity);
  const fix    = quickFix(issue);

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: open ? "rgba(255,255,255,0.02)" : "transparent",
      transition: "background 0.15s",
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "13px 20px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit",
        }}
      >
        {/* Severity badge */}
        <span style={{
          flexShrink: 0,
          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
          background: bg, border: `1px solid ${border}`, color,
          letterSpacing: "0.06em", textTransform: "uppercase" as const,
        }}>
          {getLabel(issue.severity)}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
          {issue.title}
        </span>
        {issue.count != null && issue.count > 1 && (
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700,
            padding: "2px 7px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)",
          }}>
            ×{issue.count}
          </span>
        )}
        {/* Chevron */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: "0 20px 16px 20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
            {issue.body}
          </p>
          {/* Quick fix */}
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 14,
            background: "rgba(0,123,255,0.05)", border: "1px solid rgba(0,123,255,0.14)",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <p style={{ margin: 0, fontSize: 12, color: "#7aa6ff", lineHeight: 1.6 }}>
              <strong>Quick Fix:</strong> {fix}
            </p>
          </div>
          {/* Auto-Fix button (locked for Starter) */}
          <button
            onClick={onAutoFix}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 7,
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.22)",
              color: "rgba(251,191,36,0.55)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Auto-Fix via Plugin
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1101,
        width: "min(480px, calc(100vw - 32px))",
        background: "linear-gradient(135deg, #0d1520 0%, #0f1a2e 100%)",
        border: "1px solid rgba(251,191,36,0.25)",
        borderRadius: 20, padding: "36px 32px 28px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        animation: "wf-sr-modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <style>{`
          @keyframes wf-sr-modal-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.93); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
          background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FBBF24"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        <h2 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Auto-Fix via Plugin
        </h2>
        <p style={{ textAlign: "center", margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
          Das WebsiteFix WordPress-Plugin behebt Alt-Texte, Meta-Descriptions und<br/>
          kaputte Links automatisch — direkt in deiner WordPress-Installation.
        </p>

        {/* Feature list */}
        {[
          "1-Klick Alt-Text-Generierung via KI",
          "Automatische Meta-Descriptions",
          "Redirect-Manager für 404-Seiten",
          "Unlimitierte Scans & Echtzeit-Monitoring",
        ].map(f => (
          <div key={f} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{f}</span>
          </div>
        ))}

        <Link href="/fuer-agenturen#pricing" style={{
          display: "block", textAlign: "center",
          marginTop: 24, padding: "13px 24px", borderRadius: 10,
          background: "#FBBF24", color: "#0b0c10",
          fontSize: 14, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 4px 24px rgba(251,191,36,0.3)",
        }}>
          Auf Professional upgraden →
        </Link>
        <button onClick={onClose} style={{
          display: "block", width: "100%", marginTop: 10,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "inherit",
        }}>
          Schließen
        </button>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function StarterResultsPanel({ issues, redCount, yellowCount, speedScore, plan, lastScan }: Props) {
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [showWLModal, setShowWLModal]   = useState(false);
  const [openItems, setOpenItems]       = useState<Set<number>>(new Set());
  void openItems; void setOpenItems;    // used by AccordionItem internally

  if (!lastScan || issues.length === 0) return null;

  // ── Score computation ─────────────────────────────────────────────────────
  const seoScore  = clamp(100 - redCount * 14 - yellowCount * 5, 12, 94);
  const techScore = clamp(speedScore, 10, 98);
  const secScore  = clamp(100 - redCount * 20 - (yellowCount > 5 ? 10 : 0), 15, 97);

  // ── Top 3 priorities (sorted: red → yellow → green, then by count desc) ──
  const sorted  = [...issues].sort((a, b) => {
    const sevOrd = { red: 0, yellow: 1, green: 2 };
    const sd = sevOrd[a.severity] - sevOrd[b.severity];
    if (sd !== 0) return sd;
    return (b.count ?? 1) - (a.count ?? 1);
  });
  const top3 = sorted.slice(0, 3);

  // ── PDF export ────────────────────────────────────────────────────────────
  function handleExportPDF() {
    window.print();
  }

  const isStarter = plan === "starter";

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showWLModal  && <UpgradeModal onClose={() => setShowWLModal(false)} />}

      <style>{`
        @keyframes wf-sr-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .wf-no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
        }
      `}</style>

      {/* ① SCORE RINGS ─────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "28px 32px",
        animation: "wf-sr-fadein 0.4s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Website Score
            </p>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Analyse-Übersicht
            </h2>
          </div>
          {/* Export buttons */}
          <div className="wf-no-print" style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleExportPDF}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 8,
                background: "rgba(0,123,255,0.08)", border: "1px solid rgba(0,123,255,0.22)",
                color: "#7aa6ff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Bericht speichern
            </button>
            <button
              onClick={() => setShowWLModal(true)}
              title="Ab Professional verfügbar"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 8,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              White-Label PDF
            </button>
          </div>
        </div>

        {/* Rings */}
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          <ScoreRing score={seoScore}  label="SEO"      color={seoScore  >= 70 ? "#4ade80" : seoScore  >= 45 ? "#fbbf24" : "#f87171"} delay={0}   />
          <ScoreRing score={techScore} label="Technik"  color={techScore >= 70 ? "#4ade80" : techScore >= 45 ? "#fbbf24" : "#f87171"} delay={180} />
          <ScoreRing score={secScore}  label="Sicherheit" color={secScore >= 70 ? "#4ade80" : secScore >= 45 ? "#fbbf24" : "#f87171"} delay={360} />
        </div>
      </div>

      {/* ② TOP 3 PRIORITÄTEN ─────────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div style={{
          marginBottom: 28,
          animation: "wf-sr-fadein 0.45s 0.1s ease both",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Sofort-Maßnahmen
          </p>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Top-Prioritäten
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top3.map((issue, i) => {
              const c = getColor(issue.severity);
              const fix = quickFix(issue);
              return (
                <div key={i} style={{
                  padding: "18px 20px",
                  background: getBg(issue.severity),
                  border: `1px solid ${getBorder(issue.severity)}`,
                  borderLeft: `3px solid ${c}`,
                  borderRadius: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    {/* Rank */}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `rgba(${c === "#f87171" ? "239,68,68" : c === "#fbbf24" ? "251,191,36" : "74,222,128"},0.15)`,
                      border: `1.5px solid ${getBorder(issue.severity)}`,
                      fontSize: 11, fontWeight: 900, color: c,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                          background: getBg(issue.severity), border: `1px solid ${getBorder(issue.severity)}`,
                          color: c, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                        }}>
                          {getLabel(issue.severity)}
                        </span>
                        {issue.count != null && issue.count > 1 && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                            {issue.count}× betroffen
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                        {issue.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                        {fix}
                      </p>
                    </div>
                  </div>
                  {/* Auto-Fix CTA */}
                  <div className="wf-no-print" style={{ paddingLeft: 38 }}>
                    <button
                      onClick={() => setShowUpgrade(true)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 14px", borderRadius: 7,
                        background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)",
                        color: "rgba(251,191,36,0.5)", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Auto-Fix via Plugin {isStarter ? "— Professional" : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ③ ALLE PROBLEME — Accordion ─────────────────────────────────────── */}
      <div style={{
        marginBottom: 28,
        animation: "wf-sr-fadein 0.5s 0.2s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Vollständige Analyse
            </p>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Alle Optimierungen ({issues.length})
            </h2>
          </div>
          {/* Filter legend */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { sev: "red" as const,    label: `${issues.filter(i=>i.severity==="red").length} Kritisch` },
              { sev: "yellow" as const, label: `${issues.filter(i=>i.severity==="yellow").length} Warnungen` },
              { sev: "green" as const,  label: `${issues.filter(i=>i.severity==="green").length} Hinweise` },
            ].map(f => (
              <span key={f.sev} style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                background: getBg(f.sev), border: `1px solid ${getBorder(f.sev)}`, color: getColor(f.sev),
              }}>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, overflow: "hidden",
        }}>
          {sorted.map((issue, i) => (
            <AccordionItem
              key={i}
              issue={issue}
              index={i}
              onAutoFix={() => setShowUpgrade(true)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
