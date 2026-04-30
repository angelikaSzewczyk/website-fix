"use client";

import { useState } from "react";
import Link from "next/link";
import ValueReportClient from "./value-report-client";
import type { ReportBranding, ReportKPIs, ActivityItem, SavedSite, ScanHistoryItem } from "./page";
import { isAgency as isAgencyPlan, isAtLeastProfessional, normalizePlan } from "@/lib/plans";

// ── Design tokens: DARK (Starter / Professional) ──────────────────────────────
const D = {
  page:       "#0b0c10",
  card:       "rgba(255,255,255,0.03)",
  cardSolid:  "#0f1623",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  text:       "#ffffff",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.28)",
  blue:       "#7aa6ff",
  blueBg:     "rgba(0,123,255,0.08)",
  blueBdr:    "rgba(0,123,255,0.25)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.08)",
  greenBdr:   "rgba(74,222,128,0.22)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.08)",
  amberBdr:   "rgba(251,191,36,0.22)",
  red:        "#c07070",
  redBg:      "rgba(160,80,80,0.08)",
  redBdr:     "rgba(160,80,80,0.18)",
};

// ── Design tokens: AGENCY (Phase 3 Sprint 7 — auf Dark-Mode geflippt) ────────
// Variable-Name "L" historisch beibehalten, damit alle bestehenden L.* Refe-
// renzen unverändert funktionieren. Werte gemappt aus Pro/Starter-Variants
// (UIHelpers.D), damit das Berichte-Archiv visuell zur Kommandozentrale passt.
const L = {
  bg:       "#0b0c10",
  card:     "rgba(255,255,255,0.025)",
  border:   "rgba(255,255,255,0.08)",
  divider:  "rgba(255,255,255,0.06)",
  shadow:   "none",
  shadowMd: "0 4px 18px rgba(0,0,0,0.5)",
  text:     "rgba(255,255,255,0.92)",
  textSub:  "rgba(255,255,255,0.65)",
  textMuted:"rgba(255,255,255,0.4)",
  green:    "#4ade80", greenBg: "rgba(74,222,128,0.10)",  greenBdr: "rgba(74,222,128,0.28)",
  amber:    "#fbbf24", amberBg: "rgba(251,191,36,0.10)",  amberBdr: "rgba(251,191,36,0.28)",
  red:      "#f87171", redBg:   "rgba(248,113,113,0.10)", redBdr:   "rgba(248,113,113,0.28)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function healthScore(issueCount: number | null): number {
  if (issueCount == null) return 0;
  return Math.max(0, Math.min(100, 100 - issueCount * 2));
}

function scoreColor(score: number): string {
  return score >= 70 ? D.green : score >= 40 ? D.amber : D.red;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function hostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

// ── ① STARTER: Scan-Archiv ────────────────────────────────────────────────────
function StarterView({ scans }: { scans: ScanHistoryItem[] }) {
  function handlePrint(scan: ScanHistoryItem) {
    window.location.href = `/dashboard/scans/${scan.id}`;
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Berichte
        </p>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
          Scan-Archiv
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: D.textSub }}>
          Deine letzten Scans und Fokus-Berichte als PDF abrufen.
        </p>
      </div>

      {/* Scan list */}
      {scans.length === 0 ? (
        <div style={{
          padding: "40px 32px", borderRadius: 16,
          border: `1px dashed ${D.border}`, textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: D.text }}>
            Noch keine Scans vorhanden
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: D.textSub }}>
            Starte dein erstes WordPress-Audit, um hier einen Bericht zu sehen.
          </p>
          <Link href="/dashboard/scan" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 9,
            background: D.blueBg, border: `1px solid ${D.blueBdr}`,
            color: D.blue, fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            Ersten Scan starten →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {scans.map((scan, i) => {
            const score = healthScore(scan.issue_count);
            const sc    = scoreColor(score);
            const issues = scan.issue_count ?? 0;
            return (
              <div key={scan.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "18px 22px", borderRadius: 14,
                background: D.card, border: `1px solid ${D.border}`,
                transition: "border-color 0.15s",
              }}>
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}`,
                  fontSize: 12, fontWeight: 700, color: D.textMuted,
                }}>
                  {i + 1}
                </div>

                {/* URL + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hostname(scan.url)}
                  </div>
                  <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>
                    {fmtDate(scan.created_at)} · {scan.type === "fullsite" ? "Full-Site Crawl" : "Website-Check"}
                  </div>
                </div>

                {/* Issue count badge */}
                <div style={{ textAlign: "center", minWidth: 70 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: sc, lineHeight: 1 }}>
                    {issues}
                  </div>
                  <div style={{ fontSize: 10, color: D.textMuted, marginTop: 2 }}>
                    {issues === 1 ? "Optimierung" : "Optimierungen"}
                  </div>
                </div>

                {/* Score mini ring */}
                <div style={{
                  width: 44, height: 44, flexShrink: 0, position: "relative",
                }}>
                  <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke={sc} strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: sc,
                  }}>
                    {score}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handlePrint(scan)}
                  title="Bericht öffnen"
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 8,
                    background: D.blueBg, border: `1px solid ${D.blueBdr}`,
                    color: D.blue, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Bericht
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upsell */}
      <div style={{
        marginTop: 32, padding: "22px 24px", borderRadius: 14,
        background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: D.text }}>
              Vorher-Nachher Trend-Analyse
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: D.textSub, lineHeight: 1.6 }}>
              Mit Professional siehst du, ob deine SEO-Scores und Issue-Zahlen sich Monat für Monat verbessern — inklusive KI-Empfehlungen als PDF-Anhang.
            </p>
            <Link href="/fuer-agenturen#pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, textDecoration: "none",
              fontSize: 12, fontWeight: 700,
              background: D.amberBg, border: `1px solid ${D.amberBdr}`, color: D.amber,
            }}>
              Auf Professional upgraden →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── ② PROFESSIONAL: Analyse-Zentrale ─────────────────────────────────────────
function ProfessionalView({ scans, kpis, monthLabel }: { scans: ScanHistoryItem[]; kpis: ReportKPIs; monthLabel: string }) {
  const [printing, setPrinting] = useState(false);

  const latest = scans[0] ?? null;
  const prev   = scans[1] ?? null;

  const latestScore = healthScore(latest?.issue_count ?? null);
  const prevScore   = healthScore(prev?.issue_count   ?? null);
  const scoreDelta  = prev ? latestScore - prevScore : null;
  const issueDelta  = (prev && latest)
    ? (latest.issue_count ?? 0) - (prev.issue_count ?? 0)
    : null;

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #wf-pro-print { display: block !important; }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #wf-pro-print * {
            background-color: transparent !important;
            color: #111111 !important;
            border-color: #d1d5db !important;
            box-shadow: none !important;
          }
          #wf-pro-print [style*="color: rgba"],
          #wf-pro-print [style*="color: #fff"] {
            color: #111111 !important;
          }
          @page { margin: 18mm 16mm; size: A4 portrait; }
        }
        @media screen { #wf-pro-print { display: none; } }
        @keyframes wf-rpt-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Berichte · Professional
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Analyse-Zentrale
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: D.textSub }}>
              Trend-Analyse · {monthLabel}
            </p>
          </div>
          <button onClick={handlePrint} disabled={printing} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 9,
            border: `1px solid ${D.blueBdr}`, background: D.blueBg,
            cursor: printing ? "default" : "pointer",
            color: D.blue, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            opacity: printing ? 0.5 : 1,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {printing ? "Vorbereitung…" : "Als PDF speichern"}
          </button>
        </div>

        {/* ── TREND COMPARISON ── */}
        {latest && prev ? (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0,
            background: D.card, border: `1px solid ${D.border}`, borderRadius: 16,
            overflow: "hidden", marginBottom: 24,
            animation: "wf-rpt-in 0.35s ease both",
          }}>
            {/* Previous scan */}
            <div style={{ padding: "28px 24px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Vorheriger Scan
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: D.textSub }}>
                {fmtDate(prev.created_at)}
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(prevScore), letterSpacing: "-0.03em", lineHeight: 1 }}>
                {prevScore}
              </div>
              <div style={{ fontSize: 11, color: D.textMuted, marginTop: 4 }}>Health-Score /100</div>
              <div style={{ marginTop: 12, fontSize: 13, color: D.textSub }}>
                <strong style={{ color: D.text }}>{prev.issue_count ?? 0}</strong> Optimierungen
              </div>
            </div>

            {/* Delta column */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "0 24px",
              borderLeft: `1px solid ${D.border}`, borderRight: `1px solid ${D.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>
                Trend
              </div>
              {/* Score delta */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "12px 18px", borderRadius: 12,
                background: scoreDelta! > 0 ? D.greenBg : scoreDelta! < 0 ? D.redBg : D.card,
                border: `1px solid ${scoreDelta! > 0 ? D.greenBdr : scoreDelta! < 0 ? D.redBdr : D.border}`,
              }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>
                  {scoreDelta! > 0 ? "↑" : scoreDelta! < 0 ? "↓" : "→"}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: scoreDelta! > 0 ? D.green : scoreDelta! < 0 ? D.red : D.textMuted }}>
                  {scoreDelta! > 0 ? "+" : ""}{scoreDelta}
                </div>
                <div style={{ fontSize: 9, color: D.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Score
                </div>
              </div>
              {/* Issue delta */}
              {issueDelta !== null && (
                <div style={{ marginTop: 10, textAlign: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: issueDelta <= 0 ? D.green : D.red }}>
                    {issueDelta <= 0 ? "↓" : "↑"} {Math.abs(issueDelta)} Issues
                  </span>
                  <div style={{ fontSize: 10, color: D.textMuted }}>
                    {issueDelta <= 0 ? "weniger als vorher" : "mehr als vorher"}
                  </div>
                </div>
              )}
            </div>

            {/* Latest scan */}
            <div style={{ padding: "28px 24px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Aktueller Scan
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: D.textSub }}>
                {fmtDate(latest.created_at)}
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(latestScore), letterSpacing: "-0.03em", lineHeight: 1 }}>
                {latestScore}
              </div>
              <div style={{ fontSize: 11, color: D.textMuted, marginTop: 4 }}>Health-Score /100</div>
              <div style={{ marginTop: 12, fontSize: 13, color: D.textSub }}>
                <strong style={{ color: D.text }}>{latest.issue_count ?? 0}</strong> Optimierungen
              </div>
              <Link href={`/dashboard/scans/${latest.id}`} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                marginTop: 14, padding: "6px 12px", borderRadius: 7, textDecoration: "none",
                fontSize: 11, fontWeight: 700,
                background: D.blueBg, border: `1px solid ${D.blueBdr}`, color: D.blue,
              }}>
                Detailbericht öffnen →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "32px 24px", borderRadius: 16, textAlign: "center",
            background: D.card, border: `1px solid ${D.border}`, marginBottom: 24,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: D.text }}>
              Noch kein Vorher-Nachher möglich
            </p>
            <p style={{ margin: 0, fontSize: 13, color: D.textSub }}>
              Du brauchst mindestens 2 Scans für eine Trend-Analyse.{" "}
              <Link href="/dashboard/scan" style={{ color: D.blue }}>Jetzt scannen →</Link>
            </p>
          </div>
        )}

        {/* ── KPI STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24, animation: "wf-rpt-in 0.4s 0.1s ease both" }}>
          {[
            { label: "Scans diesen Monat", value: String(kpis.scansThisMonth), color: D.blue, bg: D.blueBg, bdr: D.blueBdr },
            { label: "Uptime", value: kpis.uptimePct !== null ? `${kpis.uptimePct}%` : "—", color: kpis.uptimePct && kpis.uptimePct >= 99 ? D.green : D.amber, bg: D.amberBg, bdr: D.amberBdr },
            { label: "Ø Ladezeit", value: kpis.avgResponseMs ? `${kpis.avgResponseMs} ms` : "—", color: kpis.avgResponseMs && kpis.avgResponseMs < 500 ? D.green : D.amber, bg: D.amberBg, bdr: D.amberBdr },
          ].map(k => (
            <div key={k.label} style={{ padding: "18px 20px", borderRadius: 12, background: k.bg, border: `1px solid ${k.bdr}`, textAlign: "center" as const }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: D.textSub, marginTop: 6 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── SCAN HISTORY ── */}
        <div style={{ animation: "wf-rpt-in 0.45s 0.15s ease both" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Scan-Verlauf
          </p>
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, overflow: "hidden" }}>
            {scans.length === 0 ? (
              <div style={{ padding: "28px 24px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: D.textSub }}>
                  Noch keine Scans — <Link href="/dashboard/scan" style={{ color: D.blue }}>Scan starten</Link>
                </p>
              </div>
            ) : scans.map((scan, i) => {
              const sc = healthScore(scan.issue_count);
              const col = scoreColor(sc);
              return (
                <div key={scan.id} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 20px",
                  borderBottom: i < scans.length - 1 ? `1px solid ${D.border}` : "none",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {hostname(scan.url)}
                    </div>
                    <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>
                      {fmtDate(scan.created_at)} · {scan.type === "fullsite" ? "Full-Site" : "Website-Check"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
                    background: col === D.green ? D.greenBg : col === D.amber ? D.amberBg : D.redBg,
                    border: `1px solid ${col === D.green ? D.greenBdr : col === D.amber ? D.amberBdr : D.redBdr}`,
                    color: col,
                  }}>
                    {scan.issue_count ?? "?"} Issues
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: col, minWidth: 28, textAlign: "right" as const }}>
                    {sc}
                  </span>
                  <Link href={`/dashboard/scans/${scan.id}`} style={{
                    fontSize: 11, fontWeight: 700, color: D.blue, textDecoration: "none",
                    padding: "5px 10px", borderRadius: 7,
                    background: D.blueBg, border: `1px solid ${D.blueBdr}`,
                  }}>
                    Details
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Print-only view */}
        <div id="wf-pro-print" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fff", color: "#111", padding: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: 14, marginBottom: 24 }}>
            <span style={{ fontWeight: 800, fontSize: 18 }}>Website<span style={{ color: "#F59E0B" }}>Fix</span> · Analyse-Bericht</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{monthLabel}</span>
          </div>
          {latest && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Letzter Scan: {hostname(latest.url)}</p>
              <p style={{ fontSize: 13, color: "#374151" }}>Datum: {fmtDate(latest.created_at)}</p>
              <p style={{ fontSize: 13, color: "#374151" }}>Optimierungen: {latest.issue_count ?? "?"}</p>
              <p style={{ fontSize: 13, color: "#374151" }}>Health-Score: {latestScore}/100</p>
              {scoreDelta !== null && (
                <p style={{ fontSize: 13, color: scoreDelta > 0 ? "#15803d" : "#b91c1c" }}>
                  Score-Veränderung: {scoreDelta > 0 ? "+" : ""}{scoreDelta} Punkte gegenüber Vormonat
                </p>
              )}
            </div>
          )}
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 14, fontSize: 11, color: "#9ca3af" }}>
            Erstellt am {new Date().toLocaleDateString("de-DE")} · Powered by WebsiteFix
          </div>
        </div>

      </main>
    </>
  );
}

// ── ③ AGENCY: Kunden-Kommandozentrale ─────────────────────────────────────────
function AgencyView({
  plan, branding, kpis, activities, monthLabel, savedSites,
}: {
  plan: string;
  branding: ReportBranding;
  kpis: ReportKPIs;
  activities: ActivityItem[];
  monthLabel: string;
  savedSites: SavedSite[];
}) {
  const [printing, setPrinting]           = useState(false);
  const [autoReport, setAutoReport]       = useState(false);
  const [clientEmail, setClientEmail]     = useState("");
  const [autoSaved, setAutoSaved]         = useState(false);

  const color    = branding.primaryColor;
  const colorBg  = `${color}12`;
  const colorBdr = `${color}28`;
  const agName   = branding.agencyName || "Meine Agentur";

  const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  const uptimeVal   = kpis.uptimePct !== null ? `${kpis.uptimePct}%` : "—";
  const uptimeColor = kpis.uptimePct === null ? L.textMuted : kpis.uptimePct >= 99 ? L.green : kpis.uptimePct >= 95 ? L.amber : L.red;
  const uptimeBg    = kpis.uptimePct === null ? L.divider  : kpis.uptimePct >= 99 ? L.greenBg : kpis.uptimePct >= 95 ? L.amberBg : L.redBg;
  const uptimeBdr   = kpis.uptimePct === null ? L.border   : kpis.uptimePct >= 99 ? L.greenBdr : kpis.uptimePct >= 95 ? L.amberBdr : L.redBdr;

  // Phase 3 Sprint 7 — Sanity-Cap auf avgResponseMs.
  // kpis.avgResponseMs kommt aus scan_log.duration_ms (UNSERE interne
  // Scan-Dauer, nicht die Response-Time des Kunden-Servers). Werte > 5s
  // sind keine sinnvolle Endkunden-Metrik; in dem Fall lieber "—" als
  // einen absurden 23-Sekunden-Wert in der White-Label-Kachel.
  const RESPONSE_MS_THRESHOLD = 5000;
  const responseMs            = kpis.avgResponseMs && kpis.avgResponseMs <= RESPONSE_MS_THRESHOLD ? kpis.avgResponseMs : null;
  const msVal       = responseMs ? `${responseMs} ms` : "—";
  const msBg        = !responseMs ? L.divider : responseMs < 500 ? L.greenBg : responseMs < 1500 ? L.amberBg : L.redBg;
  const msColor     = !responseMs ? L.textMuted : responseMs < 500 ? L.green : responseMs < 1500 ? L.amber : L.red;
  const msBdr       = !responseMs ? L.border : responseMs < 500 ? L.greenBdr : responseMs < 1500 ? L.amberBdr : L.redBdr;

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  }

  function handleAutoSave() {
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2500);
  }

  const aiSummary = (() => {
    const parts: string[] = [];
    if (kpis.scansThisMonth > 0) parts.push(`${kpis.scansThisMonth} automatisierte Website-Audit${kpis.scansThisMonth > 1 ? "s" : ""}`);
    if (kpis.leadsThisMonth > 0) parts.push(`${kpis.leadsThisMonth} qualifizierte${kpis.leadsThisMonth > 1 ? " Leads" : "n Lead"} generiert`);
    if (kpis.monitoredSites > 0) parts.push(`${kpis.monitoredSites} Website${kpis.monitoredSites > 1 ? "s" : ""} überwacht`);
    const intro   = parts.length > 0 ? `Im ${monthLabel} haben wir ${parts.join(", ")}.` : `Im ${monthLabel} liefen alle Systeme stabil.`;
    const uptime  = kpis.uptimePct !== null ? ` Uptime: ${kpis.uptimePct}%.` : "";
    const closing = agName ? ` ${agName} stellt sicher, dass Ihre Online-Präsenz jederzeit performant und sicher bleibt.` : "";
    return intro + uptime + closing;
  })();

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #wf-agency-print { display: block !important; }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #wf-agency-print * {
            background-color: transparent !important;
            color: #111111 !important;
            border-color: #d1d5db !important;
            box-shadow: none !important;
          }
          #wf-agency-print [style*="color: rgba"],
          #wf-agency-print [style*="color: #fff"] {
            color: #111111 !important;
          }
          @page { margin: 18mm 16mm; size: A4 portrait; }
        }
        @media screen { #wf-agency-print { display: none; } }
      `}</style>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Berichte · {plan === "agency-pro" ? "Agency Pro" : "Agency"}
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: L.text, letterSpacing: "-0.02em" }}>
              Kunden-Kommandozentrale
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: L.textMuted }}>White-Label Monatsbericht · {monthLabel}</p>
          </div>
          <button onClick={handlePrint} disabled={printing} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 9,
            border: "1px solid rgba(124,58,237,0.40)",
            background: "rgba(124,58,237,0.18)",
            cursor: printing ? "default" : "pointer",
            color: "#a78bfa",
            fontSize: 13, fontWeight: 700,
            opacity: printing ? 0.5 : 1, fontFamily: "inherit",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {printing ? "Vorbereitung…" : "Als PDF speichern"}
          </button>
        </div>

        {/* ── AUTO-SEND CARD ── */}
        <div style={{
          padding: "22px 24px", borderRadius: 14,
          background: L.card, border: `1px solid ${L.border}`,
          boxShadow: L.shadow, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: L.text }}>
                Automatischer Monats-Report
              </p>
              <p style={{ margin: 0, fontSize: 12, color: L.textMuted }}>
                Bericht wird am 1. jeden Monats automatisch per E-Mail versendet.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setAutoReport(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  border: `1px solid ${autoReport ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.10)"}`,
                  background: autoReport ? "rgba(124,58,237,0.40)" : "rgba(255,255,255,0.06)",
                  cursor: "pointer", position: "relative", transition: "background 0.2s, border-color 0.2s", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: autoReport ? 22 : 2,
                  width: 18, height: 18, borderRadius: "50%",
                  background: autoReport ? "#a78bfa" : "rgba(255,255,255,0.55)",
                  transition: "left 0.2s, background 0.2s",
                }} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: autoReport ? L.text : L.textMuted }}>
                {autoReport ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          </div>
          {autoReport && (
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="kunde@firma.de"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                style={{
                  flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${L.border}`, fontSize: 13, color: L.text,
                  background: L.bg, fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={handleAutoSave}
                style={{
                  padding: "8px 18px", borderRadius: 8,
                  background: "rgba(124,58,237,0.18)",
                  border: "1px solid rgba(124,58,237,0.40)",
                  color: "#a78bfa",
                  fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {autoSaved ? "✓ Gespeichert" : "Speichern"}
              </button>
            </div>
          )}
        </div>

        {/* ── WHITE-LABEL REPORT CARD ── */}
        <div id="wf-report-card" style={{
          background: L.card, border: `1px solid ${L.border}`,
          borderRadius: 16, boxShadow: L.shadowMd, overflow: "hidden", marginBottom: 32,
        }}>
          {/* Header banner */}
          <div style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            padding: "26px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={agName}
                  style={{ height: 38, maxWidth: 110, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#fff",
                }}>
                  {agName.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>{agName}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>Monatlicher Website-Report</div>
              </div>
            </div>
            <div style={{ textAlign: "right" as const, position: "relative" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{monthLabel}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{dateStr}</div>
            </div>
          </div>

          <div style={{ padding: "28px 28px" }}>
            {/* KI Summary */}
            <div style={{ padding: "18px 20px", borderRadius: 12, background: colorBg, border: `1px solid ${colorBdr}`, marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10 }}>
                🤖 KI-Monatszusammenfassung
              </div>
              <p style={{ margin: 0, fontSize: 14, color: L.textSub, lineHeight: 1.8 }}>{aiSummary}</p>
            </div>

            {/* KPI grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Uptime",       value: uptimeVal,                      sub: kpis.monitoredSites > 0 ? `${kpis.monitoredSites} Sites` : "Kein Monitoring", color: uptimeColor, bg: uptimeBg, bdr: uptimeBdr },
                { label: "Ø Ladezeit",   value: msVal,                          sub: "Response Time",        color: msColor,    bg: msBg,    bdr: msBdr    },
                { label: "Scans",        value: String(kpis.scansThisMonth),    sub: "diesen Monat",         color,             bg: colorBg, bdr: colorBdr },
                { label: "Widget-Leads", value: String(kpis.leadsThisMonth),    sub: `${kpis.leadsTotal} gesamt`, color: L.green, bg: L.greenBg, bdr: L.greenBdr },
              ].map(k => (
                <div key={k.label} style={{ padding: "18px 20px", borderRadius: 12, border: `1px solid ${k.bdr}`, background: k.bg, textAlign: "center" as const }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: L.textSub, marginTop: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: L.textMuted, marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Activity / Client-Projekte */}
            {savedSites.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: L.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>
                  Projekte / Kunden
                </div>
                <div style={{ border: `1px solid ${L.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {savedSites.map((s, i) => (
                    <div key={s.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 20px",
                      borderBottom: i < savedSites.length - 1 ? `1px solid ${L.divider}` : "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: colorBg, border: `1px solid ${colorBdr}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, color,
                      }}>
                        {(s.name || hostname(s.url)).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: L.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.name || hostname(s.url)}
                        </div>
                        <div style={{ fontSize: 11, color: L.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity feed */}
            {activities.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: L.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>
                  Letzte Ereignisse
                </div>
                <div style={{ border: `1px solid ${L.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {activities.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 20px",
                      borderBottom: i < activities.length - 1 ? `1px solid ${L.divider}` : "none",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${item.color}12`, border: `1px solid ${item.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: L.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                        {item.sub && <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: L.textMuted, flexShrink: 0 }}>
                        {new Date(item.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${L.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: L.textMuted }}>Bericht erstellt am {dateStr} · Powered by WebsiteFix</div>
              {branding.agencyName && (
                <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: colorBg, color, border: `1px solid ${colorBdr}` }}>
                  {branding.agencyName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── VALUE REPORT GENERATOR ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Value Report Generator
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: colorBg, color, border: `1px solid ${colorBdr}` }}>
              Agentur-Feature
            </span>
          </div>
          {savedSites.length > 0 ? (
            <ValueReportClient websites={savedSites} />
          ) : (
            <div style={{ padding: "22px 24px", borderRadius: 12, border: `1px dashed ${L.border}`, background: L.card }}>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: L.text }}>Kunden-Websites einrichten</p>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: L.textMuted, lineHeight: 1.6 }}>
                Speichere Kunden-Websites im Monitoring, um individuelle White-Label Reports pro Kunde zu erstellen.
              </p>
              <a href="/dashboard/monitoring" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700, background: color, color: "#fff" }}>
                Monitoring einrichten →
              </a>
            </div>
          )}
        </div>

      </main>

      {/* Print-only */}
      <div id="wf-agency-print" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fff", color: L.text, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #E5E7EB", paddingBottom: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ background: "#0D1117", borderRadius: 7, padding: 3 }}>
              <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 300, fontSize: 15, color: L.text }}>Website<span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span></span>
          </div>
          <div style={{ textAlign: "right" as const, fontSize: 11, color: L.textMuted }}>
            <div style={{ fontWeight: 600 }}>Website-Report {monthLabel}</div>
            <div>{dateStr}</div>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{agName}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{monthLabel}</div>
        </div>
        <div style={{ padding: "16px 18px", borderRadius: 10, background: colorBg, border: `1px solid ${colorBdr}`, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>KI-Monatszusammenfassung</div>
          <p style={{ margin: 0, fontSize: 12, color: L.textSub, lineHeight: 1.8 }}>{aiSummary}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Uptime", value: uptimeVal, sub: `${kpis.monitoredSites} Sites` },
            { label: "Ladezeit", value: msVal, sub: "Response Time" },
            { label: "Scans", value: String(kpis.scansThisMonth), sub: "diesen Monat" },
            { label: "Leads", value: String(kpis.leadsThisMonth), sub: `${kpis.leadsTotal} gesamt` },
          ].map(k => (
            <div key={k.label} style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid #E5E7EB", textAlign: "center" as const }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: L.textSub, marginTop: 4 }}>{k.label}</div>
              <div style={{ fontSize: 9, color: L.textMuted, marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main export: plan-based router ────────────────────────────────────────────
export default function ReportsClient({
  plan,
  scanHistory,
  branding,
  kpis,
  activities,
  monthLabel,
  savedSites,
}: {
  plan:        string;
  scanHistory: ScanHistoryItem[];
  branding:    ReportBranding;
  kpis:        ReportKPIs;
  activities:  ActivityItem[];
  monthLabel:  string;
  agencyId:    string;
  savedSites:  SavedSite[];
}) {
  const canonical = normalizePlan(plan);
  // starter (and any unknown) → StarterView

  if (isAgencyPlan(plan)) return <AgencyView plan={plan} branding={branding} kpis={kpis} activities={activities} monthLabel={monthLabel} savedSites={savedSites} />;
  if (canonical === "professional" || (isAtLeastProfessional(plan) && !isAgencyPlan(plan))) {
    return <ProfessionalView scans={scanHistory} kpis={kpis} monthLabel={monthLabel} />;
  }
  return <StarterView scans={scanHistory} />;
}
