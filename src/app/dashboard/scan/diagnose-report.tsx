"use client";

/**
 * DiagnoseReport
 *
 * Transforms the plain-text AI diagnosis into a structured, card-based
 * dashboard view with severity badges, category icons, a summary bar,
 * and a print-to-PDF button.
 *
 * Works for both /api/scan (website check) and /api/full-scan output.
 */

import { useState } from "react";
import {
  Download, Search, Zap, Eye, Shield, Link2, ImageIcon,
  Code2, AlertCircle, CheckCircle2, AlertTriangle, XCircle,
  CalendarDays, Globe, FileText,
} from "lucide-react";

// ── Light-mode tokens (matches dashboard-scan-client) ─────────────────────────
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  shadowMd:    "0 2px 12px rgba(0,0,0,0.10)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBorder: "#A7F3D0",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FCA5A5",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "good";

interface ParsedIssue {
  severity: Severity;
  title:    string;
  body:     string;
  raw:      string;
}

interface ParsedSection {
  heading: string;
  text:    string;         // raw non-issue lines joined
  issues:  ParsedIssue[];
  steps:   string[];
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseReport(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let cur: ParsedSection = { heading: "", text: "", issues: [], steps: [] };

  for (const raw of text.split("\n")) {
    const line = raw.trim();

    // New section heading
    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (cur.heading || cur.text || cur.issues.length || cur.steps.length) {
        sections.push(cur);
      }
      cur = { heading: line.replace(/^#+\s*/, "").trim(), text: "", issues: [], steps: [] };
      continue;
    }

    // Numbered step
    if (/^\d+\.\s/.test(line)) {
      cur.steps.push(line.replace(/^\d+\.\s*/, "").trim());
      continue;
    }

    // Issue line: starts with **🔴 / **🟡 / **🟢
    const issueMatch = line.match(/^\*\*(🔴|🟡|🟢)([^*]*)\*\*\s*(.*)/);
    if (issueMatch) {
      const emoji    = issueMatch[1];
      const label    = issueMatch[2].trim(); // e.g. "KRITISCH" or empty
      const rest     = issueMatch[3].trim(); // everything after **…**
      // Split on first " — " to separate title from body
      const dashIdx  = rest.indexOf(" — ");
      const title    = dashIdx > -1 ? rest.slice(0, dashIdx).trim() : rest;
      const body     = dashIdx > -1 ? rest.slice(dashIdx + 3).trim() : "";
      const severity: Severity =
        emoji === "🔴" ? "critical" : emoji === "🟡" ? "warning" : "good";
      void label;
      cur.issues.push({ severity, title, body, raw: line });
      continue;
    }

    // Regular text line
    if (line) cur.text += (cur.text ? "\n" : "") + line;
  }

  if (cur.heading || cur.text || cur.issues.length || cur.steps.length) {
    sections.push(cur);
  }
  return sections;
}

// ── Category detection ────────────────────────────────────────────────────────

type Category = { label: string; Icon: React.FC<{ size?: number; color?: string }> };

function detectCategory(text: string): Category {
  const t = text.toLowerCase();
  if (/alt.?text|barrierefreiheit|wcag|bfsg|aria|kontrast|zugänglich/.test(t))
    return { label: "BFSG", Icon: Eye };
  if (/ssl|https|sicherheit|zertifikat|security/.test(t))
    return { label: "Sicherheit", Icon: Shield };
  if (/performance|ladezeit|speed|lcp|cls|pagespeed|core web/.test(t))
    return { label: "Performance", Icon: Zap };
  if (/link|404|broken|defekt|verwaist/.test(t))
    return { label: "Links", Icon: Link2 };
  if (/bild|image|foto|alt/.test(t))
    return { label: "Bilder", Icon: ImageIcon };
  if (/javascript|html|css|code|skript|fehler|wp|wordpress/.test(t))
    return { label: "Technik", Icon: Code2 };
  if (/title|meta|h1|noindex|canonical|sitemap|seo|indexier/.test(t))
    return { label: "SEO", Icon: Search };
  return { label: "Allgemein", Icon: AlertCircle };
}

// ── Score calculation ─────────────────────────────────────────────────────────

function calcScore(issues: ParsedIssue[]): number {
  const critCount = issues.filter(i => i.severity === "critical").length;
  const warnCount = issues.filter(i => i.severity === "warning").length;
  return Math.max(0, Math.min(100, 100 - critCount * 15 - warnCount * 5));
}

function scoreColor(score: number) {
  if (score >= 80) return { color: C.green,  bg: C.greenBg,  border: C.greenBorder };
  if (score >= 60) return { color: C.amber,  bg: C.amberBg,  border: C.amberBorder };
  return             { color: C.red,    bg: C.redBg,    border: C.redBorder   };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const conf = {
    critical: { label: "Dringend handeln", bg: C.redBg,   color: C.red,   border: C.redBorder,   Icon: XCircle       },
    warning:  { label: "Empfehlung",       bg: C.amberBg, color: C.amber, border: C.amberBorder, Icon: AlertTriangle  },
    good:     { label: "Optimiert",        bg: C.greenBg, color: C.green, border: C.greenBorder, Icon: CheckCircle2   },
  }[severity];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      padding: "3px 8px", borderRadius: 5,
      background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`,
    }}>
      <conf.Icon size={10} />
      {conf.label}
    </span>
  );
}

function IssueCard({ issue }: { issue: ParsedIssue }) {
  const accentColor = issue.severity === "critical" ? C.red
                    : issue.severity === "warning"  ? C.amber
                    : C.green;
  const cat = detectCategory(issue.title + " " + issue.body);

  return (
    <div className="wf-issue-card" style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: "0 10px 10px 0",
      padding: "14px 18px",
      boxShadow: C.shadow,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <SeverityBadge severity={issue.severity} />
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
          background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`,
        }}>
          <cat.Icon size={10} />
          {cat.label}
        </span>
      </div>
      {/* Title */}
      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
        {issue.title}
      </p>
      {/* Body */}
      {issue.body && (
        <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
          {issue.body}
        </p>
      )}
    </div>
  );
}

function SummaryBar({
  url, totalPages, issueCount, score, scannedAt,
}: {
  url?: string; totalPages?: number; issueCount?: number;
  score: number; scannedAt?: string | null;
}) {
  const sc    = scoreColor(score);
  const host  = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : null;
  const dateStr = scannedAt
    ? new Date(scannedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

  const stats = [
    host     ? { Icon: Globe,       label: host,           color: C.textSub  } : null,
    scannedAt? { Icon: CalendarDays, label: dateStr,        color: C.textSub  } : null,
    totalPages ? { Icon: FileText,   label: `${totalPages} Seiten`, color: C.textSub } : null,
    issueCount != null ? {
      Icon: AlertCircle,
      label: `${issueCount} Problem${issueCount !== 1 ? "e" : ""}`,
      color: issueCount === 0 ? C.green : issueCount <= 3 ? C.amber : C.red,
    } : null,
  ].filter(Boolean) as { Icon: React.FC<{ size?: number; color?: string }>; label: string; color: string }[];

  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
      padding: "10px 14px", background: C.divider, borderRadius: 8, marginBottom: 20,
    }}>
      {stats.map((s, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 500, color: s.color,
          paddingRight: i < stats.length - 1 ? 10 : 0,
          borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : "none",
          marginRight: i < stats.length - 1 ? 4 : 0,
        }}>
          <s.Icon size={12} color={s.color} />
          {s.label}
        </span>
      ))}
      {/* Score pill */}
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
      }}>
        Score {score}/100
      </span>
    </div>
  );
}

// ── PDF button ────────────────────────────────────────────────────────────────

function PDFButton() {
  const [printing, setPrinting] = useState(false);

  function handlePrint() {
    setPrinting(true);
    // Short delay so "printing…" renders before the print dialog opens
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 120);
  }

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className="wf-no-print"
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 7,
        border: `1px solid ${C.border}`, background: C.card,
        cursor: printing ? "default" : "pointer",
        color: C.textSub, fontSize: 12, fontWeight: 500,
        opacity: printing ? 0.5 : 1, transition: "opacity 0.15s",
      }}
    >
      <Download size={12} />
      {printing ? "Vorbereiten..." : "Als PDF exportieren"}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DiagnoseReport({
  diagnose,
  url,
  totalPages,
  issueCount: issueCountProp,
  scannedAt,
}: {
  diagnose:     string;
  url?:         string;
  totalPages?:  number;
  issueCount?:  number;
  scannedAt?:   string | null;
}) {
  const sections   = parseReport(diagnose);
  const allIssues  = sections.flatMap(s => s.issues);
  const score      = calcScore(allIssues);
  const critCount  = allIssues.filter(i => i.severity === "critical").length;
  const warnCount  = allIssues.filter(i => i.severity === "warning").length;
  const goodCount  = allIssues.filter(i => i.severity === "good").length;
  const issueCount = issueCountProp ?? (critCount + warnCount);

  // Summary = first section without a heading OR the "Zusammenfassung" section
  const summarySection = sections.find(s =>
    !s.heading || /zusammenfassung|summary/i.test(s.heading)
  );

  // Issue sections = sections that contain at least one 🔴/🟡/🟢 line
  const issueSections = sections.filter(s =>
    s.issues.length > 0 && !/zusammenfassung|summary/i.test(s.heading)
  );

  // Step sections = sections with numbered steps
  const stepSections = sections.filter(s =>
    s.steps.length > 0
  );

  // Other prose sections (e.g. Seitentyp-Bewertung)
  const proseSections = sections.filter(s =>
    s.heading &&
    s.text &&
    s.issues.length === 0 &&
    s.steps.length === 0 &&
    !/zusammenfassung|summary/i.test(s.heading)
  );

  return (
    <div id="wf-print-root">
      {/* Print-only header — hidden on screen, shown in PDF */}
      <div className="wf-print-header" style={{ display: "none", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "2px solid #E2E8F0" }}>
          {/* Logo mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style={{ background: "#0D1117", borderRadius: 7, padding: 3 }}>
              <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 300, fontSize: 16, color: "#0F172A" }}>
              Website<span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span>
            </span>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#94A3B8" }}>
            <div>Website-Analyse Report</div>
            <div>{url ?? ""} · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* PDF export button row */}
      <div className="wf-no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <PDFButton />
      </div>

      {/* Summary bar */}
      <SummaryBar
        url={url}
        totalPages={totalPages}
        issueCount={issueCount}
        score={score}
        scannedAt={scannedAt}
      />

      {/* Zusammenfassung */}
      {summarySection?.text && (
        <div style={{
          padding: "14px 18px", background: C.blueBg, borderRadius: 10,
          border: `1px solid ${C.blueBorder}`, marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Zusammenfassung
          </p>
          {summarySection.text.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "4px 0 0", fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Issue count strip */}
      {allIssues.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {critCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}` }}>
              <XCircle size={12} /> {critCount} Kritisch
            </span>
          )}
          {warnCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}` }}>
              <AlertTriangle size={12} /> {warnCount} Wichtig
            </span>
          )}
          {goodCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
              <CheckCircle2 size={12} /> {goodCount} Gut
            </span>
          )}
        </div>
      )}

      {/* Issue cards */}
      {issueSections.map((section, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          {section.heading && (
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {section.heading}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {section.issues.map((issue, ii) => (
              <IssueCard key={ii} issue={issue} />
            ))}
          </div>
        </div>
      ))}

      {/* If no structured issue sections found, render issues from all sections */}
      {issueSections.length === 0 && allIssues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {allIssues.map((issue, ii) => <IssueCard key={ii} issue={issue} />)}
        </div>
      )}

      {/* Prose sections (e.g. Seitentyp-Bewertung) */}
      {proseSections.map((section, si) => (
        <div key={si} style={{
          padding: "14px 18px", background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, marginBottom: 14, boxShadow: C.shadow,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {section.heading}
          </p>
          {section.text.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "3px 0", fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
              {line}
            </p>
          ))}
        </div>
      ))}

      {/* Handlungsempfehlungen / Steps */}
      {stepSections.map((section, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          {section.heading && (
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {section.heading}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {section.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "10px 14px", background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 8,
                boxShadow: C.shadow,
              }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                  background: C.blue, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fallback: raw text for anything that didn't parse */}
      {sections.length === 0 && (
        <p style={{ color: C.textSub, fontSize: 13, lineHeight: 1.7 }}>{diagnose}</p>
      )}
    </div>
  );
}
