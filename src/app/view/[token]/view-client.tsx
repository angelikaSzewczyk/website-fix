"use client";

import { useState, useEffect, useRef } from "react";
import type { IssueProp } from "@/components/dashboard/variants/_shared/IssueList";

// ─── Score helpers (mirrors StarterResultsPanel) ───────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function friendlyLabel(raw: string): string {
  return raw
    .replace(/^BFSG-Verstoß:\s*/i, "Barrierefreiheit: ")
    .replace(/^Barrierefreiheits?-Verstoß:\s*/i, "Barrierefreiheit: ")
    .replace(/\s*\(BFSG-Risiko\)\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^Barrierefreiheit:\s+Bilder-Beschreibung fehlt$/i, "Barrierefreiheit: Bilder ohne Beschreibung")
    .replace(/^Fehlendes?\s+Alt-Attribut$/i, "Barrierefreiheit: Bilder ohne Beschreibung");
}

interface Deduction { label: string; pts: number; sortedIdx: number; }

function getSeoDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    if (/barriere|bfsg|alt.?text|screenreader|alternativtext|ssl|https|cookie|dsgvo|datenschutz|formular|sicherheit|security/i.test(t)) return;
    let pts = 0;
    if (/title.?tag|kein.*title|ohne.*title/i.test(t))     pts = 14;
    else if (/meta.?desc|snippet/i.test(t))                pts = 8;
    else if (/\bh1\b|hauptüberschrift/i.test(t))           pts = 8;
    else if (/sitemap/i.test(t))                           pts = 6;
    else if (/noindex|ausgeschlossen/i.test(t))            pts = 5;
    else if (issue.category === "technik" || issue.category === "speed") return;
    else if (issue.severity === "red" && issue.category !== "recht") pts = 5;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

function getSecDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    if (/lcp|ladezeit|pagespeed|cls|layout.?shift|caching|cache|bildkompri|redirect.?kette/i.test(t)) return;
    let pts = 0;
    if (/ssl|https/i.test(t))                                             pts = 50;
    else if (/cookie|consent|dsgvo|datenschutz/i.test(t))                pts = 30;
    else if (/mixed.?content|unsicher.*ressource/i.test(t))              pts = 20;
    else if (/sicherheit|security/i.test(t) && issue.severity === "red") pts = 20;
    else if (/barriere|bfsg|screenreader|alternativtext/i.test(t))       pts = 15;
    else if (/impressum|rechtstext|rechtspflicht|anbieterkennzeichnung/i.test(t)) pts = 15;
    else if (/alt.?text|formular|label/i.test(t))                        pts = 10;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

function getTechDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    if (/barriere|bfsg|alt.?text|screenreader|alternativtext|ssl|https|cookie|dsgvo|datenschutz|formular/i.test(t)) return;
    let pts = 0;
    if (/lcp|ladezeit|pagespeed|performance|core web/i.test(t))    pts = 15;
    else if (/cls|layout.?shift/i.test(t))                          pts = 10;
    else if (/caching|cache/i.test(t))                              pts = 8;
    else if (/bildkompri|komprimier|webp|next.gen/i.test(t))        pts = 8;
    else if (/redirect.?kette|redirect.?loop/i.test(t))             pts = 8;
    else if (issue.category === "speed" && issue.severity === "red") pts = 15;
    else if (issue.category === "speed")                             pts = 8;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

// ─── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, label, delay = 0, accentColor }: { score: number; label: string; delay?: number; accentColor: string }) {
  const [displayed, setDisplayed] = useState<number | null>(null);
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
  const d = displayed ?? 0;
  const offset = circumference - (d / 100) * circumference;
  const liveColor = d >= 70 ? "#4ade80" : d >= 40 ? "#fbbf24" : "#c07070";
  const grade = d >= 80 ? "Sehr gut" : d >= 60 ? "Gut" : d >= 40 ? "OK" : "Potenzial";

  if (displayed === null) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ position: "relative", width: 106, height: 106, margin: "0 auto 10px" }}>
          <svg width="106" height="106" viewBox="0 0 106 106" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="53" cy="53" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.15)", lineHeight: 1 }}>—</span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>{label}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ position: "relative", width: 106, height: 106, margin: "0 auto 10px" }}>
        <svg width="106" height="106" viewBox="0 0 106 106" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="53" cy="53" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="53" cy="53" r={R}
            fill="none"
            stroke={liveColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${liveColor}80)`, transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{d}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: liveColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{grade}</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>{label}</p>
    </div>
  );
}

// ─── Accordion (read-only) ─────────────────────────────────────────────────────
function getColor(sev: IssueProp["severity"]) {
  return sev === "red" ? "#c07070" : sev === "yellow" ? "#fbbf24" : "#4ade80";
}
function getBg(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(160,80,80,0.07)" : sev === "yellow" ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)";
}
function getBorder(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(160,80,80,0.18)" : sev === "yellow" ? "rgba(251,191,36,0.22)" : "rgba(74,222,128,0.22)";
}

function AccordionItem({ issue, index }: { issue: IssueProp; index: number }) {
  const [open, setOpen] = useState(false);
  const color  = getColor(issue.severity);
  const bg     = getBg(issue.severity);
  const border = getBorder(issue.severity);
  const label  = issue.severity === "red" ? "Prio" : "Hinweis";

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: open ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
      >
        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg, border: `1px solid ${border}`, color, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {label}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
          {issue.title}
        </span>
        {issue.count != null && issue.count > 1 && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
            ×{issue.count}
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px 20px" }}>
          <p style={{ margin: "0 0 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{issue.body}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface Props {
  url: string;
  createdAt: string;
  issues: IssueProp[];
  redCount: number;
  yellowCount: number;
  speedScore: number;
  execSummary: string | null;
  agencyName: string | null;
  agencyWebsite: string | null;
  logoUrl: string | null;
  primaryColor: string;
  shareToken: string;
  isWooCommerce?: boolean;
  builderAudit?: {
    builder: string | null; maxDomDepth: number; divCount: number;
    googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
  } | null;
}

export default function ViewClient({
  url, createdAt, issues, redCount, yellowCount, speedScore,
  execSummary, agencyName, agencyWebsite, logoUrl, primaryColor, shareToken,
  isWooCommerce = false,
  builderAudit = null,
}: Props) {
  const date = new Date(createdAt).toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const sorted  = [...issues].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.severity] - order[b.severity];
  });
  const redIssues    = sorted.filter(i => i.severity === "red");
  const yellowIssues = sorted.filter(i => i.severity === "yellow");
  const greenIssues  = sorted.filter(i => i.severity === "green");

  const seoDeductions  = getSeoDeductions(sorted);
  const techDeductions = getTechDeductions(sorted);
  const secDeductions  = getSecDeductions(sorted);

  const seoScore  = clamp(100 - seoDeductions.reduce((s, d) => s + d.pts, 0), 0, 100);
  const techScore = clamp(speedScore, 0, 100);
  const secScore  = clamp(100 - secDeductions.reduce((s, d) => s + d.pts, 0), 0, 100);

  const accent = primaryColor;
  const accentBg = `${accent}18`;
  const accentBorder = `${accent}35`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes wf-view-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .wf-no-print { display: none !important; }
          .wf-cta-bar  { display: none !important; }
          body { background: #0b0c10 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0b0c10", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom: 100 }}>

        {/* ── Agency header ────────────────────────────────────────────────── */}
        <div style={{ borderBottom: `1px solid ${accentBorder}`, background: `linear-gradient(135deg, #0e1321 0%, #0f1a30 100%)` }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {logoUrl ? (
                <img src={logoUrl} alt={agencyName ?? "Logo"} style={{ height: 38, maxWidth: 120, objectFit: "contain" }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: 10, background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
              )}
              {agencyName && (
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{agencyName}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.04em" }}>
                Website-Analyse
              </span>
              <button
                className="wf-no-print"
                onClick={() => {
                  fetch(`/api/share-token/track-download?token=${shareToken}`, { method: "POST" }).catch(() => {});
                  window.print();
                }}
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${accentBorder}`, color: accent, background: accentBg, cursor: "pointer", fontFamily: "inherit" }}
              >
                PDF speichern
              </button>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>

          {/* Scan meta */}
          <div style={{ marginBottom: 28, animation: "wf-view-in 0.4s ease both" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Website-Analyse
            </p>
            <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", wordBreak: "break-all" }}>
              {url}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{date}</p>
          </div>

          {/* Executive Summary */}
          {execSummary && (
            <div style={{
              marginBottom: 28,
              padding: "18px 20px",
              borderRadius: 12,
              background: `${accent}08`,
              border: `1px solid ${accent}30`,
              borderLeft: `3px solid ${accent}`,
              animation: "wf-view-in 0.4s 0.05s ease both",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Experten-Fazit
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {execSummary}
              </p>
            </div>
          )}

          {/* E-Commerce & Shop-Performance — nur wenn WooCommerce erkannt */}
          {isWooCommerce && (() => {
            const shopIssues = sorted.filter(i => i.category === "shop");
            return (
              <div style={{
                marginBottom: 28, borderRadius: 12, overflow: "hidden",
                background: "rgba(127,84,179,0.06)",
                border: "1px solid rgba(127,84,179,0.32)",
                animation: "wf-view-in 0.4s 0.07s ease both",
              }}>
                <div style={{
                  padding: "12px 18px",
                  background: "linear-gradient(90deg, rgba(127,84,179,0.18) 0%, transparent 100%)",
                  borderBottom: "1px solid rgba(127,84,179,0.25)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                    background: "#7F54B3", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <path d="M21 5H3a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a1 1 0 0 0-1-1zM4 13l1.5 7h13l1.5-7H4zm6 2h4v3h-4v-3z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                      E-Commerce & Shop-Performance
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>
                      WooCommerce-spezifische Optimierungen
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                    background: "#7F54B3", color: "#fff", letterSpacing: "0.06em",
                  }}>
                    WOOCOMMERCE
                  </span>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
                    <strong style={{ color: "#C084B8" }}>Dieser Shop nutzt WooCommerce.</strong>{" "}
                    {shopIssues.length > 0
                      ? "Optimierungspotenzial bei der Datenbank-Struktur und am Checkout-Prozess gefunden — konkrete Hinweise unten."
                      : "Der Shop läuft technisch sauber. Keine kritischen Performance- oder Security-Fragmente gefunden."}
                  </p>
                  {shopIssues.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {shopIssues.map((issue, idx) => {
                        const isRed = issue.severity === "red";
                        return (
                          <div key={idx} style={{
                            padding: "10px 12px", borderRadius: 7,
                            background: isRed ? "rgba(160,80,80,0.10)" : "rgba(251,191,36,0.08)",
                            border: `1px solid ${isRed ? "rgba(160,80,80,0.22)" : "rgba(251,191,36,0.22)"}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                                background: isRed ? "rgba(160,80,80,0.18)" : "rgba(251,191,36,0.14)",
                                color: isRed ? "#c07070" : "#fbbf24", letterSpacing: "0.05em",
                              }}>
                                {isRed ? "HANDLUNGSBEDARF" : "OPTIMIERUNG"}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                                {issue.title}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                              {issue.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Builder-Intelligence — nur wenn Page-Builder erkannt */}
          {builderAudit && builderAudit.builder && (() => {
            const builderIssues = sorted.filter(i => i.category === "builder");
            const builderThemes: Record<string, { primary: string; bg: string; bd: string; logo: string }> = {
              Elementor: { primary: "#D5336D", bg: "rgba(213,51,109,0.10)", bd: "rgba(213,51,109,0.32)", logo: "E" },
              Divi:      { primary: "#00B5AD", bg: "rgba(0,181,173,0.10)",  bd: "rgba(0,181,173,0.32)",  logo: "D" },
              Astra:     { primary: "#4A90E2", bg: "rgba(74,144,226,0.10)", bd: "rgba(74,144,226,0.32)", logo: "A" },
              WPBakery:  { primary: "#F7781F", bg: "rgba(247,120,31,0.10)", bd: "rgba(247,120,31,0.32)", logo: "W" },
            };
            const bt = builderThemes[builderAudit.builder] ?? { primary: "#94A3B8", bg: "rgba(148,163,184,0.10)", bd: "rgba(148,163,184,0.32)", logo: "B" };
            return (
              <div style={{
                marginBottom: 28, borderRadius: 12, overflow: "hidden",
                background: bt.bg, border: `1px solid ${bt.bd}`,
                animation: "wf-view-in 0.4s 0.09s ease both",
              }}>
                <div style={{
                  padding: "12px 18px",
                  background: `linear-gradient(90deg, ${bt.bg} 0%, transparent 100%)`,
                  borderBottom: `1px solid ${bt.bd}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                    background: bt.primary, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: "#fff",
                  }}>{bt.logo}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                      Builder- & Theme-Analyse
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>
                      {builderAudit.builder} · DOM-Struktur, Fonts, CSS-Bloat
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                    background: bt.primary, color: "#fff", letterSpacing: "0.06em",
                  }}>
                    {builderAudit.builder.toUpperCase()}
                  </span>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {/* KPI-Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 }}>
                    <div style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>DOM-Tiefe</p>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: builderAudit.maxDomDepth > 22 ? "#c07070" : builderAudit.maxDomDepth > 15 ? "#fbbf24" : "#4ade80" }}>
                        {builderAudit.maxDomDepth}
                      </p>
                    </div>
                    <div style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Google Fonts</p>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: builderAudit.googleFontFamilies.length > 2 ? "#fbbf24" : "#4ade80" }}>
                        {builderAudit.googleFontFamilies.length}
                      </p>
                    </div>
                    <div style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stylesheets</p>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: builderAudit.stylesheetCount >= 8 ? "#fbbf24" : "#4ade80" }}>
                        {builderAudit.stylesheetCount}
                      </p>
                    </div>
                  </div>
                  {builderIssues.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {builderIssues.map((issue, idx) => {
                        const isRed = issue.severity === "red";
                        return (
                          <div key={idx} style={{
                            padding: "10px 12px", borderRadius: 7,
                            background: isRed ? "rgba(160,80,80,0.10)" : "rgba(251,191,36,0.08)",
                            border: `1px solid ${isRed ? "rgba(160,80,80,0.22)" : "rgba(251,191,36,0.22)"}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                                background: isRed ? "rgba(160,80,80,0.18)" : "rgba(251,191,36,0.14)",
                                color: isRed ? "#c07070" : "#fbbf24", letterSpacing: "0.05em",
                              }}>
                                {isRed ? "HANDLUNGSBEDARF" : "OPTIMIERUNG"}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{issue.title}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                              {issue.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Score overview */}
          <div style={{
            marginBottom: 24,
            padding: "20px 24px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            animation: "wf-view-in 0.4s 0.1s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {redCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(160,80,80,0.12)", border: "1px solid rgba(160,80,80,0.22)", color: "#c07070" }}>
                    {redCount} Priorität{redCount !== 1 ? "en" : ""}
                  </span>
                )}
                {yellowCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                    {yellowCount} Hinweis{yellowCount !== 1 ? "e" : ""}
                  </span>
                )}
                {redCount === 0 && yellowCount === 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                    Keine kritischen Probleme
                  </span>
                )}
              </div>
            </div>

            {/* Score rings */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "space-around" }}>
              <ScoreRing score={seoScore}  label="SEO"      delay={0}   accentColor={accent} />
              <ScoreRing score={techScore} label="Technik"  delay={120} accentColor={accent} />
              <ScoreRing score={secScore}  label="Sicherheit" delay={240} accentColor={accent} />
            </div>
          </div>

          {/* Issue accordion */}
          {sorted.length > 0 && (
            <div style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.015)",
              animation: "wf-view-in 0.4s 0.18s ease both",
            }}>
              <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                  Befunde ({sorted.length})
                </p>
              </div>
              {redIssues.map((issue, i) => (
                <AccordionItem key={`r${i}`} issue={issue} index={sorted.indexOf(issue)} />
              ))}
              {yellowIssues.map((issue, i) => (
                <AccordionItem key={`y${i}`} issue={issue} index={sorted.indexOf(issue)} />
              ))}
              {greenIssues.map((issue, i) => (
                <AccordionItem key={`g${i}`} issue={issue} index={sorted.indexOf(issue)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sticky CTA ───────────────────────────────────────────────────── */}
        {agencyName && agencyWebsite && (
          <div className="wf-cta-bar" style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(180deg, transparent 0%, rgba(11,12,16,0.97) 40%)",
            padding: "20px 24px 24px",
            display: "flex", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <a
              href={agencyWebsite.startsWith("http") ? agencyWebsite : `https://${agencyWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                pointerEvents: "auto",
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "12px 24px", borderRadius: 12,
                background: accent,
                color: "#0b0c10",
                fontSize: 13, fontWeight: 800,
                textDecoration: "none",
                boxShadow: `0 4px 24px ${accent}50`,
                letterSpacing: "-0.01em",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Rückfragen? Kontaktiere {agencyName}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
