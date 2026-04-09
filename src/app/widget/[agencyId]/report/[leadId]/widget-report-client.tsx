"use client";

import { useState } from "react";
import Link from "next/link";

// ── Parser ─────────────────────────────────────────────────────────────────────
type Severity = "critical" | "warning" | "good";

interface ParsedIssue {
  severity:       Severity;
  title:          string;
  description:    string;
  impact:         string;
  recommendation: string;
}

interface ParsedSection {
  heading: string;
  text:    string;
  issues:  ParsedIssue[];
  steps:   string[];
  tableRows: { label: string; status: string }[];
}

function splitBody(body: string) {
  const impactMatch = body.match(/[Aa]uswirkung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Ee]mpfehlung|$)/);
  const recMatch    = body.match(/[Ee]mpfehlung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Aa]uswirkung|$)/);
  if (impactMatch || recMatch) {
    const remaining = body
      .replace(/[Aa]uswirkung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Ee]mpfehlung|$)/, "")
      .replace(/[Ee]mpfehlung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Aa]uswirkung|$)/, "")
      .trim();
    return {
      description:    remaining,
      impact:         (impactMatch?.[1] ?? "").trim(),
      recommendation: (recMatch?.[1] ?? "").trim(),
    };
  }
  return { description: body, impact: "", recommendation: "" };
}

function parseTableRows(text: string): { label: string; status: string }[] {
  const rows = text.split("\n").filter(l => l.trim().startsWith("|"));
  if (rows.length < 2) return [];
  const dataRows = rows.filter(r => !/^[\s|:-]+$/.test(r));
  if (dataRows.length < 2) return [];
  return dataRows.slice(1).map(row => {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    return { label: cells[0] ?? "", status: cells[1] ?? "" };
  }).filter(r => r.label);
}

function parseReport(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let cur: ParsedSection = { heading: "", text: "", issues: [], steps: [], tableRows: [] };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (cur.heading || cur.text || cur.issues.length || cur.steps.length) {
        cur.tableRows = parseTableRows(cur.text);
        sections.push(cur);
      }
      cur = { heading: line.replace(/^#+\s*/, "").trim(), text: "", issues: [], steps: [], tableRows: [] };
      continue;
    }
    if (/^\d+\.\s/.test(line)) { cur.steps.push(line.replace(/^\d+\.\s*/, "").trim()); continue; }
    const m = line.match(/^\*\*(🔴|🟡|🟢)([^*]*)\*\*\s*(.*)/);
    if (m) {
      const emoji   = m[1];
      const rest    = m[3].trim();
      const dashIdx = rest.indexOf(" — ");
      const title   = dashIdx > -1 ? rest.slice(0, dashIdx).trim() : rest;
      const bodyRaw = dashIdx > -1 ? rest.slice(dashIdx + 3).trim() : "";
      const { description, impact, recommendation } = splitBody(bodyRaw);
      const severity: Severity = emoji === "🔴" ? "critical" : emoji === "🟡" ? "warning" : "good";
      cur.issues.push({ severity, title, description, impact, recommendation });
      continue;
    }
    if (line) cur.text += (cur.text ? "\n" : "") + line;
  }
  cur.tableRows = parseTableRows(cur.text);
  if (cur.heading || cur.text || cur.issues.length || cur.steps.length) sections.push(cur);
  return sections;
}

function calcScore(issues: ParsedIssue[]): number {
  return Math.max(0, Math.min(100, 100
    - issues.filter(i => i.severity === "critical").length * 15
    - issues.filter(i => i.severity === "warning").length * 5));
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  pageBg:     "#F8FAFC",           // slate-50
  white:      "#FFFFFF",
  border:     "#E2E8F0",           // slate-200
  divider:    "#F1F5F9",
  shadowSm:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
  shadowMd:   "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowLg:   "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)",
  text:       "#0D1321",
  textSub:    "#374151",
  textMuted:  "#6B7280",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FCA5A5",
  redDot:     "#EF4444",
  redLight:   "#FFE4E6",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  amberDot:   "#F59E0B",
  amberLight: "#FEF3C7",
  green:      "#15803D",
  greenBg:    "#F0FDF4",
  greenBorder:"#BBF7D0",
  greenDot:   "#22C55E",
  greenLight: "#DCFCE7",
};

// ── Score ring (right-aligned in header) ───────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const R      = 52;
  const circ   = 2 * Math.PI * R;
  const dash   = (score / 100) * circ;
  const color  = score < 50 ? T.redDot : score < 80 ? T.amberDot : T.greenDot;
  const label  = score < 50 ? "Kritisch" : score < 80 ? "Ausbaufähig" : "Gut";
  const lBg    = score < 50 ? T.redBg   : score < 80 ? T.amberBg   : T.greenBg;
  const lColor = score < 50 ? T.red     : score < 80 ? T.amber     : T.green;
  const lBdr   = score < 50 ? T.redBorder : score < 80 ? T.amberBorder : T.greenBorder;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120"
          style={{
            transform: "rotate(-90deg)",
            filter: `drop-shadow(0 0 12px ${color}50)`,
          }}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle cx="60" cy="60" r={R} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</span>
          <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, marginTop: 1 }}>/100</span>
        </div>
      </div>
      <span style={{
        padding: "4px 14px", borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        background: lBg, color: lColor, border: `1px solid ${lBdr}`,
        letterSpacing: "0.04em",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Status pill for table rows ─────────────────────────────────────────────────
function StatusPill({ text }: { text: string }) {
  const isGood = /gut|✅|ok|pass/.test(text.toLowerCase());
  const isBad  = /kritisch|❌|fehler|schlecht/.test(text.toLowerCase());
  const color  = isGood ? T.green  : isBad ? T.red   : T.amber;
  const bg     = isGood ? T.greenBg : isBad ? T.redBg : T.amberBg;
  const bdr    = isGood ? T.greenBorder : isBad ? T.redBorder : T.amberBorder;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 700,
      color, background: bg, border: `1px solid ${bdr}`,
    }}>{text}</span>
  );
}

// ── Issue card — analytics dashboard style ─────────────────────────────────────
function IssueCard({ issue }: { issue: ParsedIssue }) {
  const dotColor   = issue.severity === "critical" ? T.redDot   : issue.severity === "warning" ? T.amberDot  : T.greenDot;
  const accentColor = issue.severity === "critical" ? T.red      : issue.severity === "warning" ? T.amber     : T.green;
  const badgeBg    = issue.severity === "critical" ? T.redBg    : issue.severity === "warning" ? T.amberBg   : T.greenBg;
  const badgeBdr   = issue.severity === "critical" ? T.redBorder : issue.severity === "warning" ? T.amberBorder : T.greenBorder;
  const badgeLabel = issue.severity === "critical" ? "Dringend handeln" : issue.severity === "warning" ? "Empfehlung" : "Optimiert";

  const hasGrid = issue.description && issue.impact;

  return (
    <div className="problem-card" style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 24,
      boxShadow: T.shadowMd,
    }}>
      {/* Card header: colored dot + title + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{
          flexShrink: 0, marginTop: 3,
          width: 12, height: 12, borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 0 3px ${dotColor}25`,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.35, flex: 1 }}>
              {issue.title}
            </p>
            <span style={{
              flexShrink: 0,
              padding: "3px 10px", borderRadius: 6,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.07em",
              background: badgeBg, color: accentColor, border: `1px solid ${badgeBdr}`,
            }}>
              {badgeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 2-column grid for description + impact */}
      {hasGrid ? (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          {/* Left: Was ist das? */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: T.divider, border: `1px solid ${T.border}`,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Was ist das Problem?
            </p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
              {issue.description || issue.title}
            </p>
          </div>
          {/* Right: Auswirkung */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: `${dotColor}08`, border: `1px solid ${dotColor}25`,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Auswirkung
            </p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
              {issue.impact}
            </p>
          </div>
        </div>
      ) : (
        /* Single column fallback */
        (issue.description || issue.impact) && (
          <p style={{ margin: "0", fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
            {issue.description || issue.impact}
          </p>
        )
      )}

      {/* Empfehlung */}
      {issue.recommendation && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 10,
          background: T.blueBg, border: `1px solid ${T.blueBorder}`,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Empfehlung
            </p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
              {issue.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PDF button ─────────────────────────────────────────────────────────────────
function PDFButton({ leadId, accentColor }: { leadId: string; accentColor: string }) {
  const [state, setState] = useState<"idle" | "printing" | "done">("idle");

  async function handlePrint() {
    setState("printing");
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
      className="no-print"
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 20px", borderRadius: 10,
        background: state === "done" ? T.greenBg : accentColor,
        border: `1px solid ${state === "done" ? T.greenBorder : "transparent"}`,
        color: state === "done" ? T.green : "#fff",
        fontSize: 13, fontWeight: 700,
        cursor: state === "printing" ? "default" : "pointer",
        boxShadow: state === "done" ? "none" : `0 4px 14px ${accentColor}40`,
        transition: "all 0.2s",
        opacity: state === "printing" ? 0.7 : 1,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {state === "printing" ? "Vorbereiten…" : state === "done" ? "✓ PDF gespeichert" : "Als PDF exportieren"}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
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
  const sections     = parseReport(diagnose);
  const allIssues    = sections.flatMap(s => s.issues);
  const calcedScore  = calcScore(allIssues);
  const displayScore = allIssues.length > 0 ? calcedScore : score;

  const critical = allIssues.filter(i => i.severity === "critical").length;
  const warnings = allIssues.filter(i => i.severity === "warning").length;
  const good     = allIssues.filter(i => i.severity === "good").length;

  const domain  = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const dateStr = new Date(scannedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  const summarySection = sections.find(s => !s.heading || /zusammenfassung|summary/i.test(s.heading));
  const issueSections  = sections.filter(s => s.issues.length > 0 && !/zusammenfassung/i.test(s.heading));
  const stepSections   = sections.filter(s => s.steps.length > 0);
  const proseSections  = sections.filter(s =>
    s.heading && (s.text || s.tableRows.length > 0) &&
    s.issues.length === 0 && s.steps.length === 0 &&
    !/zusammenfassung/i.test(s.heading)
  );

  const color  = agencyColor || T.blue;
  const agName = agencyName  || "Deine Agentur";

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print  { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; font-size: 11pt !important; line-height: 1.5 !important; }
          .problem-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          @page { size: A4; margin: 14mm 12mm 18mm; }
          @page {
            @bottom-right {
              content: "Seite " counter(page) " von " counter(pages);
              font-size: 9pt; color: #94A3B8;
              font-family: system-ui, sans-serif;
            }
          }
        }
        @media screen { .print-only { display: none !important; } }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: T.pageBg,      // slate-50 — white cards will "pop"
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: T.text,
      }}>

        {/* ── Print-only report header ── */}
        <div className="print-only" style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingBottom: 14, borderBottom: "2px solid #E2E8F0",
          }}>
            {agencyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agencyLogo} alt={agName} style={{ maxHeight: 48, maxWidth: 140, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 800, color }}>{agName}</span>
            )}
            <div style={{ textAlign: "right", fontSize: 11, color: T.textMuted }}>
              <div style={{ fontWeight: 600 }}>Website-Analyse Report</div>
              <div>{domain} · {dateStr}</div>
            </div>
          </div>
        </div>

        {/* ── Sticky top bar ── */}
        <header className="no-print" style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${T.border}`,
          padding: "10px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: T.shadowSm,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {agencyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agencyLogo} alt={agName}
                style={{ maxHeight: 32, maxWidth: 110, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 800, color }}>{agName}</span>
            )}
            <span style={{ width: 1, height: 16, background: T.border }} />
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>Website-Analyse Report</span>
          </div>
          <PDFButton leadId={leadId} accentColor={color} />
        </header>

        {/* ── Centered container (max-w-5xl) ── */}
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* ════════ 1. HEADER CARD ════════ */}
          <div className="problem-card" style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "28px 32px",
            boxShadow: T.shadowLg,
            marginBottom: 20,
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 32,
            flexWrap: "wrap",
          }}>
            {/* LEFT: meta info */}
            <div style={{ flex: 1, minWidth: 220 }}>
              {/* Agency branding */}
              {agencyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agencyLogo} alt={agName}
                  style={{ maxHeight: 48, maxWidth: 140, objectFit: "contain", marginBottom: 16 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
                  padding: "5px 12px", borderRadius: 20,
                  background: `${color}12`, border: `1px solid ${color}30`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{agName}</span>
                </div>
              )}

              <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Website-Analyse Report
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, width: 50 }}>URL</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: T.textSub,
                    background: T.divider, padding: "3px 10px", borderRadius: 6,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280,
                  }}>{domain}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, width: 50 }}>Datum</span>
                  <span style={{ fontSize: 13, color: T.textSub }}>{dateStr}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, width: 50 }}>E-Mail</span>
                  <span style={{ fontSize: 13, color: T.textSub }}>{email}</span>
                </div>
              </div>

              {/* Issue count badges */}
              {allIssues.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
                  {critical > 0 && (
                    <span style={{ padding: "4px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>
                      ⚡ {critical} Dringend
                    </span>
                  )}
                  {warnings > 0 && (
                    <span style={{ padding: "4px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBorder}` }}>
                      ● {warnings} Empfehlung
                    </span>
                  )}
                  {good > 0 && (
                    <span style={{ padding: "4px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}` }}>
                      ✓ {good} Optimiert
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: score ring */}
            <ScoreRing score={displayScore} />
          </div>

          {/* ════════ 2. ZUSAMMENFASSUNG — border-l-4 blue ════════ */}
          {summarySection?.text && (
            <div style={{
              background: T.blueBg,
              border: `1px solid ${T.blueBorder}`,
              borderLeft: `4px solid ${T.blue}`,     // ← border-l-4 border-blue-500
              borderRadius: "0 12px 12px 0",
              padding: "20px 22px",
              marginBottom: 24,
              boxShadow: T.shadowSm,
            }}>
              <p style={{
                margin: "0 0 10px", fontSize: 10, fontWeight: 700,
                color: T.blue, textTransform: "uppercase", letterSpacing: "0.08em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>🤖</span> Management-Zusammenfassung
              </p>
              {summarySection.text.split("\n").map((line, i) => (
                <p key={i} style={{
                  margin: "4px 0 0", fontSize: 14, color: T.textSub,
                  lineHeight: 1.8,   // leading-relaxed
                }}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* ════════ 3. PROBLEM CARDS ════════ */}
          {issueSections.map((section, si) => (
            <div key={si} style={{ marginBottom: 32 }}>
              {section.heading && (
                <p style={{
                  margin: "0 0 14px", fontSize: 11, fontWeight: 700,
                  color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  {section.heading}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {section.issues.map((issue, ii) => <IssueCard key={ii} issue={issue} />)}
              </div>
            </div>
          ))}

          {/* Flat fallback */}
          {issueSections.length === 0 && allIssues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              {allIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
            </div>
          )}

          {/* ════════ 4. SEITENTYP-BEWERTUNG (prose / table) ════════ */}
          {proseSections.map((section, si) => (
            <div key={si} style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {section.heading}
              </p>
              <div style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: 16, overflow: "hidden",
                boxShadow: T.shadowMd,
              }}>
                {section.tableRows.length > 0 ? (
                  // Horizontal row list with status pills
                  section.tableRows.map((row, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 20px",
                      borderBottom: i < section.tableRows.length - 1 ? `1px solid ${T.divider}` : "none",
                      background: i % 2 === 0 ? T.white : T.pageBg,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{row.label}</span>
                      <StatusPill text={row.status} />
                    </div>
                  ))
                ) : (
                  // Plain text rows
                  section.text.split("\n").map((line, i) => (
                    <div key={i} style={{
                      padding: "10px 20px",
                      borderBottom: i < section.text.split("\n").length - 1 ? `1px solid ${T.divider}` : "none",
                      fontSize: 13, color: T.textSub, lineHeight: 1.7,
                    }}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {/* ════════ 5. HANDLUNGSEMPFEHLUNGEN (steps) ════════ */}
          {stepSections.map((section, si) => (
            <div key={si} style={{ marginBottom: 32 }}>
              {section.heading && (
                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {section.heading}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.steps.map((step, i) => (
                  <div key={i} className="problem-card" style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "16px 20px",
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    boxShadow: T.shadowSm,
                  }}>
                    <span style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                      background: color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}>{i + 1}</span>
                    <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Fallback: raw text */}
          {sections.length === 0 && diagnose && (
            <div style={{
              padding: 24, background: T.white,
              border: `1px solid ${T.border}`, borderRadius: 16,
              boxShadow: T.shadowSm, marginBottom: 24,
            }}>
              <p style={{ margin: 0, color: T.textSub, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {diagnose}
              </p>
            </div>
          )}

          {/* ════════ CTA block (screen only) ════════ */}
          <div className="no-print" style={{
            padding: "28px 28px",
            background: T.white,
            border: `1px solid ${T.border}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: "0 16px 16px 0",
            boxShadow: T.shadowMd,
            marginBottom: 32,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: T.text }}>
              {agName} hilft dir, diese Probleme zu lösen.
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
              Wir haben deinen vollständigen Report erhalten und melden uns in Kürze bei dir.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/register" style={{
                display: "inline-block", padding: "10px 22px",
                background: color, color: "#fff",
                textDecoration: "none", borderRadius: 9,
                fontWeight: 700, fontSize: 13,
                boxShadow: `0 4px 14px ${color}40`,
              }}>
                Selbst optimieren →
              </Link>
              <PDFButton leadId={leadId} accentColor={color} />
            </div>
          </div>

          {/* Footer */}
          <div className="no-print" style={{ textAlign: "center" }}>
            <a href="https://website-fix.com" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: T.textMuted, textDecoration: "none", fontWeight: 600 }}>
              Powered by WebsiteFix
            </a>
            <span style={{ margin: "0 8px", color: T.border }}>·</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>KI-gestützte Website-Analyse</span>
          </div>
        </main>
      </div>
    </>
  );
}
