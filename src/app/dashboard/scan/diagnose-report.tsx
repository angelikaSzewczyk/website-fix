"use client";

/**
 * DiagnoseReport — Premium redesign
 *
 * - Large score ring hero section
 * - IssueCards with 24px padding, 12px radius, structured sub-fields
 *   (Beschreibung / Auswirkung / Empfehlung) with Lucide icons
 * - Seitentyp-Bewertung: markdown table → status-badge grid
 * - Clean white/dark-navy color scheme, WebsiteFix blue accents
 * - Print-safe: page-break-inside:avoid, color-adjust:exact
 */

import { useState } from "react";
import {
  Download, Search, Zap, Eye, Shield, Link2, ImageIcon,
  Code2, AlertCircle, CheckCircle2, AlertTriangle, XCircle,
  CalendarDays, FileText, Lightbulb,
} from "lucide-react";

// ── Design tokens — dark glassmorphism ────────────────────────────────────────
const C = {
  bg:          "#0a0a0a",
  card:        "rgba(255,255,255,0.04)",
  border:      "rgba(255,255,255,0.09)",
  divider:     "rgba(255,255,255,0.05)",
  shadow:      "0 1px 12px rgba(0,0,0,0.5)",
  shadowMd:    "0 4px 24px rgba(0,0,0,0.55)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.35)",
  blue:        "#7aa6ff",
  blueBg:      "rgba(37,99,235,0.12)",
  blueBorder:  "rgba(37,99,235,0.3)",
  blueDark:    "#2563EB",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.25)",
  greenLight:  "rgba(74,222,128,0.05)",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.08)",
  amberBorder: "rgba(251,191,36,0.25)",
  amberLight:  "rgba(251,191,36,0.05)",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.08)",
  redBorder:   "rgba(248,113,113,0.25)",
  redLight:    "rgba(248,113,113,0.05)",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity = "critical" | "warning" | "good";

interface ParsedIssue {
  severity:    Severity;
  title:       string;
  description: string;
  impact:      string;
  recommendation: string;
  raw:         string;
}

interface ParsedSection {
  heading: string;
  text:    string;
  issues:  ParsedIssue[];
  steps:   string[];
  table:   TableRow[] | null;
}

interface TableRow {
  label:  string;
  status: string;
  score:  string;
  raw:    string;
}

// ── Body parser: splits body text into structured sub-fields ──────────────────
function parseIssueBody(body: string): { description: string; impact: string; recommendation: string } {
  const impactMatch  = body.match(/[Aa]uswirkung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Ee]mpfehlung|$)/);
  const recMatch     = body.match(/[Ee]mpfehlung[:\s]+([\s\S]+?)(?=\n[A-Za-zÄÖÜäöü]|[Aa]uswirkung|$)/);

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

// ── Markdown table parser ─────────────────────────────────────────────────────
function parseMarkdownTable(text: string): TableRow[] | null {
  const rows = text.split("\n").filter(l => l.trim().startsWith("|"));
  if (rows.length < 2) return null;
  const dataRows = rows.filter(r => !/^[\s|:-]+$/.test(r));
  if (dataRows.length < 2) return null;
  const result: TableRow[] = [];
  for (const row of dataRows.slice(1)) {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    result.push({
      label:  cells[0] ?? "",
      status: cells[1] ?? "",
      score:  cells[2] ?? "",
      raw:    row,
    });
  }
  return result.length > 0 ? result : null;
}

// ── Report parser ─────────────────────────────────────────────────────────────
function parseReport(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let cur: ParsedSection = { heading: "", text: "", issues: [], steps: [], table: null };

  for (const raw of text.split("\n")) {
    const line = raw.trim();

    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (cur.heading || cur.text || cur.issues.length || cur.steps.length) {
        if (cur.text && !cur.table) cur.table = parseMarkdownTable(cur.text);
        sections.push(cur);
      }
      cur = { heading: line.replace(/^#+\s*/, "").trim(), text: "", issues: [], steps: [], table: null };
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      cur.steps.push(line.replace(/^\d+\.\s*/, "").trim());
      continue;
    }

    const issueMatch = line.match(/^\*\*(🔴|🟡|🟢)([^*]*)\*\*\s*(.*)/);
    if (issueMatch) {
      const emoji    = issueMatch[1];
      const rest     = issueMatch[3].trim();
      const dashIdx  = rest.indexOf(" — ");
      const title    = dashIdx > -1 ? rest.slice(0, dashIdx).trim() : rest;
      const bodyRaw  = dashIdx > -1 ? rest.slice(dashIdx + 3).trim() : "";
      const severity: Severity = emoji === "🔴" ? "critical" : emoji === "🟡" ? "warning" : "good";
      const { description, impact, recommendation } = parseIssueBody(bodyRaw);
      cur.issues.push({ severity, title, description, impact, recommendation, raw: line });
      continue;
    }

    if (line) cur.text += (cur.text ? "\n" : "") + line;
  }

  if (cur.heading || cur.text || cur.issues.length || cur.steps.length) {
    if (cur.text && !cur.table) cur.table = parseMarkdownTable(cur.text);
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

// ── Score helpers ─────────────────────────────────────────────────────────────
function calcScore(issues: ParsedIssue[]): number {
  const critCount = issues.filter(i => i.severity === "critical").length;
  const warnCount = issues.filter(i => i.severity === "warning").length;
  return Math.max(0, Math.min(100, 100 - critCount * 15 - warnCount * 5));
}

function scoreColor(score: number) {
  if (score >= 80) return { color: C.green,  ring: "#4ade80", bg: C.greenBg,  border: C.greenBorder, label: "Gut aufgestellt",        hint: "Deine Website erfüllt die meisten Standards." };
  if (score >= 60) return { color: C.amber,  ring: "#fbbf24", bg: C.amberBg,  border: C.amberBorder, label: "Verbesserungspotenzial", hint: "Es gibt wichtige Punkte, die optimiert werden sollten." };
  return             { color: C.red,    ring: "#f87171", bg: C.redBg,    border: C.redBorder,   label: "Dringender Handlungsbedarf", hint: "Kritische Probleme beeinträchtigen deine Website erheblich." };
}

// ── CMS / Framework detection ─────────────────────────────────────────────────
function detectCMS(diagnose: string, url?: string): { label: string; version?: string } {
  const t = (diagnose + " " + (url ?? "")).toLowerCase();
  if (/wp-content|wp-admin|wp-json|wordpress/.test(t)) return { label: "WordPress", version: "6.x" };
  if (/shopify/.test(t))                                return { label: "Shopify" };
  if (/next\.js|nextjs|\/_next\//.test(t))              return { label: "Next.js" };
  if (/react/.test(t))                                  return { label: "React" };
  if (/webflow/.test(t))                                return { label: "Webflow" };
  if (/wix\.com|wixsite/.test(t))                       return { label: "Wix" };
  if (/squarespace/.test(t))                            return { label: "Squarespace" };
  if (/typo3/.test(t))                                  return { label: "TYPO3" };
  if (/joomla/.test(t))                                 return { label: "Joomla" };
  if (/drupal/.test(t))                                 return { label: "Drupal" };
  return { label: "Custom" };
}

// ── Score Ring SVG (standalone, no wrapper card) ──────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const sc     = scoreColor(score);
  const r      = 52;
  const circ   = 2 * Math.PI * r;
  const dash   = (score / 100) * circ;
  const gap    = circ - dash;
  const glowColor = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ position: "relative", flexShrink: 0, width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120"
        style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 12px ${glowColor}50)` }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={C.divider} strokeWidth="9" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={sc.ring} strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: sc.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

// ── Header card: meta LEFT + score ring RIGHT ─────────────────────────────────
function HeaderCard({
  score, url, totalPages, issueCount, scannedAt,
}: {
  score: number; url?: string; totalPages?: number;
  issueCount?: number; scannedAt?: string | null;
}) {
  const sc = scoreColor(score);
  const host = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : null;
  const dateStr = scannedAt
    ? new Date(scannedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="wf-score-hero" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 24, padding: "24px 28px",
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 16, boxShadow: C.shadowMd, marginBottom: 24,
    }}>
      {/* Left: metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {host && (
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", wordBreak: "break-all" }}>
            {host}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textMuted }}>
            <CalendarDays size={12} /> {dateStr}
          </span>
          {totalPages != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textMuted }}>
              <FileText size={12} /> {totalPages} Seiten
            </span>
          )}
          {issueCount != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textMuted }}>
              <AlertCircle size={12} /> {issueCount} Problem{issueCount !== 1 ? "e" : ""}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "4px 12px", borderRadius: 20,
          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
        }}>
          {sc.label}
        </span>
      </div>

      {/* Right: score ring */}
      <ScoreRing score={score} />
    </div>
  );
}

// ── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: Severity }) {
  const conf = {
    critical: { label: "Dringend handeln", bg: C.redBg,    color: C.red,   border: C.redBorder,   Icon: XCircle       },
    warning:  { label: "Empfehlung",       bg: C.amberBg,  color: C.amber, border: C.amberBorder, Icon: AlertTriangle  },
    good:     { label: "Optimiert",        bg: C.greenBg,  color: C.green, border: C.greenBorder, Icon: CheckCircle2   },
  }[severity];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      padding: "3px 9px", borderRadius: 6,
      background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`,
    }}>
      <conf.Icon size={10} />
      {conf.label}
    </span>
  );
}

// ── Issue Card — 2-col grid design ────────────────────────────────────────────
function IssueCard({ issue }: { issue: ParsedIssue }) {
  const accentColor = issue.severity === "critical" ? "#EF4444"
                    : issue.severity === "warning"  ? "#F59E0B"
                    : "#22C55E";
  const accentBg    = issue.severity === "critical" ? "#FEF2F2"
                    : issue.severity === "warning"  ? "#FFFBEB"
                    : "#F0FDF4";
  const cat = detectCategory(issue.title + " " + issue.description + " " + issue.impact);
  const hasGrid = issue.description || issue.impact;

  return (
    <div className="problem-card" style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, boxShadow: C.shadow, marginBottom: 16,
      overflow: "hidden",
    }}>
      {/* Header row: colored dot + title + badges */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px", flexWrap: "wrap",
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: accentColor, flexShrink: 0,
          boxShadow: `0 0 0 3px ${accentColor}22`,
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1, lineHeight: 1.3 }}>
          {issue.title}
        </span>
        <SeverityBadge severity={issue.severity} />
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
          background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`,
        }}>
          <cat.Icon size={10} />
          {cat.label}
        </span>
      </div>

      {/* 2-column grid: description | impact */}
      {hasGrid && (
        <div style={{
          display: "grid",
          gridTemplateColumns: (issue.description && issue.impact) ? "1fr 1fr" : "1fr",
          borderTop: `1px solid ${C.border}`,
        }}>
          {issue.description && (
            <div style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.03)",
              borderRight: issue.impact ? `1px solid ${C.border}` : "none",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Was ist das Problem?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
                {issue.description}
              </p>
            </div>
          )}
          {issue.impact && (
            <div style={{ padding: "14px 18px", background: accentBg }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Auswirkung
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
                {issue.impact}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendation box */}
      {issue.recommendation && (
        <div style={{
          padding: "12px 18px",
          background: C.blueBg, borderTop: `1px solid ${C.blueBorder}`,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Lightbulb size={13} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13, color: C.blue, lineHeight: 1.6 }}>
            <strong style={{ fontWeight: 700 }}>Empfehlung: </strong>{issue.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Status badge for table rows ───────────────────────────────────────────────
function StatusBadge({ text }: { text: string }) {
  const isGood    = /gut|✅|ok|pass|100|9\d|8[5-9]/.test(text.toLowerCase());
  const isBad     = /kritisch|❌|fehler|schlecht|[1-4]\d\b/.test(text.toLowerCase());
  const isWarning = /warn|⚠️|verbesser|mittel|6\d|7\d/.test(text.toLowerCase());
  const color  = isGood ? C.green : isBad ? C.red : isWarning ? C.amber : C.textSub;
  const bg     = isGood ? C.greenBg : isBad ? C.redBg : isWarning ? C.amberBg : C.divider;
  const border = isGood ? C.greenBorder : isBad ? C.redBorder : isWarning ? C.amberBorder : C.border;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {text}
    </span>
  );
}

// ── Table section ─────────────────────────────────────────────────────────────
function TableSection({ rows, heading }: { rows: TableRow[]; heading: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden",
      boxShadow: C.shadow, marginBottom: 32,
    }}>
      {heading && (
        <div style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: C.divider,
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {heading}
          </p>
        </div>
      )}
      <div>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
            background: i % 2 === 0 ? C.card : "rgba(255,255,255,0.02)",
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {row.score && <span style={{ fontSize: 12, color: C.textMuted }}>{row.score}</span>}
              <StatusBadge text={row.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── PDF button ────────────────────────────────────────────────────────────────
function PDFButton() {
  const [printing, setPrinting] = useState(false);

  function handlePrint() {
    setPrinting(true);
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
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 8,
        border: `1px solid ${C.border}`, background: C.card,
        cursor: printing ? "default" : "pointer",
        color: C.textSub, fontSize: 13, fontWeight: 600,
        boxShadow: C.shadow,
        opacity: printing ? 0.5 : 1, transition: "opacity 0.15s",
      }}
    >
      <Download size={13} />
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
  diagnose:    string;
  url?:        string;
  totalPages?: number;
  issueCount?: number;
  scannedAt?:  string | null;
}) {
  const sections   = parseReport(diagnose);
  const cms        = detectCMS(diagnose, url);
  const isWordPress = cms.label === "WordPress";
  const allIssues  = sections.flatMap(s => s.issues);
  const critCount  = allIssues.filter(i => i.severity === "critical").length;
  const warnCount  = allIssues.filter(i => i.severity === "warning").length;
  const goodCount  = allIssues.filter(i => i.severity === "good").length;
  const issueCount = issueCountProp ?? (critCount + warnCount);

  // If the AI text has no emoji-formatted issues but the DB says there ARE issues,
  // derive a fallback score — never falsely show 100/green when issues exist.
  // issueCountProp is the SUM of all .count values (e.g. 241 total items), not just
  // issue types, so we use sqrt-scaling to keep the score in a sensible range.
  const hasDbIssues = (issueCountProp ?? 0) > 0;
  const score = allIssues.length > 0
    ? calcScore(allIssues)
    : hasDbIssues
      ? Math.max(8, Math.round(100 - Math.sqrt(issueCountProp!) * 5.5))
      : 100;

  const summarySection = sections.find(s =>
    !s.heading || /zusammenfassung|summary/i.test(s.heading)
  );
  const issueSections = sections.filter(s =>
    s.issues.length > 0 && !/zusammenfassung|summary/i.test(s.heading)
  );
  const stepSections = sections.filter(s => s.steps.length > 0);
  const proseSections = sections.filter(s =>
    s.heading &&
    (s.text || s.table) &&
    s.issues.length === 0 &&
    s.steps.length === 0 &&
    !/zusammenfassung|summary/i.test(s.heading)
  );

  return (
    <div id="wf-print-root" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, borderRadius: 16, padding: "20px 0" }}>
      <style>{`
        @media print {
          #wf-print-root { background: #fff !important; padding: 0 !important; }
          #wf-print-root .problem-card,
          #wf-print-root .wf-score-hero { background: #fff !important; border-color: #e5e7eb !important; box-shadow: none !important; }
          #wf-print-root * { color: #0D1321 !important; }
        }
      `}</style>
      {/* Print-only header */}
      <div className="wf-print-header" style={{ display: "none", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: `2px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style={{ background: "#0D1117", borderRadius: 7, padding: 3 }}>
              <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 300, fontSize: 16, color: C.text }}>
              Website<span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span>
            </span>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: C.textMuted }}>
            <div style={{ fontWeight: 600 }}>Website-Analyse Report</div>
            <div>{url ?? ""} · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="wf-no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PDFButton />
      </div>

      {/* Header card: meta LEFT + score ring RIGHT */}
      <HeaderCard
        score={score}
        url={url}
        totalPages={totalPages}
        issueCount={issueCount}
        scannedAt={scannedAt}
      />

      {/* CMS Intelligence — Deep Scan */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12,
        padding: "13px 20px", marginBottom: 20,
        background: C.blueBg, border: `1px solid ${C.blueBorder}`,
        borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
            background: C.blue, color: "#fff", letterSpacing: "0.07em", flexShrink: 0,
          }}>
            DEEP SCAN
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            Erkanntes System:
          </span>
          <span style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}>
            {cms.label}{cms.version ? ` ${cms.version}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
            background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`,
            letterSpacing: "0.03em",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {isWordPress ? "WordPress 6.x BFSG-Ready" : "BFSG-Audit verfügbar"}
          </span>
        </div>
      </div>

      {/* Issue count strip */}
      {allIssues.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {critCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}` }}>
              <XCircle size={12} /> {critCount} Kritisch
            </span>
          )}
          {warnCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}` }}>
              <AlertTriangle size={12} /> {warnCount} Wichtig
            </span>
          )}
          {goodCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
              <CheckCircle2 size={12} /> {goodCount} Gut
            </span>
          )}
        </div>
      )}

      {/* Management-Zusammenfassung */}
      {summarySection?.text && (
        <div style={{
          padding: "18px 22px", background: C.blueBg, borderRadius: 12,
          border: `1px solid ${C.blueBorder}`,
          borderLeft: `4px solid ${C.blue}`,
          marginBottom: 32,
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: "0.02em" }}>
            🤖 Management-Zusammenfassung
          </p>
          {summarySection.text.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "4px 0 0", fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Issue sections */}
      {issueSections.map((section, si) => (
        <div key={si} style={{ marginBottom: 32 }}>
          {section.heading && (
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {section.heading}
            </p>
          )}
          {section.issues.map((issue, ii) => (
            <IssueCard key={ii} issue={issue} />
          ))}
        </div>
      ))}

      {/* Fallback: all issues when no section headings */}
      {issueSections.length === 0 && allIssues.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {allIssues.map((issue, ii) => <IssueCard key={ii} issue={issue} />)}
        </div>
      )}

      {/* Prose / Table sections */}
      {proseSections.map((section, si) => (
        section.table ? (
          <TableSection key={si} rows={section.table} heading={section.heading} />
        ) : (
          <div key={si} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: "hidden",
            boxShadow: C.shadow, marginBottom: 32,
          }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.divider }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {section.heading}
              </p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {section.text.split("\n").map((line, i) => (
                <p key={i} style={{ margin: "3px 0", fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )
      ))}

      {/* Steps / Handlungsempfehlungen */}
      {stepSections.map((section, si) => (
        <div key={si} style={{ marginBottom: 32 }}>
          {section.heading && (
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {section.heading}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {section.steps.map((step, i) => (
              <div key={i} className="wf-issue-card" style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                padding: 18, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 12,
                boxShadow: C.shadow,
              }}>
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                  background: C.blue, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fallback */}
      {sections.length === 0 && (
        <p style={{ color: C.textSub, fontSize: 13, lineHeight: 1.7 }}>{diagnose}</p>
      )}
    </div>
  );
}
