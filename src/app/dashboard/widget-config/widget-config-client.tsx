"use client";

import { useState, useEffect, useMemo } from "react";

type Preset = "blue" | "emerald" | "violet" | "custom";

const PRESETS: Record<Exclude<Preset, "custom">, { name: string; hex: string; description: string }> = {
  blue:    { name: "Classic Blue",   hex: "#007BFF", description: "Vertrauen & Professionalität — Standard für Tech/Dienstleister" },
  emerald: { name: "Pro Emerald",    hex: "#10B981", description: "Wachstum & Performance — perfekt für Performance-/SEO-Agenturen" },
  violet:  { name: "Agency Violet",  hex: "#7C3AED", description: "Premium & Kreativ — hebt dich von Blue-Brandings ab" },
};

function detectPreset(hex: string): Preset {
  const normalized = hex.toUpperCase();
  if (normalized === "#007BFF") return "blue";
  if (normalized === "#10B981") return "emerald";
  if (normalized === "#7C3AED") return "violet";
  return "custom";
}

type LeadStats = { total: number; last_30: number; converted: number };

export default function WidgetConfigClient({
  agencyId, agencyName, currentColor, widgetViews, leadStats,
}: {
  agencyId: string;
  agencyName: string;
  currentColor: string;
  widgetViews: number;
  leadStats: LeadStats;
}) {
  const [preset, setPreset]         = useState<Preset>(detectPreset(currentColor));
  const [customHex, setCustomHex]   = useState(currentColor);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied]         = useState<"iframe" | "script" | null>(null);

  const effectiveColor = preset === "custom" ? customHex : PRESETS[preset].hex;
  const colorParam     = preset === "custom" ? "" : preset;

  // Live-Farbänderung auf dem Server speichern (debounced).
  useEffect(() => {
    if (detectPreset(currentColor) === preset && currentColor === effectiveColor) return;
    const t = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/agency-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agency_name:   agencyName,
            agency_website: "",
            logo_url:       "",
            primary_color:  effectiveColor,
          }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
        setTimeout(() => setSaveStatus("idle"), 2200);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 2200);
      }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveColor]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://website-fix.com";
  const widgetUrl = `${origin}/widget/${agencyId}${colorParam ? `?color=${colorParam}` : ""}`;

  const iframeSnippet = useMemo(() => {
    return `<!-- WebsiteFix Lead-Widget · ${agencyName || "deine Agentur"} -->
<iframe
  src="${widgetUrl}"
  title="Website-Audit"
  style="width:100%;max-width:480px;height:620px;border:0;border-radius:16px;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`;
  }, [widgetUrl, agencyName]);

  const scriptSnippet = useMemo(() => {
    return `<!-- WebsiteFix Lead-Widget (Auto-Resize) -->
<div id="wf-widget-${agencyId}"></div>
<script>
(function(){
  var c = document.getElementById("wf-widget-${agencyId}");
  if (!c) return;
  var f = document.createElement("iframe");
  f.src = "${widgetUrl}";
  f.title = "Website-Audit";
  f.loading = "lazy";
  f.style.cssText = "width:100%;max-width:480px;height:620px;border:0;border-radius:16px;display:block;margin:0 auto;";
  c.appendChild(f);
})();
</script>`;
  }, [widgetUrl, agencyId]);

  function copy(kind: "iframe" | "script") {
    const text = kind === "iframe" ? iframeSnippet : scriptSnippet;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  const conversionRate = leadStats.total > 0 ? Math.round((leadStats.converted / leadStats.total) * 100) : 0;

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0c10", color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "40px 24px 80px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Lead-Generator
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em" }}>
            Widget-Konfigurator
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.55)", maxWidth: 680, lineHeight: 1.6 }}>
            Passe dein Lead-Widget an deine Agentur-Farbe an, kopiere den Embed-Code und platziere ihn auf deiner Website. Jeder Besucher wird durch den 2-Stufen-Flow (Teaser → E-Mail-Gate) in einen qualifizierten Lead.
          </p>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10, marginBottom: 28,
        }}>
          <Stat label="Widget-Aufrufe"       value={widgetViews.toLocaleString("de-DE")} />
          <Stat label="Leads insgesamt"      value={leadStats.total.toLocaleString("de-DE")} />
          <Stat label="Leads (letzte 30 Tg)" value={leadStats.last_30.toLocaleString("de-DE")} accent={effectiveColor} />
          <Stat label="E-Mail-Conversion"    value={`${conversionRate}%`} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1.2fr)", gap: 20, alignItems: "start" }}>

          {/* LEFT: Konfiguration */}
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
              1. Farbe wählen
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map(key => {
                const def      = PRESETS[key];
                const selected = preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      background: selected ? `${def.hex}12` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected ? `${def.hex}60` : "rgba(255,255,255,0.08)"}`,
                      color: "#fff", fontFamily: "inherit", textAlign: "left",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: def.hex, boxShadow: `0 0 14px ${def.hex}40`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{def.name}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{def.description}</div>
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      background: selected ? def.hex : "transparent",
                      border: `2px solid ${selected ? def.hex : "rgba(255,255,255,0.2)"}`,
                    }} />
                  </button>
                );
              })}

              {/* Custom */}
              <button
                onClick={() => setPreset("custom")}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  background: preset === "custom" ? `${customHex}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${preset === "custom" ? `${customHex}60` : "rgba(255,255,255,0.08)"}`,
                  color: "#fff", fontFamily: "inherit", textAlign: "left",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: customHex, boxShadow: `0 0 14px ${customHex}40`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Custom · {customHex}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>Eigene Hex-Farbe — nutzt dein Agentur-Branding.</div>
                </div>
                <input
                  type="color"
                  value={customHex}
                  onChange={e => { setCustomHex(e.target.value); setPreset("custom"); }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: 32, height: 32, border: "none", borderRadius: 6,
                    background: "transparent", cursor: "pointer", padding: 0,
                  }}
                />
              </button>
            </div>

            {/* Save Status */}
            <div style={{ marginBottom: 20, fontSize: 11, color: saveStatus === "saved" ? "#4ade80" : saveStatus === "saving" ? "rgba(255,255,255,0.4)" : saveStatus === "error" ? "#f87171" : "rgba(255,255,255,0.3)" }}>
              {saveStatus === "saving" ? "Speichert…" : saveStatus === "saved" ? "✓ Gespeichert — wirkt sofort für neue Widget-Aufrufe" : saveStatus === "error" ? "Fehler beim Speichern" : "Änderungen werden automatisch gespeichert"}
            </div>

            <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
              2. Embed-Code kopieren
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
              Wähle eine Variante und füge sie in deine Website ein — iframe für einfache Integration, Script für mehr Flexibilität.
            </p>

            {/* IFRAME snippet */}
            <CodeBlock
              label="iframe (empfohlen)"
              code={iframeSnippet}
              onCopy={() => copy("iframe")}
              copied={copied === "iframe"}
              accent={effectiveColor}
            />
            <div style={{ height: 12 }} />
            <CodeBlock
              label="JavaScript (auto-inject)"
              code={scriptSnippet}
              onCopy={() => copy("script")}
              copied={copied === "script"}
              accent={effectiveColor}
            />

            {/* Direct link */}
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 11, color: "rgba(255,255,255,0.45)",
            }}>
              Direkt-Link (z.B. für E-Mail-Signaturen):{" "}
              <a href={widgetUrl} target="_blank" rel="noopener noreferrer" style={{ color: effectiveColor, textDecoration: "none", wordBreak: "break-all", fontWeight: 600 }}>
                {widgetUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </section>

          {/* RIGHT: Live-Preview */}
          <section style={{ position: "sticky", top: 20 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Live-Vorschau
            </h2>
            <div style={{
              padding: 16, borderRadius: 14,
              background: "#13141a", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <iframe
                key={widgetUrl}
                src={widgetUrl}
                title="Widget Vorschau"
                style={{
                  width: "100%", height: 620, border: 0,
                  borderRadius: 14, background: "#0b0c10",
                }}
              />
            </div>
            <p style={{ margin: "10px 2px 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
              Die Vorschau aktualisiert sich, sobald du die Farbe änderst. Teste den 2-Stage-Flow: URL eingeben → Teaser → E-Mail.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 11,
      background: accent ? `${accent}0E` : "rgba(255,255,255,0.02)",
      border: `1px solid ${accent ? `${accent}30` : "rgba(255,255,255,0.07)"}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent ?? "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function CodeBlock({ label, code, onCopy, copied, accent }: {
  label: string;
  code: string;
  onCopy: () => void;
  copied: boolean;
  accent: string;
}) {
  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      background: "#0a0b10", border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        background: "rgba(255,255,255,0.02)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.03em" }}>{label}</span>
        <button onClick={onCopy} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 10.5, fontWeight: 700,
          background: copied ? `${accent}1a` : "rgba(255,255,255,0.05)",
          border: `1px solid ${copied ? `${accent}40` : "rgba(255,255,255,0.1)"}`,
          color: copied ? accent : "rgba(255,255,255,0.55)",
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.15s",
        }}>
          {copied ? "✓ Kopiert" : "Kopieren"}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: "12px 14px",
        fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
        fontSize: 11.5, lineHeight: 1.55,
        color: "rgba(255,255,255,0.8)",
        overflowX: "auto", whiteSpace: "pre",
      }}>
        {code}
      </pre>
    </div>
  );
}
