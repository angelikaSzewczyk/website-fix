/**
 * Integrations-Helper.
 * Zentrale Abstraktion für Drittanbieter-Tickets (Zapier/Jira/Trello) und Slack.
 * API-Keys/Webhook-URLs werden in integration_settings (Neon) gespeichert.
 *
 * Das Schema wird lazy via ensureSchema() angelegt — kein separater Migrations-Lauf nötig.
 */
import { neon } from "@neondatabase/serverless";

export type IntegrationSettings = {
  slack_webhook_url:    string | null;
  zapier_webhook_url:   string | null;
  jira_domain:          string | null; // z.B. "meineagentur.atlassian.net"
  jira_email:           string | null;
  jira_api_token:       string | null;
  jira_project_key:     string | null;
  trello_api_key:       string | null;
  trello_token:         string | null;
  trello_list_id:       string | null;
  gsc_site_url:         string | null; // z.B. "sc-domain:example.com" oder "https://example.com/"
  gsc_service_account:  string | null; // Service Account JSON (voller Text)
  ga_property_id:       string | null; // GA4 Property-ID (z.B. "properties/123456789")
};

const EMPTY: IntegrationSettings = {
  slack_webhook_url:   null,
  zapier_webhook_url:  null,
  jira_domain:         null,
  jira_email:          null,
  jira_api_token:      null,
  jira_project_key:    null,
  trello_api_key:      null,
  trello_token:        null,
  trello_list_id:      null,
  gsc_site_url:        null,
  gsc_service_account: null,
  ga_property_id:      null,
};

let schemaReady = false;

export async function ensureIntegrationSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS integration_settings (
      user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      slack_webhook_url    TEXT,
      zapier_webhook_url   TEXT,
      jira_domain          TEXT,
      jira_email           TEXT,
      jira_api_token       TEXT,
      jira_project_key     TEXT,
      trello_api_key       TEXT,
      trello_token         TEXT,
      trello_list_id       TEXT,
      gsc_site_url         TEXT,
      gsc_service_account  TEXT,
      ga_property_id       TEXT,
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  schemaReady = true;
}

export async function getIntegrationSettings(userId: number | string): Promise<IntegrationSettings> {
  await ensureIntegrationSchema();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT slack_webhook_url, zapier_webhook_url,
           jira_domain, jira_email, jira_api_token, jira_project_key,
           trello_api_key, trello_token, trello_list_id,
           gsc_site_url, gsc_service_account, ga_property_id
      FROM integration_settings
     WHERE user_id = ${userId}
     LIMIT 1
  ` as IntegrationSettings[];
  return rows[0] ?? EMPTY;
}

export async function saveIntegrationSettings(userId: number | string, patch: Partial<IntegrationSettings>): Promise<void> {
  await ensureIntegrationSchema();
  const sql = neon(process.env.DATABASE_URL!);
  const current = await getIntegrationSettings(userId);
  const merged: IntegrationSettings = { ...current, ...patch };
  await sql`
    INSERT INTO integration_settings (
      user_id, slack_webhook_url, zapier_webhook_url,
      jira_domain, jira_email, jira_api_token, jira_project_key,
      trello_api_key, trello_token, trello_list_id,
      gsc_site_url, gsc_service_account, ga_property_id, updated_at
    ) VALUES (
      ${userId}, ${merged.slack_webhook_url}, ${merged.zapier_webhook_url},
      ${merged.jira_domain}, ${merged.jira_email}, ${merged.jira_api_token}, ${merged.jira_project_key},
      ${merged.trello_api_key}, ${merged.trello_token}, ${merged.trello_list_id},
      ${merged.gsc_site_url}, ${merged.gsc_service_account}, ${merged.ga_property_id}, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      slack_webhook_url    = EXCLUDED.slack_webhook_url,
      zapier_webhook_url   = EXCLUDED.zapier_webhook_url,
      jira_domain          = EXCLUDED.jira_domain,
      jira_email           = EXCLUDED.jira_email,
      jira_api_token       = EXCLUDED.jira_api_token,
      jira_project_key     = EXCLUDED.jira_project_key,
      trello_api_key       = EXCLUDED.trello_api_key,
      trello_token         = EXCLUDED.trello_token,
      trello_list_id       = EXCLUDED.trello_list_id,
      gsc_site_url         = EXCLUDED.gsc_site_url,
      gsc_service_account  = EXCLUDED.gsc_service_account,
      ga_property_id       = EXCLUDED.ga_property_id,
      updated_at           = NOW()
  `;
}

// ── Connection-Status für das UI ──────────────────────────────────────────
export type IntegrationStatus = {
  slack:  boolean;
  zapier: boolean;
  jira:   boolean;
  trello: boolean;
  gsc:    boolean;
  ga:     boolean;
};

export function connectionStatus(s: IntegrationSettings): IntegrationStatus {
  return {
    slack:  !!s.slack_webhook_url,
    zapier: !!s.zapier_webhook_url,
    jira:   !!(s.jira_domain && s.jira_email && s.jira_api_token && s.jira_project_key),
    trello: !!(s.trello_api_key && s.trello_token && s.trello_list_id),
    gsc:    !!(s.gsc_site_url && s.gsc_service_account),
    ga:     !!s.ga_property_id,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// TASK-EXPORT — einheitliches Interface für Jira/Trello/Zapier
// ══════════════════════════════════════════════════════════════════════════

export type TaskExportPayload = {
  title:        string;
  description:  string;
  priority:     "red" | "yellow" | "green";
  url:          string;          // gescannte Website-URL
  scanId?:      string;
  source:       "optimization_plan" | "builder_audit" | "shop_audit" | "manual";
  meta?:        Record<string, unknown>; // zusätzliche Daten (DOM-Depth, Fonts, Woo-Risk, …)
};

export type ExportResult = {
  ok:       boolean;
  provider: "jira" | "trello" | "zapier";
  externalId?:  string;  // z.B. Jira-Issue-Key oder Trello-Card-Id
  externalUrl?: string;  // direkter Link zum Ticket
  error?:   string;
};

/** Sendet ein Task an den zuerst-konfigurierten Provider in der Reihenfolge
 *  preferredProvider → jira → trello → zapier. */
export async function exportTask(
  settings: IntegrationSettings,
  payload: TaskExportPayload,
  preferredProvider?: "jira" | "trello" | "zapier",
): Promise<ExportResult> {
  const status = connectionStatus(settings);
  // Bevorzugten Provider als Erstes prüfen
  const order: Array<"jira" | "trello" | "zapier"> = preferredProvider
    ? [preferredProvider, ...(["jira", "trello", "zapier"] as const).filter(p => p !== preferredProvider)]
    : ["jira", "trello", "zapier"];

  for (const p of order) {
    if (!status[p]) continue;
    try {
      if (p === "jira")   return await exportToJira(settings, payload);
      if (p === "trello") return await exportToTrello(settings, payload);
      if (p === "zapier") return await exportToZapier(settings, payload);
    } catch (err) {
      return { ok: false, provider: p, error: String(err) };
    }
  }

  return { ok: false, provider: "zapier", error: "Kein Integration-Provider verbunden" };
}

// ── Jira: REST v3, Issue anlegen ───────────────────────────────────────────
async function exportToJira(s: IntegrationSettings, p: TaskExportPayload): Promise<ExportResult> {
  if (!s.jira_domain || !s.jira_email || !s.jira_api_token || !s.jira_project_key) {
    return { ok: false, provider: "jira", error: "Jira-Credentials unvollständig" };
  }
  const auth = Buffer.from(`${s.jira_email}:${s.jira_api_token}`).toString("base64");
  const jiraPriority =
    p.priority === "red"    ? "High"
    : p.priority === "yellow" ? "Medium"
    : "Low";

  const body = {
    fields: {
      project:   { key: s.jira_project_key },
      summary:   `[WebsiteFix] ${p.title}`.slice(0, 240),
      issuetype: { name: "Task" },
      priority:  { name: jiraPriority },
      description: {
        type: "doc", version: 1,
        content: [{
          type: "paragraph",
          content: [{ type: "text", text: `${p.description}\n\nGescannte URL: ${p.url}\nQuelle: WebsiteFix · ${p.source}` }],
        }],
      },
    },
  };

  const res = await fetch(`https://${s.jira_domain}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type":  "application/json",
      "Accept":        "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, provider: "jira", error: `Jira ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json() as { key?: string; id?: string };
  return {
    ok:          true,
    provider:    "jira",
    externalId:  data.key ?? data.id,
    externalUrl: data.key ? `https://${s.jira_domain}/browse/${data.key}` : undefined,
  };
}

// ── Trello: Card in List ──────────────────────────────────────────────────
async function exportToTrello(s: IntegrationSettings, p: TaskExportPayload): Promise<ExportResult> {
  if (!s.trello_api_key || !s.trello_token || !s.trello_list_id) {
    return { ok: false, provider: "trello", error: "Trello-Credentials unvollständig" };
  }
  const params = new URLSearchParams({
    key:    s.trello_api_key,
    token:  s.trello_token,
    idList: s.trello_list_id,
    name:   `[WebsiteFix] ${p.title}`.slice(0, 240),
    desc:   `${p.description}\n\nGescannte URL: ${p.url}\nQuelle: WebsiteFix · ${p.source}`.slice(0, 16000),
  });
  // Trello-Labels nach Priority (rot/amber/grün) — falls auf dem Board vorhanden.
  // Wir übergeben keine Label-IDs (User-spezifisch), setzen nur den Color-Hint via description.

  const res = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, provider: "trello", error: `Trello ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json() as { id?: string; shortUrl?: string };
  return {
    ok:          true,
    provider:    "trello",
    externalId:  data.id,
    externalUrl: data.shortUrl,
  };
}

// ── Zapier: generischer Webhook (User Zap-Trigger "Catch Hook") ────────────
async function exportToZapier(s: IntegrationSettings, p: TaskExportPayload): Promise<ExportResult> {
  if (!s.zapier_webhook_url) {
    return { ok: false, provider: "zapier", error: "Kein Zapier-Webhook hinterlegt" };
  }
  const res = await fetch(s.zapier_webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event:       "websitefix.task_export",
      title:       p.title,
      description: p.description,
      priority:    p.priority,
      url:         p.url,
      scan_id:     p.scanId,
      source:      p.source,
      meta:        p.meta ?? {},
      timestamp:   new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    return { ok: false, provider: "zapier", error: `Zapier ${res.status}` };
  }
  return { ok: true, provider: "zapier" };
}

// ══════════════════════════════════════════════════════════════════════════
// ZAPIER — Scan-Complete Webhook (volle meta_json inkl. Woo/Builder)
// ══════════════════════════════════════════════════════════════════════════

export type ScanCompleteEvent = {
  scanId:       string | null;
  url:          string;
  createdAt:    string;
  score:        number;
  issueCount:   number;
  redCount:     number;
  yellowCount:  number;
  techFingerprint: unknown;
  wooAudit:     unknown;   // full WooAuditMeta from meta_json.woo_audit
  builderAudit: unknown;   // full BuilderAuditMeta from meta_json.builder_audit
  isWooCommerce: boolean;
  builder:       string | null;
};

/** Sendet das volle Scan-Event an die hinterlegte Zapier-Webhook-URL.
 *  Payload-Schema ist explizit so gestaltet, dass Zapier-User WooCommerce-
 *  und Builder-Audit-Felder direkt in ihren Zap-Steps verwenden können. */
export async function triggerZapierScanWebhook(
  settings: IntegrationSettings,
  event: ScanCompleteEvent,
): Promise<void> {
  if (!settings.zapier_webhook_url) return;
  try {
    await fetch(settings.zapier_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event:     "websitefix.scan_complete",
        timestamp: new Date().toISOString(),
        scan: {
          id:           event.scanId,
          url:          event.url,
          created_at:   event.createdAt,
          score:        event.score,
          issue_count:  event.issueCount,
          red_count:    event.redCount,
          yellow_count: event.yellowCount,
        },
        technology: {
          is_wordpress:    !!(event.techFingerprint as { cms?: { value?: string } })?.cms?.value && (event.techFingerprint as { cms?: { value?: string } }).cms?.value === "WordPress",
          is_woocommerce:  event.isWooCommerce,
          builder:         event.builder,
          full_fingerprint: event.techFingerprint,
        },
        woo_audit:     event.wooAudit,
        builder_audit: event.builderAudit,
      }),
    });
  } catch (err) {
    console.error("[zapier-scan-webhook] failed:", err);
  }
}
