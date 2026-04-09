"use client";

import { useState, useCallback } from "react";
import type { LeadRow } from "./page";

// ── Light-mode tokens ─────────────────────────────────────────────────────────
const C = {
  bg:        "#F8FAFC",
  card:      "#FFFFFF",
  border:    "#E2E8F0",
  divider:   "#F1F5F9",
  shadow:    "0 1px 4px rgba(0,0,0,0.06)",
  shadowMd:  "0 4px 20px rgba(0,0,0,0.08)",
  text:      "#0F172A",
  sub:       "#475569",
  muted:     "#94A3B8",
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  green:     "#16A34A",
  greenBg:   "#F0FDF4",
  amber:     "#D97706",
  amberBg:   "#FFFBEB",
  red:       "#DC2626",
  redBg:     "#FEF2F2",
};

const STATUS_CFG = {
  new:       { label: "Neu",         color: C.blue,  bg: C.blueBg  },
  contacted: { label: "Kontaktiert", color: C.amber, bg: C.amberBg },
  converted: { label: "Gewonnen",    color: C.green, bg: C.greenBg },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function scoreColor(s: number | null) {
  if (s === null) return C.muted;
  return s >= 80 ? C.green : s >= 55 ? C.amber : C.red;
}

// ── Preset brand colours ──────────────────────────────────────────────────────
const PRESETS = [
  "#007BFF", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#EF4444", "#0EA5E9", "#6366F1",
];

// ── Widget Live Preview ───────────────────────────────────────────────────────
function WidgetPreview({ color, name }: { color: string; name: string }) {
  return (
    <div style={{
      width: "100%", maxWidth: 340,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, overflow: "hidden",
      boxShadow: `0 0 40px ${color}20, 0 8px 32px rgba(0,0,0,0.4)`,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      transition: "box-shadow 0.4s ease",
    }}>
      {/* Widget header */}
      <div style={{
        padding: "20px 22px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: `linear-gradient(135deg, ${color}20, transparent)`,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 12,
          padding: "4px 12px", borderRadius: 20,
          background: `${color}20`, border: `1px solid ${color}40`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{name || "Deine Agentur"}</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
          Gratis Barrierefreiheits-Check
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          KI-Analyse in Sekunden — kostenlos.
        </p>
      </div>

      {/* Widget form (static mockup) */}
      <div style={{ padding: "18px 22px 20px", background: "#0b0c10" }}>
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Website-URL</p>
          <div style={{
            padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            https://deine-website.de
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deine E-Mail</p>
          <div style={{
            padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            name@beispiel.de
          </div>
        </div>
        <div style={{
          padding: "10px", borderRadius: 8, textAlign: "center",
          background: color, fontSize: 13, fontWeight: 700, color: "#fff",
          boxShadow: `0 4px 14px ${color}50`,
          transition: "background 0.3s, box-shadow 0.3s",
        }}>
          Kostenlos analysieren →
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 22px", borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "#0b0c10",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>Powered by</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>WebsiteFix</span>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, info }: {
  label: string; value: string | number; sub?: string; accent?: string; info?: string;
}) {
  const [tip, setTip] = useState(false);
  return (
    <div style={{
      padding: "22px 24px", background: C.card,
      border: `1px solid ${C.border}`, borderRadius: 14,
      boxShadow: C.shadow,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </p>
        {info && (
          <div style={{ position: "relative" }}>
            <button
              onMouseEnter={() => setTip(true)}
              onMouseLeave={() => setTip(false)}
              style={{
                width: 16, height: 16, borderRadius: "50%",
                border: `1px solid ${C.border}`, background: C.divider,
                color: C.muted, fontSize: 10, fontWeight: 700,
                cursor: "default", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              i
            </button>
            {tip && (
              <div style={{
                position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
                background: C.text, color: "#fff", fontSize: 11, lineHeight: 1.5,
                padding: "6px 10px", borderRadius: 7, whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 10,
              }}>
                {info}
              </div>
            )}
          </div>
        )}
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 800, color: accent ?? C.text, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
  );
}

// ── Guide step ────────────────────────────────────────────────────────────────
function GuideStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <span style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: C.blue, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 800,
      }}>{n}</span>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text }}>{title}</p>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LeadGeneratorClient({
  agencyId, leads, branding, embedUrl,
}: {
  agencyId: string;
  leads: LeadRow[];
  branding: { primary_color: string; agency_name: string; logo_url: string; widget_views: number };
  embedUrl: string;
}) {
  const [color, setColor]         = useState(branding.primary_color);
  const [agencyName]              = useState(branding.agency_name);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [copied, setCopied]       = useState(false);
  const [filter, setFilter]       = useState<"all" | "new" | "contacted" | "converted">("all");
  const [updating, setUpdating]   = useState<string | null>(null);
  const [localLeads, setLeads]    = useState(leads);

  const totalLeads     = leads.length;
  const widgetViews    = branding.widget_views;
  const convRate       = widgetViews > 0 ? Math.round((totalLeads / widgetViews) * 100) : 0;
  const estimatedValue = totalLeads * 500;

  const filteredLeads = filter === "all" ? localLeads : localLeads.filter(l => l.status === filter);

  const embedSnippet = `<iframe
  src="${embedUrl}"
  width="460"
  height="520"
  frameborder="0"
  style="border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.3)"
  title="Kostenloser Website-Check"
></iframe>`;

  // ── Save brand color ────────────────────────────────────────────────────────
  const saveBrandColor = useCallback(async () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;
    setSaving(true);
    try {
      await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: branding.agency_name,
          logo_url:    branding.logo_url,
          primary_color: color,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [color, branding]);

  // ── Status update ───────────────────────────────────────────────────────────
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
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 80px", background: C.bg, minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>
          Lead-Generator
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: C.sub }}>
          Baue dein personalisiertes Widget ein — und lass Interessenten automatisch zu dir kommen.
        </p>
      </div>

      {/* ── Hero KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 36 }}>
        <StatCard
          label="Gesammelte Leads"
          value={totalLeads}
          sub={`${localLeads.filter(l => l.status === "new").length} noch nicht kontaktiert`}
          accent={totalLeads > 0 ? C.blue : C.muted}
        />
        <StatCard
          label="Conversion-Rate"
          value={widgetViews > 0 ? `${convRate}%` : "—"}
          sub={`${widgetViews} Widget-Aufrufe insgesamt`}
          accent={convRate >= 10 ? C.green : convRate > 0 ? C.amber : C.muted}
        />
        <StatCard
          label="Geschätzter Wert"
          value={`${estimatedValue.toLocaleString("de-DE")} €`}
          sub="bei durchschn. 500 € Projektabschluss"
          accent={estimatedValue > 0 ? C.green : C.muted}
          info="Basierend auf durchschnittlichen Projektabschlüssen einer Web-Agentur"
        />
      </div>

      {/* ── Widget Customizer ── */}
      <div style={{
        background: "#0b0c10",
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: C.shadowMd,
        marginBottom: 28,
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#fff" }}>
              Widget-Customizer
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Passe Farbe an — Live-Vorschau aktualisiert sich sofort
            </p>
          </div>
          <button
            onClick={saveBrandColor}
            disabled={saving}
            style={{
              padding: "8px 20px", borderRadius: 9, fontWeight: 700, fontSize: 13,
              cursor: "pointer",
              background: saved ? "rgba(34,197,94,0.15)" : `${color}20`,
              color: saved ? "#4ADE80" : color,
              border: `1px solid ${saved ? "rgba(34,197,94,0.35)" : `${color}40`}`,
              transition: "all 0.2s",
              opacity: saving ? 0.6 : 1,
            } as React.CSSProperties}
          >
            {saved ? "✓ Gespeichert!" : saving ? "Speichert…" : "Farbe speichern"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
          {/* Left: controls */}
          <div style={{
            padding: "28px 28px 32px",
            flex: "0 0 320px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Primärfarbe
            </p>

            {/* Preset swatches */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: c, border: "none", cursor: "pointer",
                    outline: color === c ? `3px solid ${c}` : "none",
                    outlineOffset: 2,
                    boxShadow: color === c ? `0 0 12px ${c}60` : "none",
                    transition: "all 0.15s",
                    transform: color === c ? "scale(1.12)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {/* Custom hex input + color picker */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{
                  width: 44, height: 44, borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "none", cursor: "pointer",
                  padding: 2,
                }}
              />
              <input
                type="text"
                value={color}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                }}
                maxLength={7}
                style={{
                  flex: 1, padding: "10px 12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff", fontSize: 14,
                  fontFamily: "monospace", outline: "none",
                  letterSpacing: "0.06em",
                }}
              />
            </div>

            <p style={{ margin: "20px 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Vorschau-Info
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Widget-URL", value: embedUrl.replace(/^https?:\/\//, "") },
                { label: "Breite", value: "460 px" },
                { label: "Höhe", value: "520 px" },
                { label: "Widget-Aufrufe", value: String(branding.widget_views) },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>{row.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: row.label === "Widget-URL" ? "monospace" : "inherit", fontSize: row.label === "Widget-URL" ? 11 : 12 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live preview */}
          <div style={{
            flex: 1, padding: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)",
          }}>
            <WidgetPreview color={color} name={agencyName} />
          </div>
        </div>
      </div>

      {/* ── "In 2 Minuten startklar" guide ── */}
      <div style={{
        padding: "28px 32px",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, boxShadow: C.shadow,
        marginBottom: 28,
      }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Schnellstart
          </p>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
            In 2 Minuten startklar ⚡
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <GuideStep n={1} title="Farbe wählen & Code kopieren">
            Passe oben deine Markenfarbe an. Dann kopiere den Iframe-Code:
            <div style={{
              marginTop: 10, borderRadius: 10, overflow: "hidden",
              border: `1px solid ${C.border}`, background: "#0b0c10",
            }}>
              <div style={{
                padding: "8px 14px", borderBottom: `1px solid rgba(255,255,255,0.06)`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>HTML-Embed</span>
                <button onClick={copyEmbed} style={{
                  padding: "3px 10px", borderRadius: 5, cursor: "pointer",
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(79,142,247,0.15)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(79,142,247,0.3)"}`,
                  color: copied ? "#4ADE80" : "#7aa6ff",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {copied ? "✓ Kopiert!" : "Kopieren"}
                </button>
              </div>
              <pre style={{
                margin: 0, padding: "12px 16px",
                fontSize: 11, color: "rgba(255,255,255,0.55)",
                fontFamily: "'Fira Code','Cascadia Code',monospace",
                overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7,
              }}>
                {embedSnippet}
              </pre>
            </div>
          </GuideStep>

          <GuideStep n={2} title="Snippet vor dem schließenden </body>-Tag einfügen">
            Geh in deinen Website-Editor (WordPress, Webflow, Wix, reines HTML) und füge den kopierten Code
            direkt vor dem <code style={{ background: C.divider, padding: "1px 5px", borderRadius: 4, fontSize: 12, color: C.text }}>&lt;/body&gt;</code>-Tag ein.
            Das Widget erscheint sofort — kein Reload nötig.
          </GuideStep>

          <GuideStep n={3} title="Zurücklehnen und Leads empfangen">
            Jedes Mal wenn ein Besucher seine URL und E-Mail eingibt, erscheint der Lead automatisch
            in der Tabelle unten — inklusive Website-Score und Handlungsempfehlung.
            Du bekommst auch eine E-Mail-Benachrichtigung.
          </GuideStep>
        </div>
      </div>

      {/* ── Leads Table ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.text }}>
              Deine Leads ({totalLeads})
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
              {localLeads.filter(l => l.status === "new").length} neu · {localLeads.filter(l => l.status === "converted").length} gewonnen
            </p>
          </div>
          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", "new", "contacted", "converted"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: filter === f ? C.blue : C.border,
                background: filter === f ? C.blueBg : C.card,
                color: filter === f ? C.blue : C.sub,
              }}>
                {f === "all" ? "Alle" : STATUS_CFG[f].label}
                {f !== "all" && (
                  <span style={{ marginLeft: 5, opacity: 0.55 }}>
                    {localLeads.filter(l => l.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div style={{
            padding: "56px 24px", textAlign: "center",
            border: `2px dashed ${C.border}`, borderRadius: 16, background: C.divider,
          }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🎯</p>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: C.text }}>
              {filter === "all" ? "Noch keine Leads" : `Keine ${STATUS_CFG[filter]?.label ?? ""}-Leads`}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
              Binde das Widget auf deiner Website ein — erste Leads kommen oft innerhalb von Stunden.
            </p>
          </div>
        ) : (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden", boxShadow: C.shadow,
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 70px 70px 130px 110px",
              padding: "10px 20px", background: C.divider,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {["Interessent & URL", "Datum", "Score", "PDF", "Status", "Aktion"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </span>
              ))}
            </div>

            {filteredLeads.map((lead, i) => {
              const sc   = STATUS_CFG[lead.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.new;
              const domain = (() => { try { return new URL(lead.scanned_url).host; } catch { return lead.scanned_url; } })();
              return (
                <div key={lead.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 70px 70px 130px 110px",
                  padding: "13px 20px", alignItems: "center",
                  borderBottom: i < filteredLeads.length - 1 ? `1px solid ${C.divider}` : "none",
                }}>
                  {/* Email + URL */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.visitor_email}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {domain}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: C.muted }}>{fmt(lead.created_at)}</div>

                  {/* Score */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(lead.score) }}>
                    {lead.score !== null ? `${lead.score}%` : "—"}
                  </div>

                  {/* PDF */}
                  <div>
                    {lead.pdf_downloaded_at ? (
                      <span title={`Geladen: ${fmt(lead.pdf_downloaded_at)}`} style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                        background: C.greenBg, color: C.green, border: `1px solid rgba(34,197,94,0.2)`,
                      }}>
                        PDF ✓
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: C.muted }}>—</span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      color: sc.color, background: sc.bg,
                    }}>
                      {lead.notification_sent && "🔔 "}{sc.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {lead.status === "new" && (
                      <button onClick={() => updateStatus(lead.id, "contacted")} disabled={updating === lead.id} style={{
                        padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                        background: C.card, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        color: C.sub, opacity: updating === lead.id ? 0.5 : 1,
                      }}>
                        Kontaktiert
                      </button>
                    )}
                    {lead.status === "contacted" && (
                      <button onClick={() => updateStatus(lead.id, "converted")} disabled={updating === lead.id} style={{
                        padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(34,197,94,0.3)",
                        background: C.greenBg, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        color: C.green, opacity: updating === lead.id ? 0.5 : 1,
                      }}>
                        ✓ Gewonnen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
