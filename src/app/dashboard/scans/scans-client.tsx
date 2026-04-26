"use client";

import React, { useState, useEffect, useRef } from "react";
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
  emerald:      "#10B981",
  emeraldBg:    "rgba(16,185,129,0.08)",
  emeraldBorder:"rgba(16,185,129,0.22)",
  radius:       14,
  radiusSm:     8,
  radiusXs:     6,
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)  return "gerade eben";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `vor ${m} Minute${m !== 1 ? "n" : ""}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `vor ${h} Stunde${h !== 1 ? "n" : ""}`;
  }
  const d = Math.floor(diff / 86400);
  return `vor ${d} Tag${d !== 1 ? "en" : ""}`;
}

function isActiveNow(isoString: string | null): boolean {
  if (!isoString) return false;
  return Date.now() - new Date(isoString).getTime() < 24 * 60 * 60 * 1000;
}

function domainOf(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface ScanRow {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
  red_count:   number;
  yellow_count: number;
  share_token: string | null;
  view_count: number;
  download_count: number;
  last_viewed_at: string | null;
}

interface Props {
  firstName: string;
  monthlyScans: number;
  scanLimit: number;
  scans: ScanRow[];
  plan: string;
  isPro: boolean;
}

// ─── Touch-aware tooltip wrapper ──────────────────────────────────────────────
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss on outside click/tap
  useEffect(() => {
    if (!visible) return;
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      {children}
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap", pointerEvents: "none",
          fontSize: 11, fontWeight: 600, color: "#fff",
          background: "rgba(15,20,35,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "4px 9px", borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          zIndex: 50,
        }}>
          {label}
          {/* Arrow */}
          <span style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(255,255,255,0.1)",
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Analytics pill (eye + download icons) ─────────────────────────────────────
function AnalyticsPills({ scan, accent }: { scan: ScanRow; accent: string }) {
  const active = isActiveNow(scan.last_viewed_at);
  const viewLabel     = scan.view_count === 1 ? "1× angesehen" : `${scan.view_count}× angesehen`;
  const downloadLabel = scan.download_count === 1 ? "1× als PDF gespeichert" : `${scan.download_count}× als PDF gespeichert`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      {active && (
        <Tip label={`Zuletzt angesehen: ${timeAgo(scan.last_viewed_at!)}`}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            color: D.emerald, letterSpacing: "0.05em", textTransform: "uppercase",
            cursor: "default",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: D.emerald, flexShrink: 0, boxShadow: `0 0 5px ${D.emerald}` }} />
            Aktiv
          </span>
        </Tip>
      )}
      <Tip label={viewLabel}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
          background: scan.view_count > 0 ? `${accent}12` : "rgba(255,255,255,0.04)",
          border: `1px solid ${scan.view_count > 0 ? `${accent}28` : "rgba(255,255,255,0.08)"}`,
          color: scan.view_count > 0 ? accent : "rgba(255,255,255,0.25)",
          cursor: "default",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {scan.view_count}
        </span>
      </Tip>
      <Tip label={downloadLabel}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
          background: scan.download_count > 0 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${scan.download_count > 0 ? "rgba(251,191,36,0.22)" : "rgba(255,255,255,0.08)"}`,
          color: scan.download_count > 0 ? D.amber : "rgba(255,255,255,0.25)",
          cursor: "default",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {scan.download_count}
        </span>
      </Tip>
    </div>
  );
}

// ─── Live-Vibe activity feed ───────────────────────────────────────────────────
function ActivityFeed({ scans, accent }: { scans: ScanRow[]; accent: string }) {
  const [, setTick] = useState(0);
  // Re-render every minute so "vor X Minuten" stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const recent = scans
    .filter(s => s.last_viewed_at && isActiveNow(s.last_viewed_at))
    .sort((a, b) => new Date(b.last_viewed_at!).getTime() - new Date(a.last_viewed_at!).getTime())
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div style={{
      marginBottom: 24,
      padding: "14px 18px",
      borderRadius: D.radiusSm,
      background: `${accent}08`,
      border: `1px solid ${accent}25`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {/* Pulsing live dot */}
        <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%", background: D.emerald,
            animation: "wf-pulse 1.8s ease-in-out infinite",
          }} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          Letzte Kunden-Aktivität
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {recent.map(scan => (
          <div key={scan.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: "#fff" }}>{domainOf(scan.url)}</span>
              {" "}hat den Bericht{" "}
              <span style={{ color: accent, fontWeight: 600 }}>{timeAgo(scan.last_viewed_at!)}</span>
              {" "}angesehen.
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes wf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ScansClient({ firstName, monthlyScans, scanLimit, scans, plan, isPro }: Props) {
  const limitReached = monthlyScans >= scanLimit;
  const accent = "var(--agency-primary, #8df3d3)";

  // Pre-compute "previous scan of same URL" lookup for the Compare button.
  // Scans come sorted newest-first. For each scan, find the next-older scan
  // with the same origin → wir können dann Before/After vergleichen.
  function originOf(raw: string): string { try { return new URL(raw).origin; } catch { return raw; } }
  const previousScanByNewerId = new Map<string, string>();
  for (let i = 0; i < scans.length; i++) {
    const newer = scans[i];
    const origin = originOf(newer.url);
    for (let j = i + 1; j < scans.length; j++) {
      if (originOf(scans[j].url) === origin) {
        previousScanByNewerId.set(newer.id, scans[j].id);
        break;
      }
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Berichte
              </p>
              <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.03em" }}>
                Deine Experten-Berichte
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: D.textMuted, lineHeight: 1.6 }}>
                Professionell aufbereitet für dich und deine Kunden — jederzeit als PDF abrufbar.
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: limitReached ? D.red : D.blueSoft, whiteSpace: "nowrap" }}>
                Scans: {monthlyScans} / {scanLimit}{limitReached && " (Limit erreicht)"}
              </span>
            </div>
          </div>

          {/* Live-Vibe feed (Pro only) */}
          {isPro && <ActivityFeed scans={scans} accent={accent} />}

          {/* ── BERICHTE-LISTE ─────────────────────────────── */}
          {scans.length === 0 ? (
            <div style={{
              padding: "48px 40px", textAlign: "center",
              background: D.card, border: `1px dashed ${D.border}`,
              borderRadius: D.radius, marginBottom: 32,
            }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: D.text }}>
                Noch keine Berichte vorhanden
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: D.textMuted, lineHeight: 1.7 }}>
                Starte dein erstes WordPress-Audit — dein Bericht ist sofort als PDF verfügbar.
              </p>
              <Link href="/dashboard/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "11px 22px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: D.blueGlow,
              }}>
                Ersten Scan starten →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 32 }}>
              {scans.map(scan => {
                const domain   = domainOf(scan.url);
                const date     = new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
                const { red_count: red, yellow_count: yellow } = scan;
                const dotColor = red > 0 ? D.red : yellow > 0 ? D.amber : D.green;
                const hasShare = isPro && !!scan.share_token;

                return (
                  <div key={scan.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", borderRadius: D.radiusSm,
                    background: D.card, border: `1px solid ${D.border}`,
                    flexWrap: "wrap" as const,
                  }}>
                    {/* Severity dot */}
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />

                    {/* Domain + date */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {domain}
                      </div>
                      <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>{date}</div>
                    </div>

                    {/* Issue badges */}
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "nowrap" as const }}>
                      {red > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: D.redBg, border: `1px solid ${D.redBorder}`, color: D.red, whiteSpace: "nowrap" }}>
                          {red} Kritisch
                        </span>
                      )}
                      {yellow > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: D.amberBg, border: `1px solid ${D.amberBorder}`, color: D.amber, whiteSpace: "nowrap" }}>
                          {yellow} Hinweise
                        </span>
                      )}
                      {red === 0 && yellow === 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: D.greenBg, border: `1px solid ${D.greenBorder}`, color: D.green, whiteSpace: "nowrap" }}>
                          Keine Probleme
                        </span>
                      )}
                    </div>

                    {/* Analytics pills or unshared hint */}
                    {hasShare
                      ? <AnalyticsPills scan={scan} accent="var(--agency-primary, #8df3d3)" />
                      : (
                        <Tip label="Teilen-Link generieren → Analytics freischalten">
                          <Link href={`/dashboard/scans/${scan.id}`} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 9px", borderRadius: 8, textDecoration: "none",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px dashed rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 11, fontWeight: 600,
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Teilen
                          </Link>
                        </Tip>
                      )
                    }

                    {/* Compare button — only Pro+, only if a previous scan of same URL exists */}
                    {isPro && previousScanByNewerId.has(scan.id) && (
                      <Link
                        href={`/dashboard/scans/compare?a=${previousScanByNewerId.get(scan.id)}&b=${scan.id}`}
                        style={{
                          flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 11px", borderRadius: D.radiusXs,
                          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                          color: "#10B981", fontSize: 11, fontWeight: 700,
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                        title="Vorher/Nachher-Vergleich mit dem letzten Scan dieser URL"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <polyline points="9 5 15 12 9 19"/>
                        </svg>
                        Vergleichen
                      </Link>
                    )}

                    {/* View button */}
                    <Link href={`/dashboard/scans/${scan.id}`} style={{
                      flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: D.radiusXs,
                      background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                      color: D.blueSoft, fontSize: 11, fontWeight: 700,
                      textDecoration: "none", whiteSpace: "nowrap",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Bericht ansehen
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
