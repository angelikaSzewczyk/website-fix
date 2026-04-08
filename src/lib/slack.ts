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
