"use client";

/**
 * MapAndTools — Phase-2-Iter-3 Shared-Sektionen.
 *
 * Visualisierungs-Komponenten:
 *   - DeepScanMap: Interaktive Site-Map (Homepage + Subpages mit Issue-Counts)
 *   - InlineStat: Kleines Label/Value-Stat-Pair für Toolbar-Anzeigen
 *   - GscInsightCard: Google-Search-Console-Daten-Card mit Speed-Insight
 *
 * Vorher in jedem Variant dupliziert. Single-Source jetzt hier.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { D, Card, SectionLabel, SectionHead, hexToRgb } from "./UIHelpers";
import type { UnterseiteProp } from "./dashboard-types";

// ─── Deep-Scan Map ────────────────────────────────────────────────────────────
export function DeepScanMap({ homepageUrl, homepageIssueCount, unterseiten, isFree, onOpenDrawer, checkedUrls, onToggleChecked, highlightUrl, activeUrl }: {
  homepageUrl: string;
  homepageIssueCount: number;
  unterseiten: UnterseiteProp[];
  isFree: boolean;
  onOpenDrawer: (url: string) => void;
  checkedUrls: Set<string>;
  onToggleChecked: (url: string) => void;
  highlightUrl?: string | null;
  activeUrl?: string | null;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  void expanded; void setExpanded;

  return (
    <div className="wf-deep-scan-map" style={{ marginBottom: 28 }}>
      <SectionLabel>Scan-Ergebnisse · Alle analysierten Seiten</SectionLabel>
      <SectionHead>Deep-Scan Map</SectionHead>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* ── Startseite ── */}
        {(() => {
          const isHomeActive = activeUrl === homepageUrl;
          return (
            <div
              onClick={() => homepageIssueCount > 0 && onOpenDrawer(homepageUrl)}
              style={{
                padding: "13px 20px",
                borderBottom: `1px solid ${D.divider}`,
                background: isHomeActive
                  ? "rgba(251,191,36,0.10)"
                  : "rgba(0,123,255,0.035)",
                borderLeft: isHomeActive ? `3px solid ${D.amber}` : "3px solid transparent",
                display: "flex", alignItems: "center", gap: 10,
                cursor: homepageIssueCount > 0 ? "pointer" : "default",
                transition: "background 0.15s",
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                background: "rgba(0,123,255,0.12)", color: D.blueSoft,
                border: "1px solid rgba(0,123,255,0.22)", whiteSpace: "nowrap", flexShrink: 0,
              }}>START</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: D.text, fontFamily: "monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
              }}>
                {homepageUrl}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                color: homepageIssueCount > 0 ? D.amber : D.green,
                background: homepageIssueCount > 0 ? D.amberBg : D.greenBg,
                border: `1px solid ${homepageIssueCount > 0 ? D.amberBorder : D.greenBorder}`,
                padding: "2px 8px", borderRadius: 4,
              }}>
                {homepageIssueCount > 0 ? `${homepageIssueCount} Optimierungen` : "✓ Optimiert"}
              </span>
              {homepageIssueCount > 0 && (
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 4,
                  background: isHomeActive ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.08)",
                  border: `1px solid rgba(251,191,36,0.28)`,
                  color: D.amber,
                }}>
                  SEO-Fix →
                </span>
              )}
            </div>
          );
        })()}

        {/* ── Unterseiten ── */}
        {unterseiten.map((page, i) => {
          const pageIssues =
            page.altMissing
            + (!page.erreichbar ? 1 : 0)
            + (page.noindex ? 1 : 0)
            + (!page.title || page.title === "(kein Title)" ? 1 : 0)
            + (!page.h1 || page.h1 === "(kein H1)" ? 1 : 0)
            + (!page.metaDescription ? 1 : 0)
            + (page.inputsWithoutLabel ?? 0)
            + (page.buttonsWithoutText ?? 0);
          const isLast    = i === unterseiten.length - 1;
          const isChecked = checkedUrls.has(page.url);

          const isHighlighted = highlightUrl === page.url;
          const isActive      = activeUrl === page.url;
          return (
            <div
              key={page.url}
              onClick={() => pageIssues > 0 && onOpenDrawer(page.url)}
              style={{
                borderBottom: isLast ? "none" : `1px solid ${D.divider}`,
                background: isActive
                  ? "rgba(251,191,36,0.10)"
                  : isHighlighted ? "rgba(251,191,36,0.12)"
                  : isChecked ? "rgba(74,222,128,0.04)"
                  : "transparent",
                opacity: isChecked ? 0.65 : 1,
                transition: "background 0.15s, opacity 0.2s",
                borderLeft: (isActive || isHighlighted) ? `3px solid ${D.amber}` : "3px solid transparent",
                cursor: pageIssues > 0 ? "pointer" : "default",
              }}
            >
              <div style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                {/* Geprüft checkbox — stopPropagation so it doesn't open drawer */}
                <button
                  title={isChecked ? "Als offen markieren" : "Als geprüft markieren"}
                  onClick={e => { e.stopPropagation(); onToggleChecked(page.url); }}
                  style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 4,
                    border: `1.5px solid ${isChecked ? D.greenBorder : D.border}`,
                    background: isChecked ? D.greenBg : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: D.green, fontSize: 11, fontWeight: 700,
                  }}
                >
                  {isChecked ? "✓" : ""}
                </button>

                {/* Status badge — turns green immediately when page is checked off */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: isChecked ? D.greenBg : pageIssues > 0 ? D.amberBg : D.greenBg,
                  color:      isChecked ? D.green  : pageIssues > 0 ? D.amber   : D.green,
                  border: `1px solid ${isChecked ? D.greenBorder : pageIssues > 0 ? D.amberBorder : D.greenBorder}`,
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "background 0.2s, color 0.2s, border-color 0.2s",
                }}>
                  {isChecked ? "✓ Geprüft" : pageIssues > 0 ? `${pageIssues} Optimierungen` : "✓ Optimiert"}
                </span>

                {/* Full URL */}
                <span style={{
                  fontSize: 12, color: isChecked ? D.textMuted : D.textSub, fontFamily: "monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                  textDecoration: isChecked ? "line-through" : "none",
                }}>
                  {page.url}
                </span>

                {/* Offline badge */}
                {!page.erreichbar && (
                  <span style={{
                    flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 6px",
                    borderRadius: 4, background: D.redBg, color: D.red,
                    border: `1px solid ${D.redBorder}`,
                  }}>
                    404/5xx
                  </span>
                )}

                {/* SEO-Fix label — visual affordance, row itself is the click target */}
                {pageIssues > 0 && (
                  <span style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 4,
                    background: isActive ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.08)",
                    border: `1px solid rgba(251,191,36,0.28)`,
                    color: D.amber,
                  }}>
                    SEO-Fix →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
// ─── GSC-Insight-Card ────────────────────────────────────────────────────────
// Zeigt Impressions/Clicks aus Search Console neben dem Speed-Score.
// Bei speedScore < 40: roter Insight "Traffic-Risiko durch sinkende Performance".
export function GscInsightCard({ speedScore, domainUrl }: { speedScore: number; domainUrl: string }) {
  const [state, setState] = useState<"loading" | "not_configured" | "ok" | "error">("loading");
  const [totals, setTotals] = useState<{ impressions: number; clicks: number; ctr: number; position: number | null } | null>(null);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/integrations/gsc")
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.connected && d.ok && d.totals) { setTotals(d.totals); setState("ok"); }
        else if (!d.connected)                { setState("not_configured"); setReason(d.reason ?? ""); }
        else                                  { setState("error"); setReason(d.error ?? ""); }
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, []);

  const lowSpeed = speedScore < 40;
  if (state === "loading" && !lowSpeed) return null; // Keep UI clean during initial load

  const domain = (() => { try { return new URL(domainUrl).hostname.replace(/^www\./, ""); } catch { return domainUrl; } })();

  return (
    <div style={{
      marginBottom: 24, borderRadius: D.radiusSm, overflow: "hidden",
      background: "rgba(66,133,244,0.04)", border: "1px solid rgba(66,133,244,0.22)",
    }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
        {/* Offizielles Google-G — multicolor (statt Letter-Placeholder) */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(66,133,244,0.18), 0 2px 6px rgba(66,133,244,0.10)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.232c1.891-1.741 2.981-4.305 2.981-7.351z"/>
            <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.619-2.422l-3.232-2.51c-.895.6-2.041.955-3.387.955-2.604 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
            <path fill="#FBBC04" d="M6.405 13.9A5.997 5.997 0 0 1 6.09 12c0-.66.114-1.3.314-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49z"/>
            <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.868-2.868C16.96 3.04 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51L6.405 10.1C7.19 7.737 9.396 5.977 12 5.977z"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#4285F4", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
            Search Console · {domain}
          </div>
          <div style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.5 }}>
            {state === "ok" && totals ? "Letzte 28 Tage"
             : state === "loading" ? "Lädt GSC-Daten…"
             : state === "not_configured" ? (
                reason === "plan"
                  ? "Professional-Plan erforderlich"
                  : "Verbinde die Google Search Console, um Traffic-Einbußen durch technische Fehler sofort zu erkennen."
              )
             : "Fehler beim Abruf"}
          </div>
        </div>

        {state === "ok" && totals && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
            <InlineStat label="Impressions" value={totals.impressions.toLocaleString("de-DE")} />
            <InlineStat label="Klicks"      value={totals.clicks.toLocaleString("de-DE")} />
            <InlineStat label="CTR"         value={`${(totals.ctr * 100).toFixed(2)}%`} />
            {totals.position !== null && <InlineStat label="Ø Position" value={totals.position.toFixed(1)} />}
          </div>
        )}

        {state === "not_configured" && (
          <Link href="/dashboard/agency-branding" style={{
            fontSize: 11, fontWeight: 700, color: "#4285F4",
            padding: "6px 13px", borderRadius: 6,
            background: "rgba(66,133,244,0.10)", border: "1px solid rgba(66,133,244,0.28)",
            textDecoration: "none", whiteSpace: "nowrap" as const,
          }}>
            Jetzt verbinden →
          </Link>
        )}
      </div>

      {/* Low-Speed-Insight — eigener Auto-Warning-Block */}
      {lowSpeed && (
        <div style={{
          padding: "10px 16px", borderTop: "1px solid rgba(66,133,244,0.18)",
          background: "rgba(239,68,68,0.06)",
          display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" as const,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            <strong style={{ color: "#f87171" }}>Traffic-Risiko erkannt:</strong> Speed-Score von {speedScore} liegt unter 40.{" "}
            {state === "ok" && totals
              ? `Bei ${totals.impressions.toLocaleString("de-DE")} Impressions/Monat bedeutet jede 100 ms Ladezeit-Verlust ~1% Click-Through-Rate. Google bewertet Core-Web-Vitals im Ranking.`
              : "GSC-Daten zeigen Traffic-Risiko durch sinkende Performance — Core-Web-Vitals wirken auf das Ranking."}
          </p>
        </div>
      )}
    </div>
  );
}

export function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, color: D.textMuted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}


