"use client";

/**
 * RescueDashboard — Single-Site-View für Einzelunternehmer (Starter-Plan).
 *
 * Mission: User kommt über akute Suchanfragen ("WordPress Fehler",
 * "Google findet mich nicht", "Seite langsam") und braucht SOFORT
 * Antworten — keine Agency-Infrastruktur, kein Multi-Tenancy-Setup.
 *
 * Layout:
 *   1. Hero: Domain + Score-Status + Re-Scan-Button
 *   2. Drei Fokus-Säulen:
 *      - Sichtbarkeit (warum findet Google mich nicht?)
 *      - Gesundheit  (WordPress / Security / Plugins)
 *      - Geschwindigkeit (Hosting / TTFB / Performance)
 *   3. Agentur-Support-CTA (Conversion-Pfad zur Hilfe)
 *
 * Klassifikation der Issues läuft per Title-Keyword + ScanIssue-category,
 * NICHT per starrer DB-Spalte — so können wir die Mappings später
 * verfeinern ohne Migration.
 */

import { useState } from "react";
import Link from "next/link";
import type { ParsedIssueProp } from "./_shared/dashboard-types";

interface Props {
  firstName: string;
  domain:    string;
  url:       string;
  /** Letzte Scan-ID — für den Drilldown-Link zum Detail-Bericht. */
  lastScanId: string | null;
  /** ISO-String des letzten Scans, oder null wenn noch nicht gescannt. */
  lastScanAt: string | null;
  speedScore: number;
  issues:     ParsedIssueProp[];
  redCount:   number;
  yellowCount: number;
}

// ─── Theme-Tokens ────────────────────────────────────────────────────────────
const T = {
  page:       "#0b0c10",
  card:       "rgba(255,255,255,0.025)",
  cardSolid:  "rgba(255,255,255,0.04)",
  border:     "rgba(255,255,255,0.08)",
  divider:    "rgba(255,255,255,0.06)",
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.40)",
  textFaint:  "rgba(255,255,255,0.25)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.10)",
  greenBdr:   "rgba(74,222,128,0.28)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.10)",
  amberBdr:   "rgba(251,191,36,0.28)",
  red:        "#f87171",
  redBg:      "rgba(248,113,113,0.10)",
  redBdr:     "rgba(248,113,113,0.28)",
  blue:       "#7aa6ff",
  blueBg:     "rgba(122,166,255,0.10)",
  blueBdr:    "rgba(122,166,255,0.28)",
  cyan:       "#22d3ee",
  cyanBg:     "rgba(34,211,238,0.10)",
  cyanBdr:    "rgba(34,211,238,0.28)",
};

// ─── Issue-Klassifikation ────────────────────────────────────────────────────
type Pillar = "visibility" | "health" | "speed";

const VISIBILITY_KEYWORDS = [
  "title", "meta-description", "meta beschreib", "h1", "h2",
  "noindex", "sitemap", "robots.txt", "robots", "canonical",
  "indexier", "google find", "open graph", "og:", "twitter card",
  "html-lang", "html lang", "alt-attribut", "alt-text", "alt text",
];
const HEALTH_KEYWORDS = [
  "wordpress", "wp-version", "php", "kritischer fehler", "fatal",
  "plugin", "theme", "security-header", "security header", "csp",
  "hsts", "x-frame", "ssl", "https", "cookie", "wp-login",
  "veraltet", "outdated", "update", "schwachstelle", "exploit",
  "barriere", "label", "formular", "bfsg", "wcag",
];
const SPEED_KEYWORDS = [
  "ttfb", "antwortzeit", "antwort-zeit", "speed", "geschwindigkeit",
  "performance", "largest contentful", "lcp", "fcp", "cls",
  "render-block", "render block", "bilder", "image-size",
  "hosting", "lazyload", "preload", "minify", "compress",
];

function classifyIssue(issue: ParsedIssueProp): Pillar | null {
  const haystack = `${issue.title} ${issue.body ?? ""}`.toLowerCase();
  // Reihenfolge wichtig: Speed gewinnt vor Health gewinnt vor Visibility,
  // weil "performance" sowohl in speed als auch (selten) in health auftauchen kann.
  if (SPEED_KEYWORDS.some(k => haystack.includes(k))) return "speed";
  if (issue.category === "speed")                       return "speed";
  if (HEALTH_KEYWORDS.some(k => haystack.includes(k))) return "health";
  if (issue.category === "technik" || issue.category === "recht") return "health";
  if (VISIBILITY_KEYWORDS.some(k => haystack.includes(k))) return "visibility";
  return null;
}

function pillarScore(pillarIssues: ParsedIssueProp[]): number {
  if (pillarIssues.length === 0) return 100;
  const reds = pillarIssues.filter(i => i.severity === "red").length;
  const yellows = pillarIssues.filter(i => i.severity === "yellow").length;
  return Math.max(10, 100 - reds * 20 - yellows * 8);
}

function scoreColor(score: number): string {
  return score >= 80 ? T.green : score >= 60 ? T.amber : T.red;
}

// ─── Säulen-Konfiguration ────────────────────────────────────────────────────
const PILLARS: Array<{
  id:       Pillar;
  title:    string;
  question: string;
  hint:     string;
  color:    string;
  bg:       string;
  bdr:      string;
  icon:     React.ReactElement;
}> = [
  {
    id: "visibility",
    title: "Sichtbarkeit",
    question: "Warum findet Google mich nicht?",
    hint: "Indexierung, Meta-Daten, Sitemap und Title-Tags — alles was Google braucht, um deine Seite überhaupt zu zeigen.",
    color: T.blue, bg: T.blueBg, bdr: T.blueBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    id: "health",
    title: "Gesundheit",
    question: "Ist meine WordPress-Seite kaputt?",
    hint: "Plugin-Updates, PHP-Warnungen, Security-Header und SSL — die typischen Stolperfallen, die zum 'kritischen Fehler' führen.",
    color: T.amber, bg: T.amberBg, bdr: T.amberBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: "speed",
    title: "Geschwindigkeit",
    question: "Warum ist meine Seite langsam?",
    hint: "Server-Antwortzeit, Bildgrößen und Render-Blocker — die Bremsen, die Besucher zum Abspringen zwingen.",
    color: T.cyan, bg: T.cyanBg, bdr: T.cyanBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function RescueDashboard({
  firstName, domain, url, lastScanId, lastScanAt,
  speedScore, issues, redCount, yellowCount,
}: Props) {
  const [supportSent, setSupportSent] = useState(false);
  const [supportBusy, setSupportBusy] = useState(false);

  // Issues in die 3 Säulen gruppieren
  const grouped: Record<Pillar, ParsedIssueProp[]> = {
    visibility: [], health: [], speed: [],
  };
  for (const issue of issues) {
    const p = classifyIssue(issue);
    if (p) grouped[p].push(issue);
  }
  // Innerhalb jeder Säule: rote vor gelben, dann nach count desc
  for (const k of Object.keys(grouped) as Pillar[]) {
    grouped[k].sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "red" ? -1 : 1;
      return (b.count ?? 1) - (a.count ?? 1);
    });
  }

  const totalIssues = redCount + yellowCount;
  const overallScore = totalIssues === 0 ? 100 : Math.max(10, 100 - redCount * 12 - yellowCount * 4);
  const overallColor = scoreColor(overallScore);

  const lastScanLabel = lastScanAt
    ? new Date(lastScanAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "Noch nicht gescannt";

  async function requestAgencySupport() {
    setSupportBusy(true);
    try {
      // Reuse den existierenden Support-Endpoint mit einem speziellen
      // "agency-support-request"-Marker. Backend kann das später als
      // separate Mail-Vorlage rendern.
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Agentur-Support angefragt für ${domain}`,
          message: `Hallo Team, ich bräuchte Hilfe bei der Umsetzung der Empfehlungen für ${url}. Letzter Scan: ${lastScanLabel}, ${totalIssues} Issues offen.`,
          requestType: "agency-support",
        }),
      }).catch(() => {});
      setSupportSent(true);
    } finally {
      setSupportBusy(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", background: T.page, color: T.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "32px 32px 80px", maxWidth: 1280, margin: "0 auto",
    }}>

      {/* ── Hero: Domain + Status + Re-Scan ───────────────────────────────── */}
      <div style={{
        marginBottom: 28, paddingBottom: 22, borderBottom: `1px solid ${T.divider}`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {firstName ? `Hallo ${firstName}, deine Website` : "Deine Website"}
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            {domain}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11.5, fontWeight: 700,
              padding: "4px 11px", borderRadius: 20,
              color: overallColor,
              background: `${overallColor}1a`,
              border: `1px solid ${overallColor}3a`,
              letterSpacing: "0.04em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: overallColor }} />
              Score {overallScore}/100
            </span>
            <span style={{ fontSize: 12, color: T.textSub }}>
              {totalIssues === 0
                ? "Alles im grünen Bereich"
                : totalIssues === 1
                ? "1 Punkt zum Aufräumen"
                : `${totalIssues} Punkte zum Aufräumen`}
            </span>
            <span style={{ fontSize: 12, color: T.textMuted }}>· Letzter Scan: {lastScanLabel}</span>
          </div>
        </div>

        <Link href={`/dashboard/scan?url=${encodeURIComponent(url)}`} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 22px", borderRadius: 10,
          background: "rgba(124,58,237,0.85)",
          border: "1px solid rgba(167,139,250,0.55)",
          color: "#fff",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Neuen Scan starten
        </Link>
      </div>

      {/* ── 3 Säulen ───────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18,
        marginBottom: 28,
      }} className="rescue-pillars">
        {PILLARS.map(p => {
          const pillarIssues = grouped[p.id];
          const score = pillarScore(pillarIssues);
          const sCol  = scoreColor(score);
          const top3  = pillarIssues.slice(0, 3);
          return (
            <div key={p.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderTop: `3px solid ${p.color}`,
              borderRadius: 14, padding: "22px 22px 18px",
              backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: p.bg, border: `1px solid ${p.bdr}`,
                  color: p.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 800, color: p.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Säule {PILLARS.indexOf(p) + 1}
                  </p>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                    {p.title}
                  </h2>
                </div>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.45 }}>
                {p.question}
              </p>
              <p style={{ margin: "0 0 18px", fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
                {p.hint}
              </p>

              {/* Score */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: sCol, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {score}
                </span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/100</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: T.textSub }}>
                  {pillarIssues.length === 0
                    ? "Keine Probleme"
                    : `${pillarIssues.length} ${pillarIssues.length === 1 ? "Befund" : "Befunde"}`}
                </span>
              </div>

              {/* Score-Bar */}
              <div style={{ height: 5, borderRadius: 99, background: T.divider, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: `${score}%`, background: sCol, borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>

              {/* Top-3 Issues */}
              {top3.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {top3.map((issue, i) => {
                    const dotColor = issue.severity === "red" ? T.red : issue.severity === "yellow" ? T.amber : T.green;
                    return (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: dotColor, marginTop: 6,
                          boxShadow: `0 0 5px ${dotColor}80`,
                        }} />
                        <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>
                          {issue.title}
                          {issue.count && issue.count > 1 && (
                            <span style={{ color: T.textMuted, fontWeight: 500 }}> ({issue.count}×)</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: T.greenBg, border: `1px solid ${T.greenBdr}`,
                  fontSize: 12, color: T.green, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Alles in Ordnung — keine Befunde in dieser Säule.
                </div>
              )}

              {/* Detail-Link */}
              {lastScanId && pillarIssues.length > 0 && (
                <Link
                  href={`/dashboard/scans/${lastScanId}`}
                  style={{
                    marginTop: "auto",
                    display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 7,
                    padding: "10px 14px", borderRadius: 9,
                    background: p.bg, border: `1px solid ${p.bdr}`,
                    color: p.color,
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                    paddingTop: pillarIssues.length > 0 ? "10px" : undefined,
                  }}
                >
                  <span>Alle Details ansehen</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Agentur-Support-CTA ──────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(34,211,238,0.04))",
        border: "1px solid rgba(124,58,237,0.25)",
        borderRadius: 14, padding: "22px 26px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 18, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Du bist nicht allein
          </p>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
            Brauchst du Hilfe bei der Umsetzung?
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
            Wir verbinden dich mit einer geprüften Agentur, die deine Befunde umsetzt — dein Scan-Bericht wird dabei sicher übermittelt.
          </p>
        </div>
        {supportSent ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "11px 22px", borderRadius: 10,
            background: T.greenBg, border: `1px solid ${T.greenBdr}`,
            color: T.green, fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Anfrage versendet — wir melden uns
          </span>
        ) : (
          <button
            type="button"
            onClick={requestAgencySupport}
            disabled={supportBusy}
            style={{
              padding: "11px 22px", borderRadius: 10,
              background: "rgba(124,58,237,0.85)",
              border: "1px solid rgba(167,139,250,0.55)",
              color: "#fff",
              fontWeight: 700, fontSize: 13,
              cursor: supportBusy ? "wait" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
              opacity: supportBusy ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {supportBusy ? "Wird gesendet…" : "Agentur-Support anfordern →"}
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .rescue-pillars { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
