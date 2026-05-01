"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { convertLeadToClient } from "./actions";

export type Lead = {
  id: string;
  visitor_email: string | null;
  scanned_url: string;
  score: number | null;
  status: string;
  created_at: string;
  pdf_downloaded_at: string | null;
};

type Stats = { total: number; last_30: number; converted: number };

const T = {
  page:       "#0b0c10",
  card:       "rgba(255,255,255,0.025)",
  cardSolid:  "rgba(255,255,255,0.04)",
  border:     "rgba(255,255,255,0.08)",
  divider:    "rgba(255,255,255,0.06)",
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.4)",
  textFaint:  "rgba(255,255,255,0.25)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.10)",
  greenBdr:   "rgba(74,222,128,0.28)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.10)",
  amberBdr:   "rgba(251,191,36,0.28)",
  red:        "#f87171",
  blue:       "#7aa6ff",
  blueBg:     "rgba(122,166,255,0.10)",
  blueBdr:    "rgba(122,166,255,0.28)",
  purple:     "#a78bfa",
  purpleBg:   "rgba(124,58,237,0.18)",
  purpleBdr:  "rgba(124,58,237,0.40)",
  purpleSolid:"rgba(124,58,237,0.85)",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:       { label: "Neu",         color: T.blue,   bg: T.blueBg,   border: T.blueBdr },
  contacted: { label: "Kontaktiert", color: T.amber,  bg: T.amberBg,  border: T.amberBdr },
  converted: { label: "Gewonnen",    color: T.green,  bg: T.greenBg,  border: T.greenBdr },
};

function fmtAgo(iso: string): string {
  const ts = new Date(iso);
  const diff = Date.now() - ts.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "gerade eben";
  if (mins < 60) return `vor ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `vor ${hrs} h`;
  return ts.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function dom(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

function scoreColor(s: number | null): string {
  if (s === null) return T.textFaint;
  return s >= 75 ? T.green : s >= 50 ? T.amber : T.red;
}

export default function LeadGeneratorHub({
  initialLeads,
  embedSnippet,
  embedUrl,
  stats,
  agencyId,
}: {
  initialLeads: Lead[];
  embedSnippet: string;
  embedUrl:     string;
  stats:        Stats;
  agencyId:     string;
}) {
  const [leads, setLeads]       = useState(initialLeads);
  const [filter, setFilter]     = useState<"all" | "new" | "contacted" | "converted">("all");
  const [copied, setCopied]     = useState(false);
  const [busy, setBusy]         = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const [, startTransition]     = useTransition();

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  // ── CSV-Export ───────────────────────────────────────────────────────
  // CRM-kompatible Header-Reihenfolge (siehe User-Spec 01.05.). Quote-Escaping
  // nach RFC 4180: Felder mit Komma / Quote / Newline werden in "" gewrapped,
  // interne Quotes verdoppelt. BOM (﻿) am Datei-Anfang sorgt dafür, dass
  // Excel UTF-8 erkennt — sonst landet "ä" als "Ã¤" beim deutschen Office-User.
  function csvEscape(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportLeadsToCsv() {
    const headers = [
      "First Name",
      "Email",
      "Website URL",
      "Lead Source",
      "Lead Score",
      "Created At",
      "Agency ID",
    ];

    const rows = filtered.map(l => {
      // First Name: Local-Part vor dem @ als best-effort Heuristik
      // (z.B. "max.mueller@kunde.de" → "max.mueller"). Leer wenn kein
      // visitor_email — der CRM-Import füllt das bei Bedarf selbst.
      const firstName = l.visitor_email
        ? l.visitor_email.split("@")[0] ?? ""
        : "";
      // Created At: ISO-8601 ist universell parseable (Hubspot, Pipedrive,
      // Salesforce, Excel). Deutsches Format würde manche Importer brechen.
      const createdAt = new Date(l.created_at).toISOString();
      const score = l.score != null ? `${l.score}/100` : "";

      return [
        firstName,
        l.visitor_email ?? "",
        l.scanned_url,
        "WebsiteFix Widget",
        score,
        createdAt,
        agencyId,
      ].map(csvEscape).join(",");
    });

    const csv = "﻿" + [headers.map(csvEscape).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `websitefix-leads-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast(`${filtered.length} Lead${filtered.length === 1 ? "" : "s"} als CSV exportiert.`);
    setTimeout(() => setToast(null), 3500);
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } finally {
      setBusy(null);
    }
  }

  async function onConvert(leadId: string) {
    setBusy(leadId);
    try {
      const res = await convertLeadToClient(leadId);
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: "converted" } : l));
        setToast(res.alreadyExists
          ? "Site war bereits im Portfolio — Lead als gewonnen markiert."
          : "Lead ins Portfolio übernommen."
        );
        setTimeout(() => setToast(null), 4000);
        startTransition(() => { /* triggert revalidate-cycle */ });
      } else {
        setToast(`Fehler: ${res.error}`);
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <main style={{ padding: "32px 32px 80px", color: T.text, maxWidth: 1280, margin: "0 auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
        marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${T.divider}`,
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Agency · Wachstums-Maschine
          </p>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            Lead-Generator
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 620, lineHeight: 1.55 }}>
            Snippet einbauen, Leads ernten, Kunden gewinnen. Konvertierte Leads landen
            mit einem Klick als Projekt im Kunden-Portfolio.
          </p>
        </div>

        {/* Stats-Strip rechts */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Leads gesamt", value: stats.total,     color: T.purple },
            { label: "30 Tage",      value: stats.last_30,   color: T.blue },
            { label: "Gewonnen",     value: stats.converted, color: T.green },
          ].map(s => (
            <div key={s.label} style={{
              padding: "10px 16px", borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              minWidth: 90,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 8,
          background: T.greenBg, border: `1px solid ${T.greenBdr}`,
          color: T.green, fontSize: 12.5, fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* ── 2-Spalten-Hub ──────────────────────────────────────────────────── */}
      <div className="agency-leadgen-grid" style={{
        display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 2fr", gap: 18, alignItems: "start",
      }}>

        {/* ── Linke Spalte: Widget-Konfigurator ──────────────────────────── */}
        <div id="widget" style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>Widget-Snippet</span>
            <button onClick={copyEmbed} style={{
              padding: "5px 12px", borderRadius: 7, cursor: "pointer",
              background: copied ? T.greenBg : T.purpleBg,
              border: `1px solid ${copied ? T.greenBdr : T.purpleBdr}`,
              color: copied ? T.green : T.purple,
              fontSize: 11, fontWeight: 700,
            }}>
              {copied ? "✓ Kopiert" : "Kopieren"}
            </button>
          </div>

          <div style={{ padding: "16px 18px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>
              Füge dieses HTML in deine Agentur-Site ein. Branding-Farbe und Logo werden
              automatisch aus deinen <Link href="/dashboard/agency-branding" style={{ color: T.purple, textDecoration: "none", fontWeight: 600 }}>Branding-Settings</Link> übernommen.
            </p>

            <pre style={{
              margin: 0, padding: "14px 16px",
              background: "#080A10", borderRadius: 10,
              border: `1px solid ${T.divider}`,
              fontSize: 11, lineHeight: 1.6, color: T.textSub,
              fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
              overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>{embedSnippet}</pre>

            <p style={{ margin: "12px 0 0", fontSize: 11, color: T.textMuted }}>
              Direkt-Vorschau: <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{embedUrl}</a>
            </p>
          </div>
        </div>

        {/* ── Rechte Spalte: Leads-Liste ─────────────────────────────────── */}
        <div id="leads" style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: `1px solid ${T.divider}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
              Leads {filter !== "all" && <span style={{ color: T.textMuted, fontWeight: 600 }}>· {filtered.length}</span>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["all", "new", "contacted", "converted"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "5px 11px", borderRadius: 7, cursor: "pointer",
                    background: filter === f ? T.purpleBg : "transparent",
                    border: `1px solid ${filter === f ? T.purpleBdr : T.border}`,
                    color: filter === f ? T.purple : T.textSub,
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
                  }}>
                    {f === "all" ? "Alle" : STATUS_CONFIG[f].label}
                  </button>
                ))}
              </div>

              {/* CSV-Export-Icon — glassmorph, oben rechts in der Card.
                  Disabled bei 0 sichtbaren Leads (sonst leere CSV-Datei).
                  Tooltip via native `title` (barrier-free + screen-reader-friendly). */}
              <button
                onClick={exportLeadsToCsv}
                disabled={filtered.length === 0}
                title={filtered.length === 0 ? "Keine Leads im aktuellen Filter" : "Leads als CSV exportieren"}
                aria-label="Leads als CSV exportieren"
                className="leadgen-csv-btn"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 30, height: 30, borderRadius: 8, padding: 0,
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: filtered.length === 0 ? T.textFaint : T.textSub,
                  cursor: filtered.length === 0 ? "not-allowed" : "pointer",
                  opacity: filtered.length === 0 ? 0.5 : 1,
                  transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.12s ease",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "40px 18px", textAlign: "center", fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
              {leads.length === 0 ? (
                <>
                  Noch keine Leads.<br/>
                  <span style={{ color: T.textSub, fontSize: 12 }}>
                    Sobald das Widget auf einer Agentur-Site läuft, erscheinen hier qualifizierte Anfragen.
                  </span>
                </>
              ) : (
                <>Keine Leads im Status &quot;{STATUS_CONFIG[filter]?.label ?? filter}&quot;.</>
              )}
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {filtered.map((lead, i) => {
                const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                const sCol = scoreColor(lead.score);
                const isConverted = lead.status === "converted";
                const isLastRow = i === filtered.length - 1;
                return (
                  <li key={lead.id} style={{
                    padding: "12px 18px",
                    borderBottom: isLastRow ? "none" : `1px solid ${T.divider}`,
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 110px 150px",
                    gap: 12, alignItems: "center",
                  }}>
                    {/* Email + URL + ago */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.visitor_email ?? <span style={{ color: T.textMuted, fontWeight: 500 }}>(Teaser, keine E-Mail)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: T.textSub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dom(lead.scanned_url)} · {fmtAgo(lead.created_at)}
                        {lead.pdf_downloaded_at && (
                          <span style={{ marginLeft: 8, color: T.green, fontWeight: 700 }}>· PDF ✓</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: T.divider, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${lead.score ?? 0}%`, background: sCol }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: sCol, lineHeight: 1, minWidth: 22, textAlign: "right" }}>
                        {lead.score ?? "—"}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      justifySelf: "start",
                      fontSize: 10.5, fontWeight: 700,
                      padding: "3px 9px", borderRadius: 6,
                      color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                      letterSpacing: "0.04em",
                    }}>
                      {sc.label}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {!isConverted && lead.visitor_email && (
                        <button
                          onClick={() => onConvert(lead.id)}
                          disabled={busy === lead.id}
                          title="Lead-to-Client: erstellt ein Portfolio-Projekt mit dieser Domain"
                          style={{
                            padding: "5px 10px", borderRadius: 6, cursor: busy === lead.id ? "wait" : "pointer",
                            background: T.greenBg, border: `1px solid ${T.greenBdr}`,
                            color: T.green, fontSize: 10.5, fontWeight: 700,
                            opacity: busy === lead.id ? 0.5 : 1, whiteSpace: "nowrap",
                          }}
                        >
                          → Portfolio
                        </button>
                      )}
                      {lead.status === "new" && (
                        <button
                          onClick={() => updateStatus(lead.id, "contacted")}
                          disabled={busy === lead.id}
                          style={{
                            padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                            background: T.cardSolid, border: `1px solid ${T.border}`,
                            color: T.textSub, fontSize: 10.5, fontWeight: 700,
                            opacity: busy === lead.id ? 0.5 : 1,
                          }}
                        >
                          Kontaktiert
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 980px) {
          .agency-leadgen-grid { grid-template-columns: 1fr !important; }
        }
        /* Glassmorpher CSV-Export-Button — purple-tinted Hover als
           dezenter Cue, dass der Button klickbar ist. */
        .leadgen-csv-btn:not(:disabled):hover {
          background: rgba(124,58,237,0.14) !important;
          border-color: rgba(124,58,237,0.35) !important;
          color: #a78bfa !important;
          transform: translateY(-1px);
        }
        .leadgen-csv-btn:not(:disabled):active {
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
