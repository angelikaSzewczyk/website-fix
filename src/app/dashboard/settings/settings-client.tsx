"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAgency as isAgencyPlan } from "@/lib/plans";

type AgencySettings = {
  agency_name: string;
  agency_website: string;
  logo_url: string;
  primary_color: string;
  subdomain?: string;
  report_sender?: string;
};

type TeamMember = {
  id: number;
  member_email: string;
  status: string;
  invited_at: string;
};

// ─── Live Report Preview ──────────────────────────────────────────────────────

function ReportPreview({ settings }: { settings: AgencySettings }) {
  const color   = settings.primary_color || "#8df3d3";
  const name    = settings.agency_name   || "Deine Agentur";
  const hasLogo = Boolean(settings.logo_url);

  // Derive a muted version of the primary color for backgrounds
  const colorBg = `${color}18`;
  const colorBorder = `${color}35`;

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "#13141a",
      fontSize: 12,
    }}>
      {/* Report header bar */}
      <div style={{
        background: color,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt=""
            style={{ height: 28, objectFit: "contain", flexShrink: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0b0c10" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", marginTop: 1 }}>Website-Analyse Report</div>
        </div>
      </div>

      {/* Mock report body */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            Analysierte Website
          </div>
          <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>kunden-website.de</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Gescannt am {new Date().toLocaleDateString("de-DE")}</div>
        </div>

        {/* Mock KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          {[
            { label: "SEO", value: "87/100" },
            { label: "WCAG", value: "3 Fehler" },
            { label: "Speed", value: "1.4s" },
          ].map(k => (
            <div key={k.label} style={{
              padding: "8px 10px", borderRadius: 8,
              background: colorBg, border: `1px solid ${colorBorder}`,
              textAlign: "center",
            }}>
              <div style={{ fontWeight: 700, color, fontSize: 13 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Mock finding */}
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontWeight: 600, color, fontSize: 11, marginBottom: 4 }}>
            ✓ Empfehlung
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            SSL-Zertifikat erneuern (noch 12 Tage). Meta-Beschreibungen auf 3 Seiten fehlen.
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Erstellt mit WebsiteFix</div>
          <div style={{
            fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: colorBg, color, border: `1px solid ${colorBorder}`,
          }}>
            {name}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const CA = {
  card:       "#FFFFFF",
  bg:         "#F8FAFC",
  border:     "#E2E8F0",
  divider:    "#F1F5F9",
  shadow:     "0 1px 4px rgba(0,0,0,0.07)",
  text:       "#0F172A",
  textSub:    "#475569",
  textMuted:  "#94A3B8",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
};

type ScanInterval = "manuell" | "wöchentlich" | "täglich";

/** Berechnet ob ein Hex-Hintergrund schwarzen oder weißen Text braucht
 *  (W3C Luminanz-Formel, vereinfacht). Bei ungültigem Hex → "#fff" als
 *  sicheren Default. */
function contrastText(hex: string): "#000" | "#fff" {
  const cleaned = (hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return "#fff";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#000" : "#fff";
}

/** Inline-Spinner für Loading-States in Buttons. */
function Spinner({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ animation: "wf-spin 0.85s linear infinite" }}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 0,
        background: checked ? CA.green : "#CBD5E1",
        position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        display: "block", width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: checked ? 23 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }} />
    </button>
  );
}

export default function SettingsClient({ initial, plan, embedded = false }: { initial: AgencySettings; plan: string; embedded?: boolean }) {
  const [settings, setSettings]   = useState<AgencySettings>(initial);
  const [members,  setMembers]    = useState<TeamMember[]>([]);
  const [scanInterval, setScanInterval] = useState<ScanInterval>("wöchentlich");
  const [autoReport,   setAutoReport]   = useState(true);
  const [newEmail, setNewEmail]   = useState("");
  const [saveState,   setSaveState]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [inviteState, setInviteState] = useState<"idle" | "loading" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  // /api/team kann 403 zurückgeben (Plan ohne Team-Feature), 401 (Session
  // expired), oder Netzwerk-Fail. r.json() würde bei leerem Body throwen
  // und einen unhandled rejection auslösen → "Application error". Daher
  // defensiv: bei !ok einfach leeres Array setzen, kein UI-Block.
  async function fetchTeam(): Promise<TeamMember[]> {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) return [];
      const data = await res.json().catch(() => null);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    fetchTeam().then(setMembers);
  }, []);

  async function handleSave() {
    setSaveState("saving");
    const res = await fetch("/api/agency-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaveState(res.ok ? "saved" : "error");
    setTimeout(() => setSaveState("idle"), 2500);
  }

  async function handleInvite() {
    setInviteError(""); setInviteState("loading");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) {
        setMembers(await fetchTeam());
        setNewEmail("");
        setInviteState("idle");
      } else {
        const data = await res.json().catch(() => ({}));
        setInviteError(data?.error ?? "Fehler beim Einladen.");
        setInviteState("error");
      }
    } catch {
      setInviteError("Netzwerkfehler beim Einladen.");
      setInviteState("error");
    }
  }

  async function handleRemove(id: number) {
    try {
      await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* swallow — UI-State unten setzt sowieso optimistisch */ }
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  const input: React.CSSProperties = {
    width: "100%", maxWidth: 460, padding: "10px 14px", borderRadius: 10, fontSize: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", outline: "none", boxSizing: "border-box",
  };
  /** Input-Stil ohne Breitenlimit — für Inputs in Inline-Layouts (Color Hex,
   *  Subdomain-Splitter), wo das maxWidth: 460 bricht. */
  const inputUnbounded: React.CSSProperties = {
    ...input,
    maxWidth: "none",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6,
  };

  // When embedded as a tab, drop outer <main> wrapper, H1, and integrations-shortcut
  // — those are owned by SettingsTabsClient now.
  const Wrapper = ({ children }: { children: React.ReactNode }) => embedded ? (
    <>{children}</>
  ) : (
    <main style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 24px 80px" }}>{children}</main>
  );

  return (
    <Wrapper>
      <style>{`
        @keyframes wf-spin { to { transform: rotate(360deg); } }
        /* Save-Button: Brand-Farbe + Hover-Glow */
        .wf-save-btn:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(0.94);
          box-shadow: 0 8px 28px ${settings.primary_color}55, 0 0 0 1px ${settings.primary_color}33 !important;
        }
        .wf-save-btn:not(:disabled):active {
          transform: translateY(0);
          filter: brightness(0.88);
        }
        /* Hex-Input mit invalidem Format zeigt subtilen Border-Hint */
        .wf-hex-input:invalid { border-color: rgba(239,68,68,0.45) !important; }
      `}</style>
      {!embedded && (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Agentur-Einstellungen
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            White-Label Branding und Team-Verwaltung.
          </p>
        </>
      )}

      {/* Integrations-Shortcut — Pro/Agency, nur in standalone-Modus */}
      {!embedded && (
      <Link href="/dashboard/settings#integrationen" style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
        padding: "14px 18px", borderRadius: 12,
        background: "linear-gradient(90deg, rgba(16,185,129,0.08), rgba(66,133,244,0.05))",
        border: "1px solid rgba(16,185,129,0.26)",
        textDecoration: "none", color: "#fff", fontFamily: "inherit",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 2 }}>
            Integrationen verwalten · Slack, Jira, Trello, Zapier, GSC
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Scan-Ergebnisse als Tasks exportieren, Slack-Alerts aktivieren, Webhook-Payload für Zapier einrichten.
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </Link>
      )}

      {/* TWO-COLUMN LAYOUT: Form + Live Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start", marginBottom: 28 }}>

        {/* ── BRANDING FORM ── */}
        <section style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Branding-Center</h2>
            {isAgencyPlan(plan) ? (
              <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: "rgba(167,139,250,0.15)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.3)", letterSpacing: "0.04em" }}>
                FULL WHITE-LABEL AKTIV
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: "rgba(141,243,211,0.12)", color: "#8df3d3", border: "1px solid rgba(141,243,211,0.3)", letterSpacing: "0.04em" }}>
                PROFESSIONAL
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Agency name */}
            <div>
              <label style={label}>Agentur-Name</label>
              <input
                style={input}
                placeholder="z.B. Meine Digitalagentur GmbH"
                value={settings.agency_name}
                onChange={e => setSettings(s => ({ ...s, agency_name: e.target.value }))}
              />
            </div>

            {/* Agency website */}
            <div>
              <label style={label}>Agentur-Website</label>
              <input
                style={input}
                placeholder="https://deine-agentur.de"
                value={settings.agency_website}
                onChange={e => setSettings(s => ({ ...s, agency_website: e.target.value }))}
              />
            </div>

            {/* Logo upload */}
            <div>
              <label style={label}>Agentur-Logo</label>
              {settings.logo_url && (
                <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    style={{ height: 36, maxWidth: 140, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.06)", padding: "4px 8px" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button
                    onClick={() => setSettings(s => ({ ...s, logo_url: "" }))}
                    style={{ fontSize: 12, color: "rgba(255,107,107,0.7)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Entfernen
                  </button>
                </div>
              )}
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 13, color: "rgba(255,255,255,0.6)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Logo hochladen
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setSettings(s => ({ ...s, logo_url: ev.target?.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                PNG, SVG, WebP oder JPEG. Die Vorschau aktualisiert sich live →
              </p>
            </div>

            {/* Subdomain — agency-only */}
            {isAgencyPlan(plan) && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <label style={{ ...label, marginBottom: 0 }}>Eigene Subdomain</label>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.3)", letterSpacing: "0.04em" }}>PRO</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", maxWidth: 460 }}>
                  <span style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", fontSize: 13, color: "rgba(255,255,255,0.3)", borderRight: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" }}>portal.</span>
                  <input
                    style={{ ...inputUnbounded, borderRadius: 0, border: "none", flex: 1 }}
                    placeholder="deine-agentur.de"
                    value={settings.subdomain ?? ""}
                    onChange={e => setSettings(s => ({ ...s, subdomain: e.target.value }))}
                  />
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>Kunden öffnen ihr Portal unter portal.deine-agentur.de (DNS-Eintrag erforderlich)</p>
              </div>
            )}

            {/* Report sender name — agency-only */}
            {isAgencyPlan(plan) && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <label style={{ ...label, marginBottom: 0 }}>E-Mail Absendername</label>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.3)", letterSpacing: "0.04em" }}>PRO</span>
                </div>
                <input
                  style={input}
                  placeholder="z.B. Julia von Digitalagentur Schmidt"
                  value={settings.report_sender ?? ""}
                  onChange={e => setSettings(s => ({ ...s, report_sender: e.target.value }))}
                />
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>Automatische Berichte werden im Namen dieser Person versendet.</p>
              </div>
            )}

            {/* Color picker — 6 Quick-Presets + 7. Custom-Slot (native picker)
                + Hex-Input mit bidirektionaler Sync.
                Layout: Presets-Reihe oben, Hex-Eingabe unten — getrennt
                damit Hex-Validation nicht visuell kollidiert. */}
            <div>
              <label style={label}>Primärfarbe</label>

              {/* Reihe 1: 6 Presets + Custom-Picker als 7. Element */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                {["#8df3d3", "#7aa6ff", "#ffd93d", "#ff6b6b", "#a78bfa", "#f472b6"].map(c => {
                  const active = settings.primary_color.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, primary_color: c }))}
                      title={c}
                      aria-label={`Farbe ${c}`}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: active ? "2px solid #fff" : "2px solid rgba(255,255,255,0.1)",
                        background: c, cursor: "pointer", flexShrink: 0,
                        boxShadow: active ? `0 0 0 3px ${c}33` : "none",
                        transition: "box-shadow 0.18s ease, transform 0.12s ease",
                      }}
                    />
                  );
                })}

                {/* 7. Slot: Custom-Color-Picker — native input type=color
                    als Rainbow-Swatch wenn aktuelle Farbe nicht in Presets */}
                <label
                  title="Eigene Farbe wählen"
                  aria-label="Eigene Farbe wählen"
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: ["#8df3d3","#7aa6ff","#ffd93d","#ff6b6b","#a78bfa","#f472b6"]
                      .map(c => c.toLowerCase()).includes(settings.primary_color.toLowerCase())
                      ? "2px solid rgba(255,255,255,0.1)"
                      : "2px solid #fff",
                    background: "conic-gradient(#ff6b6b, #ffd93d, #8df3d3, #7aa6ff, #a78bfa, #f472b6, #ff6b6b)",
                    cursor: "pointer", flexShrink: 0, position: "relative",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                  />
                </label>

                {/* Hint: aktuelle Farbe als kompakter Swatch + Hex-Wert */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11, color: "rgba(255,255,255,0.5)",
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  marginLeft: 4,
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: settings.primary_color, border: "1px solid rgba(255,255,255,0.15)" }} />
                  {settings.primary_color.toUpperCase()}
                </div>
              </div>

              {/* Reihe 2: Hex-Eingabefeld für Profis mit fixen CI-Vorgaben */}
              <input
                className="wf-hex-input"
                style={{ ...input, width: 180, fontFamily: "ui-monospace, SF Mono, Menlo, monospace", letterSpacing: "0.04em" }}
                value={settings.primary_color}
                onChange={e => {
                  let v = e.target.value.trim();
                  if (v && !v.startsWith("#")) v = "#" + v;
                  setSettings(s => ({ ...s, primary_color: v }));
                }}
                placeholder="#8DF3D3"
                maxLength={7}
                pattern="^#[0-9a-fA-F]{6}$"
                aria-label="Hex-Farbcode"
              />
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                6-stelliger Hex-Code (z.B. <code>#1a73e8</code>) — alle Vorschauen + der Speichern-Button übernehmen die Farbe in Echtzeit.
              </p>
            </div>
          </div>

          {/* Save — übernimmt dynamisch die gewählte Branding-Farbe.
              Hover-Glow per CSS-Class statt inline events (sauberer + perf). */}
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="wf-save-btn"
              style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: saveState === "saved"
                  ? "rgba(74,222,128,0.18)"
                  : settings.primary_color,
                color: saveState === "saved"
                  ? "#4ade80"
                  : contrastText(settings.primary_color),
                border: saveState === "saved"
                  ? "1px solid rgba(74,222,128,0.35)"
                  : "1px solid rgba(0,0,0,0.08)",
                cursor: saveState === "saving" ? "wait" : "pointer",
                opacity: saveState === "saving" ? 0.7 : 1,
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: saveState === "saved"
                  ? "none"
                  : `0 4px 16px ${settings.primary_color}33`,
                transition: "transform 0.12s ease, box-shadow 0.18s ease, filter 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              {saveState === "saving" && <Spinner size={13} />}
              {saveState === "saving" ? "Speichern…" : saveState === "saved" ? "✓ Gespeichert" : "Änderungen speichern"}
            </button>
            {saveState === "error" && (
              <span style={{ fontSize: 13, color: "#ff6b6b" }}>Fehler beim Speichern.</span>
            )}
          </div>
        </section>

        {/* ── LIVE PREVIEW ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <p style={{
            margin: "0 0 10px", fontSize: 11, fontWeight: 700,
            color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Report-Vorschau (Live)
          </p>
          <ReportPreview settings={settings} />
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
            So sieht der Report-Header deiner Kunden aus. Farbe und Logo aktualisieren sich in Echtzeit.
          </p>
        </div>
      </div>

      {/* ── AUTOMATION ── */}
      <section style={{
        background: CA.card, border: `1px solid ${CA.border}`,
        borderRadius: 16, padding: "28px", marginBottom: 20,
        boxShadow: CA.shadow,
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: CA.text }}>Automatisierung</h2>
          <p style={{ margin: 0, fontSize: 13, color: CA.textMuted }}>Scan-Intervall, Berichte und E-Mail-Alerts konfigurieren.</p>
        </div>

        {/* Scan Interval */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: CA.textSub }}>Scan-Intervall</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {([
              { key: "manuell",     label: "Manuell",            sub: "Nur auf Anfrage",           badge: null },
              { key: "wöchentlich", label: "Wöchentlich",        sub: "Jeden Montag · 04:00 Uhr",  badge: null },
              { key: "täglich",     label: "Täglich",            sub: "Jeden Tag · 04:00 Uhr",     badge: "Enterprise" },
            ] as { key: ScanInterval; label: string; sub: string; badge: string | null }[]).map(opt => {
              const active = scanInterval === opt.key;
              const isEnterprise = opt.badge === "Enterprise";
              return (
                <button
                  key={opt.key}
                  onClick={() => setScanInterval(opt.key)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, border: `2px solid ${active ? CA.blue : CA.border}`,
                    background: active ? CA.blueBg : CA.bg,
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", border: `2px solid ${active ? CA.blue : CA.border}`,
                      background: active ? CA.blue : "transparent", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? CA.blue : CA.text }}>{opt.label}</span>
                    {isEnterprise && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                        background: CA.amberBg, color: CA.amber, border: `1px solid ${CA.amberBorder}`,
                        letterSpacing: "0.06em",
                      }}>ENT</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: CA.textMuted, lineHeight: 1.4, paddingLeft: 23 }}>{opt.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: CA.divider, marginBottom: 24 }} />

        {/* E-Mail Automation */}
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: CA.textSub }}>E-Mail Automatisierung</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([
              {
                id: "autoReport",
                label: "Monatsbericht automatisch versenden",
                sub: "Am 1. des Monats wird ein Bericht an den Kunden geschickt.",
                note: "Berichte werden an die oben hinterlegte Agentur-E-Mail gesendet.",
                checked: autoReport,
                onChange: setAutoReport,
              },
              {
                id: "alertsEmail",
                label: "Sofort-Alert bei kritischen Befunden",
                sub: "E-Mail innerhalb von 5 Minuten nach einem kritischen Scan-Ergebnis.",
                note: null,
                checked: true,
                onChange: (_v: boolean) => {},
              },
            ] as { id: string; label: string; sub: string; note: string | null; checked: boolean; onChange: (v: boolean) => void }[]).map(row => (
              <label key={row.id} htmlFor={row.id} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${CA.border}`, background: CA.bg,
                cursor: "pointer",
              }}>
                <Toggle checked={row.checked} onChange={row.onChange} id={row.id} />
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: CA.text }}>{row.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: CA.textMuted, lineHeight: 1.5 }}>{row.sub}</p>
                  {row.note && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: CA.textMuted, lineHeight: 1.5, opacity: 0.75, fontStyle: "italic" }}>
                      {row.note}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Team-Zugang</h2>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {members.length + 1} / 3 Seats
          </span>
        </div>

        {/* Owner */}
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 8,
          background: "rgba(141,243,211,0.05)", border: "1px solid rgba(141,243,211,0.15)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Du (Owner)</span>
          <span style={{ fontSize: 12, color: "#8df3d3" }}>Admin</span>
        </div>

        {/* Members */}
        {members.map(m => (
          <div key={m.id} style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 8,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{m.member_email}</span>
              <span style={{
                marginLeft: 10, fontSize: 11, padding: "2px 8px", borderRadius: 6,
                background: m.status === "pending" ? "rgba(255,211,77,0.1)" : "rgba(141,243,211,0.1)",
                color: m.status === "pending" ? "#ffd93d" : "#8df3d3",
              }}>
                {m.status === "pending" ? "Einladung ausstehend" : "Aktiv"}
              </span>
            </div>
            <button
              onClick={() => handleRemove(m.id)}
              style={{ fontSize: 12, color: "rgba(255,107,107,0.7)", background: "none", border: "none", cursor: "pointer" }}
            >
              Entfernen
            </button>
          </div>
        ))}

        {/* Invite */}
        {members.length < 2 && (
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <input
              style={{ ...inputUnbounded, flex: 1 }}
              placeholder="kollegin@agentur.de"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !!newEmail && inviteState !== "loading" && handleInvite()}
              disabled={inviteState === "loading"}
            />
            <button
              onClick={handleInvite}
              disabled={inviteState === "loading" || !newEmail}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "1px solid rgba(141,243,211,0.3)", color: "#8df3d3",
                background: "rgba(141,243,211,0.06)",
                cursor: inviteState === "loading" ? "wait" : !newEmail ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                opacity: !newEmail ? 0.5 : 1,
                display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "inherit",
              }}
            >
              {inviteState === "loading" && <Spinner size={12} color="#8df3d3" />}
              {inviteState === "loading" ? "Sende Einladung…" : "Einladen"}
            </button>
          </div>
        )}
        {inviteError && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#ff6b6b" }}>{inviteError}</p>}
        {members.length >= 2 && (
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            Maximale Teamgröße erreicht (3 Seats).
          </p>
        )}
      </section>
    </Wrapper>
  );
}
