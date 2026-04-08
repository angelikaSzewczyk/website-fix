"use client";

import { useState, useTransition, useRef } from "react";
import { generateMonthlyValueReport, type ValueReportData } from "./actions";

type Website = { id: string; name: string | null; url: string };

const EVENT_ICON: Record<string, string> = {
  ai_fix_generated:    "🤖",
  jira_ticket_created: "📋",
  scan_completed:      "🔍",
  alert_sent:          "🚨",
};

// ─── Printable Report Card ────────────────────────────────────────────────────

function ReportCard({ data }: { data: ValueReportData }) {
  const color     = data.primaryColor || "#8df3d3";
  const colorBg   = `${color}14`;
  const colorBdr  = `${color}30`;
  const agencyName = data.agencyName || "Ihre Agentur";

  return (
    <div id="value-report-card" style={{
      background: "#fff", borderRadius: 16, overflow: "hidden",
      border: "1px solid #e5e7eb", color: "#111",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        padding: "24px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle geometric accent */}
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)", pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt=""
              style={{ height: 40, maxWidth: 120, objectFit: "contain", filter: "brightness(0) invert(1)" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "#fff",
            }}>
              {agencyName.charAt(0) || "A"}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {agencyName || "Ihre Agentur"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Monatlicher Website-Report
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", position: "relative" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{data.monthLabel}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
            {data.websiteName}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 28px" }}>

        {/* ── CLIENT INFO ── */}
        <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            Analysierte Website
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>{data.websiteName}</div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>{data.websiteUrl}</div>
        </div>

        {/* ── EXECUTIVE SUMMARY ── */}
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: colorBg, border: `1px solid ${colorBdr}`,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Management-Zusammenfassung
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#333", lineHeight: 1.8 }}>
            {data.executiveSummary}
          </p>
        </div>

        {/* ── KPI ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Uptime",         value: `${data.avgUptimePct}%`,               sub: `${data.totalChecks} Checks` },
            { label: "Ø Ladezeit",     value: data.avgResponseMs ? `${data.avgResponseMs}ms` : "—", sub: "Response Time" },
            { label: "Scans gesamt",   value: String(data.scanCounts.total),          sub: `${data.scanCounts.wcag} WCAG` },
            { label: "Aktionen",       value: String(data.activities.length),         sub: "via Slack" },
          ].map(k => (
            <div key={k.label} style={{
              padding: "14px 16px", borderRadius: 10,
              border: "1px solid #e5e7eb", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginTop: 4 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── SCAN BREAKDOWN ── */}
        {data.scanCounts.total > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Durchgeführte Audits
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Website-Check",   count: data.scanCounts.website,     show: data.scanCounts.website > 0 },
                { label: "WCAG Audit",      count: data.scanCounts.wcag,        show: data.scanCounts.wcag > 0 },
                { label: "Performance",     count: data.scanCounts.performance, show: data.scanCounts.performance > 0 },
              ].filter(s => s.show).map(s => (
                <div key={s.label} style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: colorBg, border: `1px solid ${colorBdr}`,
                  fontSize: 13, fontWeight: 600, color,
                }}>
                  {s.count}× {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG ── */}
        {data.activities.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Erbrachte Leistungen
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              {data.activities.map((a, i) => (
                <div key={i} style={{
                  padding: "10px 16px",
                  borderBottom: i < data.activities.length - 1 ? "1px solid #f5f5f5" : "none",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{EVENT_ICON[a.event_type] ?? "•"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#222" }}>{a.label}</div>
                    {a.detail && <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{a.detail}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>
                    {new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          paddingTop: 16, borderTop: "1px solid #f0f0f0",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.6 }}>
            Bericht erstellt am {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            {data.websiteName && (
              <> für <span style={{ color: "#888", fontWeight: 600 }}>{data.websiteName}</span></>
            )}
          </div>
          {agencyName && (
            <div style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
              background: colorBg, color, border: `1px solid ${colorBdr}`,
            }}>
              {agencyName}
            </div>
          )}
        </div>

        {/* ── DISCLAIMER ── */}
        <div style={{
          marginTop: 16, padding: "12px 14px", borderRadius: 8,
          background: "#f9f9f9", border: "1px solid #ebebeb",
        }}>
          <p style={{
            margin: 0, fontSize: 10, color: "#bbb", lineHeight: 1.7,
          }}>
            <strong style={{ color: "#ccc", fontWeight: 600 }}>Hinweis:</strong>{" "}
            Dieser Bericht wurde automatisiert durch website-fix.com erstellt. Die Analyse dient der proaktiven
            Unterstützung bei der Wartung und stellt keine rechtsverbindliche Prüfung (z.&nbsp;B. durch einen
            Datenschutzbeauftragten oder Rechtsanwalt) dar. Wir übernehmen keine Gewähr für die vollständige
            Fehlerfreiheit bei der Erkennung von Drittanbieter-Sicherheitslücken oder spezifischen WCAG-Richtlinien.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function ValueReportClient({ websites }: { websites: Website[] }) {
  const [selectedSite,  setSelectedSite]  = useState(websites[0]?.id ?? "");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [report,  setReport]  = useState<ValueReportData | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reportRef = useRef<HTMLDivElement>(null);

  function handleGenerate() {
    if (!selectedSite) return;
    setError(null);
    startTransition(async () => {
      const result = await generateMonthlyValueReport(selectedSite, selectedMonth);
      if (result.error) { setError(result.error); return; }
      setReport(result.data!);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          /* hide all dashboard chrome */
          .no-print,
          .dashboard-sidebar,
          .dashboard-mobile-bar,
          header, nav, aside { display: none !important; }

          /* reset layout so report fills the page */
          .dashboard-content { margin-left: 0 !important; padding: 0 !important; }
          body, html { background: #fff !important; color: #111 !important; }
          main { padding: 0 !important; max-width: 100% !important; }

          /* report card itself */
          #value-report-card {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          /* ensure activity rows don't break across pages */
          #value-report-card > div > div { page-break-inside: avoid; }

          .report-print-wrapper { padding: 0 !important; }

          @page { margin: 1.5cm; size: A4 portrait; }
        }

        /* visible only in print (e.g. confidentiality notice) */
        .print-only { display: none; }
        @media print { .print-only { display: block !important; } }
      `}</style>

      {/* ── GENERATOR CONTROLS (hidden on print) ── */}
      <div className="no-print" style={{
        border: "1px solid rgba(122,166,255,0.15)",
        borderRadius: 14, background: "rgba(122,166,255,0.02)",
        padding: "22px 24px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Value Report Generator</h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              KI-Zusammenfassung mit Agentur-Branding — bereit für den Kunden
            </p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
            background: "rgba(122,166,255,0.1)", border: "1px solid rgba(122,166,255,0.2)", color: "#7aa6ff",
          }}>
            Agentur-Feature
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Website selector */}
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              Kunde / Website
            </label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", fontSize: 14, outline: "none",
              }}
            >
              {websites.length === 0 && <option value="">Keine Websites gespeichert</option>}
              {websites.map(w => (
                <option key={w.id} value={w.id}>{w.name ?? w.url}</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div style={{ flex: "0 0 160px" }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              Monat
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isPending || !selectedSite}
            style={{
              padding: "10px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700,
              background: isPending ? "rgba(255,255,255,0.1)" : "linear-gradient(90deg,#8df3d3,#7aa6ff)",
              color: isPending ? "rgba(255,255,255,0.3)" : "#0b0c10",
              border: "none", cursor: isPending ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {isPending ? "KI generiert..." : "Report generieren →"}
          </button>
        </div>

        {error && (
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#ff6b6b" }}>{error}</p>
        )}
      </div>

      {/* ── REPORT OUTPUT ── */}
      {report && (
        <div ref={reportRef} className="report-print-wrapper">
          {/* Print/action bar — hidden on print */}
          <div className="no-print" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14, flexWrap: "wrap", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8df3d3" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {report.websiteName} — {report.monthLabel}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "linear-gradient(90deg,#8df3d3,#7aa6ff)",
                  color: "#0b0c10", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Als PDF speichern
              </button>
              <button
                onClick={() => setReport(null)}
                style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 13,
                  background: "none", color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                }}
              >
                Schließen
              </button>
            </div>
          </div>

          <ReportCard data={report} />
        </div>
      )}
    </div>
  );
}
