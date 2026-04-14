"use client";

import { useState } from "react";
import ValueReportClient from "./value-report-client";
import type { ReportBranding, ReportKPIs, ActivityItem, SavedSite } from "./page";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         "#F8FAFC",
  card:       "#FFFFFF",
  border:     "#E5E7EB",
  divider:    "#F3F4F6",
  shadow:     "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
  shadowMd:   "0 2px 16px rgba(0,0,0,0.08)",
  text:       "#0D1321",
  textSub:    "#374151",
  textMuted:  "#6B7280",
  green:      "#15803D",
  greenBg:    "#F0FDF4",
  greenBdr:   "#BBF7D0",
  amber:      "#B45309",
  amberBg:    "#FFFBEB",
  amberBdr:   "#FDE68A",
  red:        "#B91C1C",
  redBg:      "#FEF2F2",
  redBdr:     "#FECACA",
};

// ── AI Summary template ───────────────────────────────────────────────────────
function buildSummary(
  monthLabel: string,
  kpis: ReportKPIs,
  agencyName: string,
): string {
  const parts: string[] = [];
  if (kpis.scansThisMonth > 0)
    parts.push(`${kpis.scansThisMonth} automatisierte Website-Audit${kpis.scansThisMonth > 1 ? "s" : ""}`);
  if (kpis.leadsThisMonth > 0)
    parts.push(`${kpis.leadsThisMonth} qualifizierte${kpis.leadsThisMonth > 1 ? " Leads" : "n Lead"} über das Widget generiert`);
  if (kpis.monitoredSites > 0)
    parts.push(`${kpis.monitoredSites} Website${kpis.monitoredSites > 1 ? "s" : ""} rund um die Uhr überwacht`);

  const intro = parts.length > 0
    ? `Im ${monthLabel} haben wir ${parts.join(", ")}.`
    : `Im ${monthLabel} liefen alle Systeme stabil.`;

  const perf = kpis.avgResponseMs
    ? ` Durchschnittliche Antwortzeit: ${kpis.avgResponseMs} ms.`
    : "";

  const uptime = kpis.uptimePct !== null
    ? ` Uptime über alle überwachten Seiten: ${kpis.uptimePct}%.`
    : "";

  const closing = agencyName
    ? ` ${agencyName} stellt sicher, dass Ihre Online-Präsenz jederzeit performant und sicher bleibt.`
    : " Alle Systeme laufen stabil und innerhalb der vereinbarten Performance-Ziele.";

  return intro + perf + uptime + closing;
}

// ── Components ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, bg, border,
}: {
  label: string; value: string; sub: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      padding: "18px 20px", borderRadius: 12,
      border: `1px solid ${border}`, background: bg,
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function ActivityRow({ item, last }: { item: ActivityItem; last: boolean }) {
  const dateStr = new Date(item.date).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 20px",
      borderBottom: last ? "none" : `1px solid ${C.divider}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: `${item.color}12`,
        border: `1px solid ${item.color}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.label}
        </div>
        {item.sub && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.sub}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{dateStr}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsClient({
  plan,
  branding,
  kpis,
  activities,
  monthLabel,
  savedSites,
}: {
  plan:       string;
  branding:   ReportBranding;
  kpis:       ReportKPIs;
  activities: ActivityItem[];
  monthLabel: string;
  agencyId:   string;
  savedSites: SavedSite[];
}) {
  const [printing, setPrinting] = useState(false);

  const color     = branding.primaryColor;
  const colorBg   = `${color}12`;
  const colorBdr  = `${color}28`;
  const agName    = branding.agencyName || "Meine Agentur";
  const isAgency  = plan === "agency-pro" || plan === "agency-starter";

  const dateStr = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // KPI grid data
  const uptimeVal  = kpis.uptimePct !== null ? `${kpis.uptimePct}%` : "—";
  const uptimeColor = kpis.uptimePct === null ? C.textMuted
    : kpis.uptimePct >= 99 ? C.green : kpis.uptimePct >= 95 ? C.amber : C.red;
  const uptimeBg    = kpis.uptimePct === null ? C.divider
    : kpis.uptimePct >= 99 ? C.greenBg : kpis.uptimePct >= 95 ? C.amberBg : C.redBg;
  const uptimeBdr   = kpis.uptimePct === null ? C.border
    : kpis.uptimePct >= 99 ? C.greenBdr : kpis.uptimePct >= 95 ? C.amberBdr : C.redBdr;

  const msVal  = kpis.avgResponseMs ? `${kpis.avgResponseMs} ms` : "—";
  const msBg   = !kpis.avgResponseMs ? C.divider : kpis.avgResponseMs < 500 ? C.greenBg : kpis.avgResponseMs < 1500 ? C.amberBg : C.redBg;
  const msColor = !kpis.avgResponseMs ? C.textMuted : kpis.avgResponseMs < 500 ? C.green : kpis.avgResponseMs < 1500 ? C.amber : C.red;
  const msBdr   = !kpis.avgResponseMs ? C.border : kpis.avgResponseMs < 500 ? C.greenBdr : kpis.avgResponseMs < 1500 ? C.amberBdr : C.redBdr;

  const aiSummary = buildSummary(monthLabel, kpis, branding.agencyName);

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  }

  return (
    <>
      {/* Print-only report isolation */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #wf-report-print { display: block !important; }
        }
        @media screen {
          #wf-report-print { display: none; }
        }
      `}</style>

      {/* ── Screen view ── */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Page header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 5px", color: C.text, letterSpacing: "-0.02em" }}>
              Berichte
            </h1>
            <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
              White-Label Monatsbericht · {monthLabel}
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={printing}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.card,
              cursor: printing ? "default" : "pointer",
              color: C.textSub, fontSize: 13, fontWeight: 600,
              boxShadow: C.shadow,
              opacity: printing ? 0.5 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {printing ? "Vorbereitung…" : "Als PDF speichern"}
          </button>
        </div>

        {/* ── WHITE-LABEL REPORT CARD ── */}
        <div id="wf-report-card" style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: C.shadowMd,
          overflow: "hidden",
          marginBottom: 32,
        }}>

          {/* ── HEADER BANNER ── */}
          <div style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            padding: "26px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
            {/* Geometric accent */}
            <div style={{
              position: "absolute", right: -40, top: -40,
              width: 140, height: 140, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", pointerEvents: "none",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoUrl} alt={agName}
                  style={{ height: 38, maxWidth: 110, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#fff",
                }}>
                  {agName.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                  {agName}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>
                  Monatlicher Website-Report
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" as const, position: "relative" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{monthLabel}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{dateStr}</div>
            </div>
          </div>

          <div style={{ padding: "28px 28px" }}>

            {/* ── KI SUMMARY ── */}
            <div style={{
              padding: "18px 20px", borderRadius: 12,
              background: colorBg, border: `1px solid ${colorBdr}`,
              marginBottom: 24,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, marginBottom: 10,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>🤖</span> KI-Monatszusammenfassung
              </div>
              <p style={{ margin: 0, fontSize: 14, color: C.textSub, lineHeight: 1.8 }}>
                {aiSummary}
              </p>
            </div>

            {/* ── KPI GRID ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              <KpiCard
                label="Uptime"
                value={uptimeVal}
                sub={kpis.monitoredSites > 0 ? `${kpis.monitoredSites} Sites` : "Kein Monitoring"}
                color={uptimeColor}
                bg={uptimeBg}
                border={uptimeBdr}
              />
              <KpiCard
                label="Ø Ladezeit"
                value={msVal}
                sub="Response Time"
                color={msColor}
                bg={msBg}
                border={msBdr}
              />
              <KpiCard
                label="Scans"
                value={String(kpis.scansThisMonth)}
                sub="diesen Monat"
                color={color}
                bg={colorBg}
                border={colorBdr}
              />
              <KpiCard
                label={isAgency ? "Widget-Leads" : "Aktionen"}
                value={isAgency ? String(kpis.leadsThisMonth) : "—"}
                sub={isAgency ? `${kpis.leadsTotal} gesamt` : "kein Widget"}
                color={isAgency ? C.green : C.textMuted}
                bg={isAgency ? C.greenBg : C.divider}
                border={isAgency ? C.greenBdr : C.border}
              />
            </div>

            {/* ── ACTIVITY LIST ── */}
            {activities.length > 0 ? (
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.textMuted,
                  textTransform: "uppercase" as const, letterSpacing: "0.08em",
                  marginBottom: 12,
                }}>
                  Letzte Ereignisse
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {activities.map((item, i) => (
                    <ActivityRow key={i} item={item} last={i === activities.length - 1} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: "28px 20px", borderRadius: 12,
                border: `1px dashed ${C.border}`, textAlign: "center" as const,
              }}>
                <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                  Noch keine Aktivitäten diesen Monat — starte einen Scan oder binde das Widget ein.
                </p>
              </div>
            )}

            {/* ── FOOTER ── */}
            <div style={{
              marginTop: 24, paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                Bericht erstellt am {dateStr} · Powered by WebsiteFix
              </div>
              {branding.agencyName && (
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: colorBg, color, border: `1px solid ${colorBdr}`,
                }}>
                  {branding.agencyName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CUSTOM REPORT GENERATOR (Agency only) ── */}
        {isAgency && savedSites.length > 0 && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 16,
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Value Report Generator
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                background: `${color}12`, color, border: `1px solid ${colorBdr}`,
              }}>
                Agentur-Feature
              </span>
            </div>
            <ValueReportClient websites={savedSites} />
          </div>
        )}

        {isAgency && savedSites.length === 0 && (
          <div style={{
            padding: "22px 24px", borderRadius: 12,
            border: `1px dashed ${C.border}`,
            background: C.card,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: C.text }}>
              Value Report Generator
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Speichere Kunden-Websites im Monitoring, um individuelle White-Label Reports pro Kunde zu generieren.
            </p>
            <a href="/dashboard/monitoring" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 8, textDecoration: "none",
              fontSize: 13, fontWeight: 700,
              background: color, color: "#fff",
            }}>
              Monitoring einrichten →
            </a>
          </div>
        )}
      </main>

      {/* ── PRINT-ONLY VIEW (exact copy of report card) ── */}
      <div id="wf-report-print" style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "0", background: "#fff", color: C.text,
      }}>
        {/* Print header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 14, marginBottom: 24,
          borderBottom: "2px solid #E5E7EB",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ background: "#0D1117", borderRadius: 7, padding: 3 }}>
              <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 300, fontSize: 15, color: C.text }}>
              Website<span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span>
            </span>
          </div>
          <div style={{ textAlign: "right" as const, fontSize: 11, color: C.textMuted }}>
            <div style={{ fontWeight: 600 }}>Website-Report {monthLabel}</div>
            <div>{dateStr}</div>
          </div>
        </div>

        {/* Agency banner */}
        <div style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          borderRadius: 12, padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{agName}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{monthLabel}</div>
        </div>

        {/* Summary */}
        <div style={{
          padding: "16px 18px", borderRadius: 10,
          background: colorBg, border: `1px solid ${colorBdr}`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
            KI-Monatszusammenfassung
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.8 }}>{aiSummary}</p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Uptime",     value: uptimeVal,                          sub: `${kpis.monitoredSites} Sites` },
            { label: "Ladezeit",   value: msVal,                              sub: "Response Time" },
            { label: "Scans",      value: String(kpis.scansThisMonth),        sub: "diesen Monat" },
            { label: "Leads",      value: String(kpis.leadsThisMonth),        sub: `${kpis.leadsTotal} gesamt` },
          ].map(k => (
            <div key={k.label} style={{
              padding: "12px 14px", borderRadius: 8,
              border: "1px solid #E5E7EB", textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, marginTop: 4 }}>{k.label}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Activity list */}
        {activities.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
              Letzte Ereignisse
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              {activities.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "9px 16px",
                  borderBottom: i < activities.length - 1 ? "1px solid #F3F4F6" : "none",
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: 10, color: C.textMuted }}>{item.sub}</div>}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>
                    {new Date(item.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
