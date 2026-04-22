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
  issues:      IssueProp[];
  redCount:    number;
  yellowCount: number;
  speedScore:  number;
  plan:        string;
  lastScan:    boolean; // true = scan data is present
  focusMode?:  boolean; // true = came from fresh scan redirect
  scanId?:     string;  // present when viewing a saved scan — enables executive summary
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function getLabel(sev: IssueProp["severity"]) {
  return sev === "red" ? "Prio" : sev === "yellow" ? "Hinweis" : "Hinweis";
}
function getColor(sev: IssueProp["severity"]) {
  return sev === "red" ? "#c07070" : sev === "yellow" ? "#fbbf24" : "#4ade80";
}
function getBg(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(160,80,80,0.07)" : sev === "yellow" ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)";
}
function getBorder(sev: IssueProp["severity"]) {
  return sev === "red" ? "rgba(160,80,80,0.18)" : sev === "yellow" ? "rgba(251,191,36,0.22)" : "rgba(74,222,128,0.22)";
}

// Contextual tool label for bulk issues (Sammelfehler)
function getAffectedTool(issue: IssueProp): string {
  const t = (issue.title + " " + issue.body).toLowerCase();
  if (/alt.?text|alternativtext/.test(t))  return "Medienbibliothek (Alt-Texte)";
  if (/meta.?desc|snippet/.test(t))        return "SEO-Plugin (Meta-Descriptions)";
  if (/h1|hauptüberschrift/.test(t))       return "Seiten-Editor (Überschriften)";
  if (/sitemap/.test(t))                   return "Yoast SEO (Sitemap)";
  if (/cookie|consent/.test(t))            return "Cookie-Plugin";
  if (/404|broken|kaputt/.test(t))         return "Weiterleitungs-Manager";
  if (/label|formular/.test(t))            return "Kontaktformular-Plugin";
  if (/lcp|cls|vitals|ladezeit/.test(t))   return "Caching- & Bild-Optimierung";
  if (/ssl|https/.test(t))                 return "Hosting-Panel (SSL)";
  return "Website-Inhalt";
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

// ─── Score-Breakdown helpers ──────────────────────────────────────────────────
interface Deduction { label: string; pts: number; sortedIdx: number; }

// Normalises any BFSG/Barrierefreiheit variant into consistent "Barrierefreiheit: …" wording.
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

// SEO: only real SEO topics (H1, Meta, Title, Indexierung, Sitemap)
function getSeoDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    // Exclude non-SEO topics from this column
    if (/barriere|bfsg|alt.?text|screenreader|alternativtext|ssl|https|cookie|dsgvo|datenschutz|formular|sicherheit|security/i.test(t)) return;
    let pts = 0;
    if (/title.?tag|kein.*title|ohne.*title/i.test(t))          pts = 14;
    else if (/meta.?desc|snippet/i.test(t))                     pts = 8;
    else if (/\bh1\b|hauptüberschrift/i.test(t))                pts = 8;
    else if (/sitemap/i.test(t))                                 pts = 6;
    else if (/noindex|ausgeschlossen/i.test(t))                  pts = 5;
    else if (issue.category === "technik" || issue.category === "speed") return; // never bleed tech into SEO
    else if (issue.severity === "red" && issue.category !== "recht")     pts = 5;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

// Sicherheit: SSL, DSGVO, und BFSG/Barrierefreiheit (Compliance-Themen)
function getSecDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    // Exclude pure speed/tech topics
    if (/lcp|ladezeit|pagespeed|cls|layout.?shift|caching|cache|bildkompri|redirect.?kette/i.test(t)) return;
    let pts = 0;
    if (/ssl|https/i.test(t))                                              pts = 50;
    else if (/cookie|consent|dsgvo|datenschutz/i.test(t))                 pts = 30;
    else if (/mixed.?content|unsicher.*ressource/i.test(t))               pts = 20;
    else if (/sicherheit|security/i.test(t) && issue.severity === "red")  pts = 20;
    // BFSG / Barrierefreiheit = Compliance → belongs in Sicherheit
    else if (/barriere|bfsg|screenreader|alternativtext/i.test(t))        pts = 15;
    // Impressum / Rechtstexte = Legal compliance → belongs in Sicherheit
    else if (/impressum|rechtstext|rechtspflicht|anbieterkennzeichnung/i.test(t)) pts = 15;
    else if (/alt.?text|formular|label/i.test(t))                         pts = 10;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

// Technik: nur Speed, Cache, Core Web Vitals
function getTechDeductions(sorted: IssueProp[]): Deduction[] {
  const out: Deduction[] = [];
  sorted.forEach((issue, idx) => {
    if (out.length >= 4) return;
    const t = (issue.title + " " + issue.body).toLowerCase();
    // Never put accessibility or compliance issues in Technik
    if (/barriere|bfsg|alt.?text|screenreader|alternativtext|ssl|https|cookie|dsgvo|datenschutz|formular/i.test(t)) return;
    let pts = 0;
    if (/lcp|ladezeit|pagespeed|performance|core web/i.test(t))         pts = 15;
    else if (/cls|layout.?shift/i.test(t))                               pts = 10;
    else if (/caching|cache/i.test(t))                                   pts = 8;
    else if (/bildkompri|komprimier|webp|next.gen/i.test(t))             pts = 8;
    else if (/redirect.?kette|redirect.?loop/i.test(t))                  pts = 8;
    else if (issue.category === "speed" && issue.severity === "red")     pts = 15;
    else if (issue.category === "speed")                                  pts = 8;
    if (pts > 0) out.push({ label: friendlyLabel(issue.title), pts, sortedIdx: idx });
  });
  return out;
}

function scrollToIssue(sortedIdx: number) {
  const el = document.getElementById(`wf-issue-${sortedIdx}`);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.click(); }
}

// ─── Animated circular score ring ─────────────────────────────────────────────
function ScoreRing({ score, label, delay = 0 }: { score: number; label: string; color?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState<number | null>(null); // null = not yet started
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

  // Derive color from the currently DISPLAYED value, not the final score.
  // This prevents the ring from glowing green while still showing "0".
  const liveColor = d >= 70 ? "#4ade80" : d >= 40 ? "#fbbf24" : "#c07070";
  const grade = d >= 80 ? "Sehr gut" : d >= 60 ? "Gut" : d >= 40 ? "OK" : "Potenzial";

  // While animation hasn't started, show a neutral skeleton ring
  if (displayed === null) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ position: "relative", width: 106, height: 106, margin: "0 auto 10px" }}>
          <svg width="106" height="106" viewBox="0 0 106 106" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="53" cy="53" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1,
          }}>
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
          {/* Track */}
          <circle cx="53" cy="53" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="53" cy="53" r={R}
            fill="none"
            stroke={liveColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="wf-score-progress"
            style={{ filter: `drop-shadow(0 0 6px ${liveColor}80)`, transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 1,
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {d}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: liveColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
  defaultOpen = false,
  wfAnchor,
  onAutoFix,
}: {
  issue: IssueProp;
  index: number;
  defaultOpen?: boolean;
  wfAnchor?: string;
  onAutoFix: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color  = getColor(issue.severity);
  const bg     = getBg(issue.severity);
  const border = getBorder(issue.severity);
  const fix    = quickFix(issue);

  return (
    <div id={`wf-issue-${index}`} data-wf-anchor={wfAnchor} style={{
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
            flexShrink: 0, fontSize: 10, fontWeight: 400,
            color: "rgba(255,255,255,0.22)",
          }}>
            {issue.count}×
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
          <div className="wf-quick-fix" style={{
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

// ─── Skeleton ring (shown while scores haven't loaded yet) ────────────────────
function SkeletonRing({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        position: "relative", width: 106, height: 106, margin: "0 auto 10px",
        borderRadius: "50%",
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "400px 100%",
        animation: "wf-shimmer 1.6s infinite",
      }}>
        <svg width="106" height="106" viewBox="0 0 106 106">
          <circle cx="53" cy="53" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        </svg>
      </div>
      <div style={{
        height: 10, width: 60, margin: "0 auto",
        borderRadius: 6,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "400px 100%",
        animation: "wf-shimmer 1.6s infinite",
      }} />
      <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>{label}</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
const PRO_PLANS = ["professional", "smart-guard", "agency-pro", "agency-starter"];

export default function StarterResultsPanel({ issues, redCount, yellowCount, speedScore, plan, lastScan, focusMode, scanId }: Props) {
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [showWLModal, setShowWLModal]   = useState(false);
  const [showPdfHint, setShowPdfHint]   = useState(false);
  const [showDetails, setShowDetails]   = useState(false);
  const [openItems, setOpenItems]       = useState<Set<number>>(new Set());
  void openItems; void setOpenItems;

  // ── Executive Summary (Professional+) ────────────────────────────────────
  const isPro = PRO_PLANS.includes(plan);
  const [execSummary, setExecSummary]   = useState("");
  const [saveStatus,  setSaveStatus]    = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPro || !scanId) return;
    fetch(`/api/executive-summary?scanId=${scanId}`)
      .then(r => r.json())
      .then(d => setExecSummary(d.executive_summary ?? ""));
  }, [isPro, scanId]);

  function handleSummaryChange(value: string) {
    setExecSummary(value);
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch(`/api/executive-summary?scanId=${scanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executive_summary: value }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  }

  if (!lastScan) return null;

  // 0 issues: scan is done and the site is clean — show a success state, not a skeleton
  if (issues.length === 0) {
    return (
      <div className="wf-print-root" style={{ marginBottom: 28 }}>
        <div className="wf-print-card" style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 16, padding: "40px 32px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Keine Probleme gefunden
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              Deine Website erfüllt alle geprüften Standards — SEO, Technik und Barrierefreiheit sind sauber konfiguriert.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {["SEO: 100", "Technik: 98", "Sicherheit: 100"].map(label => (
              <span key={label} style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
                ✓ {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Sorted issues (must come first — deductions depend on sorted) ─────────
  const sorted = [...issues].sort((a, b) => {
    const sevOrd = { red: 0, yellow: 1, green: 2 };
    const sd = sevOrd[a.severity] - sevOrd[b.severity];
    if (sd !== 0) return sd;
    return (b.count ?? 1) - (a.count ?? 1);
  });

  // ── Column deductions (computed once, shared by score rings + details card)
  const seoDed  = getSeoDeductions(sorted);
  const techDed = getTechDeductions(sorted);
  const secDed  = getSecDeductions(sorted);

  // ── Score computation — derived from actual deductions so ring ↔ list always match
  // Each deduction that appears in the list is exactly what drives the score down.
  const seoScore  = clamp(100 - seoDed.reduce((s, d) => s + d.pts, 0),  12, 100);
  const techScore = clamp(speedScore, 10, 98); // Technik = PageSpeed API score (external signal)
  const secScore  = clamp(100 - secDed.reduce((s, d) => s + d.pts, 0),  12, 100);
  const redIssues    = sorted.filter(i => i.severity === "red");
  const yellowIssues = sorted.filter(i => i.severity === "yellow");

  // Index of the first "recht" (UX/Barrierefreiheit) issue across all groups
  const firstRechtSortedIdx = sorted.findIndex(i => i.category === "recht");

  // ── PDF export with hint toast ────────────────────────────────────────────
  function handleExportPDF() {
    setShowPdfHint(true);
    // Give user time to read the hint, then open print dialog
    setTimeout(() => {
      window.print();
      // Hide hint after dialog closes
      setTimeout(() => setShowPdfHint(false), 800);
    }, 1200);
  }

  // ── Agency branding (Professional+) ──────────────────────────────────────
  type AgencyBranding = { agency_name: string; agency_website: string; logo_url: string; primary_color: string };
  const [agencyBranding, setAgencyBranding] = useState<AgencyBranding | null>(null);
  useEffect(() => {
    if (!isPro) return;
    fetch("/api/agency-settings")
      .then(r => r.json())
      .then(d => { if (d && !d.error) setAgencyBranding(d as AgencyBranding); });
  }, [isPro]);
  const agencyColor       = agencyBranding?.primary_color ?? "#8df3d3";
  const hasAgencyBranding = isPro && !!(agencyBranding?.agency_name || agencyBranding?.logo_url);

  const isStarter = plan === "starter";
  const printDate = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showWLModal  && <UpgradeModal onClose={() => setShowWLModal(false)} />}

      <style>{`
        @keyframes wf-sr-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wf-pdf-hint-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Print header hidden on screen — globals.css handles all @media print rules */
        .wf-print-header { display: none; }
        /* Executive summary print box hidden on screen */
        .wf-exec-summary-print { display: none; }
        /* Agency footer hidden on screen */
        .wf-agency-footer { display: none; }

        @media print {
          :root { --agency-primary: ${agencyColor}; }
          .wf-score-progress {
            stroke: var(--agency-primary) !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* ── Print-only header — agency branding or WebsiteFix fallback ── */}
      <div className="wf-print-header" style={{
        alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, paddingBottom: 14,
        borderBottom: `2px solid ${hasAgencyBranding ? agencyColor : "#e2e8f0"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {hasAgencyBranding ? (
            agencyBranding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agencyBranding.logo_url} alt="" style={{ height: 36, maxWidth: 140, objectFit: "contain" }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: agencyColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#0b0c10",
              }}>
                {(agencyBranding?.agency_name ?? "A").charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "#007BFF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: "11pt", fontWeight: 800, color: "#111", letterSpacing: "-0.01em" }}>
              {hasAgencyBranding ? agencyBranding?.agency_name : "WebsiteFix"}
            </p>
            <p style={{ margin: 0, fontSize: "8pt", color: "#64748b" }}>
              {hasAgencyBranding && agencyBranding?.agency_website
                ? agencyBranding.agency_website.replace(/^https?:\/\//, "")
                : "Analyzed by WebsiteFix.io"}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "8pt", color: "#64748b" }}>Website-Analyse Report</p>
          <p style={{ margin: 0, fontSize: "8pt", color: "#94a3b8" }}>{printDate}</p>
        </div>
      </div>

      {/* ── PDF Hint Toast ─────────────────────────────────────────────────── */}
      {showPdfHint && (
        <div className="wf-no-print" style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          zIndex: 1200,
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", borderRadius: 12,
          background: "#0f1623", border: "1px solid rgba(0,123,255,0.35)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          animation: "wf-pdf-hint-in 0.3s cubic-bezier(0.22,1,0.36,1) both",
          whiteSpace: "nowrap",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: "#fff", fontWeight: 600 }}>
            Tipp: Wähle als Ziel{" "}
            <strong style={{ color: "#7aa6ff" }}>&quot;Als PDF speichern&quot;</strong>
            {" "}im Druckdialog
          </p>
        </div>
      )}

      {/* ── All content wrapped for print targeting ─────────────────────── */}
      <div className="wf-print-root">

      {/* ── EXECUTIVE SUMMARY — Edit UI (Professional+, screen only) ───────── */}
      {isPro && scanId && (
        <div className="wf-no-print wf-exec-summary-edit" style={{
          marginBottom: 24,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(141,243,211,0.15)",
          borderRadius: 16,
          padding: "22px 26px",
          animation: "wf-sr-fadein 0.4s ease both",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8df3d3"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#8df3d3" }}>Experten-Fazit</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: "rgba(141,243,211,0.1)", color: "#8df3d3", border: "1px solid rgba(141,243,211,0.25)", letterSpacing: "0.04em" }}>
                PROFESSIONAL
              </span>
            </div>
            <span style={{ fontSize: 11, color: saveStatus === "saved" ? "#4ade80" : saveStatus === "saving" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.2)" }}>
              {saveStatus === "saving" ? "Speichert…" : saveStatus === "saved" ? "✓ Gespeichert" : "Auto-Save aktiv"}
            </span>
          </div>

          {/* Smart template buttons */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {([
              {
                label: "Dringlich",
                icon: "⚠️",
                text: "Dringende Maßnahmen erforderlich: Wir empfehlen, die kritischen Befunde innerhalb der nächsten 14 Tage zu beheben. Diese Punkte wirken sich direkt auf Sichtbarkeit, Nutzervertrauen und rechtliche Compliance aus. Gerne unterstützen wir Sie bei der Umsetzung.",
              },
              {
                label: "Technisch",
                icon: "🔧",
                text: "Technische Analyse: Die Scan-Ergebnisse zeigen optimierungsfähige Bereiche in Performance und Core Web Vitals. Wir empfehlen eine strukturierte Priorisierung nach Aufwand/Wirkung. Die identifizierten Maßnahmen können schrittweise im Rahmen des regulären Betriebs umgesetzt werden.",
              },
              {
                label: "Kompakt",
                icon: "📋",
                text: "Kurzfazit: Website-Analyse abgeschlossen. Handlungsbedarf und Optimierungshinweise identifiziert. Nächste Schritte: Prioritäten gemeinsam besprechen und Maßnahmenplan erstellen.",
              },
            ] as { label: string; icon: string; text: string }[]).map(tpl => (
              <button
                key={tpl.label}
                onClick={() => handleSummaryChange(tpl.text)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)", cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(141,243,211,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(141,243,211,0.25)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {tpl.icon} {tpl.label}
              </button>
            ))}
          </div>

          <textarea
            value={execSummary}
            onChange={e => handleSummaryChange(e.target.value)}
            placeholder="Schreibe hier ein kurzes Fazit für deinen Kunden (z.B. Prioritäten, nächste Schritte)..."
            rows={4}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", outline: "none", resize: "vertical", lineHeight: 1.65,
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
            Dieser Text erscheint nach den Score-Ringen im PDF — sichtbar nur für dich und deine Kunden.
          </p>
        </div>
      )}

      {/* ① SCORE RINGS ─────────────────────────────────────────────────────── */}
      <div className="wf-print-card" style={{
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
            {isPro ? (
              <button
                onClick={handleExportPDF}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 8,
                  background: "rgba(141,243,211,0.06)", border: "1px solid rgba(141,243,211,0.22)",
                  color: "#8df3d3", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                White-Label PDF
              </button>
            ) : (
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
            )}
          </div>
        </div>

        {/* ── Kritisch-Warnung ─────────────────────────────────────────────── */}
        {(seoScore <= 20 || secScore <= 20) && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 16px", borderRadius: 10, marginBottom: 20,
            background: "rgba(160,80,80,0.12)", border: "1px solid rgba(160,80,80,0.28)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c07070"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ margin: 0, fontSize: 13, color: "#c07070", lineHeight: 1.55 }}>
              <strong>Kritische Lücken erkannt.</strong> Deine Website weist schwerwiegende Probleme auf, die
              Nutzervertrauen und Rankings gefährden. Sieh dir die Aufschlüsselung unten an.
            </p>
          </div>
        )}

        {/* ── Rings row — clean, no inline clutter ────────────────────────── */}
        <div className="wf-score-ring" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 120px", minWidth: 120 }}>
            <ScoreRing score={seoScore} label="SEO" delay={0} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 120px", minWidth: 120 }}>
            <ScoreRing score={techScore} label="Technik" delay={180} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 120px", minWidth: 120 }}>
            <ScoreRing score={secScore} label="Sicherheit" delay={360} />
          </div>
        </div>

        {/* ── Toggle button ────────────────────────────────────────────────── */}
        <div className="wf-no-print" style={{ display: "flex", justifyContent: "center", marginBottom: showDetails ? 16 : 0 }}>
          <button
            onClick={() => setShowDetails(v => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 20,
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            Analyse-Details {showDetails ? "ausblenden" : "einblenden"}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.2s", transform: showDetails ? "rotate(180deg)" : "none" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* ── Slide-down details card — always in DOM, CSS-hidden on screen when closed ── */}
        {(() => {
          type Col = {
            heading: string;
            score: number;
            desc: string;
            deductions: Deduction[];
          };
          const cols: Col[] = [
            { heading: "SEO",        score: seoScore,  desc: "Sichtbarkeit in Suchmaschinen", deductions: seoDed },
            { heading: "Technik",    score: techScore, desc: "Ladezeit & Core Web Vitals",   deductions: techDed },
            { heading: "Sicherheit", score: secScore,  desc: "Datenschutz & SSL",             deductions: secDed },
          ];

          const excellentMsg: Record<string, string> = {
            SEO:        "Hervorragend: SEO-Grundstruktur vollständig korrekt.",
            Technik:    "Hervorragend: Alle technischen Standards erfüllt.",
            Sicherheit: "Hervorragend: Keine Sicherheits- oder Compliance-Mängel.",
          };
          const positives: Record<string, string[]> = {
            SEO:        ["Title-Tag vorhanden", "Meta-Description gesetzt", "H1-Überschrift korrekt", "Sitemap eingereicht"],
            Technik:    ["Schnelle Ladezeit", "Core Web Vitals bestanden", "Caching aktiv"],
            Sicherheit: ["SSL-Zertifikat aktiv", "HTTPS erzwungen", "Cookie-Banner vorhanden"],
          };

          return (
            <div className="wf-analysis-details" style={{
              display: showDetails ? "grid" : "none",
              gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
              borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              animation: showDetails ? "wf-sr-fadein 0.22s ease both" : "none",
            }}>
              {cols.map((col, ci) => (
                <div key={col.heading} style={{
                  padding: "16px 18px",
                  background: ci === 1 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.015)",
                  borderLeft: ci > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  {/* Column header */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {col.heading}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                      {col.desc}
                    </p>
                  </div>

                  {/* Deductions list */}
                  {col.deductions.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {col.deductions.map((d, i) => (
                        <li key={i}>
                          <button
                            onClick={() => scrollToIssue(d.sortedIdx)}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 6, width: "100%",
                              background: "none", border: "none", cursor: "pointer",
                              padding: 0, fontFamily: "inherit", textAlign: "left",
                            }}
                            title="Zur Aufgabe springen"
                          >
                            <span style={{ flexShrink: 0, fontSize: 11, lineHeight: 1.4, marginTop: 0 }}>❌</span>
                            <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                              {d.label}
                            </span>
                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#c07070", marginLeft: 4, lineHeight: 1.4 }}>
                              −{d.pts}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : col.score >= 98 ? (
                    // Perfect score → strong positive confirmation
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ flexShrink: 0, fontSize: 11, lineHeight: 1.4 }}>✅</span>
                      <span style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", lineHeight: 1.4, fontWeight: 600 }}>
                        {excellentMsg[col.heading]}
                      </span>
                    </div>
                  ) : col.score >= 80 ? (
                    // Good — show positive signals
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {positives[col.heading].slice(0, 3).map(p => (
                        <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ flexShrink: 0, fontSize: 11, lineHeight: 1.4 }}>✅</span>
                          <span style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", lineHeight: 1.4 }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : col.heading === "Technik" ? (
                    // Technik score = PageSpeed API signal, no specific issues detected
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ flexShrink: 0, fontSize: 13, lineHeight: 1.3 }}>⚠️</span>
                      <span style={{ fontSize: 11, color: "rgba(251,191,36,0.75)", lineHeight: 1.5 }}>
                        PageSpeed-Score: {col.score}/100 — Ladezeit oder Server-Antwortzeit verbessern.
                      </span>
                    </div>
                  ) : (
                    // Safety fallback — should not occur (scores derive from deductions)
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                      Keine spezifischen Abzüge erkannt.
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── EXECUTIVE SUMMARY — Print box (after score rings, page 1) ───────── */}
      {isPro && scanId && execSummary.trim() && (
        <div className="wf-exec-summary-print wf-print-card" style={{
          marginBottom: 24,
          background: "#f8fafc",
          borderLeft: `4px solid ${agencyColor}`,
          borderRadius: 10,
          padding: "16px 20px",
          breakInside: "avoid",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={agencyColor}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span style={{ fontSize: "10pt", fontWeight: 700, color: "#334155", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Experten-Fazit
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "10pt", color: "#334155", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {execSummary}
          </p>
        </div>
      )}

      {/* ② AUFGABEN-LISTE ─────────────────────────────────────────────────── */}
      <div id="wf-aufgaben" className="wf-print-accordion" style={{
        marginBottom: 28,
        animation: "wf-sr-fadein 0.45s 0.1s ease both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Ebene 2
            </p>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Deine Optimierungs-Aufgaben
            </h2>
          </div>
          <div className="wf-no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {redIssues.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: getBg("red"), border: `1px solid ${getBorder("red")}`, color: getColor("red") }}>
                {redIssues.length} Handlungsbedarf
              </span>
            )}
            {yellowIssues.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: getBg("yellow"), border: `1px solid ${getBorder("yellow")}`, color: getColor("yellow") }}>
                {yellowIssues.length} Optimierungshinweise
              </span>
            )}
          </div>
        </div>

        {/* ── Gruppe: Handlungsbedarf (rot) ─────────────────────────────── */}
        {redIssues.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c07070", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#c07070", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Handlungsbedarf — {redIssues.length} {redIssues.length === 1 ? "Aufgabe" : "Aufgaben"}
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(192,112,112,0.15)", borderRadius: 12, overflow: "hidden" }}>
              {redIssues.map((issue, i) => {
                const idx = sorted.indexOf(issue);
                const isFirstRecht = idx === firstRechtSortedIdx;
                return (
                  <AccordionItem
                    key={`red-${i}`}
                    issue={issue}
                    index={idx}
                    defaultOpen={i === 0}
                    wfAnchor={isFirstRecht ? "wf-recht-first" : undefined}
                    onAutoFix={() => setShowUpgrade(true)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 16, borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ margin: 0, fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
              Handlungsbedarf: Alle Pflicht-Einstellungen korrekt konfiguriert.
            </p>
          </div>
        )}

        {/* ── Gruppe: Optimierungshinweise (gelb) ──────────────────────── */}
        {yellowIssues.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Optimierungshinweise — {yellowIssues.length} {yellowIssues.length === 1 ? "Aufgabe" : "Aufgaben"}
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, overflow: "hidden" }}>
              {yellowIssues.map((issue, i) => {
                const idx = sorted.indexOf(issue);
                const isFirstRecht = idx === firstRechtSortedIdx;
                return (
                  <AccordionItem
                    key={`yellow-${i}`}
                    issue={issue}
                    index={idx}
                    defaultOpen={redIssues.length === 0 && i === 0}
                    wfAnchor={isFirstRecht ? "wf-recht-first" : undefined}
                    onAutoFix={() => setShowUpgrade(true)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 8, borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ margin: 0, fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
              Optimierungshinweise: Keine Verbesserungspotenziale gefunden.
            </p>
          </div>
        )}
      </div>

      {/* ④ FOCUS-MODE BACK BUTTON ──────────────────────────────────────────── */}
      {focusMode && (
        <div className="wf-no-print" style={{
          marginTop: 8, marginBottom: 32,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          animation: "wf-sr-fadein 0.55s 0.3s ease both",
        }}>
          <button
            onClick={() => { window.location.href = "/dashboard"; }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 32px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.18s, border-color 0.18s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
            }}
          >
            {/* Left arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Zurück zur vollständigen Übersicht
          </button>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            Zeigt alle Dashboard-Bereiche: Performance, Seiten-Map, Findings
          </p>
        </div>
      )}

      {/* ── Agency footer (print only) ───────────────────────────────────── */}
      <div className="wf-agency-footer" style={{
        marginTop: 32, paddingTop: 14,
        borderTop: `1px solid ${hasAgencyBranding ? agencyColor + "60" : "#e2e8f0"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: "8pt", color: "#64748b", lineHeight: 1.5 }}>
          {hasAgencyBranding
            ? `Dieser Bericht wurde exklusiv von ${agencyBranding?.agency_name ?? ""} erstellt.`
            : "Dieser Bericht wurde mit WebsiteFix.io erstellt."}
        </p>
        {hasAgencyBranding && agencyBranding?.agency_website && (
          <p style={{ margin: 0, fontSize: "8pt", color: "#94a3b8" }}>
            {agencyBranding.agency_website.replace(/^https?:\/\//, "")}
          </p>
        )}
      </div>

      </div>{/* end wf-print-root */}
    </>
  );
}
