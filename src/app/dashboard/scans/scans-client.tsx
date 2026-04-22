"use client";

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
                Scans: {monthlyScans} / {scanLimit}
                {limitReached && " (Limit erreicht)"}
              </span>
            </div>
          </div>

          {/* ── BERICHTE-LISTE ─────────────────────────────────── */}
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
                Starte deinen ersten Scan — dein Bericht ist sofort als PDF verfügbar.
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {scans.map(scan => {
                const domain = scan.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
                const date   = new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
                const issues = scan.issue_count ?? 0;
                const accent = issues === 0 ? D.green : issues <= 3 ? D.amber : D.red;
                return (
                  <div key={scan.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", borderRadius: D.radiusSm,
                    background: D.card, border: `1px solid ${D.border}`,
                  }}>
                    {/* Severity dot */}
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />

                    {/* Domain + date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {domain}
                      </div>
                      <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>{date}</div>
                    </div>

                    {/* Issue badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 20,
                      background: issues === 0 ? D.greenBg : issues <= 3 ? D.amberBg : D.redBg,
                      border: `1px solid ${issues === 0 ? D.greenBorder : issues <= 3 ? D.amberBorder : D.redBorder}`,
                      color: accent, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {issues === 0 ? "Keine Probleme" : `${issues} Problem${issues > 1 ? "e" : ""}`}
                    </span>

                    {/* Direct link to scan detail / PDF */}
                    <Link href={`/dashboard/scans/${scan.id}`} style={{
                      flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: D.radiusXs,
                      background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                      color: D.blueSoft, fontSize: 11, fontWeight: 700,
                      textDecoration: "none", whiteSpace: "nowrap",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
