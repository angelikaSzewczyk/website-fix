"use client";

import { useState, useEffect } from "react";

type AgencySettings = {
  agency_name: string;
  logo_url: string;
  primary_color: string;
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

export default function SettingsClient({ initial }: { initial: AgencySettings }) {
  const [settings, setSettings]   = useState<AgencySettings>(initial);
  const [members,  setMembers]    = useState<TeamMember[]>([]);
  const [scanInterval, setScanInterval] = useState<ScanInterval>("wöchentlich");
  const [autoReport,   setAutoReport]   = useState(true);
  const [newEmail, setNewEmail]   = useState("");
  const [saveState,   setSaveState]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [inviteState, setInviteState] = useState<"idle" | "loading" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    fetch("/api/team").then(r => r.json()).then(setMembers);
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
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    if (res.ok) {
      const updated = await fetch("/api/team").then(r => r.json());
      setMembers(updated); setNewEmail(""); setInviteState("idle");
    } else {
      const data = await res.json();
      setInviteError(data.error ?? "Fehler beim Einladen.");
      setInviteState("error");
    }
  }

  async function handleRemove(id: number) {
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", outline: "none", boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6,
  };

  return (
    <main style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
        Agentur-Einstellungen
      </h1>
      <p style={{ margin: "0 0 48px", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
        White-Label Branding und Team-Verwaltung.
      </p>

      {/* TWO-COLUMN LAYOUT: Form + Live Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start", marginBottom: 28 }}>

        {/* ── BRANDING FORM ── */}
        <section style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "28px",
        }}>
          <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: 700 }}>White-Label Branding</h2>

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

            {/* Logo URL */}
            <div>
              <label style={label}>Logo-URL</label>
              <input
                style={input}
                placeholder="https://deine-agentur.de/logo.png"
                value={settings.logo_url}
                onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
              />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                Öffentlich erreichbare URL (PNG, SVG oder WebP). Die Vorschau aktualisiert sich live →
              </p>
            </div>

            {/* Color picker */}
            <div>
              <label style={label}>Primärfarbe</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                  style={{
                    width: 44, height: 44, border: "2px solid rgba(255,255,255,0.1)",
                    background: "none", cursor: "pointer", borderRadius: 10, padding: 2,
                  }}
                />
                <input
                  style={{ ...input, width: 130 }}
                  value={settings.primary_color}
                  onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                  placeholder="#8df3d3"
                  maxLength={7}
                />
                {/* Quick presets */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["#8df3d3", "#7aa6ff", "#ffd93d", "#ff6b6b", "#a78bfa", "#f472b6"].map(c => (
                    <button
                      key={c}
                      onClick={() => setSettings(s => ({ ...s, primary_color: c }))}
                      title={c}
                      style={{
                        width: 22, height: 22, borderRadius: "50%", border: settings.primary_color === c ? "2px solid #fff" : "2px solid transparent",
                        background: c, cursor: "pointer", flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              style={{
                padding: "10px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: saveState === "saved"
                  ? "rgba(141,243,211,0.15)"
                  : "linear-gradient(90deg,#8df3d3,#7aa6ff)",
                color: saveState === "saved" ? "#8df3d3" : "#0b0c10",
                border: saveState === "saved" ? "1px solid rgba(141,243,211,0.3)" : "none",
                cursor: "pointer",
              }}
            >
              {saveState === "saving" ? "Speichern..." : saveState === "saved" ? "✓ Gespeichert" : "Speichern"}
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
            {[
              {
                id: "autoReport",
                label: "Monatsbericht automatisch versenden",
                sub: "Am 1. des Monats wird ein Bericht an den Kunden geschickt.",
                checked: autoReport,
                onChange: setAutoReport,
              },
              {
                id: "alertsEmail",
                label: "Sofort-Alert bei kritischen Befunden",
                sub: "E-Mail innerhalb von 5 Minuten nach einem kritischen Scan-Ergebnis.",
                checked: true,
                onChange: (_v: boolean) => {},
              },
            ].map(row => (
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
              style={{ ...input, flex: 1 }}
              placeholder="kollegin@agentur.de"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <button
              onClick={handleInvite}
              disabled={inviteState === "loading" || !newEmail}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "1px solid rgba(141,243,211,0.3)", color: "#8df3d3",
                background: "rgba(141,243,211,0.06)", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {inviteState === "loading" ? "..." : "Einladen"}
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
    </main>
  );
}
