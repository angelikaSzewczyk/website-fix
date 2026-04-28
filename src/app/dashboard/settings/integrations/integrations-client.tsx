"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Status = {
  slack: boolean; zapier: boolean; jira: boolean; trello: boolean; gsc: boolean; ga: boolean;
};

/** Schwarz/Weiß-Text basierend auf Hex-Hintergrund (W3C-Luminanz). */
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

/** Test-Status pro Provider — null = idle, "loading" = pending,
 *  { ok, msg } = result. */
type TestStatus = "loading" | { ok: boolean; msg: string } | null;

// Felder, die wir im Klartext speichern dürfen (URLs, Projekt-Keys, E-Mails, IDs).
// Secrets (tokens) werden nur "write-only" übertragen: leer lassen = unverändert.
type VisibleSettings = {
  jira_domain:      string | null;
  jira_email:       string | null;
  jira_project_key: string | null;
  trello_list_id:   string | null;
  gsc_site_url:     string | null;
  ga_property_id:   string | null;
};

type Props = {
  plan:            string;
  hasAccess:       boolean;
  initialStatus:   Status | null;
  initialSettings: VisibleSettings | null;
};

const D = {
  page: "#0b0c10", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)",
  text: "#fff", textSub: "rgba(255,255,255,0.55)", textMuted: "rgba(255,255,255,0.3)",
  green: "#4ade80", greenBg: "rgba(74,222,128,0.08)", greenBorder: "rgba(74,222,128,0.28)",
  amber: "#fbbf24",
  red: "#f87171",
  blue: "#007BFF",
  emerald: "#10B981",
};

const PROVIDERS = [
  {
    id:     "slack",
    name:   "Slack",
    tagline:"Scan-Zusammenfassungen + Monitoring-Alerts automatisch in deinem Kanal.",
    color:  "#4A154B",
    fields: [
      { key: "slack_webhook_url", label: "Incoming Webhook URL", placeholder: "https://hooks.slack.com/services/T.../B.../...", secret: true, help: "Slack-App → Incoming Webhooks → neue Webhook-URL generieren." },
    ],
  },
  {
    id:     "zapier",
    name:   "Zapier",
    tagline:"Sende bei jedem Scan einen Webhook-Payload — Trigger für 7.000+ Apps.",
    color:  "#FF4A00",
    fields: [
      { key: "zapier_webhook_url", label: "Catch-Hook URL", placeholder: "https://hooks.zapier.com/hooks/catch/...", secret: true, help: "In Zapier: neuer Zap → Trigger 'Webhooks by Zapier' → 'Catch Hook'." },
    ],
  },
  {
    id:     "jira",
    name:   "Jira",
    tagline:"Erstelle Jira-Issues direkt aus Optimierungs-Plan und Builder-Befunden.",
    color:  "#0052CC",
    fields: [
      { key: "jira_domain",      label: "Jira-Domain",         placeholder: "meineagentur.atlassian.net", secret: false },
      { key: "jira_email",       label: "Jira-Account E-Mail", placeholder: "max@agentur.de",             secret: false },
      { key: "jira_api_token",   label: "API-Token",           placeholder: "ATATT3xF… (leer = unverändert)", secret: true, help: "id.atlassian.com → Security → API Tokens → Create" },
      { key: "jira_project_key", label: "Project-Key",         placeholder: "WEB, MAINT, SEO …",           secret: false },
    ],
  },
  {
    id:     "trello",
    name:   "Trello",
    tagline:"Befunde landen als Karten in deiner Wartungs-Liste.",
    color:  "#0079BF",
    fields: [
      { key: "trello_api_key", label: "API-Key", placeholder: "trello.com/power-ups/admin", secret: true },
      { key: "trello_token",   label: "Token",   placeholder: "Token aus OAuth-Flow",       secret: true },
      { key: "trello_list_id", label: "List-ID", placeholder: "65a... (ID der Zielliste)",  secret: false },
    ],
  },
  {
    id:     "gsc",
    name:   "Google Search Console",
    tagline:"Impressions und Klicks neben deinen Scores — zeigt den SEO-ROI.",
    color:  "#4285F4",
    fields: [
      { key: "gsc_site_url",         label: "Site-URL",             placeholder: "sc-domain:example.com ODER https://example.com/", secret: false },
      { key: "gsc_service_account",  label: "Service-Account JSON", placeholder: "Ganzes JSON einfügen (wird verschlüsselt gespeichert)", secret: true, textarea: true, help: "GCP-Console → Service-Accounts → neuer Key → JSON. Service-Account in GSC als User hinzufügen." },
    ],
  },
  {
    id:     "ga",
    name:   "Google Analytics 4",
    tagline:"Session- und Conversion-Trends fließen in den Performance-Insight ein.",
    color:  "#F9AB00",
    fields: [
      { key: "ga_property_id", label: "GA4-Property-ID", placeholder: "properties/123456789", secret: false, help: "GA4 → Admin → Property Settings → Property ID. Nutzt denselben Service-Account wie GSC." },
    ],
  },
] as const;

type FieldKey = (typeof PROVIDERS)[number]["fields"][number]["key"];

export default function IntegrationsSettingsClient({ plan, hasAccess, initialStatus, initialSettings }: Props) {
  const [status,  setStatus]  = useState<Status | null>(initialStatus);
  const [values,  setValues]  = useState<Record<string, string>>({
    jira_domain:      initialSettings?.jira_domain      ?? "",
    jira_email:       initialSettings?.jira_email       ?? "",
    jira_project_key: initialSettings?.jira_project_key ?? "",
    trello_list_id:   initialSettings?.trello_list_id   ?? "",
    gsc_site_url:     initialSettings?.gsc_site_url     ?? "",
    ga_property_id:   initialSettings?.ga_property_id   ?? "",
  });
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<string | null>(null);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [openId,  setOpenId]  = useState<string | null>(null);
  const [testing, setTesting] = useState<Record<string, TestStatus>>({});
  const [copied,  setCopied]  = useState(false);

  // Branding-Sync: primary_color aus agency_settings holen, damit alle
  // Action-Buttons im Integrations-Bereich konsistent zur Branding-Center-
  // Farbwahl wirken. Defaultwert "#8df3d3" matched den im Branding-Center.
  const [brandColor, setBrandColor] = useState("#8df3d3");
  useEffect(() => {
    if (!hasAccess) return;
    fetch("/api/agency-settings")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.primary_color && /^#[0-9a-fA-F]{6}$/.test(data.primary_color)) {
          setBrandColor(data.primary_color);
        }
      })
      .catch(() => { /* non-fatal — bleibt auf Default */ });
  }, [hasAccess]);

  /** Test-Ping an die eingegebene Webhook-URL. Verwendet die LIVE-Eingabe
   *  aus secrets-state, nicht die DB-gespeicherte URL — User kann testen
   *  bevor er speichert. */
  async function testWebhook(providerId: "slack" | "zapier", urlFieldKey: string) {
    const url = secrets[urlFieldKey] ?? "";
    if (!url) {
      setTesting(prev => ({ ...prev, [providerId]: { ok: false, msg: "Bitte zuerst eine URL eingeben." } }));
      return;
    }
    setTesting(prev => ({ ...prev, [providerId]: "loading" }));
    try {
      const res = await fetch("/api/integrations/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, url }),
      });
      const data = await res.json().catch(() => ({}));
      const ok  = res.ok && data?.ok === true;
      const msg = ok
        ? "Test-Ping erfolgreich gesendet."
        : (data?.error ?? `Fehler ${res.status}`);
      setTesting(prev => ({ ...prev, [providerId]: { ok, msg } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Netzwerkfehler";
      setTesting(prev => ({ ...prev, [providerId]: { ok: false, msg } }));
    }
    // Auto-clear success-toasts nach 4s; Fehler bleiben sichtbar.
    setTimeout(() => {
      setTesting(prev => {
        const cur = prev[providerId];
        if (typeof cur === "object" && cur?.ok === true) {
          const n = { ...prev }; delete n[providerId]; return n;
        }
        return prev;
      });
    }, 4000);
  }

  const [planLabel, planColor, planBg, planBd] =
    plan.startsWith("agency") ? ["AGENCY", "#A78BFA", "rgba(124,58,237,0.10)", "rgba(124,58,237,0.32)"]
    : plan.includes("professional") || plan === "smart-guard" ? ["PROFESSIONAL", "#10B981", "rgba(16,185,129,0.08)", "rgba(16,185,129,0.28)"]
    : ["STARTER", "#7aa6ff", "rgba(0,123,255,0.08)", "rgba(0,123,255,0.25)"];

  async function saveProvider(providerId: string) {
    setSaving(providerId);
    setErrors(prev => ({ ...prev, [providerId]: "" }));
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) { setSaving(null); return; }

    // Baue patch-Body: visible fields + nur die secrets, die der User ausgefüllt hat
    const patch: Record<string, string> = {};
    for (const f of provider.fields) {
      if (f.secret) {
        const v = secrets[f.key];
        if (v !== undefined && v !== "") patch[f.key] = v;
        // Leeres Passwort-Feld → unverändert lassen (nichts ins Patch tun)
      } else {
        const v = values[f.key] ?? "";
        patch[f.key] = v;
      }
    }

    try {
      const res = await fetch("/api/integrations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [providerId]: data.error ?? "Fehler beim Speichern" }));
      } else {
        setStatus(data.status);
        // Secret-Felder nach erfolgreichem Save leeren, damit UI klarstellt "wurde gespeichert"
        for (const f of provider.fields) {
          if (f.secret) setSecrets(prev => { const n = { ...prev }; delete n[f.key]; return n; });
        }
      }
    } catch {
      setErrors(prev => ({ ...prev, [providerId]: "Verbindungsfehler" }));
    } finally {
      setSaving(null);
    }
  }

  async function disconnect(providerId: string) {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;
    const patch: Record<string, string> = {};
    for (const f of provider.fields) patch[f.key] = "";
    setSaving(providerId);
    try {
      const res = await fetch("/api/integrations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) setStatus(data.status);
      // Cleanup local state
      setValues(prev => { const n = { ...prev }; for (const f of provider.fields) if (!f.secret) delete n[f.key]; return n; });
      setSecrets(prev => { const n = { ...prev }; for (const f of provider.fields) if (f.secret) delete n[f.key]; return n; });
    } finally {
      setSaving(null);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: D.page, color: D.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "40px 24px 80px" }}>
      <style>{`
        @keyframes wf-spin { to { transform: rotate(360deg); } }
        @keyframes wf-toast-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .wf-int-btn:not(:disabled):hover {
          filter: brightness(0.94);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px ${brandColor}33, 0 0 0 1px ${brandColor}22;
        }
        .wf-int-btn:not(:disabled):active { filter: brightness(0.88); transform: translateY(0); }
        .wf-int-test-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .wf-int-copy-btn:hover { background: rgba(255,255,255,0.12) !important; }
        /* Code-Block: horizontaler Scroll auf Mobile statt Layout-Bruch */
        .wf-int-pre {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
        }
        .wf-int-pre::-webkit-scrollbar { height: 6px; }
        .wf-int-pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <Link href="/dashboard/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: D.textMuted, textDecoration: "none", marginBottom: 18 }}>
          ← Zurück zu den Einstellungen
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Drittanbieter
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em" }}>
              Integrationen
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: D.textSub, maxWidth: 620, lineHeight: 1.6 }}>
              Verbinde Slack, Jira, Trello, Zapier und Google Search Console mit WebsiteFix. Scan-Ergebnisse lassen sich als Task exportieren, Monitoring-Alerts landen direkt in deinem Workflow.
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "4px 11px", borderRadius: 20,
            background: planBg, color: planColor, border: `1px solid ${planBd}`, letterSpacing: "0.08em", whiteSpace: "nowrap",
          }}>
            {planLabel}
          </span>
        </div>

        {/* Gating für Starter */}
        {!hasAccess && (
          <div style={{
            marginBottom: 22, padding: "22px 26px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(251,191,36,0.04))",
            border: "1px solid rgba(16,185,129,0.28)",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: D.emerald, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Professional & Agency Feature
            </p>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Integrationen sind ab dem Professional-Plan verfügbar
            </h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: D.textSub, lineHeight: 1.6 }}>
              Slack-Alerts, Jira-Tickets, Trello-Karten, Zapier-Webhooks und GSC/GA-Dashboards — alle Integrationen in einem Plan. Ab <strong style={{ color: D.emerald }}>89 €/Monat</strong>.
            </p>
            <Link href="/fuer-agenturen#pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 9,
              background: "linear-gradient(90deg, #059669, #10B981)", color: "#fff",
              fontSize: 13, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 3px 12px rgba(16,185,129,0.28)",
            }}>
              Auf Professional upgraden →
            </Link>
          </div>
        )}

        {/* Provider-Liste */}
        {hasAccess && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PROVIDERS.map(provider => {
              const connected = status?.[provider.id as keyof Status] ?? false;
              const open      = openId === provider.id;
              const focusBorder = open
                ? `1px solid ${brandColor}55`
                : `1px solid ${connected ? D.greenBorder : D.border}`;
              const focusGlow = open
                ? `0 0 0 1px ${brandColor}22`
                : connected ? `0 0 0 1px ${D.greenBg}` : "none";
              return (
                <div key={provider.id} style={{
                  background: D.card, border: focusBorder,
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: focusGlow,
                  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                }}>
                  {/* Row */}
                  <button
                    onClick={() => setOpenId(open ? null : provider.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, width: "100%",
                      padding: "16px 20px", background: "none", border: "none",
                      cursor: "pointer", color: "#fff", fontFamily: "inherit", textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: `${provider.color}18`, border: `1px solid ${provider.color}45`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, color: provider.color,
                    }}>
                      {provider.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{provider.name}</span>
                        {connected && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                            background: D.greenBg, color: D.green, border: `1px solid ${D.greenBorder}`,
                            letterSpacing: "0.06em",
                          }}>
                            VERBUNDEN
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: D.textMuted, lineHeight: 1.5 }}>{provider.tagline}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Expanded config */}
                  {open && (
                    <div style={{ padding: "8px 20px 20px", borderTop: `1px solid ${D.border}` }}>
                      {provider.fields.map(f => {
                        // Widen const-typed union so key/help/textarea access is type-safe.
                        const field = f as { key: FieldKey; label: string; placeholder: string; secret: boolean; help?: string; textarea?: boolean };
                        const isSecret = field.secret;
                        const v = isSecret ? (secrets[field.key] ?? "") : (values[field.key] ?? "");
                        const help = field.help;
                        return (
                          <div key={field.key} style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: D.textMuted, marginBottom: 5, letterSpacing: "0.04em" }}>
                              {field.label} {isSecret && connected && <span style={{ color: D.green, marginLeft: 4 }}>· aktuell hinterlegt</span>}
                            </label>
                            {field.textarea ? (
                              <textarea
                                value={v}
                                onChange={e => isSecret ? setSecrets(p => ({ ...p, [field.key]: e.target.value })) : setValues(p => ({ ...p, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                rows={5}
                                style={{
                                  width: "100%", padding: "10px 13px",
                                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                                  borderRadius: 9, color: "#fff", fontSize: 12.5, outline: "none",
                                  fontFamily: "'SF Mono', Menlo, monospace", boxSizing: "border-box",
                                  resize: "vertical" as const,
                                }}
                              />
                            ) : (
                              <input
                                type={isSecret ? "password" : "text"}
                                value={v}
                                onChange={e => isSecret ? setSecrets(p => ({ ...p, [field.key]: e.target.value })) : setValues(p => ({ ...p, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                style={{
                                  width: "100%", padding: "10px 13px",
                                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                                  borderRadius: 9, color: "#fff", fontSize: 13, outline: "none",
                                  fontFamily: "inherit", boxSizing: "border-box",
                                }}
                              />
                            )}
                            {help && (
                              <p style={{ margin: "5px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{help}</p>
                            )}
                          </div>
                        );
                      })}

                      {errors[provider.id] && (
                        <div style={{ padding: "8px 12px", marginTop: 6, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", fontSize: 12, color: D.red }}>
                          {errors[provider.id]}
                        </div>
                      )}

                      {/* Test-Result-Toast — nur sichtbar wenn ein Test gelaufen ist */}
                      {testing[provider.id] && testing[provider.id] !== "loading" && (() => {
                        const t = testing[provider.id] as { ok: boolean; msg: string };
                        return (
                          <div style={{
                            padding: "8px 12px", marginTop: 10, borderRadius: 8,
                            background: t.ok ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.10)",
                            border: `1px solid ${t.ok ? "rgba(74,222,128,0.32)" : "rgba(248,113,113,0.32)"}`,
                            fontSize: 12, color: t.ok ? D.green : D.red,
                            display: "flex", alignItems: "center", gap: 8,
                            animation: "wf-toast-in 0.18s ease both",
                          }}>
                            <span>{t.ok ? "🟢" : "🔴"}</span>
                            <span>{t.ok ? "Test-Ping erfolgreich gesendet." : `Fehler: ${t.msg}`}</span>
                          </div>
                        );
                      })()}

                      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                        <button
                          onClick={() => saveProvider(provider.id)}
                          disabled={saving === provider.id}
                          className="wf-int-btn"
                          style={{
                            padding: "9px 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                            background: brandColor, color: contrastText(brandColor),
                            border: "1px solid rgba(0,0,0,0.06)",
                            cursor: saving === provider.id ? "wait" : "pointer",
                            fontFamily: "inherit", opacity: saving === provider.id ? 0.7 : 1,
                            display: "inline-flex", alignItems: "center", gap: 7,
                            transition: "filter 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease",
                          }}
                        >
                          {saving === provider.id && <Spinner size={12} />}
                          {saving === provider.id ? "Speichert…" : connected ? "Aktualisieren" : "Verbinden"}
                        </button>

                        {/* Test-Button — nur Slack + Zapier (Webhook-basierte Provider) */}
                        {(provider.id === "slack" || provider.id === "zapier") && (
                          <button
                            onClick={() => testWebhook(
                              provider.id as "slack" | "zapier",
                              provider.id === "slack" ? "slack_webhook_url" : "zapier_webhook_url",
                            )}
                            disabled={testing[provider.id] === "loading"}
                            className="wf-int-test-btn"
                            style={{
                              padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: "rgba(255,255,255,0.04)", color: D.text,
                              border: "1px solid rgba(255,255,255,0.18)",
                              cursor: testing[provider.id] === "loading" ? "wait" : "pointer",
                              fontFamily: "inherit",
                              display: "inline-flex", alignItems: "center", gap: 6,
                              opacity: testing[provider.id] === "loading" ? 0.7 : 1,
                              transition: "background 0.15s ease",
                            }}
                          >
                            {testing[provider.id] === "loading" ? (
                              <><Spinner size={11} color={D.text} /> Test läuft…</>
                            ) : (
                              <>🧪 Test-Ping senden</>
                            )}
                          </button>
                        )}

                        {connected && (
                          <button
                            onClick={() => disconnect(provider.id)}
                            disabled={saving === provider.id}
                            style={{
                              padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: "rgba(255,255,255,0.04)", color: D.textSub,
                              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Trennen
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dev-Info: Zapier-Payload-Schema mit Copy-to-Clipboard */}
        {hasAccess && (() => {
          const payloadSnippet = `{
  "event": "websitefix.scan_complete",
  "timestamp": "2026-04-23T10:12:00.000Z",
  "scan": {
    "id": "uuid",
    "url": "https://kunde.de",
    "score": 87,
    "issue_count": 4,
    "red_count": 1,
    "yellow_count": 3
  },
  "technology": {
    "is_wordpress": true,
    "is_woocommerce": false,
    "builder": "Elementor",
    "full_fingerprint": { "...": "..." }
  },
  "woo_audit": {
    "addToCartButtons": 12,
    "revenueRiskPct": 18,
    "pluginImpact": [],
    "cartButtonsBlocked": false,
    "outdatedTemplates": false
  },
  "builder_audit": {
    "maxDomDepth": 14,
    "googleFontFamilies": ["Inter"],
    "cssBloatHints": [],
    "stylesheetCount": 6,
    "divCount": 312
  }
}`;
          async function copyPayload() {
            try {
              await navigator.clipboard.writeText(payloadSnippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Fallback für ältere Browser / unsichere Kontexte
              const ta = document.createElement("textarea");
              ta.value = payloadSnippet;
              document.body.appendChild(ta);
              ta.select();
              try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); }
              finally { document.body.removeChild(ta); }
            }
          }
          return (
            <div style={{
              marginTop: 22, padding: "16px 20px", borderRadius: 12,
              background: D.card, border: `1px solid ${D.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: D.emerald, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Zapier-Payload-Schema
                </p>
                <button
                  onClick={copyPayload}
                  className="wf-int-copy-btn"
                  aria-label="Payload kopieren"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: copied ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                    color: copied ? D.green : D.textSub,
                    border: `1px solid ${copied ? "rgba(74,222,128,0.32)" : "rgba(255,255,255,0.1)"}`,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  {copied ? (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Kopiert</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopieren</>
                  )}
                </button>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: D.textSub, lineHeight: 1.6 }}>
                Bei jedem abgeschlossenen Scan sendet WebsiteFix dieses Event an deine Zapier-Catch-Hook-URL — volles meta_json inklusive Builder- und Shop-Audit:
              </p>
              <pre className="wf-int-pre" style={{
                margin: 0, padding: "12px 14px", borderRadius: 7,
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace",
                color: "rgba(255,255,255,0.7)",
                whiteSpace: "pre",
                lineHeight: 1.55,
              }}>{payloadSnippet}</pre>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
