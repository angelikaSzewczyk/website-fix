"use client";

import { useState } from "react";
import Link from "next/link";

type Status = {
  slack: boolean; zapier: boolean; jira: boolean; trello: boolean; gsc: boolean; ga: boolean;
};

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
              return (
                <div key={provider.id} style={{
                  background: D.card, border: `1px solid ${connected ? D.greenBorder : D.border}`,
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: connected ? `0 0 0 1px ${D.greenBg}` : "none",
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

                      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                        <button
                          onClick={() => saveProvider(provider.id)}
                          disabled={saving === provider.id}
                          style={{
                            padding: "9px 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                            background: provider.color, color: "#fff",
                            border: "none", cursor: saving === provider.id ? "wait" : "pointer",
                            fontFamily: "inherit", opacity: saving === provider.id ? 0.7 : 1,
                          }}
                        >
                          {saving === provider.id ? "Speichert…" : connected ? "Aktualisieren" : "Verbinden"}
                        </button>
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

        {/* Dev-Info: Zapier-Payload-Schema */}
        {hasAccess && (
          <div style={{
            marginTop: 22, padding: "16px 20px", borderRadius: 12,
            background: D.card, border: `1px solid ${D.border}`,
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: D.emerald, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Zapier-Payload-Schema
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 12.5, color: D.textSub, lineHeight: 1.6 }}>
              Bei jedem abgeschlossenen Scan sendet WebsiteFix dieses Event an deine Zapier-Catch-Hook-URL — volles meta_json inklusive Builder- und Shop-Audit:
            </p>
            <pre style={{
              margin: 0, padding: "10px 12px", borderRadius: 7,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace",
              color: "rgba(255,255,255,0.7)", overflowX: "auto",
            }}>{`{
  "event": "websitefix.scan_complete",
  "timestamp": "2026-04-23T10:12:00.000Z",
  "scan": { "id", "url", "score", "issue_count", "red_count", "yellow_count" },
  "technology": {
    "is_wordpress": true,
    "is_woocommerce": false,
    "builder": "Elementor" | "Divi" | "Astra" | null,
    "full_fingerprint": { ... }
  },
  "woo_audit":     { "addToCartButtons", "revenueRiskPct", "pluginImpact[]", ... } | null,
  "builder_audit": { "maxDomDepth", "googleFontFamilies[]", "cssBloatHints[]", ... } | null
}`}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
