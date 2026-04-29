export type AlertType =
  | "website_down"
  | "ssl_expiring"
  | "security_issue"
  | "performance_drop"
  | "wcag_violation";

export type Severity = "critical" | "warning";

export type SlackAlertPayload = {
  projectName: string;
  projectUrl: string;
  alertType: AlertType;
  severity: Severity;
  description: string;
  dashboardUrl: string;
  userId: number;
};

// ─── Icon system ──────────────────────────────────────────────────────────────
// Team reads severity at a glance before reading a single word.

const SEVERITY_ICON: Record<Severity, string> = {
  critical: "🚨",
  warning:  "⚠️",
};

const ALERT_ICON: Record<AlertType, string> = {
  website_down:     "💀",
  ssl_expiring:     "🔐",
  security_issue:   "🛡️",
  performance_drop: "⚡",
  wcag_violation:   "♿",
};

const ALERT_LABEL: Record<AlertType, string> = {
  website_down:     "Website nicht erreichbar",
  ssl_expiring:     "SSL-Zertifikat läuft ab",
  security_issue:   "Sicherheitsproblem erkannt",
  performance_drop: "Performance-Einbruch",
  wcag_violation:   "Barrierefreiheit-Verstoß (WCAG 2.1)",
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ff6b6b",
  warning:  "#ffd93d",
};

// ─── Shared button value type ─────────────────────────────────────────────────
// Serialized into every action button so the interactive handler is self-contained.
export type ButtonContext = {
  url:  string;   // project URL
  name: string;   // project name
  type: AlertType;
  desc: string;   // short description (<300 chars)
  dash: string;   // dashboard URL
  uid:  number;   // user_id — for activity log
};

// ─── Main send function ───────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SCAN-SUMMARY — Agency-Scan-Zusammenfassung (WooCommerce + Revenue-at-Risk)
// ═══════════════════════════════════════════════════════════════════════════

export type ScanSummaryPayload = {
  webhookUrl: string;    // User-Webhook aus integration_settings
  projectUrl: string;
  scanId:     string | null;
  score:      number;
  issueCount: number;
  redCount:   number;
  yellowCount: number;
  builder:    string | null;
  isWooCommerce: boolean;
  wooRiskPct: number | null;     // Revenue-at-Risk, wenn Shop
  domDepth:   number | null;     // Builder-Audit DOM-Tiefe
  dashboardUrl: string;
  agencyName: string;
};

/** Postet eine kompakte Scan-Zusammenfassung in den Agency-Slack.
 *  Wird in scan/route.ts nach saveUserScan für Agency-Plans + gesetztem
 *  slack_webhook_url ausgelöst (fire-and-forget, blockiert nie den Response). */
export async function sendScanSummaryToSlack(p: ScanSummaryPayload): Promise<void> {
  if (!p.webhookUrl) return;

  const domain = (() => { try { return new URL(p.projectUrl).host; } catch { return p.projectUrl; } })();
  const scoreEmoji = p.score >= 80 ? "🟢" : p.score >= 55 ? "🟡" : "🔴";
  const color      = p.score >= 80 ? "#22c55e" : p.score >= 55 ? "#f59e0b" : "#ef4444";

  const fields: Array<{ title: string; value: string; short: boolean }> = [
    { title: "Website",     value: `<${p.projectUrl}|${domain}>`, short: true },
    { title: "Score",       value: `${scoreEmoji} ${p.score}/100`, short: true },
    { title: "Probleme",    value: `${p.redCount} kritisch · ${p.yellowCount} Hinweise (gesamt ${p.issueCount})`, short: false },
  ];
  if (p.builder) {
    fields.push({
      title: "Page-Builder",
      value: `${p.builder}${p.domDepth != null ? ` · DOM-Tiefe ${p.domDepth}` : ""}`,
      short: true,
    });
  }
  if (p.isWooCommerce) {
    fields.push({
      title: "WooCommerce",
      value: p.wooRiskPct != null ? `🛒 Shop erkannt · Revenue-at-Risk: ${p.wooRiskPct}%` : "🛒 Shop erkannt",
      short: true,
    });
  }

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 Scan abgeschlossen: ${domain}`, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${p.agencyName}* · Scan fertig · ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}` },
    },
    {
      type: "section",
      fields: fields.map(f => ({ type: "mrkdwn", text: `*${f.title}*\n${f.value}` })),
    },
    ...(p.scanId ? [{
      type: "actions",
      elements: [{
        type: "button",
        text: { type: "plain_text", text: "🔍 Bericht ansehen", emoji: true },
        action_id: "open_scan",
        url: `${p.dashboardUrl}/dashboard/scans/${p.scanId}`,
      }],
    }] : []),
  ];

  try {
    await fetch(p.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{ color, fallback: `Scan: ${domain} · ${p.score}/100 · ${p.issueCount} Probleme`, blocks }],
      }),
    });
  } catch (err) {
    console.error("[slack-scan-summary] failed:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE-ISSUE — Pro-User postet einzelnen Befund aus dem Dashboard in Slack
// ═══════════════════════════════════════════════════════════════════════════

export type SlackIssuePayload = {
  webhookUrl:   string;          // User-Webhook aus integration_settings
  severity:     "red" | "yellow" | "green";
  title:        string;
  body:         string;
  count?:       number | null;   // z.B. "24 Bilder"
  projectUrl:   string;
  scanId?:      string | null;
  dashboardUrl: string;
};

/** Postet einen einzelnen Issue als Slack-Block. Nicht-blockierend (try/catch);
 *  Fehler werden vom Caller (Route) als 502 gemeldet, damit der User weiß,
 *  dass der Webhook nicht antwortet. */
export async function postIssueToSlack(p: SlackIssuePayload): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!p.webhookUrl) return { ok: false, error: "Kein Slack-Webhook hinterlegt" };

  const sevIcon  = p.severity === "red" ? "🔴" : p.severity === "yellow" ? "🟡" : "🟢";
  const sevLabel = p.severity === "red" ? "Kritisch" : p.severity === "yellow" ? "Hinweis" : "OK";
  const color    = p.severity === "red" ? "#ef4444" : p.severity === "yellow" ? "#fbbf24" : "#22c55e";
  const domain   = (() => { try { return new URL(p.projectUrl).host; } catch { return p.projectUrl; } })();
  const titleSuffix = p.count && p.count > 1 ? ` · ${p.count}×` : "";

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: { type: "plain_text", text: `${sevIcon} ${p.title}${titleSuffix}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Status*\n${sevLabel}` },
        { type: "mrkdwn", text: `*Website*\n<${p.projectUrl}|${domain}>` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Details*\n${p.body.slice(0, 1500)}` },
    },
  ];

  if (p.scanId) {
    blocks.push({
      type: "actions",
      elements: [{
        type: "button",
        text: { type: "plain_text", text: "🔍 Bericht ansehen", emoji: true },
        action_id: "open_scan",
        url: `${p.dashboardUrl}/dashboard/scans/${p.scanId}`,
      }],
    });
  }

  try {
    const res = await fetch(p.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{ color, fallback: `${sevLabel}: ${p.title}`, blocks }],
      }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Slack ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Netzwerkfehler" };
  }
}

export async function sendSlackAlert(alert: SlackAlertPayload): Promise<void> {
  const botToken  = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;
  const webhook   = process.env.SLACK_WEBHOOK_URL;

  if (!botToken && !webhook) return;

  const sevIcon   = SEVERITY_ICON[alert.severity];
  const typeIcon  = ALERT_ICON[alert.alertType];
  const typeLabel = ALERT_LABEL[alert.alertType];
  const color     = SEVERITY_COLOR[alert.severity];
  const sevLabel  = alert.severity === "critical" ? "KRITISCH" : "WARNUNG";
  const ts        = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  // Compact context packed into every button value (Slack limit: 2000 chars)
  const ctx: ButtonContext = {
    url:  alert.projectUrl,
    name: alert.projectName,
    type: alert.alertType,
    desc: alert.description.substring(0, 280),
    dash: alert.dashboardUrl,
    uid:  alert.userId,
  };
  const ctxJson = JSON.stringify(ctx);

  const blocks = [
    // ── Header: severity icon makes priority unmistakeable ──
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${sevIcon} ${sevLabel}: ${alert.projectName}`,
        emoji: true,
      },
    },
    // ── Two-column fields ──
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `${typeIcon} *Problem*\n${typeLabel}` },
        { type: "mrkdwn", text: `🌐 *Website*\n<${alert.projectUrl}|${alert.projectUrl}>` },
      ],
    },
    // ── Detail line ──
    {
      type: "section",
      text: { type: "mrkdwn", text: `📋 *Details*\n${alert.description}` },
    },
    { type: "divider" },
    // ── Action row ──
    {
      type: "actions",
      elements: [
        // PRIMARY — triggers Claude in the background, posts thread reply
        {
          type: "button",
          text: { type: "plain_text", text: "🤖 KI-Lösungsvorschlag", emoji: true },
          action_id: "ai_suggest",
          style: "primary",
          value: ctxJson,
        },
        // SECONDARY — creates Jira ticket, posts confirmation to thread
        {
          type: "button",
          text: { type: "plain_text", text: "📋 Jira Ticket erstellen", emoji: true },
          action_id: "jira_create",
          value: ctxJson,
        },
        // LINK — no round-trip, just opens URL
        {
          type: "button",
          text: { type: "plain_text", text: "🔗 Dashboard", emoji: true },
          action_id: "open_dashboard",
          url: alert.dashboardUrl,
        },
      ],
    },
    // ── Footer ──
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `⏱️ Erkannt: ${ts} · WebsiteFix Monitoring` },
      ],
    },
  ];

  if (botToken && channelId) {
    // Full Web API — required for thread replies from button actions
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        // Color bar via legacy attachment — blocks stay at top level for interactivity
        attachments: [{ color, fallback: `${sevLabel}: ${alert.projectName} — ${alert.description}`, blocks }],
      }),
    });
  } else if (webhook) {
    // Webhook fallback — interactive buttons still work, but thread replies won't post
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{ color, fallback: `${sevLabel}: ${alert.projectName}`, blocks }],
      }),
    });
  }
}
