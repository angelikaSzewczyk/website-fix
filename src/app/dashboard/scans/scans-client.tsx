"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  page:         "#0b0c10",
  sidebar:      "#0A192F",
  card:         "rgba(255,255,255,0.03)",
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.14)",
  sidebarBdr:   "rgba(255,255,255,0.06)",
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  textFaint:    "rgba(255,255,255,0.18)",
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.25)",
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.25)",
  radius:       14,
  radiusSm:     8,
  radiusXs:     6,
} as const;


// ─── Lock icon ─────────────────────────────────────────────────────────────────
function LockIco({ size = 12, color = D.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface ScanRow {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
}

interface Props {
  firstName: string;
  monthlyScans: number;
  scanLimit: number;
  scans: ScanRow[];
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ScansClient({ firstName, monthlyScans, scanLimit, scans }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const limitReached = monthlyScans >= scanLimit;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── MAIN — sidebar rendered by dashboard layout.tsx ── */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Berichte
              </p>
              <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.03em" }}>
                PDF-Berichte &amp; Dokumentation
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: D.textMuted, lineHeight: 1.6 }}>
                Automatisch erstellte Monatsberichte für dein Projekt — archiviert, teilbar und professionell aufbereitet.
              </p>
            </div>

            {/* Scan-Limit Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 20, flexShrink: 0,
              background: limitReached ? "rgba(239,68,68,0.08)" : D.blueBg,
              border: `1px solid ${limitReached ? "rgba(239,68,68,0.25)" : D.blueBorder}`,
            }}>
              {limitReached ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={D.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={D.blueSoft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: limitReached ? D.red : D.blueSoft, whiteSpace: "nowrap" }}>
                Gratis-Scans: {monthlyScans} / {scanLimit}
                {limitReached && " (Limit erreicht)"}
              </span>
            </div>
          </div>

          {/* ── PDF REPORTS — locked empty state ──────────────── */}
          <div style={{
            padding: "56px 40px",
            background: D.card,
            border: `1px solid ${D.border}`,
            borderRadius: D.radius,
            textAlign: "center",
            marginBottom: 32,
            position: "relative", overflow: "hidden",
          }}>
            {/* Background glow */}
            <div style={{
              position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
              width: 300, height: 300,
              background: "radial-gradient(circle, rgba(0,123,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* PDF icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              position: "relative", zIndex: 1,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={D.blueSoft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              Noch keine Berichte vorhanden
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 14, color: D.textMuted, lineHeight: 1.75, maxWidth: 460, position: "relative", zIndex: 1 }}>
              Deine monatlichen Experten-Berichte werden hier automatisch archiviert.
              Verfügbar im <strong style={{ color: D.text }}>Professional Plan</strong>.
            </p>

            {/* Feature list */}
            <div style={{
              display: "inline-flex", flexDirection: "column", gap: 8,
              textAlign: "left", marginBottom: 28,
              position: "relative", zIndex: 1,
            }}>
              {[
                "Automatisch erstellter PDF-Bericht jeden Monat",
                "Strukturiert aufbereitet — teilbar mit Kunden",
                "Score-Verlauf, Probleme & behobene Punkte",
                "Für interne Dokumentation und Nachweise",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={D.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 13, color: D.textSub }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Link href="/pricing" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Professional aktivieren – Ab 39 €/Monat
              </Link>

              {/* Beispiel-Bericht — let free users see the end product */}
              <Link href="/sample-report" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: D.radiusSm,
                background: "transparent", color: D.textSub,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                border: `1px solid ${D.border}`,
                transition: "border-color 0.15s, color 0.15s",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Beispiel-Bericht ansehen
              </Link>

              <p style={{ margin: 0, fontSize: 12, color: D.textFaint }}>
                Professional Plan · Jederzeit kündbar
              </p>
            </div>
          </div>

          {/* ── SCAN-VERLAUF ──────────────────────────────────── */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scan-Verlauf
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Vergangene Audits
            </h2>

            {scans.length === 0 ? (
              <div style={{
                padding: "28px", borderRadius: D.radiusSm,
                background: D.card, border: `1px solid ${D.border}`,
                textAlign: "center",
              }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: D.textMuted }}>
                  Noch keine Scans durchgeführt.
                </p>
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 18px", borderRadius: D.radiusXs,
                  background: D.blue, color: "#fff",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                  boxShadow: D.blueGlow,
                }}>
                  Ersten Scan starten →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {scans.map(scan => {
                  const domain = scan.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
                  const date   = new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
                  const issues = scan.issue_count ?? 0;
                  const accent = issues === 0 ? D.green : issues <= 3 ? D.amber : D.red;
                  return (
                    <div
                      key={scan.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px", borderRadius: D.radiusSm,
                        background: D.card, border: `1px solid ${D.border}`,
                      }}
                    >
                      {/* Severity dot */}
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: accent, flexShrink: 0,
                      }} />

                      {/* Domain */}
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {domain}
                      </span>

                      {/* Issue badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: "2px 9px", borderRadius: 20,
                        background: issues === 0 ? D.greenBg : issues <= 3 ? D.amberBg : D.redBg,
                        border: `1px solid ${issues === 0 ? D.greenBorder : issues <= 3 ? D.amberBorder : D.redBorder}`,
                        color: accent, whiteSpace: "nowrap",
                      }}>
                        {issues === 0 ? "Keine Probleme" : `${issues} Problem${issues > 1 ? "e" : ""}`}
                      </span>

                      {/* Date */}
                      <span style={{ fontSize: 12, color: D.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {date}
                      </span>

                      {/* "Bericht ansehen" — locked CTA */}
                      <button
                        onClick={() => setModalOpen(true)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: D.radiusXs,
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${D.borderStrong}`,
                          color: D.textSub,
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                      >
                        <LockIco size={11} color={D.textMuted} />
                        Bericht ansehen
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── PAYWALL MODAL ────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623",
              border: `1px solid ${D.borderStrong}`,
              borderRadius: D.radius,
              padding: "36px 36px 32px",
              maxWidth: 440, width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            {/* PDF icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke={D.blueSoft} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" opacity="0.4"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" opacity="0.4"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              PDF-Berichte sind gesperrt
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: D.textSub, lineHeight: 1.75, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              PDF-Berichte sind im Professional Plan enthalten. Sichere dir jetzt den vollen Zugriff auf alle Auswertungen — professionell aufbereitet, monatlich archiviert.
            </p>

            {/* Feature list */}
            <div style={{
              display: "inline-flex", flexDirection: "column", gap: 7,
              textAlign: "left", marginBottom: 28,
            }}>
              {[
                "Monatlicher PDF-Bericht automatisch erstellt",
                "Score-Verlauf & alle gefundenen Probleme",
                "Teilbar mit Kunden & für Dokumentation",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={D.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 13, color: D.textSub }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/pricing"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 28px", borderRadius: D.radiusSm,
                  background: D.blue, color: "#fff",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Professional aktivieren – Ab 39 €/Monat
              </Link>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "10px", borderRadius: D.radiusSm,
                  border: `1px solid ${D.borderStrong}`,
                  background: "transparent", color: D.textMuted,
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
