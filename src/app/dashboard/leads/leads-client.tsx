"use client";

import { useState } from "react";
import type { Lead } from "./page";

const STATUS_CONFIG = {
  new:       { label: "Neu",         color: "#7aa6ff", bg: "rgba(122,166,255,0.1)",  border: "rgba(122,166,255,0.25)" },
  contacted: { label: "Kontaktiert", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)" },
  converted: { label: "Gewonnen",    color: "#22c55e", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.25)" },
};

const SCORE_COLOR = (s: number | null) =>
  s === null ? "rgba(255,255,255,0.3)" : s >= 80 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function LeadsClient({
  leads: initialLeads,
  embedSnippet,
  embedUrl,
}: {
  leads: Lead[];
  embedSnippet: string;
  embedUrl: string;
}) {
  const [leads, setLeads]           = useState(initialLeads);
  const [filter, setFilter]         = useState<"all" | "new" | "contacted" | "converted">("all");
  const [copied, setCopied]         = useState(false);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [tab, setTab]               = useState<"leads" | "embed">("leads");

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  const total     = leads.length;
  const newCount  = leads.filter(l => l.status === "new").length;
  const converted = leads.filter(l => l.status === "converted").length;
  const avgScore  = leads.length ? Math.round(leads.reduce((a, l) => a + (l.score ?? 50), 0) / leads.length) : 0;

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } finally {
      setUpdating(null);
    }
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em", color: "#0F172A" }}>
            Lead-Management
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Interessenten, die dein Widget genutzt haben — warme Leads zum Anrufen.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
          {(["leads", "embed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#0F172A" : "#94A3B8",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              {t === "leads" ? "📋 Leads" : "🔗 Widget einbetten"}
            </button>
          ))}
        </div>
      </div>

      {tab === "leads" ? (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
            {[
              { label: "Leads gesamt",    value: total,     color: "#0F172A" },
              { label: "Neu",             value: newCount,  color: "#007BFF" },
              { label: "Gewonnen",        value: converted, color: "#22c55e" },
              { label: "Ø Score",         value: `${avgScore}%`, color: SCORE_COLOR(avgScore) },
            ].map(s => (
              <div key={s.label} style={{
                padding: "16px 18px", borderRadius: 12,
                border: "1px solid #E2E8F0", background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {(["all", "new", "contacted", "converted"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: filter === f ? "#007BFF" : "#E2E8F0",
                background: filter === f ? "rgba(0,123,255,0.06)" : "#fff",
                color: filter === f ? "#007BFF" : "#64748B",
              }}>
                {f === "all" ? "Alle" : STATUS_CONFIG[f].label}
                {f !== "all" && (
                  <span style={{ marginLeft: 6, opacity: 0.6 }}>
                    {leads.filter(l => l.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Leads table */}
          {filtered.length === 0 ? (
            <div style={{
              padding: "64px 24px", textAlign: "center",
              border: "2px dashed #E2E8F0", borderRadius: 16, background: "#FAFAFA",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
              <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                {filter === "all" ? "Noch keine Leads" : `Keine ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label ?? ""}-Leads`}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#94A3B8" }}>
                Binde das Widget auf deiner Website ein und Leads landen hier automatisch.
              </p>
              <button onClick={() => setTab("embed")} style={{
                marginTop: 20, padding: "10px 22px", borderRadius: 10,
                background: "#007BFF", color: "#fff", border: "none",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,123,255,0.35)",
              }}>
                Widget-Code anzeigen →
              </button>
            </div>
          ) : (
            <div style={{
              border: "1px solid #E2E8F0", borderRadius: 14,
              overflow: "hidden", background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 160px 80px 80px 140px 120px",
                padding: "10px 20px", background: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}>
                {["Interessent & URL", "Datum", "Score", "PDF", "Status", "Aktion"].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
                ))}
              </div>

              {filtered.map((lead, i) => {
                const sc    = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.new;
                const sCol  = SCORE_COLOR(lead.score);
                const domain = (() => { try { return new URL(lead.scanned_url).host; } catch { return lead.scanned_url; } })();
                return (
                  <div key={lead.id} style={{
                    display: "grid", gridTemplateColumns: "1fr 160px 80px 80px 140px 120px",
                    padding: "14px 20px", alignItems: "center",
                    borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                    transition: "background 0.1s",
                  }}>
                    {/* Email + URL */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.visitor_email}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {domain}
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{fmt(lead.created_at)}</div>

                    {/* Score */}
                    <div style={{ fontSize: 15, fontWeight: 700, color: sCol }}>
                      {lead.score !== null ? `${lead.score}%` : "—"}
                    </div>

                    {/* PDF downloaded */}
                    <div>
                      {lead.pdf_downloaded_at ? (
                        <span title={`PDF geladen: ${fmt(lead.pdf_downloaded_at)}`} style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                          background: "rgba(34,197,94,0.08)", color: "#16A34A",
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}>
                          PDF ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#CBD5E1" }}>—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                      }}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {lead.status === "new" && (
                        <button
                          onClick={() => updateStatus(lead.id, "contacted")}
                          disabled={updating === lead.id}
                          style={{
                            padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0",
                            background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                            color: "#64748B", opacity: updating === lead.id ? 0.5 : 1,
                          }}
                        >
                          Kontaktiert
                        </button>
                      )}
                      {lead.status === "contacted" && (
                        <button
                          onClick={() => updateStatus(lead.id, "converted")}
                          disabled={updating === lead.id}
                          style={{
                            padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(34,197,94,0.3)",
                            background: "rgba(34,197,94,0.06)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                            color: "#22c55e", opacity: updating === lead.id ? 0.5 : 1,
                          }}
                        >
                          ✓ Gewonnen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* EMBED TAB */
        <div style={{ maxWidth: 680 }}>
          <div style={{
            padding: "24px 28px", borderRadius: 16,
            border: "1px solid #E2E8F0", background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            marginBottom: 20,
          }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              Widget auf deine Website einbetten
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
              Kopiere diesen Code und füge ihn auf deiner Website ein — z.B. auf der Startseite mit dem Text
              {" "}<em>„Gratis Barrierefreiheits-Check"</em>. Besucher geben ihre URL und E-Mail ein, du bekommst den Lead.
            </p>

            {/* Code block */}
            <div style={{
              background: "#0b0c10", borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 14,
            }}>
              <div style={{
                padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  HTML-Embed-Code
                </span>
                <button onClick={copyEmbed} style={{
                  padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(0,123,255,0.15)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(0,123,255,0.3)"}`,
                  color: copied ? "#22c55e" : "#7aa6ff",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {copied ? "✓ Kopiert!" : "Kopieren"}
                </button>
              </div>
              <pre style={{
                margin: 0, padding: "16px 20px",
                fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.7)",
                fontFamily: "'Fira Code','Cascadia Code',monospace",
                overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {embedSnippet}
              </pre>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
              Widget-URL: <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#007BFF", textDecoration: "none" }}>{embedUrl}</a>
            </p>
          </div>

          {/* How it works */}
          <div style={{
            padding: "20px 24px", borderRadius: 14,
            border: "1px solid #E2E8F0", background: "#F8FAFC",
          }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>So funktioniert es</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { step: "1", text: "Besucher öffnet deine Website und sieht das Widget" },
                { step: "2", text: "Er gibt seine URL + E-Mail ein und startet die Analyse" },
                { step: "3", text: "Du bekommst sofort eine E-Mail: Neuer Lead: X hat Y gescannt, Score: Z%" },
                { step: "4", text: "Der Besucher sieht eine Teaserseite mit deinem Branding und wartet auf deine Kontaktaufnahme" },
                { step: "5", text: "Du rufst an, präsentierst den vollständigen Report — und gewinnst einen Kunden" },
              ].map(item => (
                <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(0,123,255,0.1)", border: "1px solid rgba(0,123,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#007BFF",
                  }}>
                    {item.step}
                  </span>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
