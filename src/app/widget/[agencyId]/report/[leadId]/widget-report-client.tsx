"use client";

import { useState } from "react";
import Link from "next/link";

// ── Parser (mirrors diagnose-report.tsx logic) ────────────────────────────────

type Severity = "critical" | "warning" | "good";

interface ParsedIssue {
  severity: Severity;
  title:    string;
  body:     string;
}

interface ParsedSection {
  heading: string;
  text:    string;
  issues:  ParsedIssue[];
  steps:   string[];
}

function parseReport(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let cur: ParsedSection = { heading: "", text: "", issues: [], steps: [] };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (cur.heading || cur.text || cur.issues.length || cur.steps.length) sections.push(cur);
      cur = { heading: line.replace(/^#+\s*/, "").trim(), text: "", issues: [], steps: [] };
      continue;
    }
    if (/^\d+\.\s/.test(line)) { cur.steps.push(line.replace(/^\d+\.\s*/, "").trim()); continue; }
    const m = line.match(/^\*\*(🔴|🟡|🟢)([^*]*)\*\*\s*(.*)/);
    if (m) {
      const emoji    = m[1];
      const rest     = m[3].trim();
      const dashIdx  = rest.indexOf(" — ");
      const title    = dashIdx > -1 ? rest.slice(0, dashIdx).trim() : rest;
      const body     = dashIdx > -1 ? rest.slice(dashIdx + 3).trim() : "";
      const severity: Severity = emoji === "🔴" ? "critical" : emoji === "🟡" ? "warning" : "good";
      cur.issues.push({ severity, title, body });
      continue;
    }
    if (line) cur.text += (cur.text ? "\n" : "") + line;
  }
  if (cur.heading || cur.text || cur.issues.length || cur.steps.length) sections.push(cur);
  return sections;
}

function calcScore(issues: ParsedIssue[]): number {
  const crit = issues.filter(i => i.severity === "critical").length;
  const warn = issues.filter(i => i.severity === "warning").length;
  return Math.max(0, Math.min(100, 100 - crit * 15 - warn * 5));
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const GLASS = {
  critical: {
    bg:     "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.2)",
    accent: "#EF4444",
    badge:  { bg: "rgba(239,68,68,0.12)", color: "#FF6B6B", label: "Dringend handeln" },
  },
  warning: {
    bg:     "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.2)",
    accent: "#F59E0B",
    badge:  { bg: "rgba(245,158,11,0.12)", color: "#FBB040", label: "Empfehlung" },
  },
  good: {
    bg:     "rgba(34,197,94,0.05)",
    border: "rgba(34,197,94,0.18)",
    accent: "#22C55E",
    badge:  { bg: "rgba(34,197,94,0.1)", color: "#4ADE80", label: "Optimiert" },
  },
};

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const R = 52, cx = 60, cy = 60;
  const circ   = 2 * Math.PI * R;
  const filled = (score / 100) * circ;
  const label  = score >= 80 ? "Gut" : score >= 55 ? "Ausbaufähig" : "Kritisch";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2, letterSpacing: "0.06em" }}>/ 100</span>
        </div>
      </div>
      <div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10,
          padding: "4px 12px", borderRadius: 20,
          background: `${color}14`, border: `1px solid ${color}35`,
          fontSize: 12, fontWeight: 700, color,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
          {label}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Dein Website-Score basiert auf KI-Analyse aller technischen, SEO- und
          Barrierefreiheits-Faktoren.
        </p>
      </div>
    </div>
  );
}

// ── Issue card (glassmorphism) ────────────────────────────────────────────────

function IssueCard({ issue }: { issue: ParsedIssue }) {
  const cfg = GLASS[issue.severity];
  return (
    <div style={{
      background: cfg.bg,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.accent}`,
      borderRadius: "0 12px 12px 0",
      padding: "14px 18px",
      boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 5,
          background: cfg.badge.bg, color: cfg.badge.color,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {issue.severity === "critical" ? "⚡" : issue.severity === "warning" ? "●" : "✓"}{" "}
          {cfg.badge.label}
        </span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
        {issue.title}
      </p>
      {issue.body && (
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
          {issue.body}
        </p>
      )}
    </div>
  );
}

// ── Category score bar ────────────────────────────────────────────────────────

function CategoryBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
        <div style={{
          height: "100%", borderRadius: 2, background: color,
          width: `${pct}%`, transition: "width 1.2s ease",
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
    </div>
  );
}

// ── PDF button with logging ───────────────────────────────────────────────────

function PDFButton({ leadId }: { leadId: string }) {
  const [state, setState] = useState<"idle" | "printing" | "done">("idle");

  async function handlePrint() {
    setState("printing");
    // Log the PDF download
    fetch("/api/widget/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    }).catch(() => null);

    setTimeout(() => {
      window.print();
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    }, 150);
  }

  return (
    <button
      onClick={handlePrint}
      disabled={state === "printing"}
      className="wf-no-print"
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 20px", borderRadius: 10,
        background: state === "done" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${state === "done" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.12)"}`,
        color: state === "done" ? "#4ADE80" : "rgba(255,255,255,0.7)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {state === "printing" ? "Vorbereiten…" : state === "done" ? "✓ PDF gespeichert" : "Als PDF exportieren"}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WidgetReportClient({
  leadId, email, url, score, diagnose, scannedAt,
  agencyName, agencyColor, agencyLogo,
}: {
  leadId:      string;
  email:       string;
  url:         string;
  score:       number;
  diagnose:    string;
  scannedAt:   string;
  agencyName:  string;
  agencyColor: string;
  agencyLogo:  string | null;
}) {
  const sections   = parseReport(diagnose);
  const allIssues  = sections.flatMap(s => s.issues);
  const calcedScore = calcScore(allIssues);
  const displayScore = allIssues.length > 0 ? calcedScore : score;

  const critical = allIssues.filter(i => i.severity === "critical").length;
  const warnings = allIssues.filter(i => i.severity === "warning").length;
  const good     = allIssues.filter(i => i.severity === "good").length;

  const scoreColor = displayScore >= 80 ? "#22C55E" : displayScore >= 55 ? "#F59E0B" : "#EF4444";
  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const dateStr = new Date(scannedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  // Category scores (rough estimate from issue distribution)
  const hasIssues = allIssues.length > 0;
  const seoScore  = Math.max(0, 100 - allIssues.filter(i => /title|meta|h1|seo|index|canonical/i.test(i.title + i.body)).length * 18);
  const a11yScore = Math.max(0, 100 - allIssues.filter(i => /alt|bfsg|aria|kontrast|wcag|barriere/i.test(i.title + i.body)).length * 20);
  const perfScore = Math.max(0, 100 - allIssues.filter(i => /performance|ladezeit|speed|lcp/i.test(i.title + i.body)).length * 25);

  // Sections to render
  const summarySection = sections.find(s => !s.heading || /zusammenfassung|summary/i.test(s.heading));
  const issueSections  = sections.filter(s => s.issues.length > 0 && !/zusammenfassung/i.test(s.heading));
  const stepSections   = sections.filter(s => s.steps.length > 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0b0c10 0%, #0f1118 100%)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      color: "#fff",
    }}>
      {/* Print-only header */}
      <div className="wf-print-header" style={{ display: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 12, marginBottom: 24,
          borderBottom: "2px solid #E2E8F0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ background: "#0D1117", borderRadius: 7, padding: 3 }}>
              <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 300, fontSize: 16, color: "#0F172A" }}>
              Website<span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: "#94A3B8" }}>· {agencyName}</span>
            </span>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#94A3B8" }}>
            <div>Website-Analyse Report</div>
            <div>{domain} · {dateStr}</div>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <header className="wf-no-print" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {agencyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agencyLogo} alt={agencyName} style={{ height: 24, objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: agencyColor }}>{agencyName}</span>
          )}
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Website-Analyse Report</span>
        </div>
        <PDFButton leadId={leadId} />
      </header>

      <main id="wf-print-root" style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Hero: score + domain */}
        <div style={{
          padding: "32px 32px 24px",
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, marginBottom: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {dateStr}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{domain}</span>
          </div>

          <ScoreRing score={displayScore} color={scoreColor} />

          {/* Issue count strip */}
          {hasIssues && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {critical > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#FF6B6B", border: "1px solid rgba(239,68,68,0.2)" }}>
                  ⚡ {critical} Dringend
                </span>
              )}
              {warnings > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", color: "#FBB040", border: "1px solid rgba(245,158,11,0.2)" }}>
                  ● {warnings} Empfehlung
                </span>
              )}
              {good > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, background: "rgba(34,197,94,0.08)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.18)" }}>
                  ✓ {good} Optimiert
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 24 }}>

          {/* Summary text */}
          {summarySection?.text && (
            <div style={{
              padding: "20px 22px",
              background: "rgba(79,142,247,0.06)",
              border: "1px solid rgba(79,142,247,0.18)",
              borderRadius: 14,
              backdropFilter: "blur(10px)",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "rgba(79,142,247,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Zusammenfassung
              </p>
              {summarySection.text.split("\n").map((line, i) => (
                <p key={i} style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{line}</p>
              ))}
            </div>
          )}

          {/* Category scores */}
          {hasIssues && (
            <div style={{
              padding: "20px 22px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
            }}>
              <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Bereiche
              </p>
              <CategoryBar label="SEO" pct={seoScore} color={seoScore >= 80 ? "#22C55E" : seoScore >= 55 ? "#F59E0B" : "#EF4444"} />
              <CategoryBar label="Barrierefreiheit" pct={a11yScore} color={a11yScore >= 80 ? "#22C55E" : a11yScore >= 55 ? "#F59E0B" : "#EF4444"} />
              <CategoryBar label="Performance" pct={perfScore} color={perfScore >= 80 ? "#22C55E" : perfScore >= 55 ? "#F59E0B" : "#EF4444"} />
            </div>
          )}
        </div>

        {/* Issue cards */}
        {issueSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 24 }}>
            {section.heading && (
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {section.heading}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {section.issues.map((issue, ii) => <IssueCard key={ii} issue={issue} />)}
            </div>
          </div>
        ))}

        {/* Flat list fallback */}
        {issueSections.length === 0 && allIssues.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {allIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
        )}

        {/* Steps / Handlungsempfehlungen */}
        {stepSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 24 }}>
            {section.heading && (
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {section.heading}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.steps.map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                    background: agencyColor, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                  }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Fallback: raw text */}
        {sections.length === 0 && diagnose && (
          <div style={{
            padding: "20px", background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
            marginBottom: 24,
          }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {diagnose}
            </p>
          </div>
        )}

        {/* CTA: contact agency */}
        <div className="wf-no-print" style={{
          padding: "24px 28px",
          background: `linear-gradient(135deg, ${agencyColor}10, transparent)`,
          border: `1px solid ${agencyColor}25`,
          borderRadius: 16, marginBottom: 32,
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {agencyName} hilft dir, diese Probleme zu lösen.
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Wir haben den vollständigen Report erhalten und melden uns in Kürze bei dir.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/register" style={{
              display: "inline-block", padding: "10px 24px",
              background: agencyColor, color: "#fff",
              textDecoration: "none", borderRadius: 9,
              fontWeight: 700, fontSize: 13,
              boxShadow: `0 4px 16px ${agencyColor}40`,
            }}>
              Selbst optimieren →
            </Link>
            <PDFButton leadId={leadId} />
          </div>
        </div>

        {/* Footer */}
        <div className="wf-no-print" style={{ textAlign: "center" }}>
          <a href="https://website-fix.com" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 11, textDecoration: "none",
            background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(245,158,11,0.45))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Powered by WebsiteFix
          </a>
          <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.08)" }}>·</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.12)" }}>KI-gestützte Website-Analyse</span>
        </div>
      </main>
    </div>
  );
}
